import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客文章集合。文章放在 src/content/blog/*.md(x)，frontmatter 按下面 schema 校验。
// 少写/写错字段会在 build 时直接报错，避免上线后才发现缺 SEO 字段。
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(70, 'title 建议 ≤70 字符，利于搜索结果完整展示'),
    // 用作 <meta description> 和列表摘要，直接影响点击率。
    description: z.string().min(20).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // 目标关键词，用于分类页与内链。第一个通常是主关键词。
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    author: z.string().default('编辑部'),
    // 草稿不会进入生产构建。
    draft: z.boolean().default(false),
    // 置顶到首页/列表顶部。
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
