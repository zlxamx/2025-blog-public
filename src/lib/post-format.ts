import type { BlogIndexItem, BlogConfig, PostFormat } from '@/app/blog/types'

export const MICRO_FORMATS: PostFormat[] = ['note', 'link', 'quote']

export function normalizeFormat(format?: string | null): PostFormat {
	if (format === 'note' || format === 'link' || format === 'quote' || format === 'article') {
		return format
	}
	return 'article'
}

export function isMicroFormat(format?: string | null): boolean {
	return MICRO_FORMATS.includes(normalizeFormat(format))
}

/** RSS / 广播：article 默认 true，微内容默认 false */
export function isFeaturedPost(item: Pick<BlogIndexItem, 'format' | 'featured'>): boolean {
	if (typeof item.featured === 'boolean') return item.featured
	return normalizeFormat(item.format) === 'article'
}

export function getPostHref(item: Pick<BlogIndexItem, 'slug' | 'format'>): string {
	const format = normalizeFormat(item.format)
	if (format === 'article') return `/blog/${item.slug}`
	return `/p/${item.slug}`
}

export function getFormatLabel(format?: string | null): string {
	switch (normalizeFormat(format)) {
		case 'note':
			return '短记'
		case 'link':
			return '链接'
		case 'quote':
			return '摘录'
		default:
			return '文章'
	}
}

export function getPostDisplayTitle(item: Pick<BlogIndexItem, 'title' | 'slug' | 'format' | 'quoteText' | 'url' | 'summary'>): string {
	if (item.title?.trim()) return item.title.trim()
	const format = normalizeFormat(item.format)
	if (format === 'quote' && item.quoteText?.trim()) {
		const t = item.quoteText.trim()
		return t.length > 40 ? `${t.slice(0, 40)}…` : t
	}
	if (format === 'link' && item.url) return item.url
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

export function slugifyTitle(title: string): string {
	const base = title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
	return base || randomSlug()
}

export type StreamConfig = BlogConfig & {
	format: 'note' | 'link' | 'quote'
	body?: string
	commentary?: string
	images?: string[]
}

export function buildIndexItemFromConfig(slug: string, config: BlogConfig | StreamConfig): BlogIndexItem {
	const format = normalizeFormat(config.format)
	const body = config.body || config.commentary || ''
	const summary =
		config.summary ||
		(format === 'quote' ? config.quoteText?.slice(0, 120) : body.replace(/\s+/g, ' ').trim().slice(0, 120)) ||
		''

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
		url: config.url,
		quoteText: config.quoteText,
		sourceName: config.sourceName,
		sourceUrl: config.sourceUrl,
		rating: config.rating
	}
}
