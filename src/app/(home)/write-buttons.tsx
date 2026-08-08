import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import PenSVG from '@/svgs/pen.svg'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { useConfigStore } from './stores/config-store'
import { useCenterStore } from '@/hooks/use-center'
import { useRouter } from 'next/navigation'
import { useSize } from '@/hooks/use-size'
import DotsSVG from '@/svgs/dots.svg'
import { HomeDraggableLayer } from './home-draggable-layer'

const MENU = [
	{ label: '长文', href: '/write', desc: '完整文章 / 周刊' },
	{ label: '短记', href: '/compose?format=note', desc: '随手想法' },
	{ label: '链接', href: '/compose?format=link', desc: '分享并点评' },
	{ label: '摘录', href: '/compose?format=quote', desc: '书摘 / 金句' }
]

export default function WriteButton() {
	const center = useCenterStore()
	const { cardStyles, setConfigDialogOpen, siteContent } = useConfigStore()
	const { maxSM } = useSize()
	const router = useRouter()
	const styles = cardStyles.writeButtons
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard

	const [show, setShow] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)

	useEffect(() => {
		setTimeout(() => setShow(true), styles.order * ANIMATION_DELAY * 1000)
	}, [styles.order])

	if (maxSM) return null

	if (!show) return null

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height

	return (
		<HomeDraggableLayer cardKey='writeButtons' x={x} y={y} width={styles.width} height={styles.height}>
			<div className='absolute flex items-center gap-4' style={{ left: x, top: y }}>
				<div className='relative'>
					<motion.button
						onClick={() => setMenuOpen(v => !v)}
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 1 }}
						whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
						whileTap={{ scale: 0.95 }}
						style={{ boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.4)' }}
						className='brand-btn whitespace-nowrap'>
						{siteContent.enableChristmas && (
							<img
								src='/images/christmas/snow-8.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 60, left: -2, top: -4, opacity: 0.95 }}
							/>
						)}

						<PenSVG />
						<span>写点什么</span>
					</motion.button>

					<AnimatePresence>
						{menuOpen && (
							<motion.div
								initial={{ opacity: 0, y: -6, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -6, scale: 0.96 }}
								className='card absolute top-full left-0 z-50 mt-2 min-w-[200px] overflow-hidden p-1.5 shadow-lg'>
								{MENU.map(item => (
									<button
										key={item.href}
										type='button'
										onClick={() => {
											setMenuOpen(false)
											router.push(item.href)
										}}
										className='hover:bg-brand/10 flex w-full flex-col items-start rounded-xl px-3 py-2 text-left transition-colors'>
										<span className='text-sm font-medium'>{item.label}</span>
										<span className='text-secondary text-xs'>{item.desc}</span>
									</button>
								))}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 1 }}
					whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setConfigDialogOpen(true)}
					className='p-2'>
					<DotsSVG className='h-6 w-6' />
				</motion.button>
			</div>
		</HomeDraggableLayer>
	)
}
