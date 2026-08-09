'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import { DialogModal } from '@/components/dialog-modal'
import { loadStreamPost, type LoadedNote } from '@/lib/load-stream'
import { useMarkdownRender } from '@/hooks/use-markdown-render'

type NoteDetailDialogProps = {
	slug: string | null
	onClose: () => void
}

export function NoteDetailDialog({ slug, onClose }: NoteDetailDialogProps) {
	const router = useRouter()
	const [post, setPost] = useState<LoadedNote | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!slug) {
			setPost(null)
			setError(null)
			setLoading(false)
			return
		}

		let cancelled = false
		async function run() {
			try {
				setLoading(true)
				setError(null)
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
	const dateLabel = useMemo(() => (cfg?.date ? dayjs(cfg.date).format('YYYY年 M月 D日 HH:mm') : ''), [cfg?.date])
	const images = cfg?.images?.length ? cfg.images : cfg?.cover ? [cfg.cover] : []

	return (
		<DialogModal open={Boolean(slug)} onClose={onClose} className='w-full max-w-4xl'>
			<div className='card relative flex max-h-[min(88vh,820px)] w-full flex-col overflow-hidden md:flex-row'>
				<button
					type='button'
					onClick={onClose}
					className='absolute top-3 right-3 z-20 rounded-full border bg-white/80 p-1.5 backdrop-blur transition hover:bg-white'
					aria-label='关闭'>
					<X className='h-4 w-4' />
				</button>

				{/* 左侧媒体区 */}
				<div className='bg-secondary/10 relative flex min-h-[220px] w-full shrink-0 items-center justify-center md:min-h-0 md:w-[46%]'>
					{loading ? (
						<span className='text-secondary text-sm'>加载中…</span>
					) : images.length > 0 ? (
						<div className='flex h-full max-h-[40vh] w-full snap-x snap-mandatory overflow-x-auto md:max-h-none md:flex-col md:overflow-y-auto'>
							{images.map(src => (
								<img key={src} src={src} alt='' className='h-full max-h-[40vh] w-full shrink-0 snap-center object-contain md:max-h-none md:min-h-full' />
							))}
						</div>
					) : (
						<div className='text-secondary flex h-full min-h-[220px] w-full items-center justify-center p-8 text-center text-sm md:min-h-[360px]'>
							{cfg?.title || '无配图'}
						</div>
					)}
				</div>

				{/* 右侧内容 */}
				<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
					<div className='min-h-0 flex-1 space-y-4 overflow-y-auto p-5 pr-12 md:p-6'>
						{loading && <p className='text-secondary text-sm'>加载正文…</p>}
						{error && <p className='text-sm text-red-500'>{error}</p>}

						{!loading && !error && cfg && (
							<>
								<div className='flex flex-wrap items-center gap-2 text-xs'>
									<span className='bg-brand/10 text-brand rounded-full px-2.5 py-1 font-medium'>短记</span>
									<span className='text-secondary'>{dateLabel}</span>
									{cfg.featured && <span className='text-secondary'>精选 · RSS</span>}
									{cfg.hidden && <span className='text-secondary'>已隐藏</span>}
								</div>

								{cfg.title && <h2 className='text-xl font-semibold tracking-tight'>{cfg.title}</h2>}

								{bodyMd ? (
									<div className='prose-blog text-sm leading-7'>{mdLoading ? <p className='text-secondary text-sm'>渲染中…</p> : content}</div>
								) : (
									!cfg.title && <p className='text-secondary text-sm'>（无正文）</p>
								)}

								{(cfg.tags || []).length > 0 && (
									<div className='flex flex-wrap gap-2 pt-2'>
										{(cfg.tags || []).map(tag => (
											<span key={tag} className='text-secondary rounded-full bg-white/60 px-2.5 py-1 text-xs'>
												#{tag}
											</span>
										))}
									</div>
								)}

								<div className='text-secondary border-t border-black/5 pt-4 text-xs'>
									<div className='grid gap-1.5 sm:grid-cols-2'>
										<p>
											<span className='opacity-70'>slug</span> · {slug}
										</p>
										<p>
											<span className='opacity-70'>格式</span> · note
										</p>
										<p>
											<span className='opacity-70'>精选</span> · {cfg.featured ? '是' : '否'}
										</p>
										<p>
											<span className='opacity-70'>隐藏</span> · {cfg.hidden ? '是' : '否'}
										</p>
										{typeof cfg.rating === 'number' && cfg.rating > 0 && (
											<p>
												<span className='opacity-70'>评分</span> · {cfg.rating}/5
											</p>
										)}
									</div>
								</div>
							</>
						)}
					</div>

					<div className='flex shrink-0 items-center justify-end gap-2 border-t border-black/5 bg-white/40 px-5 py-3'>
						<button type='button' onClick={onClose} className='rounded-xl border bg-white/70 px-4 py-2 text-sm'>
							关闭
						</button>
						<button
							type='button'
							disabled={!slug}
							onClick={() => {
								if (!slug) return
								onClose()
								router.push(`/compose?slug=${encodeURIComponent(slug)}`)
							}}
							className='brand-btn px-4 py-2 text-sm disabled:opacity-50'>
							编辑
						</button>
					</div>
				</div>
			</div>
		</DialogModal>
	)
}
