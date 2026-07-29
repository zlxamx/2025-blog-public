import assert from 'node:assert/strict'
import test from 'node:test'

import { appendFootnotes, prepareFootnotes, stripFootnoteReferences } from './footnotes.ts'

test('renders a reference and a semantic endnote for a defined footnote', () => {
	const prepared = prepareFootnotes('正文[^source]。\n\n[^source]: **参考** [链接](https://example.com)')
	const html = appendFootnotes('<p>正文<sup>引用</sup>。</p>\n', prepared, (definition) => `<p>${definition}</p>`)

	assert.match(prepared.markdown, /<a href="#footnote-source" id="footnote-ref-source-1" role="doc-noteref">1<\/a>/)
	assert.match(html, /<section class="footnote-endnotes" role="doc-endnotes"/)
	assert.match(html, /<li id="footnote-source" class="footnote"/)
	assert.match(html, /<p>\*\*参考\*\* \[链接\]\(https:\/\/example\.com\)<\/p>/)
	assert.match(html, /href="#footnote-ref-source-1" role="doc-backlink"/)
})

test('creates a backlink for every repeated reference', () => {
	const prepared = prepareFootnotes('第一次[^a]，第二次[^a]。\n\n[^a]: 注释')

	assert.match(prepared.markdown, /id="footnote-ref-a-1"/)
	assert.match(prepared.markdown, /id="footnote-ref-a-2"/)

	const html = appendFootnotes('', prepared, (definition) => definition)
	assert.match(html, /href="#footnote-ref-a-1" role="doc-backlink"/)
	assert.match(html, /href="#footnote-ref-a-2" role="doc-backlink"/)
})

test('orders endnotes by their first reference instead of their definition', () => {
	const prepared = prepareFootnotes('先引用 B[^b]，再引用 A[^a]。\n\n[^a]: A 注释\n[^b]: B 注释')
	const html = appendFootnotes('', prepared, (definition) => definition)

	assert.match(prepared.markdown, /footnote-ref-b-1" role="doc-noteref">1/)
	assert.match(prepared.markdown, /footnote-ref-a-1" role="doc-noteref">2/)
	assert.ok(html.indexOf('id="footnote-b"') < html.indexOf('id="footnote-a"'))
})

test('does not turn footnote-like text inside code into a reference', () => {
	const prepared = prepareFootnotes('`[^a]`\n\n```txt\n[^a]\n```\n\n[^a]: 注释')

	assert.equal(prepared.markdown, '`[^a]`\n\n```txt\n[^a]\n```\n')
	assert.equal(prepared.footnotes[0].references.length, 0)
})

test('removes rendered footnote references from heading text', () => {
	const prepared = prepareFootnotes('标题[^a]\n\n[^a]: 注释')

	assert.equal(stripFootnoteReferences(prepared.markdown), '标题\n')
})
