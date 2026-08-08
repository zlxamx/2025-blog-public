'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { INIT_DELAY } from '@/consts'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { cn } from '@/lib/utils'
import { getFormatLabel, getPostDisplayTitle, getPostHref, normalizeFormat } from '@/lib/post-format'
import type { PostFormat } from '@/app/blog/types'
import StarRating from '@/components/star-rating'
import { preloadStreamPost } from '@/lib/load-stream'

type Filter = 'all' | 'note' | 'link' | 'quote'

export default function StreamPage() {
	const { items, loading } = useBlogIndex({ formats: 'micro' })
	const [filter, setFilter] = useState<Filter>('all')
	const router = useRouter()

	const filtered = useMemo(() => {
		const list = filter === 'all' ? items : items.filter(it => normalizeFormat(it.format) === filter)
		return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	}, [items, filter])

	const filters: { value: Filter; label: string }[] = [
		{ value: 'all', label: '全部' },
		{ value: 'note', label: '短记' },
		{ value: 'link', label: '链接' },
		{ value: 'quote', label: '摘录' }
	]

	return (
		<>
			<div className='flex flex-col items-center gap-6 px-6 pt-24 pb-16'>
				<div className='flex w-full max-w-[720px] items-end justify-between gap-4'>
					<div>
						<h1 className='text-xl font-medium'>动态</h1>
						<p className='text-secondary mt-1 text-sm'>短记 · 链接 · 摘录 — 不必凑成长文</p>
					</div>
					<button type='button' onClick={() => router.push('/compose')} className='brand-btn shrink-0 px-4 py-2 text-sm max-sm:hidden'>
						写一条
					</button>
				</div>

				{items.length > 0 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						className='card btn-rounded flex items-center gap-1 p-1'>
						{filters.map(option => (
							<button
								key={option.value}
								type='button'
								onClick={() => setFilter(option.value)}
								className={cn(
									'btn-rounded px-3 py-1.5 text-xs font-medium transition-all',
									filter === option.value ? 'bg-brand text-white shadow-sm' : 'text-secondary hover:text-brand hover:bg-white/60'
								)}>
								{option.label}
							</button>
						))}
					</motion.div>
				)}

				<div className='flex w-full max-w-[720px] flex-col gap-4'>
					{filtered.map((item, index) => {
						const format = normalizeFormat(item.format) as PostFormat
						const href = getPostHref(item)
						const title = getPostDisplayTitle(item)
						return (
							<motion.div
								key={item.slug}
								initial={{ opacity: 0, y: 8 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ delay: Math.min(index, 6) * (INIT_DELAY / 4) }}
								className='card p-5 transition-shadow hover:shadow-md'>
								<Link
									href={href}
									onMouseEnter={() => preloadStreamPost(item.slug)}
									className='block space-y-3'>
									<div className='flex items-center gap-2 text-xs'>
										<span className='bg-brand/10 text-brand rounded-full px-2 py-0.5 font-medium'>{getFormatLabel(format)}</span>
										<span className='text-secondary'>{dayjs(item.date).format('YYYY/M/D HH:mm')}</span>
										{item.featured && <span className='text-secondary'>精选</span>}
									</div>

									{format === 'quote' && item.quoteText ? (
										<blockquote className='border-brand/30 border-l-2 pl-4 text-base leading-relaxed'>{item.quoteText}</blockquote>
									) : (
										<h2 className='text-base font-medium'>{title}</h2>
									)}

									{format === 'link' && item.url && (
										<p className='text-brand truncate text-sm'>{item.url}</p>
									)}

									{item.summary && format !== 'quote' && (
										<p className='text-secondary line-clamp-3 text-sm leading-relaxed'>{item.summary}</p>
									)}

									{item.sourceName && <p className='text-secondary text-xs'>— {item.sourceName}</p>}

									<div className='flex flex-wrap items-center gap-3'>
										{typeof item.rating === 'number' && item.rating > 0 && <StarRating stars={item.rating} />}
										{(item.tags || []).map(tag => (
											<span key={tag} className='text-secondary text-xs'>
												#{tag}
											</span>
										))}
									</div>

									{item.cover && (
										<img src={item.cover} alt='' className='mt-1 max-h-64 w-full rounded-xl border object-cover' />
									)}
								</Link>
							</motion.div>
						)
					})}
				</div>

				{!loading && filtered.length === 0 && (
					<div className='text-secondary py-12 text-center text-sm'>
						还没有动态。
						<button type='button' className='text-brand ml-1 underline' onClick={() => router.push('/compose')}>
							写第一条
						</button>
					</div>
				)}
				{loading && <div className='text-secondary py-6 text-center text-sm'>加载中…</div>}
			</div>
		</>
	)
}
