import assert from 'node:assert/strict'
import test from 'node:test'

import { buildIndexItemFromConfig, getPostDisplayTitle, summarizeContent } from './post-format.ts'

test('strips markdown and takes the first slice of prose', () => {
	const md = '![cover](/x.png)\n\n我仔细琢磨了一下这件事，最后得出的结果还是**我太懒了**。\n\n后面还有很多字。'
	assert.equal(summarizeContent(md, 20), '我仔细琢磨了一下这件事，最后得出的结果还')
})

test('returns empty string for image-only input', () => {
	assert.equal(summarizeContent('![](/a.jpg)\n'), '')
})

test('index item summary prefers stripped markdown over raw markers', () => {
	const item = buildIndexItemFromConfig('n1', {
		format: 'note',
		title: '',
		body: '**你好**，这是一条短记。'
	})
	assert.equal(item.summary, '你好，这是一条短记。')
})

test('display title falls back to slug so RSS description is never empty', () => {
	assert.equal(getPostDisplayTitle({ slug: 'abc123', title: '', summary: '' }), 'abc123')
})
