import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveSiteOrigin } from './site-url.ts'

test('falls back to the canonical blog host', () => {
	assert.equal(resolveSiteOrigin(), 'https://www.xiluluke.com')
	assert.equal(resolveSiteOrigin(''), 'https://www.xiluluke.com')
})

test('rejects vercel preview hosts and localhost', () => {
	assert.equal(resolveSiteOrigin('https://2025-blog-public-ku696116c-luxis-projects-405734ce.vercel.app'), 'https://www.xiluluke.com')
	assert.equal(resolveSiteOrigin('http://localhost:3000'), 'https://www.xiluluke.com')
})

test('keeps a real custom domain', () => {
	assert.equal(resolveSiteOrigin('https://luxi.blog'), 'https://luxi.blog')
	assert.equal(resolveSiteOrigin('luxi.blog/'), 'https://luxi.blog')
})
