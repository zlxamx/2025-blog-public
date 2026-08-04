'use client'

import { ANIMATION_DELAY } from '@/consts'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useSize } from '@/hooks/use-size'

/** Desktop: weighty spring pop-in (original feel) */
const ENTRANCE_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 1 }
const HOVER_TRANSITION = { type: 'spring' as const, stiffness: 400, damping: 28 }
/** Mobile: short tween — less main-thread work, faster first paint */
const MOBILE_ENTRANCE_TRANSITION = { duration: 0.22, ease: 'easeOut' as const }

interface Props {
	className?: string
	order: number
	width: number
	height?: number
	x: number
	y: number
	children: React.ReactNode
}

export default function Card({ children, order, width, height, x, y, className }: Props) {
	const maxSM = useSize(s => s.maxSM)
	const init = useSize(s => s.init)
	const isMobile = init && maxSM
	const [show, setShow] = useState(false)
	const effectiveOrder = isMobile ? 0 : order

	useEffect(() => {
		if (!init || show) return
		// Desktop absolute cards need center coords; mobile uses static flow and can show immediately
		if (!isMobile && x === 0 && y === 0) return
		const delayMs = isMobile ? 0 : effectiveOrder * ANIMATION_DELAY * 1000
		const t = window.setTimeout(() => setShow(true), delayMs)
		return () => window.clearTimeout(t)
	}, [x, y, show, isMobile, init, effectiveOrder])

	if (!init || !show) return null

	// Mobile: no hover/tap scale (touch devices don't need it; scale fights the compositor)
	if (isMobile) {
		return (
			<motion.div
				className={cn('card squircle', className)}
				style={{ left: x, top: y, width, height }}
				initial={{ opacity: 0, scale: 0.92 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={MOBILE_ENTRANCE_TRANSITION}>
				{children}
			</motion.div>
		)
	}

	return (
		<motion.div
			className={cn('card squircle', className)}
			style={{ left: x, top: y, width, height }}
			initial={{ opacity: 0, scale: 0.6 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={ENTRANCE_TRANSITION}
			whileHover={{ scale: 1.05, transition: HOVER_TRANSITION }}
			whileTap={{ scale: 0.95, transition: HOVER_TRANSITION }}>
			{children}
		</motion.div>
	)
}
