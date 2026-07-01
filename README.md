# ibve · AI 笔记

一个关于 AI 的学习笔记与技术分享博客。技术栈 **Astro 5 + Tailwind v4**，纯静态输出，部署到自有服务器 / Nginx。域名 `ibve.org`。

## 快速开始

```bash
pnpm install       # 安装依赖
pnpm dev           # 本地开发 http://localhost:4321
pnpm build         # 构建到 dist/（纯静态）
pnpm preview       # 本地预览构建产物
```

> Windows 上已在 `astro.config.mjs` 里把 dev server 绑定到 `127.0.0.1`，避免 localhost 走 IPv6 打不开的问题。

## 目录结构

```
src/
  consts.ts              ← 全站配置：域名、站名、外链地址（改这一处即可）
  content.config.ts      ← 文章 frontmatter 校验规则
  content/blog/*.md(x)   ← 文章正文（← 你日常只动这里）
  components/            ← Header / Footer / PostCard / BaseHead(SEO)
  layouts/              ← BaseLayout(全站) / PostLayout(文章页)
  pages/                ← 首页 / blog 列表 / [slug] 详情 / tags / rss / robots
public/                 ← favicon、og 图等静态资源
scripts/new-post.mjs    ← 一键新建草稿
```

## 上线前必改

1. `src/consts.ts` 里的 `SITE_URL` 已设为 `https://ibve.org`，换域名改这里
2. `public/` 放一张 `og-default.png`（1200×630，社交分享封面）

## 写一篇新文章

```bash
SLUG=llm-context-window pnpm new "上下文窗口是什么" "大模型,AI原理"
```

会在 `src/content/blog/` 生成草稿（`draft: true`）。编辑完成后把 `draft` 改成 `false` 即发布。

### frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | ≤70 字符，含主关键词 |
| `description` | ✅ | 20–160 字，搜索结果描述，影响点击率 |
| `pubDate` | ✅ | 发布日期 |
| `updatedDate` |  | 更新日期（更新老文有利 SEO） |
| `tags` |  | 第一个是主关键词，自动生成标签页 |
| `featured` |  | `true` 置顶到首页精选位 |
| `draft` |  | `true` 时不进生产构建 |

## 关于外链（引流）

本站定位是**正常的 AI 学习/技术博客**，全站导航、首页、页脚都不放广告位。外链只在文章正文里、
**在相关语境中自然出现**，直接写 Markdown 链接即可：

```md
我自己用的是 [RDVCC 的虚拟卡](https://rdvcc.com)，充值出卡都比较省心。
```

原则：

- **不是每篇都要放**。像《RAG 是什么》这类纯技术文就完全没有外链，这样整站才可信、才自然。
- 只在「订阅 / 付款 / 海外访问」这类真正相关的语境里带一句，别硬塞。
- 一篇文章最多一个外链，读感优先。
- 想追踪某个链接带来的流量，用 `consts.ts` 里的 `rdvccLink()` 生成带 UTM 的地址；纯自然链接可不带。

> SEO 说明：博客用独立域名 `ibve.org`，作为外部站点链向目标站，属于站外反向链接，权重高于同域子目录。

## SEO 已内置

- ✅ 每页 canonical / OG / Twitter 卡片（`BaseHead.astro`）
- ✅ 文章页 `BlogPosting` + `BreadcrumbList` 结构化数据（JSON-LD）
- ✅ 自动 `sitemap-index.xml`、`rss.xml`、`robots.txt`
- ✅ 干净 URL（`/blog/slug/`）、语义化 HTML、零多余 JS（Core Web Vitals 友好）

## 部署到自有服务器

```bash
pnpm build           # 产物在 dist/
# 把 dist/ 整个目录传到服务器，Nginx 指向它即可
```

Nginx 参考：

```nginx
server {
  listen 80;
  server_name ibve.org;
  root /var/www/ibve/dist;
  index index.html;
  location / { try_files $uri $uri/ $uri.html =404; }
}
```

## 运营建议

1. **选题围绕真实搜索意图**：`提示词技巧`、`RAG 是什么`、`ChatGPT 怎么订阅` 这类问题，既有搜索量又精准。
2. **内容为主，链接为辅**：先把文章写得真有用，外链是顺带的，不是目的。
3. **文章互链**：新文章链到相关旧文（种子文章里已示范），提升站内权重与停留时长。
4. **持续更新**：每周 1–2 篇，老文定期更新 `updatedDate`。
5. **提交搜索引擎**：上线后把 `sitemap-index.xml` 提交到 Google Search Console / Bing。
