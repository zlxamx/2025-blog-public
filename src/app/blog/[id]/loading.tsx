export default function BlogLoading() {
	return (
		<div className='mx-auto w-full max-w-[760px] px-6 pt-28 pb-12' role='status' aria-live='polite'>
			<div className='rounded-xl border bg-article p-8 shadow-sm'>
				<div className='mx-auto h-8 w-2/3 animate-pulse rounded bg-border' />
				<div className='mx-auto mt-5 h-4 w-1/3 animate-pulse rounded bg-border' />
				<div className='mt-10 space-y-4'>
					<div className='h-4 animate-pulse rounded bg-border' />
					<div className='h-4 animate-pulse rounded bg-border' />
					<div className='h-4 w-5/6 animate-pulse rounded bg-border' />
				</div>
			</div>
			<span className='sr-only'>正在加载文章…</span>
		</div>
	)
}
