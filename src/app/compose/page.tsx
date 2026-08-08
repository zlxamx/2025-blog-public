'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { useComposeStore } from './stores/compose-store'
import { pushPost } from './services/push-post'
import { useAuthStore } from '@/hooks/use-auth'
import { readFileAsText } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import EditableStarRating from '@/components/editable-star-rating'
import type { MicroFormat } from './types'

const FORMATS: { value: MicroFormat; label: string; hint: string }[] = [
	{ value: 'note', label: '短记', hint: '随手想法、日记、状态' },
	{ value: 'link', label: '链接', hint: '分享文章 / 工具并点评' },
	{ value: 'quote', label: '摘录', hint: '书摘、金句、台词' }
]

function ComposeInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { isAuth, setPrivateKey } = useAuthStore()
	const { form, images, loading, mode, originalSlug, updateForm, setFormat, setLoading, addFiles, removeImage, loadForEdit, reset } =
		useComposeStore()
	const keyInputRef = useRef<HTMLInputElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const slug = searchParams.get('slug')
		const formatParam = searchParams.get('format') as MicroFormat | null
		if (slug) {
			void loadForEdit(slug)
		} else {
			reset(formatParam && ['note', 'link', 'quote'].includes(formatParam) ? formatParam : 'note')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams])

	const onChoosePrivateKey = async (file: File) => {
		const pem = await readFileAsText(file)
		setPrivateKey(pem)
		toast.success('密钥已导入')
	}

	const onPublish = async () => {
		try {
			setLoading(true)
			await pushPost({ form, images, mode, originalSlug })
			router.push(`/p/${form.slug}`)
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '发布失败')
		} finally {
			setLoading(false)
		}
	}

	const handlePrimary = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
			return
		}
		void onPublish()
	}

	const tagsText = form.tags.join(', ')

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await onChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				multiple
				className='hidden'
				onChange={async e => {
					if (e.target.files?.length) await addFiles(e.target.files)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pt-24 pb-28'>
				<div className='flex flex-wrap gap-2'>
					{FORMATS.map(item => (
						<button
							key={item.value}
							type='button'
							onClick={() => setFormat(item.value)}
							className={cn(
								'rounded-full border px-4 py-2 text-sm transition-colors',
								form.format === item.value ? 'bg-brand border-brand text-white' : 'bg-white/60 text-secondary hover:text-brand'
							)}>
							{item.label}
						</button>
					))}
				</div>
				<p className='text-secondary -mt-3 text-xs'>{FORMATS.find(f => f.value === form.format)?.hint}</p>

				<div className='card space-y-4 p-6'>
					{form.format === 'link' && (
						<input
							type='url'
							value={form.url}
							onChange={e => updateForm({ url: e.target.value })}
							placeholder='https://…（必填）'
							className='w-full rounded-xl border bg-white/50 px-4 py-3 text-sm focus:outline-none'
						/>
					)}

					{form.format === 'quote' && (
						<textarea
							value={form.quoteText}
							onChange={e => updateForm({ quoteText: e.target.value })}
							placeholder='引文正文（必填）'
							rows={4}
							className='w-full resize-none rounded-xl border bg-white/50 px-4 py-3 text-base leading-relaxed focus:outline-none'
						/>
					)}

					<input
						type='text'
						value={form.title}
						onChange={e => updateForm({ title: e.target.value })}
						placeholder={form.format === 'link' ? '标题（必填）' : '标题（可选）'}
						className='w-full rounded-xl border bg-white/50 px-4 py-3 text-lg font-medium focus:outline-none'
					/>

					{form.format === 'quote' && (
						<div className='grid gap-3 sm:grid-cols-2'>
							<input
								type='text'
								value={form.sourceName}
								onChange={e => updateForm({ sourceName: e.target.value })}
								placeholder='出处 / 作者（可选）'
								className='w-full rounded-xl border bg-white/50 px-4 py-2 text-sm focus:outline-none'
							/>
							<input
								type='url'
								value={form.sourceUrl}
								onChange={e => updateForm({ sourceUrl: e.target.value })}
								placeholder='出处链接（可选）'
								className='w-full rounded-xl border bg-white/50 px-4 py-2 text-sm focus:outline-none'
							/>
						</div>
					)}

					<textarea
						value={form.body}
						onChange={e => updateForm({ body: e.target.value })}
						placeholder={form.format === 'note' ? '写点什么…（支持 Markdown）' : '你的想法 / 点评（可选，支持 Markdown）'}
						rows={form.format === 'note' ? 10 : 6}
						className='w-full resize-y rounded-xl border bg-white/50 px-4 py-3 text-sm leading-relaxed focus:outline-none'
					/>

					<div className='flex flex-wrap items-center gap-4'>
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							className='text-secondary hover:text-brand inline-flex items-center gap-2 rounded-xl border bg-white/50 px-3 py-2 text-sm'>
							<ImagePlus className='h-4 w-4' />
							添加图片
						</button>
						<div className='flex items-center gap-2 text-sm'>
							<span className='text-secondary'>评分</span>
							<EditableStarRating stars={form.rating} editable onChange={v => updateForm({ rating: v })} />
							{form.rating > 0 && (
								<button type='button' className='text-secondary text-xs underline' onClick={() => updateForm({ rating: 0 })}>
									清除
								</button>
							)}
						</div>
					</div>

					{images.length > 0 && (
						<div className='flex flex-wrap gap-2'>
							{images.map(img => {
								const src = img.type === 'url' ? img.url : img.previewUrl
								return (
									<div key={img.id} className='relative h-20 w-20 overflow-hidden rounded-xl border'>
										<img src={src} alt='' className='h-full w-full object-cover' />
										<button
											type='button'
											onClick={() => removeImage(img.id)}
											className='absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white'>
											<X className='h-3 w-3' />
										</button>
									</div>
								)
							})}
						</div>
					)}

					<div className='grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-2'>
						<input
							type='text'
							value={tagsText}
							onChange={e =>
								updateForm({
									tags: e.target.value
										.split(/[,，]/)
										.map(t => t.trim())
										.filter(Boolean)
								})
							}
							placeholder='标签，逗号分隔'
							className='w-full rounded-xl border bg-white/50 px-3 py-2 text-sm focus:outline-none'
						/>
						<input
							type='datetime-local'
							value={form.date}
							onChange={e => updateForm({ date: e.target.value })}
							className='w-full rounded-xl border bg-white/50 px-3 py-2 text-sm focus:outline-none'
						/>
						<input
							type='text'
							value={form.slug}
							onChange={e => updateForm({ slug: e.target.value })}
							disabled={mode === 'edit'}
							placeholder='slug'
							className='w-full rounded-xl border bg-white/50 px-3 py-2 text-sm focus:outline-none disabled:opacity-60'
						/>
						<label className='text-secondary flex items-center gap-2 text-sm'>
							<input type='checkbox' checked={form.featured} onChange={e => updateForm({ featured: e.target.checked })} />
							标为精选（进入 RSS）
						</label>
						<label className='text-secondary flex items-center gap-2 text-sm'>
							<input type='checkbox' checked={form.hidden} onChange={e => updateForm({ hidden: e.target.checked })} />
							隐藏（不出现在列表）
						</label>
					</div>
				</div>
			</div>

			<ul className='absolute top-4 right-6 flex items-center gap-2 max-sm:right-3'>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					type='button'
					onClick={() => router.push('/stream')}
					className='rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-sm'>
					取消
				</motion.button>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					type='button'
					disabled={loading}
					onClick={handlePrimary}
					className='brand-btn px-6'>
					{loading ? '提交中…' : isAuth ? (mode === 'edit' ? '更新' : '发布') : '导入密钥'}
				</motion.button>
			</ul>
		</>
	)
}

export default function ComposePage() {
	return (
		<Suspense fallback={<div className='text-secondary flex h-full items-center justify-center text-sm'>加载中…</div>}>
			<ComposeInner />
		</Suspense>
	)
}
