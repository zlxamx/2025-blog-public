'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { INIT_DELAY } from '@/consts'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { getPostDisplayTitle, getPostHref } from '@/lib/post-format'
import { preloadStreamPost } from '@/lib/load-stream'

export default function StreamPage() {
	const { items, loading } = useBlogIndex({ formats: 'note' })
	const router = useRouter()

	const list = useMemo(
		() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[items]
	)

	return (
		<div className='flex flex-col items-center gap-6 px-6 pt-24 pb-16'>
			<div className='flex w-full max-w-[720px] items-end justify-between gap-4'>
				<div>
					<h1 className='text-xl font-medium'>短记</h1>
					<p className='text-secondary mt-1 text-sm'>不必凑成长文的随手记录</p>
				</div>
				<button type='button' onClick={() => router.push('/compose')} className='brand-btn shrink-0 px-4 py-2 text-sm max-sm:hidden'>
					写短记
				</button>
			</div>

			<div className='flex w-full max-w-[720px] flex-col gap-4'>
				{list.map((item, index) => (
					<motion.div
						key={item.slug}
						initial={{ opacity: 0, y: 8 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ delay: Math.min(index, 6) * (INIT_DELAY / 4) }}
						className='card p-5 transition-shadow hover:shadow-md'>
						<Link href={getPostHref(item)} onMouseEnter={() => preloadStreamPost(item.slug)} className='block space-y-3'>
							<div className='text-secondary flex items-center gap-2 text-xs'>
								<span>{dayjs(item.date).format('YYYY/M/D HH:mm')}</span>
								{item.featured && <span>精选</span>}
							</div>

							{item.title ? (
								<>
									<h2 className='text-base font-medium'>{item.title}</h2>
									{item.summary && <p className='text-secondary line-clamp-3 text-sm leading-relaxed'>{item.summary}</p>}
								</>
							) : (
								<p className='text-sm leading-relaxed whitespace-pre-wrap'>{getPostDisplayTitle(item)}</p>
							)}

							{(item.tags || []).length > 0 && (
								<div className='flex flex-wrap gap-2'>
									{(item.tags || []).map(tag => (
										<span key={tag} className='text-secondary text-xs'>
											#{tag}
										</span>
									))}
								</div>
							)}

							{item.cover && <img src={item.cover} alt='' className='mt-1 max-h-64 w-full rounded-xl border object-cover' />}
						</Link>
					</motion.div>
				))}
			</div>

			{!loading && list.length === 0 && (
				<div className='text-secondary py-12 text-center text-sm'>
					还没有短记。
					<button type='button' className='text-brand ml-1 underline' onClick={() => router.push('/compose')}>
						写第一条
					</button>
				</div>
			)}
			{loading && <div className='text-secondary py-6 text-center text-sm'>加载中…</div>}
		</div>
	)
}
