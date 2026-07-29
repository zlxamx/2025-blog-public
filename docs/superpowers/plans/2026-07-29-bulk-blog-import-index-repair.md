# Bulk Blog Import Index Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the empty blog index so all 160 already-migrated articles appear on the deployed blog.

**Architecture:** Treat each article directory's `config.json` as the source of truth and mechanically derive `public/blogs/index.json`. Preserve every article body and configuration file, clear only the stale upstream category list, then verify the repository, production build, and deployed site.

**Tech Stack:** Node.js, Next.js 16, pnpm, JSON, Git, Vercel

## Global Constraints

- Do not modify any `public/blogs/{slug}/index.md` or `public/blogs/{slug}/config.json`.
- Preserve the existing 30 Jant remote image references.
- Do not modify GitHub App, theme, home page, product pages, or unrelated site data.
- The final index must contain exactly 160 unique slugs and be sorted by descending `date`.
- Deliver the repair as one implementation commit separate from the design and plan commits.

---

### Task 1: Rebuild the blog index

**Files:**
- Modify: `public/blogs/index.json`
- Modify: `public/blogs/categories.json`

**Interfaces:**
- Consumes: `public/blogs/{slug}/config.json` matching the `BlogConfig` shape in `src/app/blog/types.ts`
- Produces: `public/blogs/index.json` containing `BlogIndexItem[]`

- [ ] **Step 1: Run the precondition validation and confirm it fails**

Run:

```bash
node - <<'NODE'
const fs = require('fs')
const path = require('path')
const root = 'public/blogs'
const dirs = fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory())
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'))
if (index.length !== dirs.length) {
  throw new Error(`index has ${index.length} entries but ${dirs.length} article directories exist`)
}
NODE
```

Expected: FAIL with `index has 0 entries but 160 article directories exist`.

- [ ] **Step 2: Mechanically generate the complete index**

Run:

```bash
node - <<'NODE'
const fs = require('fs')
const path = require('path')
const root = 'public/blogs'
const entries = fs
  .readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => {
    const slug = entry.name
    const config = JSON.parse(fs.readFileSync(path.join(root, slug, 'config.json'), 'utf8'))
    return {
      slug,
      title: config.title,
      tags: config.tags,
      date: config.date,
      summary: config.summary,
      cover: config.cover,
      hidden: config.hidden,
      category: config.category
    }
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

fs.writeFileSync(path.join(root, 'index.json'), `${JSON.stringify(entries, null, 2)}\n`)
NODE
```

Expected: `public/blogs/index.json` contains 160 formatted entries.

- [ ] **Step 3: Clear stale upstream categories**

Replace `public/blogs/categories.json` with:

```json
{
  "categories": []
}
```

- [ ] **Step 4: Run structural validation**

Run:

```bash
node - <<'NODE'
const fs = require('fs')
const path = require('path')
const root = 'public/blogs'
const dirs = fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'))
const slugs = index.map(item => item.slug)
const unique = new Set(slugs)
const sortedSlugs = [...slugs].sort()

if (index.length !== 160) throw new Error(`expected 160 entries, got ${index.length}`)
if (unique.size !== 160) throw new Error(`expected 160 unique slugs, got ${unique.size}`)
if (JSON.stringify(dirs) !== JSON.stringify(sortedSlugs)) throw new Error('index slugs do not match article directories')
if (!index.every(item => item.slug && item.title && item.date && Array.isArray(item.tags))) {
  throw new Error('one or more index entries have invalid required fields')
}
for (let i = 1; i < index.length; i += 1) {
  if ((index[i - 1].date || '') < (index[i].date || '')) throw new Error(`index is not date-descending at ${i}`)
}

console.log('validated 160 indexed articles')
NODE
```

Expected: PASS with `validated 160 indexed articles`.

- [ ] **Step 5: Verify article sources were not changed**

Run:

```bash
diff -qr /Users/zhangluxi/Downloads/blogs-migrated/public/blogs public/blogs \
  | grep -v 'Only in public/blogs: categories.json' \
  | grep -v 'Only in public/blogs: index.json'
```

Expected: no output.

---

### Task 2: Verify the production build

**Files:**
- No source files modified

**Interfaces:**
- Consumes: repaired blog data and the repository's existing build configuration
- Produces: a successful Next.js production build

- [ ] **Step 1: Install locked dependencies**

Run:

```bash
corepack pnpm install --frozen-lockfile
```

Expected: installation completes without changing `pnpm-lock.yaml`.

- [ ] **Step 2: Run the production build**

Run:

```bash
corepack pnpm build
```

Expected: Next.js build exits with status 0 and includes the blog routes.

- [ ] **Step 3: Inspect the complete diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: only `public/blogs/index.json` and `public/blogs/categories.json` are implementation changes, plus this plan document.

---

### Task 3: Commit and publish the repair

**Files:**
- Commit: `public/blogs/index.json`
- Commit: `public/blogs/categories.json`

**Interfaces:**
- Consumes: verified working tree from Tasks 1 and 2
- Produces: a Git commit on `main`, pushed to `origin/main`

- [ ] **Step 1: Commit the implementation**

Run:

```bash
git add public/blogs/index.json public/blogs/categories.json
git commit -m "fix: rebuild migrated blog index"
```

Expected: one implementation commit containing only the two blog data files.

- [ ] **Step 2: Push the local commits**

Run:

```bash
git push origin main
```

Expected: `origin/main` advances to include the design, plan, and implementation commits.

---

### Task 4: Verify the deployed site

**Files:**
- No repository files modified

**Interfaces:**
- Consumes: Vercel deployment triggered from `origin/main`
- Produces: live evidence that the blog index and article pages work

- [ ] **Step 1: Poll the deployed index**

Request:

```text
https://2025-blog-public-one-snowy.vercel.app/blogs/index.json
```

Expected: a JSON array containing 160 entries.

- [ ] **Step 2: Verify the blog list**

Open:

```text
https://2025-blog-public-one-snowy.vercel.app/blog
```

Expected: the loading state resolves into the migrated article list.

- [ ] **Step 3: Open three representative articles**

Open one recent article, one weekly article, and one hidden-or-project migration by their exact slug from the generated index.

Expected: each public sample loads its title and Markdown body; a hidden article is verified through its direct content files rather than expected in the public list.

