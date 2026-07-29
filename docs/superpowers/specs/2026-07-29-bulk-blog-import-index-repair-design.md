# 批量文章导入索引修复设计

## 目标

让已经进入 `zlxamx/2025-blog-public` 的 160 篇迁移文章在 `/blog` 页面正常显示，并能打开文章详情页。

## 已确认事实

- 迁移源位于 `/Users/zhangluxi/Downloads/blogs-migrated/public/blogs`。
- 迁移源包含 160 个文章目录；每个目录都有 `index.md` 和 `config.json`。
- Fork 的 `public/blogs` 已包含相同的 160 个文章目录，正文和配置与迁移源逐文件一致。
- Fork 的 `public/blogs/index.json` 当前是空数组 `[]`。
- 线上 `/blogs/index.json` 同样返回空数组，因此 `/blog` 无法列出文章。
- 约 30 个正文图片仍使用 Jant 远程地址。本次保留这些地址，图片本地化不在本次范围内。

## 方案

不重新复制或覆盖文章正文。读取每个 `public/blogs/{slug}/config.json`，生成一个 `BlogIndexItem`：

```ts
type BlogIndexItem = {
  slug: string
  title: string
  tags: string[]
  date: string
  summary?: string
  cover?: string
  hidden?: boolean
  category?: string
}
```

把全部条目按 `date` 降序排列后写入 `public/blogs/index.json`。同时把仍来自上游示例内容的 `public/blogs/categories.json` 清空为：

```json
{
  "categories": []
}
```

文章标签保持原样；不修改 Markdown、标题、日期、摘要、slug、封面或可见性。

## 验证

生成后必须满足：

1. `index.json` 是合法 JSON 数组，恰好包含 160 条记录。
2. 文章目录 slug 与索引 slug 一一对应。
3. 没有重复 slug。
4. 每条记录都有非空的 `slug`、`title` 和 `date`，`tags` 是数组。
5. 索引按日期降序排列。
6. 迁移前后所有 `index.md` 和 `config.json` 保持一致。
7. 项目生产构建成功。
8. 推送后，线上 `/blogs/index.json` 返回 160 条记录，`/blog` 能列出文章，并抽样打开至少三篇文章。

## 交付与回滚

索引修复和分类清理使用一个独立提交。若线上出现问题，可以回滚该提交；文章正文不会受到影响。

## 非目标

- 下载或替换 Jant 图片。
- 修改文章内容或元数据。
- 重做分类、合集或产品页。
- 修改 GitHub App、主题、首页或其他站点功能。
