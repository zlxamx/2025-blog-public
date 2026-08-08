'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { loadStreamPost, type LoadedStreamPost } from '@/lib/load-stream'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { getFormatLabel, normalizeFormat } from '@/lib/post-format'
import StarRating from '@/components/star-rating'

export default function StreamPostPage() {
	const params = useParams() as { slug?: string | string[] }
	const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || ''
	const router = useRouter()

	const [post, setPost] = useState<LoadedStreamPost | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		async function run() {
			if (!slug) return
			try {
				setLoading(true)
				const data = await loadStreamPost(slug)
				if (!cancelled) {
					setPost(data)
					setError(null)
				}
			} catch (e: any) {
				if (!cancelled) setError(e?.message || '加载失败')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		void run()
		return () => {
			cancelled = true
		}
	}, [slug])

	const cfg = post?.config
	const format = normalizeFormat(cfg?.format)
	const bodyMd = cfg?.body || cfg?.commentary || ''
	const { content, loading: mdLoading } = useMarkdownRender(bodyMd)

	const dateLabel = useMemo(() => (cfg?.date ? dayjs(cfg.date).format('YYYY年 M月 D日 HH:mm') : ''), [cfg?.date])

	if (!slug) {
		return <div className='text-secondary flex h-full items-center justify-center text-sm'>无效的链接</div>
	}
	if (loading) {
		return <div className='text-secondary flex h-full items-center justify-center text-sm'>加载中…</div>
	}
	if (error || !cfg) {
		return <div className='flex h-full items-center justify-center text-sm text-red-500'>{error || '不存在'}</div>
	}

	return (
		<>
			<article className='mx-auto w-full max-w-[720px] px-6 pt-24 pb-20'>
				<div className='mb-6 flex flex-wrap items-center gap-2 text-xs'>
					<span className='bg-brand/10 text-brand rounded-full px-2.5 py-1 font-medium'>{getFormatLabel(format)}</span>
					<span className='text-secondary'>{dateLabel}</span>
					{cfg.featured && <span className='text-secondary'>精选 · RSS</span>}
					<Link href='/stream' className='text-secondary hover:text-brand ml-auto text-xs underline-offset-2 hover:underline'>
						← 动态
					</Link>
				</div>

				{format === 'quote' && cfg.quoteText && (
					<blockquote className='border-brand/40 mb-6 border-l-4 pl-5 text-xl leading-relaxed font-medium md:text-2xl'>
						{cfg.quoteText}
					</blockquote>
				)}

				{cfg.title && <h1 className='mb-4 text-2xl font-semibold tracking-tight'>{cfg.title}</h1>}

				{format === 'link' && cfg.url && (
					<a
						href={cfg.url}
						target='_blank'
						rel='noopener noreferrer'
						className='bg-brand/5 text-brand mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm break-all hover:opacity-80'>
						<span className='flex-1'>{cfg.url}</span>
						<ExternalLink className='h-4 w-4 shrink-0' />
					</a>
				)}

				{format === 'quote' && (cfg.sourceName || cfg.sourceUrl) && (
					<p className='text-secondary mb-6 text-sm'>
						—{' '}
						{cfg.sourceUrl ? (
							<a href={cfg.sourceUrl} target='_blank' rel='noopener noreferrer' className='text-brand hover:underline'>
								{cfg.sourceName || cfg.sourceUrl}
							</a>
						) : (
							cfg.sourceName
						)}
					</p>
				)}

				{typeof cfg.rating === 'number' && cfg.rating > 0 && (
					<div className='mb-6'>
						<StarRating stars={cfg.rating} />
					</div>
				)}

				{(cfg.images || []).length > 0 && (
					<div className='mb-6 grid gap-3'>
						{(cfg.images || []).map(src => (
							<img key={src} src={src} alt='' className='w-full rounded-2xl border object-cover' />
						))}
					</div>
				)}

				{bodyMd && (
					<div className='prose-blog text-sm leading-7 md:text-base'>
						{mdLoading ? <p className='text-secondary text-sm'>渲染中…</p> : content}
					</div>
				)}

				{(cfg.tags || []).length > 0 && (
					<div className='mt-8 flex flex-wrap gap-2'>
						{(cfg.tags || []).map(tag => (
							<span key={tag} className='text-secondary rounded-full bg-white/50 px-2.5 py-1 text-xs'>
								#{tag}
							</span>
						))}
					</div>
				)}
			</article>

			<motion.button
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => router.push(`/compose?slug=${encodeURIComponent(slug)}`)}
				className='absolute top-4 right-6 rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80 max-sm:hidden'>
				编辑
			</motion.button>
		</>
	)
}
