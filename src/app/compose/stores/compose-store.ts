import { create } from 'zustand'
import { toast } from 'sonner'
import { hashFileSHA256 } from '@/lib/file-utils'
import { loadStreamPost } from '@/lib/load-stream'
import { randomSlug } from '@/lib/post-format'
import type { ComposeForm, ComposeImageItem, MicroFormat } from '../types'

export const formatDateTimeLocal = (date: Date = new Date()): string => {
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const initialForm = (format: MicroFormat = 'note'): ComposeForm => ({
	format,
	slug: randomSlug(7),
	title: '',
	body: '',
	url: '',
	quoteText: '',
	sourceName: '',
	sourceUrl: '',
	tags: [],
	date: formatDateTimeLocal(),
	rating: 0,
	featured: false,
	hidden: false
})

type ComposeStore = {
	mode: 'create' | 'edit'
	originalSlug: string | null
	form: ComposeForm
	images: ComposeImageItem[]
	loading: boolean
	updateForm: (updates: Partial<ComposeForm>) => void
	setFormat: (format: MicroFormat) => void
	setLoading: (loading: boolean) => void
	addFiles: (files: FileList | File[]) => Promise<void>
	removeImage: (id: string) => void
	loadForEdit: (slug: string) => Promise<void>
	reset: (format?: MicroFormat) => void
}

export const useComposeStore = create<ComposeStore>((set, get) => ({
	mode: 'create',
	originalSlug: null,
	form: initialForm(),
	images: [],
	loading: false,

	updateForm: updates => set(state => ({ form: { ...state.form, ...updates } })),

	setFormat: format => set(state => ({ form: { ...state.form, format } })),

	setLoading: loading => set({ loading }),

	addFiles: async files => {
		const { images } = get()
		const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
		if (arr.length === 0) return

		const existing = new Set(
			images
				.filter((it): it is Extract<ComposeImageItem, { type: 'file' }> => it.type === 'file' && !!it.hash)
				.map(it => it.hash as string)
		)

		const computed = await Promise.all(
			arr.map(async file => ({
				file,
				hash: await hashFileSHA256(file)
			}))
		)

		const unique = computed.filter(({ hash }) => !existing.has(hash))
		if (unique.length === 0) {
			toast.info('图片已存在')
			return
		}

		const newItems: ComposeImageItem[] = unique.map(({ file, hash }) => ({
			id: Math.random().toString(36).slice(2, 10),
			type: 'file',
			file,
			previewUrl: URL.createObjectURL(file),
			filename: file.name,
			hash
		}))

		set(state => ({ images: [...state.images, ...newItems] }))
	},

	removeImage: id =>
		set(state => {
			for (const img of state.images) {
				if (img.type === 'file' && img.id === id) URL.revokeObjectURL(img.previewUrl)
			}
			return { images: state.images.filter(it => it.id !== id) }
		}),

	loadForEdit: async slug => {
		try {
			set({ loading: true })
			const post = await loadStreamPost(slug)
			const cfg = post.config
			const images: ComposeImageItem[] = (cfg.images || []).map(url => ({
				id: Math.random().toString(36).slice(2, 10),
				type: 'url' as const,
				url
			}))

			set({
				mode: 'edit',
				originalSlug: slug,
				form: {
					format: cfg.format,
					slug,
					title: cfg.title || '',
					body: cfg.body || cfg.commentary || '',
					url: cfg.url || '',
					quoteText: cfg.quoteText || '',
					sourceName: cfg.sourceName || '',
					sourceUrl: cfg.sourceUrl || '',
					tags: cfg.tags || [],
					date: cfg.date ? formatDateTimeLocal(new Date(cfg.date)) : formatDateTimeLocal(),
					rating: cfg.rating || 0,
					featured: cfg.featured ?? false,
					hidden: cfg.hidden ?? false
				},
				images,
				loading: false
			})
			toast.success('已加载')
		} catch (err: any) {
			set({ loading: false })
			toast.error(err?.message || '加载失败')
			throw err
		}
	},

	reset: (format = 'note') => {
		const { images } = get()
		for (const img of images) {
			if (img.type === 'file') URL.revokeObjectURL(img.previewUrl)
		}
		set({
			mode: 'create',
			originalSlug: null,
			form: initialForm(format),
			images: [],
			loading: false
		})
	}
}))
