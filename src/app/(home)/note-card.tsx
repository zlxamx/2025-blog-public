'use client'

import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import dayjs from 'dayjs'
import Link from 'next/link'
import { HomeDraggableLayer } from './home-draggable-layer'
import { getPostDisplayTitle, getPostHref } from '@/lib/post-format'
import { preloadStreamPost } from '@/lib/load-stream'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export default function NoteCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const { items, loading } = useBlogIndex({ formats: 'note' })
	const styles = cardStyles.noteCard
	const hiCardStyles = cardStyles.hiCard
	const articleCardStyles = cardStyles.articleCard

	const latest = useMemo(
		() => [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4),
		[items]
	)

	const x =
		styles.offsetX !== null
			? center.x + styles.offsetX
			: center.x + hiCardStyles.width / 2 + CARD_SPACING
	const y =
		styles.offsetY !== null
			? center.y + styles.offsetY
			: center.y + hiCardStyles.height / 2 + CARD_SPACING + (articleCardStyles?.height || 100) + CARD_SPACING

	return (
		<HomeDraggableLayer cardKey='noteCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='flex flex-col max-sm:static'>
				{siteContent.enableChristmas && (
					<img
						src='/images/christmas/snow-9.webp'
						alt=''
						className='pointer-events-none absolute'
						style={{ width: 120, right: -10, top: -14, opacity: 0.75 }}
					/>
				)}

				<div className='mb-2 flex items-center justify-between gap-2'>
					<h2 className='text-secondary text-sm'>短记</h2>
					<Link href='/stream' className='text-brand text-xs hover:underline'>
						全部
					</Link>
				</div>

				{loading ? (
					<div className='text-secondary flex flex-1 items-center justify-center text-xs'>加载中…</div>
				) : latest.length === 0 ? (
					<Link href='/compose' className='text-secondary hover:text-brand flex flex-1 flex-col items-center justify-center gap-1 text-xs'>
						<span>还没有短记</span>
						<span className='underline'>写一条</span>
					</Link>
				) : (
					<div className='min-h-0 flex-1 columns-2 gap-2 overflow-hidden'>
						{latest.map(item => {
							const href = getPostHref(item)
							const hasCover = Boolean(item.cover)
							return (
								<Link
									key={item.slug}
									href={href}
									onMouseEnter={() => preloadStreamPost(item.slug)}
									className={cn(
										'mb-2 block break-inside-avoid overflow-hidden rounded-xl border bg-white/50 transition-opacity hover:opacity-85',
										!hasCover && 'p-2'
									)}>
									{hasCover && (
										<img src={item.cover} alt='' className='aspect-[4/5] w-full object-cover' loading='lazy' />
									)}
									<div className={cn(hasCover ? 'space-y-1 p-2' : 'space-y-1')}>
										<p className='line-clamp-2 text-[11px] leading-snug font-medium'>{getPostDisplayTitle(item)}</p>
										<p className='text-secondary text-[10px]'>{dayjs(item.date).format('M/D')}</p>
									</div>
								</Link>
							)
						})}
					</div>
				)}
			</Card>
		</HomeDraggableLayer>
	)
}
