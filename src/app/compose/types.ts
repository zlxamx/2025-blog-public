import type { PostFormat } from '@/app/blog/types'

export type MicroFormat = Exclude<PostFormat, 'article'>

export type ComposeForm = {
	format: MicroFormat
	slug: string
	title: string
	body: string
	url: string
	quoteText: string
	sourceName: string
	sourceUrl: string
	tags: string[]
	date: string
	rating: number
	featured: boolean
	hidden: boolean
}

export type ComposeImageItem =
	| { id: string; type: 'url'; url: string }
	| { id: string; type: 'file'; file: File; previewUrl: string; filename: string; hash?: string }
