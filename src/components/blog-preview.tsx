'use client'

import { motion } from 'motion/react'
import { useMemo, useRef } from 'react'
import { htmlToReactContent, useMarkdownRender } from '@/hooks/use-markdown-render'
import { BlogSidebar } from '@/components/blog-sidebar'
import { useFootnoteRail } from '@/components/footnote-rail'
import type { TocItem } from '@/lib/markdown-renderer'

type BlogPreviewProps = {
	markdown?: string
	html?: string
	toc?: TocItem[]
	title: string
	tags: string[]
	date: string
	cover?: string
	slug?: string
}

export function BlogPreview({ markdown = '', html, toc: providedToc, title, tags, date, cover, slug }: BlogPreviewProps) {
	const rendered = useMarkdownRender(html ? null : markdown)
	const content = useMemo(() => (html ? htmlToReactContent(html) : rendered.content), [html, rendered.content])
	const toc = html ? providedToc || [] : rendered.toc
	const loading = html ? false : rendered.loading
	const proseRef = useRef<HTMLDivElement>(null)
	useFootnoteRail(proseRef, !loading)

	if (loading) {
		return <div className='text-secondary flex h-full items-center justify-center text-sm'>渲染中...</div>
	}

	return (
		<div className='mx-auto flex max-w-[1500px] items-start justify-center gap-8 px-6 pt-28 pb-12 max-sm:px-0'>
			<div className='hidden w-[15.5rem] shrink-0 self-stretch min-[1440px]:flex min-[1440px]:justify-end'>
				<BlogSidebar cover={cover} toc={toc} slug={slug} />
			</div>

			<motion.article
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.15 }}
				className='card bg-article static w-full max-w-[760px] flex-1 overflow-visible rounded-xl p-8 max-xl:max-w-none'>
				<div>
					<div className='text-center text-2xl font-semibold'>{title}</div>

					<div className='text-secondary mt-4 flex flex-wrap items-center justify-center gap-3 px-8 text-center text-sm'>
						{tags.map(t => (
							<span key={t}>#{t}</span>
						))}
					</div>

					<div className='text-secondary mt-3 text-center text-sm'>{date}</div>

					<div ref={proseRef} className='prose mt-6 max-w-none cursor-text'>
						{content}
					</div>
				</div>
			</motion.article>

			<div aria-hidden='true' className='hidden w-[15.5rem] shrink-0 min-[1440px]:block' />
		</div>
	)
}
