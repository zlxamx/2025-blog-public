'use client'

import { useAuthStore } from '@/hooks/use-auth'
import { KJUR, KEYUTIL } from 'jsrsasign'
import { toast } from 'sonner'

export const GH_API = 'https://api.github.com'

/** 普通 GitHub API 超时 */
const DEFAULT_FETCH_TIMEOUT_MS = 60_000
/** 图片 blob 上传超时（大图 base64 体积约为原图 4/3） */
const BLOB_FETCH_TIMEOUT_MS = 180_000

function handle401Error(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		useAuthStore.getState().clearAuth()
	} catch (error) {
		console.error('Failed to clear auth cache:', error)
	}
}

function handle422Error(): void {
	toast.error('操作太快了，请操作慢一点')
}

async function readGitHubErrorMessage(res: Response): Promise<string> {
	try {
		const data = await res.json()
		if (typeof data?.message === 'string' && data.message) return data.message
		return JSON.stringify(data).slice(0, 200)
	} catch {
		try {
			const text = await res.text()
			return text.slice(0, 200) || res.statusText || String(res.status)
		} catch {
			return res.statusText || String(res.status)
		}
	}
}

async function ghFetch(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS): Promise<Response> {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		return await fetch(url, { ...init, signal: controller.signal })
	} catch (err: unknown) {
		const name = err && typeof err === 'object' && 'name' in err ? String((err as { name?: string }).name) : ''
		if (name === 'AbortError') {
			throw new Error(`请求超时（${Math.round(timeoutMs / 1000)}s），请检查网络后重试；大图建议先压缩到 2MB 以内`)
		}
		throw err
	} finally {
		clearTimeout(timer)
	}
}

async function assertOk(res: Response, action: string): Promise<void> {
	if (res.status === 401) {
		handle401Error()
		throw new Error(`${action}失败：登录已过期，请重新导入私钥后再试`)
	}
	if (res.status === 422) {
		handle422Error()
		const detail = await readGitHubErrorMessage(res)
		throw new Error(`${action}失败（422）：${detail}`)
	}
	if (!res.ok) {
		const detail = await readGitHubErrorMessage(res)
		throw new Error(`${action}失败（${res.status}）：${detail}`)
	}
}

function authHeaders(token: string, withJson = false): HeadersInit {
	return {
		Authorization: `Bearer ${token}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		...(withJson ? { 'Content-Type': 'application/json' } : {})
	}
}

export function toBase64Utf8(input: string): string {
	return btoa(unescape(encodeURIComponent(input)))
}

export function signAppJwt(appId: string, privateKeyPem: string): string {
	const now = Math.floor(Date.now() / 1000)
	const header = { alg: 'RS256', typ: 'JWT' }
	const payload = { iat: now - 60, exp: now + 8 * 60, iss: appId }
	const prv = KEYUTIL.getKey(privateKeyPem) as unknown as string
	return KJUR.jws.JWS.sign('RS256', JSON.stringify(header), JSON.stringify(payload), prv)
}

export async function getInstallationId(jwt: string, owner: string, repo: string): Promise<number> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/installation`, {
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	await assertOk(res, '获取 Installation')
	const data = await res.json()
	return data.id
}

export async function createInstallationToken(jwt: string, installationId: number): Promise<{ token: string; expiresAt?: string }> {
	const res = await ghFetch(`${GH_API}/app/installations/${installationId}/access_tokens`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	await assertOk(res, '创建 Installation Token')
	const data = await res.json()
	return { token: data.token as string, expiresAt: data.expires_at as string | undefined }
}

export async function getFileSha(token: string, owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, {
		headers: authHeaders(token)
	})
	if (res.status === 404) return undefined
	await assertOk(res, '读取文件 SHA')
	const data = await res.json()
	return (data && data.sha) || undefined
}

export async function putFile(token: string, owner: string, repo: string, path: string, contentBase64: string, message: string, branch: string) {
	const sha = await getFileSha(token, owner, repo, path, branch)
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
		method: 'PUT',
		headers: authHeaders(token, true),
		body: JSON.stringify({ message, content: contentBase64, branch, ...(sha ? { sha } : {}) })
	})
	await assertOk(res, '写入文件')
	return res.json()
}

