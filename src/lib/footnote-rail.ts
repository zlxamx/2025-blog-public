export type FootnoteRailItem = {
	referenceTop: number
	noteHeight: number
}

export function layoutFootnoteRail(items: FootnoteRailItem[], gap: number): number[] {
	let nextTop = 0

	return items.map(({ referenceTop, noteHeight }) => {
		const top = Math.max(referenceTop, nextTop)
		nextTop = top + noteHeight + gap
		return top
	})
}
