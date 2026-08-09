'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { loadStreamPost, type LoadedNote } from '@/lib/load-stream'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { cn } from '@/lib/utils'

type NoteDetailDialogProps = {
	slug: string | null
	onClose: () => void
}

export function NoteDetailDialog({ slug, onClose }: NoteDetailDialogProps) {
	const router = useRouter()
	const [post, setPost] = useState<LoadedNote | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [imageIndex, setImageIndex] = useState(0)

	useEffect(() => {
		if (!slug) {
			setPost(null)
			setError(null)
			setLoading(false)
			setImageIndex(0)
			return
		}

		let cancelled = false
		async function run() {
			try {
				setLoading(true)
				setError(null)
				setImageIndex(0)
				const data = await loadStreamPost(slug!)
				if (!cancelled) setPost(data)
			} catch (e: any) {
				if (!cancelled) {
					setPost(null)
					setError(e?.message || '加载失败')
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		void run()
		return () => {
			cancelled = true
		}
	}, [slug])

	const cfg = post?.config
	const bodyMd = cfg?.body || ''
	const { content, loading: mdLoading } = useMarkdownRender(bodyMd)
	const dateLabel = useMemo(() => (cfg?.date ? dayjs(cfg.date).format('YYYY年 M月 D日') : ''), [cfg?.date])
	const dateTimeLabel = useMemo(() => (cfg?.date ? dayjs(cfg.date).format('YYYY年 M月 D日 HH:mm') : ''), [cfg?.date])

	const images = useMemo(() => {
		if (!cfg) return [] as string[]
		if (cfg.images?.length) return cfg.images.filter(Boolean)
		if (cfg.cover) return [cfg.cover]
		return []
	}, [cfg])

	const hasImages = images.length > 0
	const title = cfg?.title?.trim() || ''

	const goEdit = () => {
		if (!slug) return
		onClose()
		router.push(`/compose?slug=${encodeURIComponent(slug)}`)
	}

	return (
		<DialogModal open={Boolean(slug)} onClose={onClose} className='w-full max-w-[920px] px-2 sm:px-4'>
			{/* 设计图：大圆角白卡片 */}
			<div
				className={cn(
					'relative w-full overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_-20px_rgba(15,40,40,0.18)]',
					hasImages ? 'md:min-h-[420px]' : 'max-w-xl mx-auto'
				)}>
				<button
					type='button'
					onClick={onClose}
					className='absolute top-4 right-4 z-20 rounded-full bg-black/5 p-2 text-black/50 transition hover:bg-black/10 hover:text-black/70'
					aria-label='关闭'>
					<X className='h-4 w-4' />
				</button>

				{loading && (
					<div className='text-secondary flex min-h-[280px] items-center justify-center text-sm'>加载中…</div>
				)}

				{error && !loading && (
					<div className='flex min-h-[240px] flex-col items-center justify-center gap-3 p-8'>
						<p className='text-sm text-red-500'>{error}</p>
						<button type='button' onClick={onClose} className='text-secondary text-sm underline'>
							关闭
						</button>
					</div>
				)}

				{!loading && !error && cfg && (
					<div className={cn('flex flex-col', hasImages && 'md:flex-row md:items-stretch')}>
						{/* 有图：左侧媒体区（设计图左栏） */}
						{hasImages && (
							<div className='relative w-full shrink-0 p-4 md:w-[44%] md:p-5 md:pr-2'>
								<div className='relative aspect-square w-full overflow-hidden rounded-[22px] bg-[#f3f7f6]'>
									<img
										src={images[Math.min(imageIndex, images.length - 1)]}
										alt=''
										className='h-full w-full object-cover'
									/>
									{images.length > 1 && (
										<div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5'>
											{images.map((_, i) => (
												<button
													key={i}
													type='button'
													aria-label={`第 ${i + 1} 张`}
													onClick={() => setImageIndex(i)}
													className={cn(
														'h-1.5 rounded-full transition-all',
														i === imageIndex ? 'bg-white w-4 shadow' : 'w-1.5 bg-white/60'
													)}
												/>
											))}
										</div>
									)}
								</div>
							</div>
						)}

						{/* 右侧 / 无图全文：标签 + 标题/正文 + 日期 + 装饰线 */}
						<div
							className={cn(
								'flex min-w-0 flex-1 flex-col justify-center px-6 pb-6 pt-5 md:px-10 md:py-10',
								hasImages ? 'md:pl-4 md:pr-12' : 'px-8 py-10 md:px-12'
							)}>
							<div className='mb-5 flex flex-wrap items-center gap-2'>
								<span className='rounded-full bg-[#d4efe9] px-3 py-1 text-xs font-medium text-[#2a8f7e]'>短记</span>
								{dateLabel && (
									<span className='text-secondary text-xs tabular-nums'>{dateTimeLabel || dateLabel}</span>
								)}
							</div>

							{title ? (
								<>
									<h2 className='text-[1.65rem] leading-snug font-semibold tracking-tight text-[#1f3a3a] md:text-[1.85rem]'>
										{title}
									</h2>
									{bodyMd && (
										<div className='prose-blog mt-5 max-h-[min(40vh,360px)] overflow-y-auto text-[15px] leading-7 text-[#2c4040]/'>
											{mdLoading ? <p className='text-secondary text-sm'>渲染中…</p> : content}
										</div>
									)}
								</>
							) : (
								<div className='prose-blog max-h-[min(48vh,420px)] overflow-y-auto text-[1.35rem] leading-snug font-semibold tracking-tight text-[#1f3a3a] md:text-[1.55rem] [&_p]:my-2'>
									{mdLoading ? <p className='text-secondary text-sm font-normal'>渲染中…</p> : content}
								</div>
							)}

							{(cfg.tags || []).length > 0 && (
								<div className='mt-4 flex flex-wrap gap-2'>
									{(cfg.tags || []).map(tag => (
										<span key={tag} className='text-secondary text-xs'>
											#{tag}
										</span>
									))}
								</div>
							)}

							{/* 设计图青绿色装饰短线 */}
							<div className='mt-7 h-[3px] w-8 rounded-full bg-[#3db8a0]' />

							<div className='mt-8 flex items-center gap-2'>
								<button
									type='button'
									onClick={onClose}
									className='rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-[#3a5555] transition hover:bg-black/[0.03]'>
									关闭
								</button>
								<button
									type='button'
									onClick={goEdit}
									className='rounded-full bg-[#3db8a0] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#34a58f]'>
									编辑
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DialogModal>
	)
}
