'use client'

import { useEffect, type RefObject } from 'react'
import { layoutFootnoteRail } from '@/lib/footnote-rail'

const WIDE_SCREEN_QUERY = '(min-width: 1280px)'
const RAIL_GAP = 16

export function useFootnoteRail(proseRef: RefObject<HTMLElement | null>, enabled: boolean) {
	useEffect(() => {
		const prose = proseRef.current
		if (!prose || !enabled) return

		const media = window.matchMedia(WIDE_SCREEN_QUERY)
		let frame = 0

		const clearRail = () => {
			prose.classList.remove('footnote-rail-ready')
			prose.querySelectorAll<HTMLElement>('.footnote').forEach(note => note.style.removeProperty('--footnote-rail-y'))
			prose.querySelector<HTMLElement>('.footnote-list')?.style.removeProperty('--footnote-rail-height')
		}

		const layoutRail = () => {
			if (!media.matches) {
				clearRail()
				return
			}

			clearRail()
			const references = Array.from(prose.querySelectorAll<HTMLAnchorElement>('.footnote-ref > a[role="doc-noteref"]'))
			const seenNoteIds = new Set<string>()
			const pairs = references.flatMap(reference => {
				const noteId = reference.getAttribute('href')?.slice(1)
				const note = noteId ? document.getElementById(noteId) : null
				if (!noteId || !note || !prose.contains(note) || seenNoteIds.has(noteId)) return []
				seenNoteIds.add(noteId)
				return [{ reference, note }]
			})

			if (pairs.length === 0) return

			const proseTop = prose.getBoundingClientRect().top
			const tops = layoutFootnoteRail(
				pairs.map(({ reference, note }) => ({
					referenceTop: reference.getBoundingClientRect().top - proseTop,
					noteHeight: note.getBoundingClientRect().height
				})),
				RAIL_GAP
			)

			pairs.forEach(({ note }, index) => note.style.setProperty('--footnote-rail-y', `${tops[index]}px`))
			const list = prose.querySelector<HTMLElement>('.footnote-list')
			const lastPair = pairs[pairs.length - 1]
			const lastHeight = lastPair.note.getBoundingClientRect().height
			list?.style.setProperty('--footnote-rail-height', `${tops[tops.length - 1] + lastHeight}px`)
			prose.classList.add('footnote-rail-ready')
		}

		const scheduleLayout = () => {
			window.cancelAnimationFrame(frame)
			frame = window.requestAnimationFrame(layoutRail)
		}

		const resizeObserver = new ResizeObserver(scheduleLayout)
		resizeObserver.observe(prose)
		window.addEventListener('resize', scheduleLayout)
		media.addEventListener('change', scheduleLayout)
		scheduleLayout()

		return () => {
			window.cancelAnimationFrame(frame)
			resizeObserver.disconnect()
			window.removeEventListener('resize', scheduleLayout)
			media.removeEventListener('change', scheduleLayout)
			clearRail()
		}
	}, [proseRef, enabled])
}
