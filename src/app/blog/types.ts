export type PostFormat = 'article' | 'note' | 'link' | 'quote'

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
	 * 缺省：article → true；note/link/quote → false
	 */
	featured?: boolean
	/** link 外链 */
	url?: string
	/** quote 引文（列表预览可截断） */
	quoteText?: string
	sourceName?: string
	sourceUrl?: string
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
	url?: string
	quoteText?: string
	sourceName?: string
	sourceUrl?: string
	/** note/link/quote 正文（Markdown）；article 仍用 index.md */
	body?: string
	/** 评论区（link/quote 附言） */
	commentary?: string
	rating?: number
	images?: string[]
}
