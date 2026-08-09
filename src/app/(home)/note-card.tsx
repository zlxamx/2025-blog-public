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

	const note = useMemo(() => {
		if (!items.length) return null
		return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
	}, [items])

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
				<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='space-y-2 max-sm:static'>
					{siteContent.enableChristmas && (
						<img
							src='/images/christmas/snow-9.webp'
							alt=''
							className='pointer-events-none absolute'
							style={{ width: 120, right: -10, top: -14, opacity: 0.75 }}
						/>
					)}

					<div className='flex items-center justify-between gap-2'>
						<h2 className='text-secondary text-sm'>最新短记</h2>
						<Link href='/stream' className='text-brand text-xs hover:underline'>
							全部
						</Link>
					</div>

					{loading ? (
						<div className='flex h-[60px] items-center justify-center'>
							<span className='text-secondary text-xs'>加载中…</span>
						</div>
					) : note ? (
						<button
							type='button'
							onMouseEnter={() => preloadStreamPost(note.slug)}
							onClick={() => setActiveSlug(note.slug)}
							className='flex w-full text-left transition-opacity hover:opacity-80'>
							{note.cover ? (
								<img src={note.cover} alt='' className='mr-3 h-12 w-12 shrink-0 rounded-xl border object-cover' />
							) : (
								<div className='text-secondary mr-3 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/60 text-lg'>✎</div>
							)}
							<div className='min-w-0 flex-1'>
								<h3 className='line-clamp-2 text-sm font-medium'>{getPostDisplayTitle(note)}</h3>
								<p className='text-secondary mt-2 text-xs'>{dayjs(note.date).format('YYYY/M/D')}</p>
							</div>
						</button>
					) : (
						<Link href='/compose' className='text-secondary hover:text-brand flex h-[60px] items-center justify-center text-xs'>
							写第一条短记
						</Link>
					)}
				</Card>
			</HomeDraggableLayer>

			<NoteDetailDialog slug={activeSlug} onClose={() => setActiveSlug(null)} />
		</>
	)
}
