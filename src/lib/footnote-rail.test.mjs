import assert from 'node:assert/strict'
import test from 'node:test'

import { layoutFootnoteRail } from './footnote-rail.ts'

test('keeps later notes below earlier overlapping notes', () => {
	assert.deepEqual(
		layoutFootnoteRail(
			[
				{ referenceTop: 20, noteHeight: 30 },
				{ referenceTop: 35, noteHeight: 20 }
			],
			12
		),
		[20, 62]
	)
})

test('keeps a note aligned with its reference when there is enough space', () => {
	assert.deepEqual(
		layoutFootnoteRail(
			[
				{ referenceTop: 20, noteHeight: 20 },
				{ referenceTop: 100, noteHeight: 20 }
			],
			12
		),
		[20, 100]
	)
})
