# 网页发文指南（Pages CMS）

以后写文章：打开 **app.pagescms.org** → 填表写正文 → 点保存/发布 → 自动提交到 GitHub → GitHub Actions 自动构建并部署到你的服务器上线。**不用碰代码，不用自建后台。**

链路：

```
在 Pages CMS 网页写文章
   → 提交到 GitHub 仓库 zhangglnuo-art/AiBlog
   → GitHub Actions 自动 build + 部署到服务器
   → 上线到 ibve.org
```

---

## 一次性接入（3 步）

### 1. 授权 Pages CMS

1. 打开 https://pagescms.org → 点 **Sign in** / **Get started**，用 **GitHub** 登录
2. 授权时选 **Only select repositories → `AiBlog`**（只授权这一个仓库即可）

### 2. 打开你的仓库

登录后在 Pages CMS 里选择 `zhangglnuo-art/AiBlog` 仓库、`main` 分支。它会自动读取仓库根目录的 `.pages.yml`，识别出「博客文章」这个集合。

### 3. 开始写

- 左侧「博客文章」→ **Add an entry / 新建**
- 填：标题、英文短链（决定网址）、摘要、发布日期、标签，上传封面，正文用可视化编辑器写
- 点 **Save**（草稿把「存为草稿」开着；要发布就关掉再保存）
- 保存即提交到 GitHub → 约 1–2 分钟后自动上线

> 已有的 6 篇文章会自动出现在列表里，可直接在线编辑。
> 手机浏览器也能用，随时随地发。

---

## 字段说明

| 字段 | 说明 |
| --- | --- |
| 标题 | 文章大标题，≤70 字含关键词 |
| 英文短链 | 决定文章网址 `/blog/xxx`，只用小写字母数字连字符 |
| 摘要 | 20–160 字，搜索结果里的描述，影响点击率 |
| 发布日期 | 文章日期 |
| 更新日期 | 改老文时填，利于 SEO（可留空） |
| 标签 | 第一个是主关键词，自动生成标签页 |
| 封面图 | 建议 1200×630，会传到 `public/covers/`；留空用默认占位 |
| 首页置顶 | 开启后置顶到首页精选位 |
| 存为草稿 | 开启则不发布上线 |
| 正文 | 可视化 Markdown 编辑器 |

---

## 常见问题

**Q：发布后多久上线？**
保存 → GitHub Actions 自动跑（约 1–2 分钟）→ 上线。可在 https://github.com/zhangglnuo-art/AiBlog/actions 看部署进度。

**Q：封面图传到哪了？**
提交到仓库 `public/covers/`，页面里以 `/covers/xxx.jpg` 引用。

**Q：想直接写 Markdown / 本地写？**
仍然可以：直接在 `src/content/blog/` 加 `.md` 文件推送，效果一样。Pages CMS 只是多给你一个网页入口。