// Batch commit APIs

export async function getRef(token: string, owner: string, repo: string, ref: string): Promise<{ sha: string }> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/git/ref/${encodeURIComponent(ref)}`, {
		headers: authHeaders(token)
	})
	await assertOk(res, '获取分支引用')
	const data = await res.json()
	return { sha: data.object.sha }
}

export type TreeItem = {
	path: string
	mode: '100644' | '100755' | '040000' | '160000' | '120000'
	type: 'blob' | 'tree' | 'commit'
	content?: string
	sha?: string | null
}

export async function createTree(token: string, owner: string, repo: string, tree: TreeItem[], baseTree?: string): Promise<{ sha: string }> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/git/trees`, {
		method: 'POST',
		headers: authHeaders(token, true),
		body: JSON.stringify({ tree, base_tree: baseTree })
	})
	await assertOk(res, '创建文件树')
	const data = await res.json()
	return { sha: data.sha }
}

export async function createCommit(token: string, owner: string, repo: string, message: string, tree: string, parents: string[]): Promise<{ sha: string }> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/git/commits`, {
		method: 'POST',
		headers: authHeaders(token, true),
		body: JSON.stringify({ message, tree, parents })
	})
	await assertOk(res, '创建提交')
	const data = await res.json()
	return { sha: data.sha }
}

export async function updateRef(token: string, owner: string, repo: string, ref: string, sha: string, force = false): Promise<void> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/git/refs/${encodeURIComponent(ref)}`, {
		method: 'PATCH',
		headers: authHeaders(token, true),
		body: JSON.stringify({ sha, force })
	})
	await assertOk(res, '更新分支')
}

export async function readTextFileFromRepo(token: string, owner: string, repo: string, path: string, ref: string): Promise<string | null> {
	const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`, {
		headers: authHeaders(token)
	})
	if (res.status === 404) return null
	await assertOk(res, '读取文件')
	const data: any = await res.json()
	if (Array.isArray(data) || !data.content) return null
	try {
		return decodeURIComponent(escape(atob(data.content)))
	} catch {
		return atob(data.content)
	}
}

export async function listRepoFilesRecursive(token: string, owner: string, repo: string, path: string, ref: string): Promise<string[]> {
	async function fetchPath(targetPath: string): Promise<string[]> {
		const res = await ghFetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}?ref=${encodeURIComponent(ref)}`, {
			headers: authHeaders(token)
		})
		if (res.status === 404) return []
		await assertOk(res, '读取目录')
		const data: any = await res.json()
		if (Array.isArray(data)) {
			const files: string[] = []
			for (const item of data) {
				if (item.type === 'file') {
					files.push(item.path)
				} else if (item.type === 'dir') {
					const nested = await fetchPath(item.path)
					files.push(...nested)
				}
			}
			return files
		}
		if (data?.type === 'file') return [data.path]
		if (data?.type === 'dir') return fetchPath(data.path)
		return []
	}

	return fetchPath(path)
}

export async function createBlob(
	token: string,
	owner: string,
	repo: string,
	content: string,
	encoding: 'utf-8' | 'base64' = 'base64'
): Promise<{ sha: string }> {
	// base64 字符串长度粗略对应上传体积；超过 ~7MB 的 base64 约等于 5MB+ 原图，容易慢/超时
	const approxBytes = encoding === 'base64' ? Math.floor((content.length * 3) / 4) : content.length
	const timeoutMs = approxBytes > 1_500_000 ? BLOB_FETCH_TIMEOUT_MS : DEFAULT_FETCH_TIMEOUT_MS

	const res = await ghFetch(
		`${GH_API}/repos/${owner}/${repo}/git/blobs`,
		{
			method: 'POST',
			headers: authHeaders(token, true),
			body: JSON.stringify({ content, encoding })
		},
		timeoutMs
	)
	await assertOk(res, '上传文件内容')
	const data = await res.json()
	return { sha: data.sha }
}
