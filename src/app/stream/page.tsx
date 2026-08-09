'use client'

import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { getPostDisplayTitle } from '@/lib/post-format'
import { preloadStreamPost } from '@/lib/load-stream'
import type { BlogIndexItem } from '@/app/blog/types'
import { cn } from '@/lib/utils'
import { NoteDetailDialog } from './components/note-detail-dialog'

function NoteSquareCard({
	item,
	index,
	onOpen
}: {
	item: BlogIndexItem
	index: number
	onOpen: (slug: string) => void
}) {
	const title = getPostDisplayTitle(item)
	const hasCover = Boolean(item.cover)

	return (
		<motion.button
			type='button'
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-24px' }}
			transition={{ delay: Math.min(index % 12, 8) * 0.03, duration: 0.3 }}
			onMouseEnter={() => preloadStreamPost(item.slug)}
			onClick={() => onOpen(item.slug)}
			className='group w-full text-left'>
			{/* 小红书式方形封面 */}
			<div className='relative aspect-square w-full overflow-hidden rounded-2xl border bg-white/50 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md'>
				{hasCover ? (
					<img
						src={item.cover}
						alt=''
						className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]'
						loading='lazy'
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-white/80 to-[color-mix(in_oklab,var(--color-brand)_12%,white)] p-4'>
						<p className='line-clamp-6 text-center text-sm leading-relaxed text-black/70'>{title}</p>
					</div>
				)}
			</div>

			<div className='mt-2 space-y-1 px-0.5'>
				<p className='line-clamp-2 text-sm leading-snug font-medium'>{item.title?.trim() || title}</p>
				<div className='text-secondary flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]'>
					<span>{dayjs(item.date).format('M月D日')}</span>
					{(item.tags || []).slice(0, 2).map(tag => (
						<span key={tag}>#{tag}</span>
					))}
				</div>
			</div>
		</motion.button>
	)
}

function StreamPageInner() {
	const { items, loading } = useBlogIndex({ formats: 'note' })
	const router = useRouter()
	const searchParams = useSearchParams()
	const [activeSlug, setActiveSlug] = useState<string | null>(null)

	useEffect(() => {
		const open = searchParams.get('open')
		if (open) setActiveSlug(open)
	}, [searchParams])

	const list = useMemo(
		() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[items]
	)

	const closeDialog = () => {
		setActiveSlug(null)
		if (searchParams.get('open')) {
			router.replace('/stream', { scroll: false })
		}
	}

	return (
		<>
			<div className='mx-auto w-full max-w-6xl px-4 pt-24 pb-20 sm:px-6'>
				<div className='mb-8 flex items-end justify-between gap-4'>
					<div>
						<h1 className='text-xl font-medium tracking-tight'>短记</h1>
						<p className='text-secondary mt-1 text-sm'>点开浮窗看全文，不必跳页</p>
					</div>
					<button type='button' onClick={() => router.push('/compose')} className='brand-btn px-4 py-2 text-sm max-sm:px-3'>
						写短记
					</button>
				</div>

				{list.length > 0 && (
					<div className={cn('grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-7 md:grid-cols-3 lg:grid-cols-4')}>
						{list.map((item, index) => (
							<NoteSquareCard key={item.slug} item={item} index={index} onOpen={setActiveSlug} />
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

			<NoteDetailDialog slug={activeSlug} onClose={closeDialog} />
		</>
	)
}

export default function StreamPage() {
	return (
		<Suspense fallback={<div className='text-secondary flex h-full items-center justify-center text-sm'>加载中…</div>}>
			<StreamPageInner />
		</Suspense>
	)
}
