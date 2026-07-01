# 网页版 CMS 上线指南（Sveltia CMS + GitHub + Cloudflare Pages）

目标：以后在浏览器打开 `https://ibve.org/admin`，登录后可视化写文章、传封面、点「发布」→ 自动上线。**全程没有自建后台、没有数据库。**

整体链路：

```
你在 /admin 写文章
   → Sveltia 帮你 commit 到 GitHub 仓库
   → Cloudflare Pages 监测到提交，自动 pnpm build
   → 新文章上线到 ibve.org
```

需要你操作的只有下面 4 步（都是点几下，一次性配置）。

---

## 第 1 步：把代码放到 GitHub

> 注意：`e:/AiBlog` 建议作为**独立仓库**（别和主站/父目录混在一起）。

```bash
cd e:/AiBlog
git init
git add .
git commit -m "init: ibve AI 博客"
```

然后去 GitHub 新建一个仓库（例如叫 `ibve`），按页面提示：

```bash
git remote add origin https://github.com/你的用户名/ibve.git
git branch -M main
git push -u origin main
```

---

## 第 2 步：用 Cloudflare Pages 自动部署

1. 登录 [Cloudflare](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选中刚才的 `ibve` 仓库
3. 构建设置：
   - **Framework preset**：`Astro`
   - **Build command**：`pnpm build`
   - **Build output directory**：`dist`
4. 部署完成后会给你一个 `xxx.pages.dev` 地址，先确认能打开
5. **绑定域名**：Pages 项目 → **Custom domains** → 添加 `ibve.org`，按提示在 DNS 里加一条 CNAME（如果域名也托管在 Cloudflare，一键即可）

到这里，**每次 GitHub 有新提交，Pages 会自动重新构建上线**。

---

## 第 3 步：配置 CMS 登录（一次性）

CMS 要能替你提交到 GitHub，需要一个轻量的 OAuth 中转。Sveltia 官方提供现成的 Cloudflare Worker，部署一次即可，不用写代码。

### 3.1 创建 GitHub OAuth App

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. 填写：
   - **Application name**：`ibve CMS`
   - **Homepage URL**：`https://ibve.org`
   - **Authorization callback URL**：`https://你的worker地址.workers.dev/callback`
     （这个地址下一步部署完 Worker 才有，可以先随便填，回头改）
3. 创建后记下 **Client ID**，再点 **Generate a new client secret** 记下 **Client Secret**

### 3.2 部署 Sveltia 的 OAuth Worker

1. 打开官方仓库 [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)，按其 README 一键部署到 Cloudflare Workers（Deploy 按钮）
2. 在该 Worker 的 **Settings → Variables** 里加两个环境变量：
   - `GITHUB_CLIENT_ID` = 上一步的 Client ID
   - `GITHUB_CLIENT_SECRET` = 上一步的 Client Secret
3. 复制 Worker 的地址（形如 `https://sveltia-cms-auth.你的账号.workers.dev`）
4. 回到 GitHub OAuth App，把 **callback URL** 改成 `https://这个worker地址/callback`

### 3.3 填回配置

打开 [public/admin/config.yml](public/admin/config.yml)，改这两行后提交：

```yaml
backend:
  name: github
  repo: 你的用户名/ibve        # ← 改这里
  branch: main
  base_url: https://你的worker地址.workers.dev   # ← 改这里（不带 /callback）
```

---

## 第 4 步：开始用

1. 打开 `https://ibve.org/admin`
2. 点 **Login with GitHub** 授权
3. 左侧「博客文章」→ **New 文章**：填标题、英文短链、摘要、日期、标签，上传封面，正文用可视化 Markdown 编辑器写
4. 点 **Publish**（或先存草稿）→ 自动提交到 GitHub → 约 1 分钟后自动上线

> 已有的 `.md` 文章会自动出现在后台列表里，可直接在线编辑。
> 手机浏览器也能用，随时随地发。

---

## 常见问题

**Q：一定要用 Cloudflare Pages 吗？我想继续用自己的服务器。**
可以。仓库里已放了 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：配置好服务器 SSH 密钥后，每次提交会自动 `pnpm build` 并把 `dist/` 同步到你的服务器。用它就不需要第 2 步的 Pages。但「网页 CMS 随时随地发」仍需要第 1、3 步（GitHub + OAuth）。

**Q：觉得 OAuth Worker 这步麻烦，有更省事的吗？**
有。改用托管版 [Pages CMS](https://pagescms.org)：授权它的 GitHub App、在仓库根加一个 `.pages.yml`（字段和现有 config.yml 一致），就能在 `app.pagescms.org` 里编辑，**免自建 OAuth Worker**。代价是编辑器托管在第三方（对公开博客影响不大）。需要的话告诉我，我帮你把 `.pages.yml` 也生成好。

**Q：封面图传到哪了？**
后台上传的图片会提交到仓库的 `public/covers/`，页面里以 `/covers/xxx.jpg` 引用，和现在手动放图的规则一致。
