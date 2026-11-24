/**
 * 从 OpenRouter 公开 API 拉取主流国内外大模型的最新客观数据（上下文长度、API 定价、多模态输入、发布时间），
 * 与站内维护的榜单参考分、开源状态、中文点评和差异化对比信息合并，生成 `src/data/models.generated.json`。
 *
 * 用法：
 *   node scripts/sync-models.mjs
 *   pnpm sync-models
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CURATED_PATH = resolve(process.cwd(), 'src/data/models.curated.json');
const OUTPUT_PATH = resolve(process.cwd(), 'src/data/models.generated.json');
const OPENROUTER_API = 'https://openrouter.ai/api/v1/models';

const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf-8'));

function toPerMillion(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Number((n * 1_000_000).toFixed(3));
}

function formatDate(unixSec) {
  if (!unixSec) return null;
  const d = new Date(unixSec * 1000);
  if (Number.isNaN(d.valueOf())) return null;
  return d.toISOString().slice(0, 10);
}

let remoteMap = new Map();
let syncedFromApi = false;

try {
  const res = await fetch(OPENROUTER_API, {
    headers: { 'User-Agent': 'ibve-ai-blog-sync/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  for (const item of payload.data ?? []) {
    remoteMap.set(item.id, item);
  }
  syncedFromApi = true;
  console.log(`✓ 已从 OpenRouter 拉取 ${remoteMap.size} 条模型元数据`);
} catch (err) {
  console.warn(`⚠️ 拉取 OpenRouter API 失败（${err.message}），将使用本地保底快照数据`);
}

let existingMap = new Map();
try {
  const prev = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  for (const m of prev.models ?? []) existingMap.set(m.slug, m);
} catch {
  // 首次运行无旧文件
}

const models = curated.models.map((item) => {
  const live = item.openrouterId ? remoteMap.get(item.openrouterId) : null;
  const prev = existingMap.get(item.slug);

  const contextLength = live?.context_length ?? prev?.contextLength ?? item.fallback.contextLength;
  const inputPricePerM = live
    ? toPerMillion(live.pricing?.prompt)
    : (prev?.inputPricePerM ?? item.fallback.inputPricePerM);
  const outputPricePerM = live
    ? toPerMillion(live.pricing?.completion)
    : (prev?.outputPricePerM ?? item.fallback.outputPricePerM);
  const modalities = live?.architecture?.input_modalities?.length
    ? live.architecture.input_modalities
    : (prev?.modalities ?? item.fallback.modalities);
  const releaseDate = live?.created
    ? formatDate(live.created)
    : (prev?.releaseDate ?? item.fallback.releaseDate);

  // 综合加权单价（3:1 输入输出比，方便按性价比排序）
  const blendedPricePerM =
    inputPricePerM != null && outputPricePerM != null
      ? Number(((inputPricePerM * 3 + outputPricePerM) / 4).toFixed(3))
      : null;

  return {
    slug: item.slug,
    name: item.name,
    provider: item.provider,
    providerZh: item.providerZh,
    region: item.region, // 'global' | 'china'
    license: item.license, // 'closed' | 'open-weight'
    tier: item.tier, // 'flagship' | 'balanced' | 'fast'
    openrouterId: item.openrouterId ?? null,
    arenaElo: item.arenaElo,
    codingScore: item.codingScore,
    reasoningScore: item.reasoningScore,
    contextLength,
    inputPricePerM,
    outputPricePerM,
    blendedPricePerM,
    modalities,
    releaseDate,
    chinaAccess: item.chinaAccess,
    summary: item.summary,
    strengths: item.strengths,
    limitations: item.limitations,
    bestFor: item.bestFor,
    differenceNote: item.differenceNote,
    relatedPosts: item.relatedPosts ?? [],
    tags: item.tags ?? [],
    liveSynced: Boolean(live),
  };
});

// 默认按 LMArena Elo 降序排定初始榜次
models.sort((a, b) => (b.arenaElo ?? 0) - (a.arenaElo ?? 0));
models.forEach((m, idx) => {
  m.rank = idx + 1;
});

const output = {
  updatedAt: new Date().toISOString(),
  source: syncedFromApi
    ? 'OpenRouter Models API + LMArena / Artificial Analysis 公开榜单参考'
    : '本地快照 + LMArena / Artificial Analysis 公开榜单参考',
  totalCount: models.length,
  models,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
console.log(`✓ 已写入 ${OUTPUT_PATH}（共 ${models.length} 个主流国内外模型）`);
