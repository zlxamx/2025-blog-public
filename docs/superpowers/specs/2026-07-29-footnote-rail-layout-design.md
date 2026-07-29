# Article footnote rail layout

## Outcome

On wide screens, article footnotes appear in a right-side rail aligned with the
first matching reference in the prose. The table of contents, like button, and
scroll-to-top control move to a sticky left rail. Mobile and narrow desktop
views retain the existing semantic endnotes beneath the article.

## Layout

- The article page has three reading columns on wide screens: left controls,
  main prose, and a right footnote rail.
- The left rail contains the existing cover image when present, table of
  contents, like button, and scroll-to-top control.
- The right rail is reserved for footnotes and does not contain a summary.
- At the breakpoint where the three-column layout no longer fits, both rails
  are hidden and the current single-column article presentation remains.

## Footnote behavior

- Keep the existing semantic HTML: body references link to endnotes and every
  endnote retains a backlink.
- On wide screens with JavaScript available, measure each first reference and
  place its endnote in the rail at the matching vertical position.
- Resolve overlaps by moving a later footnote below the prior one with a fixed
  gap.
- Recalculate on resize, font/layout changes, and article rerendering.
- Do not clone or move footnote content: CSS positions the semantic endnote
  list as the rail. This preserves no-JS, print, and narrow-screen fallback.

## Verification

- Unit-test the vertical collision layout calculation.
- Verify the existing Markdown footnote tests still pass.
- Verify the production build passes.
- Inspect a migrated footnote article at desktop width: left controls, right
  aligned footnotes, no summary, and no overlapping notes.
- Inspect narrow width: no rails and visible endnotes under the article.
