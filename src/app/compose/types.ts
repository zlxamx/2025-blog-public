export type ComposeForm = {
	slug: string
	title: string
	body: string
	tags: string[]
	date: string
	featured: boolean
	hidden: boolean
}

export type ComposeImageItem =
	| { id: string; type: 'url'; url: string }
	| { id: string; type: 'file'; file: File; previewUrl: string; filename: string; hash?: string }
