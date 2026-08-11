import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { prepareBlogsIndex } from '@/lib/blog-index'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { getFileExt } from '@/lib/utils'
import { buildIndexItemFromConfig, type NoteConfig } from '@/lib/post-format'
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
	if (!form.slug.trim()) throw new Error('需要 slug')
	if (!form.body.trim() && !form.title.trim()) {
		throw new Error('短记至少写一点正文或标题')
	}
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
	const commitMessage = mode === 'edit' ? `更新短记: ${slug}` : `新增短记: ${slug}`
	const dateStr = form.date || formatDateTimeLocal()

	const treeItems: TreeItem[] = []
	const imagePaths: string[] = []
	const uploadedHashes = new Set<string>()

	toast.info('正在准备文件...')

	const localImages = images.filter((img): img is Extract<ComposeImageItem, { type: 'file' }> => img.type === 'file')
	let uploadedCount = 0
	const totalLocal = localImages.length

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
			uploadedCount += 1
			const sizeMb = img.file.size / (1024 * 1024)
			const sizeLabel = sizeMb >= 0.1 ? `${sizeMb.toFixed(1)}MB` : `${Math.max(1, Math.round(img.file.size / 1024))}KB`
			toast.info(`正在上传图片 ${uploadedCount}/${totalLocal || 1}（${sizeLabel}）...`)
			if (img.file.size > 5 * 1024 * 1024) {
				toast.warning(`图片较大（${sizeLabel}），上传可能需要 1–3 分钟，请勿关闭页面`)
			}
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

	const body = form.body
	const config: NoteConfig = {
		format: 'note',
		title: form.title.trim(),
		date: dateStr,
		tags: form.tags,
		body,
		featured: form.featured,
		hidden: form.hidden,
		images: imagePaths,
		cover: imagePaths[0] || '',
		summary: (body.replace(/\s+/g, ' ').trim() || form.title.trim()).slice(0, 160)
	}

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
