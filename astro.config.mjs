// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE_URL } from './src/consts.ts';

import cloudflare from "@astrojs/cloudflare";

// 构建文章 URL -> lastmod 映射：直接读 frontmatter 的 updatedDate/pubDate，
// 让 sitemap 的 <lastmod> 反映内容真实更新时间（而非每次构建时间，避免误导爬虫）。
const blogDir = new URL('./src/content/blog/', import.meta.url);
/** @type {Record<string, string>} */
const lastmodMap = {};
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
}

// https://astro.build/config
export default defineConfig({
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

  adapter: cloudflare()
});