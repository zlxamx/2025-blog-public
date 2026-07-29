'use client'

import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import LikeButton from '@/components/like-button'
import { BlogToc } from '@/components/blog-toc'
import { ScrollTopButton } from '@/components/scroll-top-button'

type TocItem = {
	id: string
	text: string
	level: number
}

type BlogSidebarProps = {
	cover?: string
	toc: TocItem[]
	slug?: string
}

export function BlogSidebar({ cover, toc, slug }: BlogSidebarProps) {
	return (
		<div className='sticky flex w-[200px] shrink-0 flex-col items-start gap-4 self-start max-xl:hidden' style={{ top: 24 }}>
			{cover && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 1 }}
					className='bg-card w-full rounded-xl border p-3'>
					<img src={cover} alt='cover' className='h-auto w-full rounded-xl border object-cover' />
				</motion.div>
			)}

			<BlogToc toc={toc} delay={INIT_DELAY + ANIMATION_DELAY * 2} />

			<LikeButton slug={slug} delay={(INIT_DELAY + ANIMATION_DELAY * 3) * 1000} />

			<ScrollTopButton delay={(INIT_DELAY + ANIMATION_DELAY * 4) * 1000} />
		</div>
	)
}
