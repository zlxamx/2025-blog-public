import assert from 'node:assert/strict'
import test from 'node:test'

import { formatPostDateLabel, parsePostDate } from './post-date.ts'

test('treats naive datetime as China time, not UTC', () => {
	const date = parsePostDate('2026-08-11T11:26')
	assert.equal(date.toUTCString(), 'Tue, 11 Aug 2026 03:26:00 GMT')
})

test('treats date-only values as midnight in China', () => {
	const date = parsePostDate('2026-08-11')
	assert.equal(date.toUTCString(), 'Mon, 10 Aug 2026 16:00:00 GMT')
})

test('keeps explicit timezone offsets', () => {
	const date = parsePostDate('2026-08-11T11:26:00Z')
	assert.equal(date.toUTCString(), 'Tue, 11 Aug 2026 11:26:00 GMT')
})

test('formats naive dates without shifting the calendar day', () => {
	assert.equal(formatPostDateLabel('2026-08-11T03:00'), '2026年 8月 11日')
})
