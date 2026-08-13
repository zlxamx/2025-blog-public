const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.webp', '.png', '.svg', '.gif', '.avif', '.heic', '.heif', '.bmp'])

export function getFileExt(filename: string): string {
	const match = filename.toLowerCase().match(/(\.[a-z0-9]+)$/)
	const ext = match?.[1]
	if (ext && IMAGE_EXT.has(ext)) return ext
	return ext || '.png'
}
