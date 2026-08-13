import { MetadataRoute } from 'next'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'
import { parsePostDate } from '@/lib/post-date'
import { getPostHref, normalizeFormat } from '@/lib/post-format'
import { getSiteOrigin } from '@/lib/site-url'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getSiteOrigin()

	console.log(`[Sitemap] Generating for: ${baseUrl}`)

	const posts = blogIndex as BlogIndexItem[]

	const postEntries: MetadataRoute.Sitemap = posts
		.filter(post => post?.slug && !post.hidden)
		.map(post => ({
			url: `${baseUrl}${getPostHref(post)}`,
			lastModified: post.date ? parsePostDate(post.date) : new Date(),
			changeFrequency: 'weekly' as const,
			priority: normalizeFormat(post.format) === 'article' ? 0.8 : 0.6
		}))

	const staticEntries: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1
		},
		{
			url: `${baseUrl}/blog`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.9
		},
		{
			url: `${baseUrl}/stream`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.9
		}
	]

	return [...staticEntries, ...postEntries]
}
