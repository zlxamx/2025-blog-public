import type { NoteConfig } from '@/lib/post-format'
import { normalizeFormat } from '@/lib/post-format'

export type LoadedNote = {
	slug: string
	config: NoteConfig
}

const cache = new Map<string, Promise<LoadedNote>>()

export function invalidateStreamCache(slug?: string) {
	if (slug) cache.delete(slug)
	else cache.clear()
}

export async function loadStreamPost(slug: string): Promise<LoadedNote> {
	if (!slug) throw new Error('Slug is required')
	const cached = cache.get(slug)
	if (cached) return cached

	const request = fetchNote(slug)
	cache.set(slug, request)
	request.catch(() => cache.delete(slug))
	return request
}

export function preloadStreamPost(slug: string) {
	if (!slug) return
	void loadStreamPost(slug).catch(() => {})
}

async function fetchNote(slug: string): Promise<LoadedNote> {
	const res = await fetch(`/stream/${encodeURIComponent(slug)}/config.json`)
	if (!res.ok) throw new Error('短记不存在')
	const raw = (await res.json()) as NoteConfig

	if (normalizeFormat(raw.format) !== 'note') {
		throw new Error('不是短记')
	}

	return {
		slug,
		config: {
			...raw,
			format: 'note',
			tags: raw.tags || [],
			body: raw.body || '',
			images: raw.images || []
		}
	}
}
