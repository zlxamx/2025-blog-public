import assert from 'node:assert/strict'
import test from 'node:test'

import { moveListItem } from './list-order.ts'

test('moves an item to a different list position without changing the other order', () => {
	assert.deepEqual(moveListItem(['文芽', '问答', '资源'], 2, 0), ['资源', '文芽', '问答'])
})

test('leaves a list unchanged for an out-of-range target', () => {
	assert.deepEqual(moveListItem(['文芽', '问答'], 0, -1), ['文芽', '问答'])
	assert.deepEqual(moveListItem(['文芽', '问答'], 1, 2), ['文芽', '问答'])
})
