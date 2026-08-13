'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { BlogPreview } from '@/components/blog-preview'
import LiquidGrass from '@/components/liquid-grass'
import { useReadArticles } from '@/hooks/use-read-articles'
import type { TocItem } from '@/lib/markdown-renderer'

type BlogPostViewProps = {
	slug: string
	title: string
	tags: string[]
	date: string
	cover?: string
	html: string
	toc: TocItem[]
}

export function BlogPostView({ slug, title, tags, date, cover, html, toc }: BlogPostViewProps) {
	const router = useRouter()
	const { markAsRead } = useReadArticles()

	useEffect(() => {
		if (slug) markAsRead(slug)
	}, [slug, markAsRead])

	return (
		<>
			<BlogPreview markdown='' html={html} toc={toc} title={title} tags={tags} date={date} cover={cover} slug={slug} />

			<motion.button
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => router.push(`/write/${slug}`)}
				className='absolute top-4 right-6 rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80 max-sm:hidden'>
				编辑
			</motion.button>

			{slug === 'liquid-grass' && <LiquidGrass />}
		</>
	)
}
