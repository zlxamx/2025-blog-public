import assert from 'node:assert/strict'
import test from 'node:test'

import { getFileExt } from './file-ext.ts'

test('maps known image types to their real extension', () => {
	assert.equal(getFileExt('cover.JPG'), '.jpg')
	assert.equal(getFileExt('a.jpeg'), '.jpeg')
	assert.equal(getFileExt('x.webp'), '.webp')
	assert.equal(getFileExt('x.png'), '.png')
	assert.equal(getFileExt('icon.svg'), '.svg')
	assert.equal(getFileExt('loop.gif'), '.gif')
	assert.equal(getFileExt('shot.avif'), '.avif')
	assert.equal(getFileExt('phone.heic'), '.heic')
})

test('falls back to the filename extension, then .png', () => {
	assert.equal(getFileExt('doc.bmp'), '.bmp')
	assert.equal(getFileExt('noext'), '.png')
})
