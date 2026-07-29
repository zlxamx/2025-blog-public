type CategorizedBlog = {
	tags?: string[]
	category?: string
}

export function getDisplayCategories(item: CategorizedBlog): string[] {
	const tags = [...new Set((item.tags || []).map((tag) => tag.trim()).filter(Boolean))]
	if (tags.length > 0) return tags
	return [item.category?.trim() || '未分类']
}
