'use client'

import Card from '@/components/card'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useCenterStore } from '@/hooks/use-center'
import { CARD_SPACING } from '@/consts'
import ScrollOutlineSVG from '@/svgs/scroll-outline.svg'
import ScrollFilledSVG from '@/svgs/scroll-filled.svg'
import ProjectsFilledSVG from '@/svgs/projects-filled.svg'
import ProjectsOutlineSVG from '@/svgs/projects-outline.svg'
import AboutFilledSVG from '@/svgs/about-filled.svg'
import AboutOutlineSVG from '@/svgs/about-outline.svg'
import ShareFilledSVG from '@/svgs/share-filled.svg'
import ShareOutlineSVG from '@/svgs/share-outline.svg'
import WebsiteFilledSVG from '@/svgs/website-filled.svg'
import WebsiteOutlineSVG from '@/svgs/website-outline.svg'
import { Feather } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { useSize } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { HomeDraggableLayer } from '@/app/(home)/home-draggable-layer'
import type { SVGProps } from 'react'

function StreamOutlineSVG(props: SVGProps<SVGSVGElement>) {
	return <Feather strokeWidth={1.75} {...props} />
}
function StreamFilledSVG(props: SVGProps<SVGSVGElement>) {
	return <Feather strokeWidth={2.5} {...props} />
}

const list = [
	{
		icon: ScrollOutlineSVG,
		iconActive: ScrollFilledSVG,
		label: '近期文章',
		href: '/blog'
	},
	{
		icon: StreamOutlineSVG,
		iconActive: StreamFilledSVG,
		label: '短记',
		href: '/stream'
	},
	{
		icon: ProjectsOutlineSVG,
		iconActive: ProjectsFilledSVG,
		label: '我的项目',
		href: '/projects'
	},
	{
		icon: AboutOutlineSVG,
		iconActive: AboutFilledSVG,
		label: '关于网站',
		href: '/about'
	},
	{
		icon: ShareOutlineSVG,
		iconActive: ShareFilledSVG,
		label: '推荐分享',
		href: '/share'
	},
	{
		icon: WebsiteOutlineSVG,
		iconActive: WebsiteFilledSVG,
		label: '优秀博客',
		href: '/bloggers'
	}
]

const ICONS_AVATAR = 40
const ICONS_ITEM = 28
const ICONS_GAP = 16
const ICONS_PAD = 12
/** 高亮圈比图标略大一圈 */
const ICONS_HIGHLIGHT = 40

