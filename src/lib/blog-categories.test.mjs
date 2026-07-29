import assert from 'node:assert/strict'
import test from 'node:test'

import { getDisplayCategories } from './blog-categories.ts'

test('uses every migrated tag as a display category', () => {
	assert.deepEqual(getDisplayCategories({ tags: ['周刊', '随笔'], category: '' }), ['周刊', '随笔'])
})

test('falls back to an assigned category or 未分类 when tags are absent', () => {
	assert.deepEqual(getDisplayCategories({ tags: [], category: '手动分类' }), ['手动分类'])
	assert.deepEqual(getDisplayCategories({ tags: [] }), ['未分类'])
})
