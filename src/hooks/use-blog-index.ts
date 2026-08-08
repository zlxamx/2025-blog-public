import useSWR from 'swr'
import { useAuthStore } from '@/hooks/use-auth'
import type { BlogIndexItem, PostFormat } from '@/app/blog/types'
import { isMicroFormat, normalizeFormat } from '@/lib/post-format'

export type { BlogIndexItem } from '@/app/blog/types'

// 改进 fetcher，抛出状态码以便处理 404
const fetcher = async (url: string) => {
	const res = await fetch(url)
	if (!res.ok) {
		const error: any = new Error('Fetch failed')
		error.status = res.status
		throw error
	}
	const data = await res.json()
	return Array.isArray(data) ? data : []
}

function sortByDateDesc(items: BlogIndexItem[]) {
	return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function useBlogIndex(options?: { formats?: PostFormat[] | 'article' | 'micro' | 'all' }) {
	const { isAuth } = useAuthStore()
	const { data, error, isLoading } = useSWR<BlogIndexItem[]>('/blogs/index.json', fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	let result = data || []
	if (!isAuth) {
		result = result.filter(item => !item.hidden)
	}

	const formats = options?.formats ?? 'all'
	if (formats === 'article') {
		result = result.filter(item => normalizeFormat(item.format) === 'article')
	} else if (formats === 'micro') {
		result = result.filter(item => isMicroFormat(item.format))
	} else if (Array.isArray(formats)) {
		const set = new Set(formats)
		result = result.filter(item => set.has(normalizeFormat(item.format)))
	}

	return {
		items: result,
		loading: isLoading,
		error
	}
}

export function useLatestBlog() {
	const { items, loading, error } = useBlogIndex({ formats: 'article' })

	const latestBlog = items.length > 0 ? sortByDateDesc(items)[0] : null

	return {
		blog: latestBlog,
		loading,
		error
	}
}

export function useLatestMicro() {
	const { items, loading, error } = useBlogIndex({ formats: 'micro' })
	const latest = items.length > 0 ? sortByDateDesc(items)[0] : null
	return { post: latest, loading, error }
}
