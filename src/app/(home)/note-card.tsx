'use client'

import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import dayjs from 'dayjs'
import Link from 'next/link'
import { HomeDraggableLayer } from './home-draggable-layer'
import { getPostDisplayTitle } from '@/lib/post-format'
import { preloadStreamPost } from '@/lib/load-stream'
import { useMemo, useState } from 'react'
import { NoteDetailDialog } from '@/app/stream/components/note-detail-dialog'

export default function NoteCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const { items, loading } = useBlogIndex({ formats: 'note' })
	const styles = cardStyles.noteCard
	const hiCardStyles = cardStyles.hiCard
	const articleCardStyles = cardStyles.articleCard
	const [activeSlug, setActiveSlug] = useState<string | null>(null)

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
		<>
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
						<div className='grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden'>
							{latest.map(item => {
								const hasCover = Boolean(item.cover)
								return (
									<button
										key={item.slug}
										type='button'
										onMouseEnter={() => preloadStreamPost(item.slug)}
										onClick={() => setActiveSlug(item.slug)}
										className='group overflow-hidden rounded-xl border bg-white/50 text-left transition hover:opacity-90'>
										<div className='aspect-square w-full overflow-hidden bg-white/40'>
											{hasCover ? (
												<img src={item.cover} alt='' className='h-full w-full object-cover' loading='lazy' />
											) : (
												<div className='flex h-full items-center justify-center p-1.5'>
													<p className='line-clamp-4 text-center text-[10px] leading-snug'>{getPostDisplayTitle(item)}</p>
												</div>
											)}
										</div>
										<div className='space-y-0.5 p-1.5'>
											<p className='line-clamp-1 text-[11px] font-medium'>{item.title?.trim() || getPostDisplayTitle(item)}</p>
											<p className='text-secondary text-[10px]'>{dayjs(item.date).format('M/D')}</p>
										</div>
									</button>
								)
							})}
						</div>
					)}
				</Card>
			</HomeDraggableLayer>

			<NoteDetailDialog slug={activeSlug} onClose={() => setActiveSlug(null)} />
		</>
	)
}
