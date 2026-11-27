/**
 * 自动从国内外权威 AI 资讯 RSS 与社区 API 拉取最新 AI 热点新闻，
 * 经过 AI 相关性过滤、清洗、去重与按时间排序后，写入 `src/data/news.generated.json`。
 *
 * 用法：
 *   node scripts/sync-news.mjs
 *   pnpm sync-news
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT_PATH = resolve(process.cwd(), 'src/data/news.generated.json');

const SOURCES = [
  {
    id: 'qbitai',
    name: '量子位',
    region: 'china',
    category: 'china',
    url: 'https://www.qbitai.com/feed',
    type: 'rss',
    filterAi: false,
    limit: 12,
  },
  {
    id: 'ithome',
    name: 'IT之家',
    region: 'china',
    category: 'china',
    url: 'https://www.ithome.com/rss/',
    type: 'rss',
    filterAi: true,
    limit: 12,
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    region: 'global',
    category: 'official',
    url: 'https://openai.com/news/rss.xml',
    type: 'rss',
    filterAi: false,
    limit: 8,
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    region: 'global',
    category: 'official',
    url: 'https://blog.google/technology/ai/rss/',
    type: 'rss',
    filterAi: false,
    limit: 8,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    region: 'global',
    category: 'opensource',
    url: 'https://huggingface.co/blog/feed.xml',
    type: 'rss',
    filterAi: false,
    limit: 8,
  },
  {
    id: 'theverge',
    name: 'The Verge AI',
    region: 'global',
    category: 'media',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    type: 'atom',
    filterAi: false,
    limit: 10,
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    region: 'global',
    category: 'community',
    url: 'https://hn.algolia.com/api/v1/search?tags=story&query=AI%20OR%20LLM%20OR%20OpenAI%20OR%20Claude%20OR%20Gemini%20OR%20DeepSeek&numericFilters=points>80&hitsPerPage=12',
    type: 'hn',
    filterAi: true,
    limit: 10,
  },
];

const AI_KEYWORD_RE =
  /\b(ai|llm|gpt|openai|claude|anthropic|gemini|deepmind|deepseek|qwen|kimi|glm|minimax|grok|llama|mistral|sora|agent|rag|mcp|nvidia|gpu|hugging\s*face|transformer|diffusion|copilot|cursor)\b|人工智能|大模型|智能体|算力|通义千问|豆包|智谱|文心|混元|月之暗面|具身智能|机器人|开源模型|多模态|推理模型/i;

function decodeEntities(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(html) {
  return decodeEntities(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(block);
  return m ? m[1].trim() : '';
}

function extractAtomLink(block) {
  const alt = /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i.exec(block);
  if (alt) return decodeEntities(alt[1]);
  const any = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
  return any ? decodeEntities(any[1]) : '';
}

function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.valueOf())) return null;
  return d.toISOString();
}

function truncate(text, max = 140) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

function inferTags(title, summary) {
  const text = `${title} ${summary}`;
  const tags = [];
  if (/openai|gpt|chatgpt|sora/i.test(text)) tags.push('OpenAI');
  if (/claude|anthropic/i.test(text)) tags.push('Claude');
  if (/gemini|google|deepmind/i.test(text)) tags.push('Google');
  if (/deepseek|深度求索/i.test(text)) tags.push('DeepSeek');
  if (/qwen|通义千问|阿里/i.test(text)) tags.push('Qwen');
  if (/kimi|月之暗面|glm|智谱|豆包|字节|minimax|国产/i.test(text)) tags.push('国产AI');
  if (/开源|open[- ]?source|open[- ]?weight|hugging\s*face|llama/i.test(text)) tags.push('开源');
  if (/agent|智能体|mcp/i.test(text)) tags.push('Agent');
  if (/视频|图像|多模态|语音|multimodal|video/i.test(text)) tags.push('多模态');
  if (/芯片|gpu|nvidia|英伟达|算力/i.test(text)) tags.push('算力芯片');
  if (tags.length === 0) tags.push('AI前沿');
  return tags.slice(0, 3);
}

function parseRssItems(xml, source) {
  const items = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = stripHtml(extractTag(block, 'title'));
    const link = stripHtml(extractTag(block, 'link'));
    const desc = stripHtml(extractTag(block, 'description') || extractTag(block, 'content:encoded'));
    const pubDate = parseDate(
      stripHtml(extractTag(block, 'pubDate') || extractTag(block, 'dc:date')),
    );
    if (!title || !link || !pubDate) continue;
    if (source.filterAi && !AI_KEYWORD_RE.test(`${title} ${desc}`)) continue;
    items.push({
      id: `${source.id}-${Buffer.from(link).toString('base64url').slice(0, 16)}`,
      title,
      url: link,
      summary: truncate(desc, 130),
      sourceId: source.id,
      sourceName: source.name,
      region: source.region,
      category: source.category,
      publishedAt: pubDate,
      tags: inferTags(title, desc),
    });
    if (items.length >= source.limit) break;
  }
  return items;
}

function parseAtomItems(xml, source) {
  const items = [];
  const blocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of blocks) {
    const title = stripHtml(extractTag(block, 'title'));
    const link = extractAtomLink(block);
    const desc = stripHtml(extractTag(block, 'summary') || extractTag(block, 'content'));
    const pubDate = parseDate(
      stripHtml(extractTag(block, 'published') || extractTag(block, 'updated')),
    );
    if (!title || !link || !pubDate) continue;
    if (source.filterAi && !AI_KEYWORD_RE.test(`${title} ${desc}`)) continue;
    items.push({
      id: `${source.id}-${Buffer.from(link).toString('base64url').slice(0, 16)}`,
      title,
      url: link,
      summary: truncate(desc, 130),
      sourceId: source.id,
      sourceName: source.name,
      region: source.region,
      category: source.category,
      publishedAt: pubDate,
      tags: inferTags(title, desc),
    });
    if (items.length >= source.limit) break;
  }
  return items;
}

function parseHnItems(json, source) {
  const items = [];
  for (const hit of json.hits ?? []) {
    const title = (hit.title || '').trim();
    const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
    const pubDate = parseDate(hit.created_at);
    if (!title || !pubDate) continue;
    if (source.filterAi && !AI_KEYWORD_RE.test(title)) continue;
    items.push({
      id: `hn-${hit.objectID}`,
      title,
      url,
      summary: `Hacker News 社区热议（${hit.points ?? 0} 赞 · ${hit.num_comments ?? 0} 条讨论）`,
      sourceId: source.id,
      sourceName: source.name,
      region: source.region,
      category: source.category,
      publishedAt: pubDate,
      points: hit.points ?? 0,
      tags: inferTags(title, ''),
    });
    if (items.length >= source.limit) break;
  }
  return items;
}

const fetched = [];
const activeSources = [];

await Promise.all(
  SOURCES.map(async (source) => {
    try {
      const res = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ibve-ai-news-bot/1.0; +https://ibve.org)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, application/json, text/xml',
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let parsed = [];
      if (source.type === 'hn') {
        parsed = parseHnItems(await res.json(), source);
      } else {
        const xml = await res.text();
        parsed = source.type === 'atom' ? parseAtomItems(xml, source) : parseRssItems(xml, source);
      }
      if (parsed.length > 0) {
        fetched.push(...parsed);
        activeSources.push(source.name);
        console.log(`✓ ${source.name}: ${parsed.length} 条`);
      } else {
        console.warn(`⚠️ ${source.name}: 解析到 0 条`);
      }
    } catch (err) {
      console.warn(`⚠️ ${source.name} 拉取失败: ${err.message}`);
    }
  }),
);

// 若网络异常导致全部拉取失败，保留现有快照避免构建变空
let prevItems = [];
try {
  const prev = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  prevItems = prev.items ?? [];
} catch {
  // 首次运行无旧文件
}

const merged = fetched.length > 0 ? fetched : prevItems;

// 按 URL 和标准化标题去重
const seenUrls = new Set();
const seenTitles = new Set();
const deduped = [];

for (const item of merged) {
  const normUrl = item.url.replace(/#.*$/, '').replace(/\/$/, '');
  const normTitle = item.title.toLowerCase().replace(/\s+/g, '');
  if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) continue;
  seenUrls.add(normUrl);
  seenTitles.add(normTitle);
  deduped.push(item);
}

// 按发布时间倒序排列，保留最新 50 条
deduped.sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());
const finalItems = deduped.slice(0, 50);

const output = {
  updatedAt: new Date().toISOString(),
  activeSources,
  totalCount: finalItems.length,
  items: finalItems,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
console.log(`✓ 已写入 ${OUTPUT_PATH}（共 ${finalItems.length} 条 AI 热点资讯）`);
