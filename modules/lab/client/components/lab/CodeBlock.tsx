import { highlight } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  lang: string
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const cleaned = code.replace(/\n$/, '')
  const lines = cleaned.split('\n')
  const html = highlight(cleaned, lang)

  return (
    <div className="code-wrap">
      <div className="gutter">
        {lines.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <div className="code" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
