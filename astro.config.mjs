// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE_URL, TAG_INDEX_MIN_POSTS } from './src/consts.ts';

// 构建文章 URL -> lastmod 映射：直接读 frontmatter 的 updatedDate/pubDate，
// 让 sitemap 的 <lastmod> 反映内容真实更新时间（而非每次构建时间，避免误导爬虫）。
// 同时统计每个标签的文章数，供 sitemap 过滤薄标签页使用。
const blogDir = new URL('./src/content/blog/', import.meta.url);
/** @type {Record<string, string>} */
const lastmodMap = {};
/** @type {Record<string, number>} */
const tagCounts = {};
for (const file of readdirSync(blogDir)) {
  if (!/\.mdx?$/.test(file)) continue;
  const slug = file.replace(/\.mdx?$/, '');
  const raw = readFileSync(new URL(file, blogDir), 'utf-8');
  const fm = raw.split('---')[1] ?? '';
  const draft = /^\s*draft:\s*true\s*$/m.test(fm);
  if (draft) continue;
  const upd = /^\s*updatedDate:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const pub = /^\s*pubDate:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const dateStr = (upd || pub)?.replace(/^['"]|['"]$/g, '');
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.valueOf())) lastmodMap[`/blog/${slug}/`] = d.toISOString();
  }
  const tagLine = /^\s*tags:\s*\[(.*)\]\s*$/m.exec(fm)?.[1] ?? '';
  for (const raw of tagLine.split(',')) {
    const tag = raw.trim().replace(/^['"]|['"]$/g, '');
    if (tag) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
  }
}

// 把 Markdown 生成的宽表格包进可横向滚动的容器。
// 横评类文章有 5～6 列的表格，窄屏下会把整个页面撑出横向滚动条；
// 只处理列数多的表格，2～3 列的窄表格保持原样自适应。
const WIDE_TABLE_MIN_COLS = 5;

function rehypeScrollableTables() {
  const countColumns = (table) => {
    let max = 0;
    const visit = (node) => {
      if (node.tagName === 'tr') {
        const cells = (node.children ?? []).filter(
          (c) => c.type === 'element' && (c.tagName === 'th' || c.tagName === 'td'),
        );
        max = Math.max(max, cells.length);
      }
      for (const child of node.children ?? []) if (child.type === 'element') visit(child);
    };
    visit(table);
    return max;
  };

  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type !== 'element') return child;
        walk(child);
        if (child.tagName !== 'table' || countColumns(child) < WIDE_TABLE_MIN_COLS) return child;
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [child],
        };
      });
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeScrollableTables],
  },
  // 站点根 URL —— 决定 sitemap / canonical / RSS 的绝对地址。上线前改成正式域名。
  site: SITE_URL,
  // 纯静态输出：build 后 dist/ 直接丢到 Nginx / 主站服务器即可。
  output: 'static',
  // 全站统一带尾斜杠，配合服务器 301，避免 /blog/x 与 /blog/x/ 重复内容。
  trailingSlash: 'always',
  // Windows 上默认可能只绑定 IPv6(::1)，导致浏览器走 IPv4(127.0.0.1) 时打不开。
  // 显式绑定到 127.0.0.1，确保 localhost 一定能访问。
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  integrations: [
    mdx(),
    sitemap({
      // 文章数不足的标签页带 noindex，就不该再出现在 sitemap 里——否则等于
      // 一边告诉 Google「别收录」，一边又把它提交上去，白耗抓取预算。
      filter(page) {
        const path = decodeURIComponent(new URL(page).pathname);
        const tag = /^\/tags\/(.+)\/$/.exec(path)?.[1];
        if (!tag) return true;
        return (tagCounts[tag] ?? 0) >= TAG_INDEX_MIN_POSTS;
      },
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (lastmodMap[path]) item.lastmod = lastmodMap[path];
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    // 每篇文章输出 /blog/slug/index.html，URL 干净、对 SEO 友好。
    format: 'directory',
  },
});
