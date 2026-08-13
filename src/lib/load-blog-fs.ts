import fs from 'node:fs'
import path from 'node:path'

import type { BlogConfig, LoadedBlog } from '@/lib/load-blog'

function isSafeSlug(slug: string): boolean {
	return Boolean(slug) && !slug.includes('..') && !slug.includes('/') && !slug.includes('\\')
}

export function loadBlogFromFs(slug: string): LoadedBlog | null {
	if (!isSafeSlug(slug)) return null

	const dir = path.join(process.cwd(), 'public', 'blogs', slug)
	const mdPath = path.join(dir, 'index.md')
	if (!fs.existsSync(mdPath)) return null

	let config: BlogConfig = {}
	const configPath = path.join(dir, 'config.json')
	if (fs.existsSync(configPath)) {
		try {
			config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as BlogConfig
		} catch {
			config = {}
		}
	}

	return {
		slug,
		config,
		markdown: fs.readFileSync(mdPath, 'utf8'),
		cover: config.cover
	}
}
