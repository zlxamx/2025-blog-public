import type { StreamConfig } from '@/lib/post-format'
import { normalizeFormat } from '@/lib/post-format'

export type LoadedStreamPost = {
	slug: string
	config: StreamConfig
}

const cache = new Map<string, Promise<LoadedStreamPost>>()

export async function loadStreamPost(slug: string): Promise<LoadedStreamPost> {
	if (!slug) throw new Error('Slug is required')
	const cached = cache.get(slug)
	if (cached) return cached

	const request = fetchStreamPost(slug)
	cache.set(slug, request)
	request.catch(() => cache.delete(slug))
	return request
}

export function preloadStreamPost(slug: string) {
	if (!slug) return
	void loadStreamPost(slug).catch(() => {})
}

async function fetchStreamPost(slug: string): Promise<LoadedStreamPost> {
	const res = await fetch(`/stream/${encodeURIComponent(slug)}/config.json`)
	if (!res.ok) throw new Error('Post not found')
	const raw = (await res.json()) as StreamConfig
	const format = normalizeFormat(raw.format)
	if (format === 'article') throw new Error('Not a stream post')

	return {
		slug,
		config: {
			...raw,
			format,
			tags: raw.tags || [],
			body: raw.body || '',
			commentary: raw.commentary || '',
			images: raw.images || []
		}
	}
}
