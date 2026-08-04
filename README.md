# LuxiBlog

希路路克的个人站点源码。

- 站点：https://www.xiluluke.com
- 仓库：https://github.com/zlxamx/2025-blog-public
- 技术：Next.js 16 · React 19 · Tailwind CSS 4 · 部署于 Vercel

基于开源模板 [YYsuni/2025-blog-public](https://github.com/YYsuni/2025-blog-public) 定制。

## 本地开发

```bash
pnpm i
pnpm dev   # http://localhost:2025
```

## 内容怎么改

站点把 GitHub 仓库当作 CMS：页面右上角「编辑」导入 GitHub App 的 Private Key（`.pem`）后，可直接从浏览器提交内容。

| 内容 | 路径 |
|------|------|
| 站点名 / 主题色 / 社交 | `src/config/site-content.json` |
| 首页卡片布局 | `src/config/card-styles.json` |
| 文章 | `public/blogs/{slug}/` + `public/blogs/index.json` |
| 关于 / 项目 / 分享 / 博主 | `src/app/*/list.json` |
| GitHub 绑定 | `src/consts.ts` → `GITHUB_CONFIG` |

改完 push 到 `main` 后，等 Vercel 部署完成再刷新。

## 常用命令

```bash
pnpm build
pnpm svg    # 重新生成 src/svgs/index.ts
```
