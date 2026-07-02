/**
 * 全站配置中心。改站名、域名、外链地址都在这里改一处即可。
 */

// 博客正式域名。
export const SITE_URL = 'https://ibve.org';

export const SITE_TITLE = 'ibve · AI 笔记';
export const SITE_DESCRIPTION =
  '一个关于 AI 的学习笔记与技术分享博客。提示词工程、大模型原理、AI 工具实测与海外 AI 使用经验，持续更新。';

// 品牌实体信息，用于全站 Organization / WebSite 结构化数据。
export const SITE_NAME = 'ibve';
export const SITE_LOGO = '/logo.png';
// 首页专用标题：吃到核心关键词，避免首页只有品牌词。
export const HOME_TITLE = 'AI 学习笔记 — 大模型原理 · 提示词工程 · RAG · AI 工具实测 | ibve';
// 有官方 X / Twitter 账号时填 @handle，留空则不输出 twitter:site。
export const TWITTER_HANDLE = '';

// Google Search Console 站点验证码（留空则不输出该 meta）。
export const GOOGLE_SITE_VERIFICATION = 'k_IVQLO6cVD7hCiamSbc40DBQ54aj3eKdizUVzz53Zg';

// 引流目标：文章正文里按需自然引用，不做全站硬广。
// 换域名或加 UTM 只需改这一处。
export const RDVCC_URL = 'https://rdvcc.com';
export const RDVCC_BRAND = '融达虚拟信用卡';

// 带 UTM 参数的落地链接，便于在主站分析里区分博客带来的流量。
// 想让某个文章内链接带追踪时用它；纯自然链接直接写 Markdown 即可。
export const rdvccLink = (path = '/', campaign = 'blog') =>
  `${RDVCC_URL}${path}?utm_source=ibve&utm_medium=article&utm_campaign=${campaign}`;

// 导航栏
export const NAV_LINKS = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/blog/' },
  { label: '关于', href: '/about/' },
];

// 每页文章数（分页用）
export const POSTS_PER_PAGE = 9;
