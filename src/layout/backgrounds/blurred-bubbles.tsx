'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import siteContent from '@/config/site-content.json'
import { rand } from './utils'

/**
 * Blurred Floating Circles Background (static)
 * - Soft color blobs along the bottom band
 * - Painted once (redraw only on resize / regenerate)
 * - Softness via a single CSS blur on the wrapper
 * - No continuous rAF — critical for mobile touch responsiveness
 */
export default function BlurredBubblesBackground({
	count = 6,
	colors = siteContent.backgroundColors,
	minRadius = 250,
	maxRadius = 400,
	bottomBandStart = 0.8,
	regenerateKey = 0
}: {
	count?: number
	colors?: string[]
	minRadius?: number
	maxRadius?: number
	bottomBandStart?: number
	/** kept for API compat with layout; unused after static rewrite */
	speed?: number
	noiseScale?: number
	noiseTimeScale?: number
	targetFps?: number
	debugFps?: boolean
	startDelayMs?: number
	regenerateKey?: number
}) {
	const ref = useRef<HTMLCanvasElement>(null)
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const mq = window.matchMedia('(max-width: 639px)')
		const apply = () => setIsMobile(mq.matches)
		apply()
		mq.addEventListener('change', apply)
		return () => mq.removeEventListener('change', apply)
	}, [])

	useEffect(() => {
		const canvas = ref.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		let width = canvas.clientWidth
		let height = canvas.clientHeight
		const mobile = window.innerWidth < 640
		// Lower DPR on mobile: full-screen blur is expensive at 2× pixel density
		const DPR = Math.min(mobile ? 1 : 2, window.devicePixelRatio || 1)
		const bubbleCount = mobile ? Math.min(count, 4) : count
		const rMin = mobile ? Math.min(minRadius, 180) : minRadius
		const rMax = mobile ? Math.min(maxRadius, 280) : maxRadius

		const paint = () => {
			width = canvas.clientWidth
			height = canvas.clientHeight
			canvas.width = Math.floor(width * DPR)
			canvas.height = Math.floor(height * DPR)
			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.scale(DPR, DPR)
			ctx.clearRect(0, 0, width, height)

			const bubbles: { x: number; y: number; r: number; color: string }[] = []
			const minDist = Math.max(rMin * 0.2, 80)
			const maxTries = 4000
			let tries = 0
			while (bubbles.length < bubbleCount && tries < maxTries) {
				tries++
				const r = rand(rMin, rMax)
				const x = rand(-r / 2, width + r / 2)
				const y = rand(height * bottomBandStart, height * 1.15)
				let ok = true
				for (const b of bubbles) {
					const d = Math.hypot(b.x - x, b.y - y)
					if (d < (b.r + r) * 0.6 || d < minDist) {
						ok = false
						break
					}
				}
				if (ok) {
					bubbles.push({
						x,
						y,
						r,
						color: colors[bubbles.length % colors.length]
					})
				}
			}

			ctx.globalAlpha = 0.85
			for (const b of bubbles) {
				ctx.beginPath()
				ctx.fillStyle = b.color
				ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
				ctx.fill()
			}
			ctx.globalAlpha = 1
		}

		paint()

		let resizeTimer: number | null = null
		const ro = new ResizeObserver(() => {
			if (resizeTimer !== null) window.clearTimeout(resizeTimer)
			// Debounce resize repaints; avoid thrashing during mobile URL-bar show/hide
			resizeTimer = window.setTimeout(() => {
				paint()
				resizeTimer = null
			}, mobile ? 400 : 200)
		})
		ro.observe(canvas)

		return () => {
			ro.disconnect()
			if (resizeTimer !== null) window.clearTimeout(resizeTimer)
		}
	}, [colors, regenerateKey, count, minRadius, maxRadius, bottomBandStart])

	return (
		<motion.div
			animate={{ opacity: 1 }}
			initial={{ opacity: 0 }}
			transition={{ duration: isMobile ? 0.3 : 0.8 }}
			className='pointer-events-none fixed inset-0 z-0 overflow-hidden'
			style={{ filter: isMobile ? 'blur(32px)' : 'blur(64px)' }}>
			<canvas ref={ref} className='h-full w-full' style={{ display: 'block' }} />
		</motion.div>
	)
}
