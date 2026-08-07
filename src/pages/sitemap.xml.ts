import type { APIRoute } from 'astro';

// @astrojs/sitemap 生成的是 sitemap-index.xml + sitemap-0.xml，没有 /sitemap.xml。
// 但 /sitemap.xml 是搜索引擎和人工提交时默认会试的路径，这里补一份同样的索引，避免 404。
// 单个 sitemap 文件上限 45000 条 URL，远超当前规模，所以只需指向 sitemap-0.xml。
export const GET: APIRoute = ({ site }) => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${new URL('sitemap-0.xml', site).href}</loc></sitemap>
</sitemapindex>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
