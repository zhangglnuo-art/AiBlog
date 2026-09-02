// 把设计好的 SVG 封面/OG 图光栅化为 PNG，供社交分享(og:image)与富结果使用。
// sharp 随 Astro(pnpm) 安装，从其嵌套路径加载。
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
// 直接指向 pnpm 下的 sharp 实体（相对 cwd 解析为绝对路径）
const sharp = require(
  resolve(process.cwd(), 'node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js'),
);

const jobs = [
  { in: 'scripts/og-source/og-default.svg', out: 'public/og-default.png', w: 1200, h: 630 },
  { in: 'public/covers/midjourney.svg', out: 'public/covers/midjourney.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-agent.svg', out: 'public/covers/ai-agent.png', w: 1200, h: 675 },
  { in: 'public/covers/cursor.svg', out: 'public/covers/cursor.png', w: 1200, h: 675 },
  { in: 'public/covers/context-window.svg', out: 'public/covers/context-window.png', w: 1200, h: 675 },
  { in: 'public/covers/perplexity.svg', out: 'public/covers/perplexity.png', w: 1200, h: 675 },
  { in: 'public/covers/customize-llm.svg', out: 'public/covers/customize-llm.png', w: 1200, h: 675 },
  { in: 'public/covers/api-billing.svg', out: 'public/covers/api-billing.png', w: 1200, h: 675 },
  { in: 'public/covers/multimodal.svg', out: 'public/covers/multimodal.png', w: 1200, h: 675 },
  { in: 'public/covers/model-comparison.svg', out: 'public/covers/model-comparison.png', w: 1200, h: 675 },
  { in: 'public/covers/hallucination.svg', out: 'public/covers/hallucination.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-video.svg', out: 'public/covers/ai-video.png', w: 1200, h: 675 },
  { in: 'public/covers/embedding.svg', out: 'public/covers/embedding.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-music.svg', out: 'public/covers/ai-music.png', w: 1200, h: 675 },
  { in: 'public/covers/how-llm-works.svg', out: 'public/covers/how-llm-works.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-voice.svg', out: 'public/covers/ai-voice.png', w: 1200, h: 675 },
  { in: 'public/covers/temperature.svg', out: 'public/covers/temperature.png', w: 1200, h: 675 },
  { in: 'public/covers/gemini.svg', out: 'public/covers/gemini.png', w: 1200, h: 675 },
  { in: 'public/covers/open-vs-closed.svg', out: 'public/covers/open-vs-closed.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-image-tools.svg', out: 'public/covers/ai-image-tools.png', w: 1200, h: 675 },
  { in: 'public/covers/vector-database.svg', out: 'public/covers/vector-database.png', w: 1200, h: 675 },
  { in: 'public/covers/subscription-savings.svg', out: 'public/covers/subscription-savings.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-privacy.svg', out: 'public/covers/ai-privacy.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-coding-tools.svg', out: 'public/covers/ai-coding-tools.png', w: 1200, h: 675 },
  { in: 'public/covers/mcp.svg', out: 'public/covers/mcp.png', w: 1200, h: 675 },
  { in: 'public/covers/digital-human.svg', out: 'public/covers/digital-human.png', w: 1200, h: 675 },
  { in: 'public/covers/reasoning.svg', out: 'public/covers/reasoning.png', w: 1200, h: 675 },
  { in: 'public/covers/github-copilot.svg', out: 'public/covers/github-copilot.png', w: 1200, h: 675 },
  { in: 'public/covers/token.svg', out: 'public/covers/token.png', w: 1200, h: 675 },
  { in: 'public/covers/runway.svg', out: 'public/covers/runway.png', w: 1200, h: 675 },
  { in: 'public/covers/diffusion.svg', out: 'public/covers/diffusion.png', w: 1200, h: 675 },
  { in: 'public/covers/grok.svg', out: 'public/covers/grok.png', w: 1200, h: 675 },
  { in: 'public/covers/prompt-injection.svg', out: 'public/covers/prompt-injection.png', w: 1200, h: 675 },
  { in: 'public/covers/gamma.svg', out: 'public/covers/gamma.png', w: 1200, h: 675 },
  { in: 'public/covers/model-parameters.svg', out: 'public/covers/model-parameters.png', w: 1200, h: 675 },
  { in: 'public/covers/notion-ai.svg', out: 'public/covers/notion-ai.png', w: 1200, h: 675 },
  { in: 'public/covers/moe.svg', out: 'public/covers/moe.png', w: 1200, h: 675 },
  { in: 'public/covers/poe.svg', out: 'public/covers/poe.png', w: 1200, h: 675 },
  { in: 'public/covers/agi.svg', out: 'public/covers/agi.png', w: 1200, h: 675 },
  { in: 'public/covers/lovable.svg', out: 'public/covers/lovable.png', w: 1200, h: 675 },
  { in: 'public/covers/quantization.svg', out: 'public/covers/quantization.png', w: 1200, h: 675 },
  { in: 'public/covers/ideogram.svg', out: 'public/covers/ideogram.png', w: 1200, h: 675 },
  { in: 'public/covers/rlhf.svg', out: 'public/covers/rlhf.png', w: 1200, h: 675 },
  { in: 'public/covers/manus.svg', out: 'public/covers/manus.png', w: 1200, h: 675 },
  { in: 'public/covers/function-calling.svg', out: 'public/covers/function-calling.png', w: 1200, h: 675 },
  { in: 'public/covers/descript.svg', out: 'public/covers/descript.png', w: 1200, h: 675 },
  { in: 'public/covers/deepl.svg', out: 'public/covers/deepl.png', w: 1200, h: 675 },
  { in: 'public/covers/lora.svg', out: 'public/covers/lora.png', w: 1200, h: 675 },
  { in: 'public/covers/grammarly.svg', out: 'public/covers/grammarly.png', w: 1200, h: 675 },
  { in: 'public/covers/benchmark.svg', out: 'public/covers/benchmark.png', w: 1200, h: 675 },
  { in: 'public/covers/canva.svg', out: 'public/covers/canva.png', w: 1200, h: 675 },
  { in: 'public/covers/scaling-law.svg', out: 'public/covers/scaling-law.png', w: 1200, h: 675 },
  { in: 'public/covers/otter.svg', out: 'public/covers/otter.png', w: 1200, h: 675 },
  { in: 'public/covers/synthetic-data.svg', out: 'public/covers/synthetic-data.png', w: 1200, h: 675 },
  { in: 'public/covers/zapier.svg', out: 'public/covers/zapier.png', w: 1200, h: 675 },
  { in: 'public/covers/world-model.svg', out: 'public/covers/world-model.png', w: 1200, h: 675 },
  { in: 'public/covers/distillation.svg', out: 'public/covers/distillation.png', w: 1200, h: 675 },
  { in: 'public/covers/n8n.svg', out: 'public/covers/n8n.png', w: 1200, h: 675 },
  { in: 'public/covers/notebooklm.svg', out: 'public/covers/notebooklm.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-memory.svg', out: 'public/covers/ai-memory.png', w: 1200, h: 675 },
  { in: 'public/covers/video-prompt.svg', out: 'public/covers/video-prompt.png', w: 1200, h: 675 },
  { in: 'public/covers/speculative-decoding.svg', out: 'public/covers/speculative-decoding.png', w: 1200, h: 675 },
  { in: 'public/covers/fireflies.svg', out: 'public/covers/fireflies.png', w: 1200, h: 675 },
  { in: 'public/covers/kv-cache.svg', out: 'public/covers/kv-cache.png', w: 1200, h: 675 },
  { in: 'public/covers/claude-code.svg', out: 'public/covers/claude-code.png', w: 1200, h: 675 },
  { in: 'public/covers/context-engineering.svg', out: 'public/covers/context-engineering.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-code-review.svg', out: 'public/covers/ai-code-review.png', w: 1200, h: 675 },
  { in: 'public/covers/ai-automation-safety.svg', out: 'public/covers/ai-automation-safety.png', w: 1200, h: 675 },
  { in: 'public/covers/model-routing.svg', out: 'public/covers/model-routing.png', w: 1200, h: 675 },
  { in: 'public/covers/multi-agent.svg', out: 'public/covers/multi-agent.png', w: 1200, h: 675 },
  { in: 'public/covers/api-rate-limit.svg', out: 'public/covers/api-rate-limit.png', w: 1200, h: 675 },
  { in: 'public/covers/rag-evaluation.svg', out: 'public/covers/rag-evaluation.png', w: 1200, h: 675 },
  { in: 'public/covers/sft.svg', out: 'public/covers/sft.png', w: 1200, h: 675 },
  { in: 'public/covers/positional-encoding.svg', out: 'public/covers/positional-encoding.png', w: 1200, h: 675 },
  { in: 'public/covers/rag-chunking.svg', out: 'public/covers/rag-chunking.png', w: 1200, h: 675 },
  { in: 'public/covers/prompt-versioning.svg', out: 'public/covers/prompt-versioning.png', w: 1200, h: 675 },
  { in: 'public/covers/reranker.svg', out: 'public/covers/reranker.png', w: 1200, h: 675 },
  { in: 'public/covers/beam-search.svg', out: 'public/covers/beam-search.png', w: 1200, h: 675 },
  { in: 'public/covers/llm-observability.svg', out: 'public/covers/llm-observability.png', w: 1200, h: 675 },
  { in: 'public/covers/structured-output.svg', out: 'public/covers/structured-output.png', w: 1200, h: 675 },
  { in: 'public/covers/flash-attention.svg', out: 'public/covers/flash-attention.png', w: 1200, h: 675 },
  { in: 'public/covers/contrastive-learning.svg', out: 'public/covers/contrastive-learning.png', w: 1200, h: 675 },
  { in: 'public/covers/knowledge-graph.svg', out: 'public/covers/knowledge-graph.png', w: 1200, h: 675 },
  { in: 'public/covers/semantic-cache.svg', out: 'public/covers/semantic-cache.png', w: 1200, h: 675 },
  // 品牌 logo（Organization 结构化数据用）与 iOS 桌面图标
  { in: 'scripts/og-source/logo.svg', out: 'public/logo.png', w: 512, h: 512 },
  { in: 'scripts/og-source/logo.svg', out: 'public/apple-touch-icon.png', w: 180, h: 180 },
  { in: 'scripts/og-source/logo.svg', out: 'public/favicon-32.png', w: 32, h: 32 },
];

for (const job of jobs) {
  const svg = readFileSync(job.in);
  await sharp(svg, { density: 200 })
    .resize(job.w, job.h)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(job.out);
  console.log(`✓ ${job.out}`);
}