export default function NavCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const [show, setShow] = useState(false)
	const { maxSM } = useSize()
	const [hoveredIndex, setHoveredIndex] = useState(0)
	const { siteContent, cardStyles } = useConfigStore()
	const styles = cardStyles.navCard
	const hiCardStyles = cardStyles.hiCard

	const iconsContainerRef = useRef<HTMLDivElement>(null)
	const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
	const [iconsHighlight, setIconsHighlight] = useState({ left: 0, top: 0, ready: false })

	const activeIndex = useMemo(() => {
		const index = list.findIndex(item => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href + '/')))
		return index >= 0 ? index : undefined
	}, [pathname])

	useEffect(() => {
		setShow(true)
	}, [])

	let form = useMemo(() => {
		if (pathname == '/') return 'full'
		else if (pathname == '/write' || pathname?.startsWith('/compose')) return 'mini'
		else return 'icons'
	}, [pathname])
	if (maxSM) form = 'icons'

	const itemHeight = form === 'full' ? 52 : ICONS_ITEM

	// 路由变化时立刻对齐高亮，不要延迟 1.5s
	useEffect(() => {
		if (activeIndex !== undefined) {
			setHoveredIndex(activeIndex)
		}
	}, [activeIndex, form, pathname])

	const size = useMemo(() => {
		if (form === 'mini') return { width: 72, height: 72 }
		if (form === 'icons') {
			const n = list.length
			const width = ICONS_PAD * 2 + ICONS_AVATAR + ICONS_GAP + n * ICONS_ITEM + Math.max(0, n - 1) * ICONS_GAP + 4
			return { width, height: 64 }
		}
		return { width: styles.width, height: styles.height }
	}, [form, styles])

	let position = useMemo(() => {
		if (form === 'full') {
			const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - hiCardStyles.width / 2 - styles.width - CARD_SPACING
			const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 - styles.height
			return { x, y }
		}
		return { x: 24, y: 16 }
	}, [form, center, styles, hiCardStyles])

	if (maxSM) position = { x: center.x - size.width / 2, y: 16 }

	// icons 模式：按真实 DOM 量高亮位置，避免公式/layoutId 漂移
	useLayoutEffect(() => {
		if (form !== 'icons') {
			setIconsHighlight(prev => (prev.ready ? { left: 0, top: 0, ready: false } : prev))
			return
		}

		const measure = () => {
			const container = iconsContainerRef.current
			const el = itemRefs.current[hoveredIndex]
			if (!container || !el) return

			const cRect = container.getBoundingClientRect()
			const iRect = el.getBoundingClientRect()
			const left = iRect.left - cRect.left + iRect.width / 2 - ICONS_HIGHLIGHT / 2
			const top = iRect.top - cRect.top + iRect.height / 2 - ICONS_HIGHLIGHT / 2
			setIconsHighlight({ left, top, ready: true })
		}

		measure()
		// 字体/图片加载后再量一次
		const t = window.setTimeout(measure, 50)
		window.addEventListener('resize', measure)
		return () => {
			window.clearTimeout(t)
			window.removeEventListener('resize', measure)
		}
	}, [form, hoveredIndex, size.width, maxSM, pathname])

	if (!show) return null

	return (
		<HomeDraggableLayer cardKey='navCard' x={position.x} y={position.y} width={styles.width} height={styles.height}>
			<Card
				order={styles.order}
				width={size.width}
				height={size.height}
				x={position.x}
				y={position.y}
				className={clsx(
					form === 'mini' && 'flex items-center justify-center p-3',
					form === 'icons' && 'flex items-center gap-4 overflow-visible p-3'
				)}>
				{form === 'full' && siteContent.enableChristmas && (
					<img
						src='/images/christmas/snow-4.webp'
						alt='Christmas decoration'
						className='pointer-events-none absolute'
						style={{ width: 160, left: -18, top: -20, opacity: 0.9 }}
					/>
				)}

				<Link
					href='/'
					title='回到首页'
					aria-label='回到首页'
					className={cn('relative z-20 flex shrink-0 items-center gap-3', form === 'mini' && 'justify-center')}>
					<Image
						src='/images/avatar.webp'
						alt='回到首页'
						width={ICONS_AVATAR}
						height={ICONS_AVATAR}
						priority
						style={{ boxShadow: '0 12px 20px -5px #E2D9CE', width: ICONS_AVATAR, height: ICONS_AVATAR }}
						className='h-10 w-10 shrink-0 rounded-full object-cover'
					/>
					{form === 'full' && <span className='font-averia mt-1 text-2xl leading-none font-medium'>{siteContent.meta.title}</span>}
				</Link>

				{(form === 'full' || form === 'icons') && (
					<>
						{form !== 'icons' && <div className='text-secondary mt-6 text-sm uppercase'>General</div>}

						<div
							ref={iconsContainerRef}
							className={cn('relative mt-2 space-y-2', form === 'icons' && 'mt-0 flex shrink-0 items-center space-y-0')}
							style={form === 'icons' ? { gap: ICONS_GAP } : undefined}>
							{/* full：纵向高亮；icons：横向高亮（独立，不用跨形态 layoutId） */}
							{form === 'full' && (
								<motion.div
									className='absolute max-w-[230px] rounded-full border'
									animate={{ top: hoveredIndex * (itemHeight + 8), left: 0, width: '100%', height: itemHeight }}
									transition={maxSM ? { type: 'tween', duration: 0.18, ease: 'easeOut' } : { type: 'spring', stiffness: 400, damping: 30 }}
									style={{ backgroundImage: 'linear-gradient(to right bottom, var(--color-border) 60%, var(--color-card) 100%)' }}
								/>
							)}

							{form === 'icons' && iconsHighlight.ready && (
								<motion.div
									className='pointer-events-none absolute z-0 rounded-full border'
									initial={false}
									animate={{
										left: iconsHighlight.left,
										top: iconsHighlight.top,
										width: ICONS_HIGHLIGHT,
										height: ICONS_HIGHLIGHT
									}}
									transition={maxSM ? { type: 'tween', duration: 0.16, ease: 'easeOut' } : { type: 'spring', stiffness: 420, damping: 32 }}
									style={{ backgroundImage: 'linear-gradient(to right bottom, var(--color-border) 60%, var(--color-card) 100%)' }}
								/>
							)}

							{list.map((item, index) => (
								<Link
									key={item.href}
									ref={el => {
										itemRefs.current[index] = el
									}}
									href={item.href}
									title={item.label}
									aria-label={item.label}
									className={cn(
										'text-secondary text-md relative z-10 flex shrink-0 items-center gap-3 rounded-full px-5 py-3',
										form === 'icons' && 'h-7 w-7 items-center justify-center p-0'
									)}
									onMouseEnter={() => setHoveredIndex(index)}
									onFocus={() => setHoveredIndex(index)}
									onClick={() => setHoveredIndex(index)}>
									<div className='relative flex h-7 w-7 shrink-0 items-center justify-center'>
										{hoveredIndex === index ? (
											<item.iconActive className='text-brand absolute h-7 w-7' />
										) : (
											<item.icon className='absolute h-7 w-7' />
										)}
									</div>
									{form !== 'icons' && (
										<span className={clsx(index === hoveredIndex && 'text-primary font-medium')}>{item.label}</span>
									)}
								</Link>
							))}
						</div>
					</>
				)}
			</Card>
		</HomeDraggableLayer>
	)
}
