import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'
import { formatPostDateLabel } from '@/lib/post-date'
import { loadBlogFromFs } from '@/lib/load-blog-fs'
import { renderMarkdown } from '@/lib/markdown-renderer'
import { normalizeFormat, summarizeContent } from '@/lib/post-format'
import { getSiteOrigin } from '@/lib/site-url'
import { BlogPostView } from './blog-post-view'

type PageProps = {
	params: Promise<{ id: string }>
}

export function generateStaticParams() {
	const posts = blogIndex as BlogIndexItem[]
	return posts.filter(post => post.slug && normalizeFormat(post.format) === 'article').map(post => ({ id: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id } = await params
	const blog = loadBlogFromFs(id)
	if (!blog) return { title: '文章不存在' }

	const title = blog.config.title || id
	const description = blog.config.summary?.trim() || summarizeContent(blog.markdown) || title
	const origin = getSiteOrigin()
	const cover = blog.cover ? (blog.cover.startsWith('http') ? blog.cover : `${origin}${blog.cover}`) : undefined

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			images: cover ? [cover] : undefined
		},
		twitter: {
			title,
			description
		}
	}
}

export default async function Page({ params }: PageProps) {
	const { id } = await params
	const blog = loadBlogFromFs(id)
	if (!blog) notFound()

	const title = blog.config.title || id
	const date = formatPostDateLabel(blog.config.date)
	const tags = blog.config.tags || []
	const { html, toc } = await renderMarkdown(blog.markdown)

	return <BlogPostView slug={id} title={title} tags={tags} date={date} cover={blog.cover} html={html} toc={toc} />
}
