export type PostFormat = 'article' | 'note'

export type BlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
	hidden?: boolean
	category?: string
	/** 缺省视为 article，兼容旧索引 */
	format?: PostFormat
	/**
	 * 是否进入默认 RSS。
	 * 缺省：article → true；note → false
	 */
	featured?: boolean
	/** 1–5 可选评分 */
	rating?: number
}

export type BlogConfig = {
	title?: string
	tags?: string[]
	date?: string
	summary?: string
	cover?: string
	hidden?: boolean
	category?: string
	format?: PostFormat
	featured?: boolean
	/** note 正文（Markdown）；article 仍用 index.md */
	body?: string
	rating?: number
	images?: string[]
}
