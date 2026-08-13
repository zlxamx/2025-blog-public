import { createInstallationToken, getInstallationId, signAppJwt } from './github-client'
import { GITHUB_CONFIG } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { decrypt, encrypt } from './aes256-util'

const GITHUB_TOKEN_CACHE_KEY = 'github_token'
const GITHUB_TOKEN_EXPIRES_KEY = 'github_token_expires_at'
const GITHUB_PEM_CACHE_KEY = 'p_info'
const GITHUB_PEM_KEY_CACHE_KEY = 'p_key'
/** Installation Token 有效约 1 小时，提前 5 分钟刷新 */
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000

function getTokenFromCache(): string | null {
	if (typeof sessionStorage === 'undefined') return null
	try {
		const token = sessionStorage.getItem(GITHUB_TOKEN_CACHE_KEY)
		if (!token) return null
		const expiresAt = sessionStorage.getItem(GITHUB_TOKEN_EXPIRES_KEY)
		if (expiresAt) {
			const exp = Date.parse(expiresAt)
			if (!Number.isNaN(exp) && Date.now() >= exp - TOKEN_REFRESH_SKEW_MS) {
				clearTokenCache()
				return null
			}
		}
		return token
	} catch {
		return null
	}
}

function saveTokenToCache(token: string, expiresAt?: string): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(GITHUB_TOKEN_CACHE_KEY, token)
		if (expiresAt) {
			sessionStorage.setItem(GITHUB_TOKEN_EXPIRES_KEY, expiresAt)
		} else {
			// GitHub Installation Token 默认约 1h；无 expires_at 时按 55 分钟自失效
			sessionStorage.setItem(GITHUB_TOKEN_EXPIRES_KEY, new Date(Date.now() + 55 * 60 * 1000).toISOString())
		}
	} catch (error) {
		console.error('Failed to save token to cache:', error)
	}
}

function clearTokenCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(GITHUB_TOKEN_CACHE_KEY)
		sessionStorage.removeItem(GITHUB_TOKEN_EXPIRES_KEY)
	} catch (error) {
		console.error('Failed to clear token cache:', error)
	}
}

function getSessionPemKey(): string {
	if (typeof sessionStorage === 'undefined') {
		throw new Error('sessionStorage unavailable')
	}
	let key = sessionStorage.getItem(GITHUB_PEM_KEY_CACHE_KEY)
	if (!key) {
		const bytes = crypto.getRandomValues(new Uint8Array(32))
		key = btoa(String.fromCharCode(...Array.from(bytes)))
		sessionStorage.setItem(GITHUB_PEM_KEY_CACHE_KEY, key)
	}
	return key
}

export async function getPemFromCache(): Promise<string | null> {
	if (typeof sessionStorage === 'undefined') return null
	try {
		const encryptedPem = sessionStorage.getItem(GITHUB_PEM_CACHE_KEY)
		if (!encryptedPem) return null
		return await decrypt(encryptedPem, getSessionPemKey())
	} catch {
		return null
	}
}

export async function savePemToCache(pem: string): Promise<void> {
	if (typeof sessionStorage === 'undefined') return
	try {
		const encryptedPem = await encrypt(pem, getSessionPemKey())
		sessionStorage.setItem(GITHUB_PEM_CACHE_KEY, encryptedPem)
	} catch (error) {
		console.error('Failed to save pem to cache:', error)
	}
}

function clearPemCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(GITHUB_PEM_CACHE_KEY)
		sessionStorage.removeItem(GITHUB_PEM_KEY_CACHE_KEY)
	} catch (error) {
		console.error('Failed to clear pem cache:', error)
	}
}

export function clearAllAuthCache(): void {
	clearTokenCache()
	clearPemCache()
}

export async function hasAuth(): Promise<boolean> {
	return !!getTokenFromCache() || !!(await getPemFromCache())
}

/**
 * 统一的认证 Token 获取
 * 自动处理缓存、签发等逻辑
 * @returns GitHub Installation Token
 */
export async function getAuthToken(): Promise<string> {
	// 1. 先尝试从缓存获取 token（含过期检查）
	const cachedToken = getTokenFromCache()
	if (cachedToken) {
		toast.info('使用缓存的令牌...')
		return cachedToken
	}

	// 2. 获取私钥（从缓存）
	const privateKey = useAuthStore.getState().privateKey
	if (!privateKey) {
		throw new Error('需要先设置私钥。请使用 useAuth().setPrivateKey()')
	}

	toast.info('正在签发 JWT...')
	const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)

	toast.info('正在获取安装信息...')
	const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)

	toast.info('正在创建安装令牌...')
	const { token, expiresAt } = await createInstallationToken(jwt, installationId)

	saveTokenToCache(token, expiresAt)

	return token
}
