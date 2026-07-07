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
