import type { BlogIndexItem, BlogConfig, PostFormat } from '@/app/blog/types'

export function normalizeFormat(format?: string | null): PostFormat {
	// 历史兼容：曾规划的 link/quote 一律当 note 展示
	if (format === 'note' || format === 'link' || format === 'quote') return 'note'
	return 'article'
}

export function isNoteFormat(format?: string | null): boolean {
	return normalizeFormat(format) === 'note'
}

/** RSS：article 默认 true，短记默认 false */
export function isFeaturedPost(item: Pick<BlogIndexItem, 'format' | 'featured'>): boolean {
	if (typeof item.featured === 'boolean') return item.featured
	return normalizeFormat(item.format) === 'article'
}

export function getPostHref(item: Pick<BlogIndexItem, 'slug' | 'format'>): string {
	return normalizeFormat(item.format) === 'article' ? `/blog/${item.slug}` : `/p/${item.slug}`
}

export function getFormatLabel(format?: string | null): string {
	return normalizeFormat(format) === 'note' ? '短记' : '文章'
}

export function getPostDisplayTitle(item: Pick<BlogIndexItem, 'title' | 'slug' | 'summary'>): string {
	if (item.title?.trim()) return item.title.trim()
	if (item.summary?.trim()) {
		const t = item.summary.trim()
		return t.length > 40 ? `${t.slice(0, 40)}…` : t
	}
	return item.slug
}

export function randomSlug(length = 6): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
	let out = ''
	for (let i = 0; i < length; i++) {
		out += alphabet[Math.floor(Math.random() * alphabet.length)]
	}
	return out
}

export type NoteConfig = BlogConfig & {
	format: 'note'
	body?: string
	images?: string[]
}

export function buildIndexItemFromConfig(slug: string, config: BlogConfig | NoteConfig): BlogIndexItem {
	const format = normalizeFormat(config.format)
	const body = config.body || ''
	const summary = config.summary || body.replace(/\s+/g, ' ').trim().slice(0, 120) || ''

	return {
		slug,
		title: config.title || '',
		tags: config.tags || [],
		date: config.date || new Date().toISOString().slice(0, 16),
		summary,
		cover: config.cover || (config.images && config.images[0]) || '',
		hidden: config.hidden ?? false,
		category: config.category || '',
		format,
		featured: typeof config.featured === 'boolean' ? config.featured : format === 'article',
		rating: config.rating
	}
}
