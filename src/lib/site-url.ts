const CANONICAL_ORIGIN = 'https://www.xiluluke.com'

function hostnameOf(raw: string): string | null {
	try {
		const href = raw.includes('://') ? raw : `https://${raw}`
		return new URL(href).hostname
	} catch {
		return null
	}
}

function isEphemeralHost(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')
}

/** 解析站点 origin：拒绝 Vercel 一次性域名和 localhost，避免 sitemap/RSS 写错。 */
export function resolveSiteOrigin(raw?: string | null): string {
	const trimmed = raw?.trim().replace(/\/$/, '')
	if (!trimmed) return CANONICAL_ORIGIN
	const hostname = hostnameOf(trimmed)
	if (!hostname || isEphemeralHost(hostname)) return CANONICAL_ORIGIN
	return trimmed.includes('://') ? trimmed : `https://${trimmed}`
}

export function getSiteOrigin(): string {
	return resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL)
}
