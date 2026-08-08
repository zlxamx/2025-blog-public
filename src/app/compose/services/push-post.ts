import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { prepareBlogsIndex } from '@/lib/blog-index'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { getFileExt } from '@/lib/utils'
import { buildIndexItemFromConfig, type StreamConfig } from '@/lib/post-format'
import { toast } from 'sonner'
import type { ComposeForm, ComposeImageItem } from '../types'
import { formatDateTimeLocal } from '../stores/compose-store'

export type PushPostParams = {
	form: ComposeForm
	images?: ComposeImageItem[]
	mode?: 'create' | 'edit'
	originalSlug?: string | null
}

function validateForm(form: ComposeForm) {
	if (form.format === 'link') {
		if (!form.url.trim()) throw new Error('链接格式需要填写 URL')
		if (!form.title.trim()) throw new Error('链接格式需要填写标题')
		try {
			// eslint-disable-next-line no-new
			new URL(form.url.trim())
		} catch {
			throw new Error('URL 格式不正确')
		}
	}
	if (form.format === 'quote') {
		if (!form.quoteText.trim()) throw new Error('摘录格式需要填写引文')
	}
	if (form.format === 'note') {
		if (!form.body.trim() && !form.title.trim()) {
			throw new Error('短记至少写一点正文或标题')
		}
	}
	if (!form.slug.trim()) throw new Error('需要 slug')
}

function buildConfig(form: ComposeForm, dateStr: string, imagePaths: string[]): StreamConfig {
	const summaryBase =
		form.format === 'quote'
			? form.quoteText.trim()
			: form.body.replace(/\s+/g, ' ').trim() || form.title.trim()

	const base: StreamConfig = {
		format: form.format,
		title: form.title.trim(),
		date: dateStr,
		tags: form.tags,
		body: form.body,
		rating: form.rating > 0 ? form.rating : undefined,
		featured: form.featured,
		hidden: form.hidden,
		images: imagePaths,
		cover: imagePaths[0] || '',
		summary: summaryBase.slice(0, 160)
	}

	if (form.format === 'link') {
		return {
			...base,
			url: form.url.trim(),
			sourceUrl: form.url.trim(),
			commentary: form.body
		}
	}

	if (form.format === 'quote') {
		return {
			...base,
			quoteText: form.quoteText.trim(),
			sourceName: form.sourceName.trim() || undefined,
			sourceUrl: form.sourceUrl.trim() || undefined,
			commentary: form.body
		}
	}

	return base
}

export async function pushPost(params: PushPostParams): Promise<void> {
	const { form, images = [], mode = 'create', originalSlug } = params
	validateForm(form)

	if (mode === 'edit' && originalSlug && originalSlug !== form.slug) {
		throw new Error('编辑模式下不支持修改 slug')
	}

	const token = await getAuthToken()

	toast.info('正在获取分支信息...')
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const slug = form.slug.trim()
	const basePath = `public/stream/${slug}`
	const commitMessage = mode === 'edit' ? `更新动态: ${slug}` : `新增动态: ${slug}`
	const dateStr = form.date || formatDateTimeLocal()

	const treeItems: TreeItem[] = []
	const imagePaths: string[] = []
	const uploadedHashes = new Set<string>()

	toast.info('正在准备文件...')

	for (const img of images) {
		if (img.type === 'url') {
			imagePaths.push(img.url)
			continue
		}
		const hash = img.hash || (await hashFileSHA256(img.file))
		const ext = getFileExt(img.file.name)
		const filename = `${hash}${ext}`
		const publicPath = `/stream/${slug}/${filename}`

		if (!uploadedHashes.has(hash)) {
			const contentBase64 = await fileToBase64NoPrefix(img.file)
			const blobData = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, contentBase64, 'base64')
			treeItems.push({
				path: `${basePath}/${filename}`,
				mode: '100644',
				type: 'blob',
				sha: blobData.sha
			})
			uploadedHashes.add(hash)
		}
		imagePaths.push(publicPath)
	}

	const config = buildConfig(form, dateStr, imagePaths)

	const configBlob = await createBlob(
		token,
		GITHUB_CONFIG.OWNER,
		GITHUB_CONFIG.REPO,
		toBase64Utf8(JSON.stringify(config, null, 2)),
		'base64'
	)
	treeItems.push({
		path: `${basePath}/config.json`,
		mode: '100644',
		type: 'blob',
		sha: configBlob.sha
	})

	const indexItem = buildIndexItemFromConfig(slug, config)
	const indexJson = await prepareBlogsIndex(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, indexItem, GITHUB_CONFIG.BRANCH)
	const indexBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(indexJson), 'base64')
	treeItems.push({
		path: 'public/blogs/index.json',
		mode: '100644',
		type: 'blob',
		sha: indexBlob.sha
	})

	toast.info('正在创建文件树...')
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

	toast.info('正在创建提交...')
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

	toast.info('正在更新分支...')
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

	toast.success(mode === 'edit' ? '更新成功！' : '发布成功！')
}
