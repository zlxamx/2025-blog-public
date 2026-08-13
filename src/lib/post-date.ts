const CHINA_OFFSET = '+08:00'

/**
 * 文章日期按中国时区解析。
 * 仓库里存的是 datetime-local（无时区），作者本意是北京时间。
 */
export function parsePostDate(input?: string | null): Date {
	if (!input?.trim()) return new Date()
	const raw = input.trim()

	if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
		const dated = new Date(raw)
		return Number.isNaN(dated.getTime()) ? new Date() : dated
	}

	let normalized = raw
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
		normalized = `${raw}T00:00:00`
	} else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
		normalized = `${raw}:00`
	}

	const dated = new Date(`${normalized}${CHINA_OFFSET}`)
	return Number.isNaN(dated.getTime()) ? new Date() : dated
}

/** 按日期字符串本身格式化，避免服务端 UTC 把凌晨文章错到前一天 */
export function formatPostDateLabel(input?: string | null): string {
	const match = input?.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
	if (!match) return ''
	return `${match[1]}年 ${Number(match[2])}月 ${Number(match[3])}日`
}
