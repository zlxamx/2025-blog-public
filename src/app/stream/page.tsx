'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { getPostDisplayTitle, getPostHref } from '@/lib/post-format'
import { preloadStreamPost } from '@/lib/load-stream'
import type { BlogIndexItem } from '@/app/blog/types'
import { cn } from '@/lib/utils'

function NoteMasonryCard({ item, index }: { item: BlogIndexItem; index: number }) {
	const href = getPostHref(item)
	const title = getPostDisplayTitle(item)
	const hasCover = Boolean(item.cover)

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-40px' }}
			transition={{ delay: Math.min(index % 8, 6) * 0.04, duration: 0.35 }}
			className='mb-4 break-inside-avoid'>
			<Link
				href={href}
				onMouseEnter={() => preloadStreamPost(item.slug)}
				className={cn(
					'card group block overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md',
					!hasCover && 'p-4'
				)}>
				{hasCover && (
					<div className='relative aspect-auto w-full overflow-hidden bg-white/40'>
						<img
							src={item.cover}
							alt=''
							className='w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
							loading='lazy'
						/>
					</div>
				)}

				<div className={cn(hasCover ? 'space-y-2 p-3.5' : 'space-y-2')}>
					{item.title ? (
						<>
							<h2 className='line-clamp-2 text-sm font-medium leading-snug'>{item.title}</h2>
							{item.summary && <p className='text-secondary line-clamp-3 text-xs leading-relaxed'>{item.summary}</p>}
						</>
					) : (
						<p className={cn('text-sm leading-relaxed', hasCover ? 'line-clamp-4' : 'line-clamp-8')}>{title}</p>
					)}

					<div className='text-secondary flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]'>
						<span>{dayjs(item.date).format('M/D')}</span>
						{(item.tags || []).slice(0, 2).map(tag => (
							<span key={tag}>#{tag}</span>
						))}
					</div>
				</div>
			</Link>
		</motion.div>
	)
}

export default function StreamPage() {
	const { items, loading } = useBlogIndex({ formats: 'note' })
	const router = useRouter()

	const list = useMemo(
		() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[items]
	)

	return (
		<div className='mx-auto w-full max-w-6xl px-4 pt-24 pb-20 sm:px-6'>
			<div className='mb-8 flex items-end justify-between gap-4'>
				<div>
					<h1 className='text-xl font-medium tracking-tight'>短记</h1>
					<p className='text-secondary mt-1 text-sm'>随手翻一翻，不必成章</p>
				</div>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => router.push('/compose')}
						className='brand-btn px-4 py-2 text-sm max-sm:px-3'>
						写短记
					</button>
				</div>
			</div>

			{list.length > 0 && (
				<div className='columns-2 gap-4 md:columns-3 lg:columns-4'>
					{list.map((item, index) => (
						<NoteMasonryCard key={item.slug} item={item} index={index} />
					))}
				</div>
			)}

			{!loading && list.length === 0 && (
				<div className='text-secondary py-20 text-center text-sm'>
					还没有短记。
					<button type='button' className='text-brand ml-1 underline' onClick={() => router.push('/compose')}>
						写第一条
					</button>
				</div>
			)}
			{loading && <div className='text-secondary py-16 text-center text-sm'>加载中…</div>}
		</div>
	)
}
