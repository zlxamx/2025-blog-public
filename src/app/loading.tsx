export default function Loading() {
	return (
		<div className='flex min-h-[60vh] items-center justify-center px-6 pt-24' role='status' aria-live='polite'>
			<div className='rounded-2xl border bg-card/80 px-5 py-3 text-sm text-secondary shadow-sm backdrop-blur'>正在切换页面…</div>
		</div>
	)
}
