'use client'

import { ANIMATION_DELAY } from '@/consts'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useSize } from '@/hooks/use-size'

/** Entrance spring — keeps the original weighty pop-in without animating layout props */
const ENTRANCE_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 1 }
const HOVER_TRANSITION = { type: 'spring' as const, stiffness: 400, damping: 28 }

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
	const { maxSM, init } = useSize()
	let [show, setShow] = useState(false)
	if (maxSM && init) order = 0

	useEffect(() => {
		if (show) return
		if (x === 0 && y === 0) return
		setTimeout(
			() => {
				setShow(true)
			},
			order * ANIMATION_DELAY * 1000
		)
	}, [x, y, show])

	if (show)
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

	return null
}
