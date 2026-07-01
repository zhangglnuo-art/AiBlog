// 快速新建一篇文章：pnpm new "标题" tag1,tag2
// 会在 src/content/blog/ 下生成带完整 frontmatter 的 .md 草稿。
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [, , title, tagsArg] = process.argv;

if (!title) {
  console.error('用法: pnpm new "文章标题" [tag1,tag2]');
  process.exit(1);
}

// 中文标题无法直接做 slug，这里让作者手动指定英文 slug 更利于 SEO。
const slug = (process.env.SLUG || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

if (!slug) {
  console.error('请指定英文 slug（用于 URL）：SLUG=chatgpt-guide pnpm new "标题" tag1,tag2');
  process.exit(1);
}

const tags = (tagsArg || 'AI订阅')
  .split(',')
  .map((t) => `'${t.trim()}'`)
  .join(', ');

const today = new Date().toISOString().slice(0, 10);

const dir = join(process.cwd(), 'src', 'content', 'blog');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const file = join(dir, `${slug}.md`);
if (existsSync(file)) {
  console.error(`已存在: ${file}`);
  process.exit(1);
}

const template = `---
title: ${title}
description: 在这里写 20-160 字的摘要，会作为搜索结果描述与列表摘要，直接影响点击率。
pubDate: ${today}
tags: [${tags}]
author: 编辑部
draft: true
---

正文开头用一段话点明「读者的痛点 + 本文能解决什么」。

## 第一个小标题

内容……在自然的位置放一个指向主站的链接，例如用一张 [虚拟信用卡](https://rdvcc.com) 解决支付问题。

## 常见问题

**Q：……？**
……

<!-- 文章底部会自动追加引流 CTA，无需手动添加。写完把上面的 draft 改成 false 即可发布。 -->
`;

writeFileSync(file, template, 'utf8');
console.log(`✅ 已创建草稿: src/content/blog/${slug}.md`);
console.log('   编辑完成后，把 frontmatter 里的 draft 改为 false 发布。');
