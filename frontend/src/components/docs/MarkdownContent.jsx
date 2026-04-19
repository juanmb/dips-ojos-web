import { useRef, useEffect, useMemo } from 'preact/hooks'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const renderer = new marked.Renderer()
const origImage = renderer.image.bind(renderer)
renderer.image = (...args) => origImage(...args).replace('<img', '<img loading="lazy"')

const FIGURE_PATTERN = /<p>(<img[^>]*>)<\/p>\s*<p><em>([\s\S]+?)<\/em><\/p>/g

function wrapFigures(html) {
  return html.replace(FIGURE_PATTERN, '<figure>$1<figcaption>$2</figcaption></figure>')
}

export function MarkdownContent({ source, class: className = '' }) {
  const ref = useRef(null)

  const html = useMemo(() => {
    const raw = marked.parse(source, { renderer, gfm: true, breaks: false })
    return DOMPurify.sanitize(wrapFigures(raw), { ADD_ATTR: ['loading'] })
  }, [source])

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html
  }, [html])

  return <article ref={ref} class={`prose prose-invert max-w-none ${className}`} />
}
