'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * 短记详情改为浮窗浏览；保留 /p/[slug] 深链，重定向到列表并带 open 参数。
 */
export default function NotePageRedirect() {
	const params = useParams() as { slug?: string | string[] }
	const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || ''
	const router = useRouter()

	useEffect(() => {
		if (!slug) {
			router.replace('/stream')
			return
		}
		router.replace(`/stream?open=${encodeURIComponent(slug)}`)
	}, [slug, router])

	return <div className='text-secondary flex h-full items-center justify-center text-sm'>正在打开短记…</div>
}
