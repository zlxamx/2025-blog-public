import type { BlogConfig } from '@/app/blog/types'

export type { BlogConfig } from '@/app/blog/types'

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

const blogRequestCache = new Map<string, Promise<LoadedBlog>>()

/**
 * Load blog data from public/blogs/{slug}
 * Used by both view page and edit page
 */
export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) {
		throw new Error('Slug is required')
	}
	const cached = blogRequestCache.get(slug)
	if (cached) return cached

	const request = fetchBlog(slug)
	blogRequestCache.set(slug, request)
	request.catch(() => blogRequestCache.delete(slug))
	return request
}

export function preloadBlog(slug: string) {
	if (!slug) return
	void loadBlog(slug).catch(() => {})
}

async function fetchBlog(slug: string): Promise<LoadedBlog> {

	const basePath = `/blogs/${encodeURIComponent(slug)}`
	const configPromise: Promise<BlogConfig> = fetch(`${basePath}/config.json`)
		.then(async res => {
			if (!res.ok) return {} as BlogConfig
			try {
				return (await res.json()) as BlogConfig
			} catch {
				return {}
			}
		})
		.catch(() => ({} as BlogConfig))
	const markdownPromise = fetch(`${basePath}/index.md`)

	const [config, mdRes] = await Promise.all([configPromise, markdownPromise])
	if (!mdRes.ok) {
		throw new Error('Blog not found')
	}
	const markdown = await mdRes.text()

	return {
		slug,
		config,
		markdown,
		cover: config.cover
	}
}
