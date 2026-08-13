import { useEffect, useState, type ReactElement, Fragment } from 'react'
import parse, { type HTMLReactParserOptions, Element, type DOMNode } from 'html-react-parser'
import { renderMarkdown, type TocItem } from '@/lib/markdown-renderer'
import { MarkdownImage } from '@/components/markdown-image'
import { CodeBlock } from '@/components/code-block'

type MarkdownRenderResult = {
	content: ReactElement | null
	toc: TocItem[]
	loading: boolean
}

export function htmlToReactContent(html: string): ReactElement {
	const codeBlocks: Array<{ placeholder: string; code: string; preHtml: string }> = []
	const processedHtml = html.replace(/<pre\s+data-code="([^"]*)"([^>]*)>([\s\S]*?)<\/pre>/g, (_match, codeAttr, _attrs, preContent) => {
		const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
		const code = codeAttr
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&')
		codeBlocks.push({
			placeholder,
			code,
			preHtml: `${preContent}`
		})
		return placeholder
	})

	const options: HTMLReactParserOptions = {
		replace(domNode: DOMNode) {
			if (domNode instanceof Element && domNode.name === 'img') {
				const { src, alt, title } = domNode.attribs
				return <MarkdownImage src={src} alt={alt} title={title} />
			}
			if (domNode.type === 'text' && domNode.data && domNode.data.includes('__CODE_BLOCK_')) {
				const result = domNode.data.split(/(__CODE_BLOCK_\d+__)/).filter(Boolean)

				return (
					<>
						{result.map((item, index) => {
							if (item.startsWith('__CODE_BLOCK_')) {
								const block = codeBlocks.find(b => b.placeholder === item)
								if (block) {
									const preElement = parse(block.preHtml) as ReactElement
									return (
										<CodeBlock key={block.placeholder} code={block.code}>
											{preElement}
										</CodeBlock>
									)
								}
							}
							return item ? <Fragment key={index}>{item}</Fragment> : null
						})}
					</>
				)
			}
		}
	}

	return parse(processedHtml, options) as ReactElement
}

export function useMarkdownRender(markdown: string | null): MarkdownRenderResult {
	const [content, setContent] = useState<ReactElement | null>(null)
	const [toc, setToc] = useState<TocItem[]>([])
	const [loading, setLoading] = useState<boolean>(markdown !== null)

	useEffect(() => {
		if (markdown === null) {
			setLoading(false)
			return
		}

		let cancelled = false

		async function render() {
			setLoading(true)
			try {
				const { html, toc } = await renderMarkdown(markdown!)
				if (!cancelled) {
					setContent(htmlToReactContent(html))
					setToc(toc)
				}
			} catch (error) {
				console.error('Markdown render error:', error)
				if (!cancelled) {
					setContent(null)
					setToc([])
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		render()

		return () => {
			cancelled = true
		}
	}, [markdown])

	return { content, toc, loading }
}
