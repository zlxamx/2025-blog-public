'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Feather } from 'lucide-react'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { NoteDetailDialog } from './components/note-detail-dialog'
import { NoteCard } from './components/note-card'

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
			<div className='mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6'>
				<div className='mb-8 flex items-end justify-between gap-4'>
					<div>
						<h1 className='text-xl font-medium tracking-tight'>短记</h1>
						<p className='text-secondary mt-1 text-sm'>点开浮窗看全文，不必跳页</p>
					</div>
					<button
						type='button'
						onClick={() => router.push('/compose')}
						className='brand-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm max-sm:px-3'>
						<Feather className='h-3.5 w-3.5' strokeWidth={2.25} />
						写短记
					</button>
				</div>

				{list.length > 0 && (
					// CSS multi-column：真正不等高瀑布流（禁止 aspect-square 套全卡）
					<div className='columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5'>
						{list.map((item, index) => (
							<NoteCard key={item.slug} item={item} index={index} onOpen={setActiveSlug} />
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
