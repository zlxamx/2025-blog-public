'use client'

import dayjs from 'dayjs'
import { motion } from 'motion/react'
import type { BlogIndexItem } from '@/app/blog/types'
import { getPostDisplayTitle } from '@/lib/post-format'
import { preloadStreamPost } from '@/lib/load-stream'
import { cn } from '@/lib/utils'

/** 文卡便签色：低饱和 pastel，按 slug 稳定轮换 */
const NOTE_TONES = [
	{ bg: '#E7F5F0', fg: '#1F3D38' }, // 薄荷
	{ bg: '#F7F1E6', fg: '#3D3426' }, // 奶油
	{ bg: '#FFFFFF', fg: '#2A3030' }, // 白
	{ bg: '#EAF2F7', fg: '#243440' }, // 雾蓝
	{ bg: '#F6EFE8', fg: '#3A3028' }, // 浅杏
	{ bg: '#F1EFF5', fg: '#322F3A' } // 淡紫灰
] as const

function hashSlug(slug: string): number {
	let h = 0
	for (let i = 0; i < slug.length; i++) {
		h = (h * 31 + slug.charCodeAt(i)) | 0
	}
	return Math.abs(h)
}

function getNoteCardTone(slug: string) {
	return NOTE_TONES[hashSlug(slug) % NOTE_TONES.length]
}

type NoteCardProps = {
	item: BlogIndexItem
	index: number
	onOpen: (slug: string) => void
}

export function NoteCard({ item, index, onOpen }: NoteCardProps) {
	const hasCover = Boolean(item.cover)
	const dateLabel = dayjs(item.date).format('M月D日')
	const body = (item.summary?.trim() || item.title?.trim() || getPostDisplayTitle(item)).trim()
	const tone = getNoteCardTone(item.slug)

	return (
		<motion.button
			type='button'
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-24px' }}
			transition={{ delay: Math.min(index % 12, 8) * 0.03, duration: 0.28 }}
			onMouseEnter={() => preloadStreamPost(item.slug)}
			onClick={() => onOpen(item.slug)}
			className={cn('group mb-3 block w-full break-inside-avoid text-left sm:mb-4')}>
			{hasCover ? (
				<div className='relative w-full overflow-hidden rounded-2xl border border-white/70 bg-white/40 shadow-[0_8px_24px_-16px_rgba(15,40,40,0.28)] transition-shadow group-hover:shadow-[0_14px_32px_-16px_rgba(15,40,40,0.36)]'>
					<img
						src={item.cover}
						alt=''
						className='block h-auto max-h-[480px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]'
						loading='lazy'
					/>
					{/* 日期叠在图底，无星标 */}
					<div className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent px-3 pt-10 pb-2.5'>
						<span className='text-[11px] text-white/90'>{dateLabel}</span>
					</div>
				</div>
			) : (
				<div
					className={cn(
						'flex w-full flex-col rounded-2xl border border-white/80 px-4 py-4 shadow-[0_8px_24px_-18px_rgba(15,40,40,0.22)]',
						'transition-shadow group-hover:shadow-[0_14px_28px_-16px_rgba(15,40,40,0.3)]'
					)}
					style={{ backgroundColor: tone.bg, color: tone.fg }}>
					<p className='line-clamp-10 whitespace-pre-wrap text-sm leading-relaxed'>{body}</p>
					<div className='mt-4'>
						<span className='text-[11px] opacity-55'>{dateLabel}</span>
					</div>
				</div>
			)}
		</motion.button>
	)
}
