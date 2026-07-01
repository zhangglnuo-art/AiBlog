import type { APIRoute } from 'astro';

// 动态生成 robots.txt，sitemap 地址自动取 astro.config 的 site，避免换域名忘记改。
export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site).href}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
