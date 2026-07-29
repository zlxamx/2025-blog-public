export interface Footnote {
	id: string
	label: string
	definition: string
	references: string[]
	number?: number
}

export interface PreparedFootnotes {
	markdown: string
	footnotes: Footnote[]
}

export function stripFootnoteReferences(markdown: string): string {
	return markdown.replace(/<sup class="footnote-ref">[\s\S]*?<\/sup>/g, '')
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function normalizeLabel(label: string): string {
	return encodeURIComponent(label.trim().toLowerCase().replace(/\s+/g, '-'))
}

function replaceReferences(text: string, footnotes: Map<string, Footnote>): string {
	let output = ''
	let cursor = 0

	while (cursor < text.length) {
		const openingTicks = text.slice(cursor).match(/^`+/)?.[0]
		if (openingTicks) {
			const closingIndex = text.indexOf(openingTicks, cursor + openingTicks.length)
			if (closingIndex !== -1) {
				output += text.slice(cursor, closingIndex + openingTicks.length)
				cursor = closingIndex + openingTicks.length
				continue
			}
		}

		const reference = text.slice(cursor).match(/^\[\^([^\]\n]+)\]/)
		if (!reference) {
			output += text[cursor]
			cursor += 1
			continue
		}

		const label = reference[1].trim()
		const footnote = footnotes.get(label)
		if (!footnote) {
			output += `<sup class="footnote-ref">[^${escapeHtml(label)}]</sup>`
			cursor += reference[0].length
			continue
		}

		const referenceId = `footnote-ref-${normalizeLabel(label)}-${footnote.references.length + 1}`
		footnote.number ??= [...footnotes.values()].filter((item) => item.references.length > 0).length + 1
		footnote.references.push(referenceId)
		output += `<sup class="footnote-ref"><a href="#${footnote.id}" id="${referenceId}" role="doc-noteref">${footnote.number}</a></sup>`
		cursor += reference[0].length
	}

	return output
}

export function prepareFootnotes(markdown: string): PreparedFootnotes {
	const lines = markdown.split('\n')
	const definitions = new Map<string, Footnote>()
	const contentLines: string[] = []
	let fenceMarker: string | null = null

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index]
		const fence = line.match(/^\s*(`{3,}|~{3,})/)
		if (fence) {
			if (!fenceMarker) fenceMarker = fence[1][0]
			else if (fence[1][0] === fenceMarker) fenceMarker = null
			contentLines.push(line)
			continue
		}

		if (fenceMarker) {
			contentLines.push(line)
			continue
		}

		const definition = line.match(/^\[\^([^\]\n]+)\]:\s*(.*)$/)
		if (!definition) {
			contentLines.push(line)
			continue
		}

		const label = definition[1].trim()
		const definitionLines = [definition[2]]
		while (index + 1 < lines.length && /^(?:\t| {4})/.test(lines[index + 1])) {
			index += 1
			definitionLines.push(lines[index].replace(/^(?:\t| {4})/, ''))
		}

		if (!definitions.has(label)) {
			definitions.set(label, {
				id: `footnote-${normalizeLabel(label)}`,
				label,
				definition: definitionLines.join('\n').trim(),
				references: []
			})
		}
	}

	const markdownWithoutDefinitions = contentLines.join('\n')
	const footnotes = [...definitions.values()]
	const footnotesByLabel = new Map(footnotes.map((footnote) => [footnote.label, footnote]))
	const renderedLines: string[] = []
	fenceMarker = null

	for (const line of markdownWithoutDefinitions.split('\n')) {
		const fence = line.match(/^\s*(`{3,}|~{3,})/)
		if (fence) {
			if (!fenceMarker) fenceMarker = fence[1][0]
			else if (fence[1][0] === fenceMarker) fenceMarker = null
			renderedLines.push(line)
			continue
		}

		renderedLines.push(fenceMarker ? line : replaceReferences(line, footnotesByLabel))
	}

	return { markdown: renderedLines.join('\n'), footnotes }
}

export function appendFootnotes(html: string, prepared: PreparedFootnotes, renderDefinition: (definition: string) => string): string {
	const referencedFootnotes = prepared.footnotes.filter((footnote) => footnote.references.length > 0).sort((left, right) => (left.number ?? 0) - (right.number ?? 0))
	if (referencedFootnotes.length === 0) return html

	const items = referencedFootnotes
		.map((footnote) => {
			const backlinks = footnote.references
				.map((referenceId) => `<a href="#${referenceId}" role="doc-backlink" aria-label="返回引用">↩</a>`)
				.join(' ')
			return `<li id="${footnote.id}" class="footnote">${renderDefinition(footnote.definition)}<span class="footnote-backlinks">${backlinks}</span></li>`
		})
		.join('\n')

	return `${html}<section class="footnote-endnotes" role="doc-endnotes" aria-label="脚注"><ol class="footnote-list">${items}</ol></section>\n`
}
