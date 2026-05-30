import { highlight } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  lang: string
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const lines = code.split('\n')
  const html = highlight(code, lang)
  const lineCount = lines.length

  // Build gutter content
  const gutterHtml = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')

  return (
    <div className="code-wrap">
      <div className="gutter" dangerouslySetInnerHTML={{ __html: gutterHtml }} />
      <div className="code" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
