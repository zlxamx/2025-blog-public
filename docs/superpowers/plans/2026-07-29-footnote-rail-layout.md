# Footnote Rail Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move article controls to a left rail and render wide-screen footnotes in a Jant-style right rail aligned with their references.

**Architecture:** Keep the current semantic endnote HTML as the only footnote source. A small client hook measures reference anchors and their endnotes, computes collision-free top offsets, and adds CSS custom properties; CSS turns the existing endnote list into an absolute right rail only at wide desktop widths. The existing list remains in normal flow outside that breakpoint.

**Tech Stack:** Next.js client components, React hooks, TypeScript, CSS, Node built-in test runner.

## Global Constraints

- Do not change Markdown source files or footnote semantic HTML.
- At widths below 1440px, render one-column content with ordinary endnotes below the prose.
- Keep article summaries hidden.
- Do not add a dependency.

---

### Task 1: Collision-free rail placement

**Files:**
- Create: `src/lib/footnote-rail.ts`
- Create: `src/lib/footnote-rail.test.mjs`

**Interfaces:**
- Produces `layoutFootnoteRail(items: RailItem[], gap: number): number[]`.
- `RailItem` has `referenceTop` and `noteHeight` in pixels.

- [ ] **Step 1: Write failing tests**

```js
assert.deepEqual(
  layoutFootnoteRail([
    { referenceTop: 20, noteHeight: 30 },
    { referenceTop: 35, noteHeight: 20 }
  ], 12),
  [20, 62]
)
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test src/lib/footnote-rail.test.mjs`

- [ ] **Step 3: Implement the pure placement function**

```ts
export function layoutFootnoteRail(items: RailItem[], gap: number): number[] {
  let nextTop = 0
  return items.map(({ referenceTop, noteHeight }) => {
    const top = Math.max(referenceTop, nextTop)
    nextTop = top + noteHeight + gap
    return top
  })
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --experimental-strip-types --test src/lib/footnote-rail.test.mjs`

### Task 2: Progressive footnote rail hook and CSS

**Files:**
- Create: `src/components/footnote-rail.tsx`
- Modify: `src/components/blog-preview.tsx`
- Modify: `src/styles/article.css`

**Interfaces:**
- `useFootnoteRail(proseRef)` measures `.footnote-ref > a[role="doc-noteref"]` and `.footnote` elements inside the prose ref.
- It toggles `footnote-rail-ready` only when `window.matchMedia('(min-width: 1440px)')` matches.

- [ ] **Step 1: Write the failing placement test from Task 1 and run it**
- [ ] **Step 2: Implement the hook using `ResizeObserver` and a window resize listener**

```ts
const referenceTop = reference.getBoundingClientRect().top - proseRect.top
const noteHeight = note.getBoundingClientRect().height
note.style.setProperty('--footnote-rail-y', `${top}px`)
```

- [ ] **Step 3: Add wide-screen rail CSS**

```css
@media (min-width: 1440px) {
  .prose.footnote-rail-ready { position: relative; overflow: visible; }
  .prose.footnote-rail-ready > .footnote-endnotes {
    position: absolute;
    inset-inline-start: calc(100% + 2.5rem);
    inset-block-start: 0;
    width: 13rem;
  }
}
```

- [ ] **Step 4: Run rail and existing footnote tests**

Run: `node --experimental-strip-types --test src/lib/footnote-rail.test.mjs src/lib/footnotes.test.mjs`

### Task 3: Three-column article layout

**Files:**
- Modify: `src/components/blog-preview.tsx`
- Modify: `src/components/blog-sidebar.tsx`

**Interfaces:**
- `BlogSidebar` remains the owner of cover, TOC, like, and scroll controls.
- `BlogPreview` renders `BlogSidebar` before the article and attaches the prose ref used by `useFootnoteRail`.

- [ ] **Step 1: Move the sidebar before the article in the flex layout**
- [ ] **Step 2: Widen the desktop wrapper and hide the left sidebar below `xl`**

```tsx
<div className='mx-auto flex max-w-[1500px] items-start gap-8 px-6 pt-28 pb-12 max-xl:block'>
  <BlogSidebar ... />
  <motion.article className='... min-w-0 max-w-[760px] flex-1 ...'>
```

- [ ] **Step 3: Keep normal-flow endnotes below the prose below 1440px**
- [ ] **Step 4: Build**

Run: `pnpm build`

### Task 4: Visual acceptance

**Files:**
- No code changes required unless verification exposes a defect.

- [ ] **Step 1: Start the local app**

Run: `pnpm dev`

- [ ] **Step 2: Verify `zhou-kan-vol19` on desktop**

Confirm the cover, TOC, like, and scroll controls are left of the prose; all ten notes are in the right rail near their first references; no overlap; no summary.

- [ ] **Step 3: Verify at 1024px width**

Confirm both rails are absent and the endnote section appears below the article.

- [ ] **Step 4: Run complete checks and commit**

Run: `node --experimental-strip-types --test src/lib/footnote-rail.test.mjs src/lib/blog-categories.test.mjs src/lib/footnotes.test.mjs && pnpm build && git diff --check`
