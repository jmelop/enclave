import type { Lang } from '@/types/lab'

// ─── LANG_META ────────────────────────────────────────────────────────────────

export const LANG_META: Record<Lang, { label: string; fg: string }> = {
  js:   { label: 'JS',   fg: '#fbbf24' },
  ts:   { label: 'TS',   fg: '#60a5fa' },
  py:   { label: 'PY',   fg: '#5eead4' },
  sql:  { label: 'SQL',  fg: '#f0abfc' },
  bash: { label: 'BASH', fg: '#a3e635' },
  json: { label: 'JSON', fg: '#fca5a5' },
  css:  { label: 'CSS',  fg: '#93c5fd' },
}

// ─── copyText ─────────────────────────────────────────────────────────────────

export function copyText(text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.top = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

// ─── today ────────────────────────────────────────────────────────────────────

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── linkIcon ─────────────────────────────────────────────────────────────────

export function linkIcon(type: string): string {
  if (type === 'github') return 'github'
  if (type === 'figma')  return 'figma'
  if (type === 'doc')    return 'file-text'
  return 'link'
}

// ─── highlight ───────────────────────────────────────────────────────────────
// Simple multi-language syntax highlighter returning HTML with span classes.
// Supports: js, ts, py, sql, bash, json, css.

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function span(cls: string, text: string): string {
  return `<span class="${cls}">${text}</span>`
}

// Token rule: [className, regex]
type Rule = [string, RegExp]

const JS_TS_RULES: Rule[] = [
  ['t-com', /\/\/[^\n]*/],
  ['t-com', /\/\*[\s\S]*?\*\//],
  ['t-str', /`(?:[^`\\]|\\.)*`/],
  ['t-str', /'(?:[^'\\]|\\.)*'/],
  ['t-str', /"(?:[^"\\]|\\.)*"/],
  ['t-kw',  /\b(?:import|export|from|default|const|let|var|function|async|await|return|if|else|for|while|class|extends|new|typeof|instanceof|void|null|undefined|true|false|type|interface|as|of|in)\b/],
  ['t-typ', /\b(?:string|number|boolean|any|never|void|unknown|Promise|Array|Record|Partial|Required|Readonly|Pick|Omit|T|K|V)\b/],
  ['t-fn',  /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/],
  ['t-num', /\b\d+(?:\.\d+)?\b/],
  ['t-dec', /(?:^|\s)(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/],
  ['t-pun', /[{}[\]().,;:?!<>|&^~+=*/%\\-]/],
]

const PY_RULES: Rule[] = [
  ['t-com', /#[^\n]*/],
  ['t-str', /"""[\s\S]*?"""/],
  ['t-str', /'''[\s\S]*?'''/],
  ['t-str', /"(?:[^"\\]|\\.)*"/],
  ['t-str', /'(?:[^'\\]|\\.)*'/],
  ['t-kw',  /\b(?:import|from|def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|pass|raise|try|except|finally|with|as|lambda|yield|async|await|self)\b/],
  ['t-fn',  /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/],
  ['t-typ', /\b(?:str|int|float|bool|list|dict|tuple|set|Optional|Union|Any|List|Dict|Tuple)\b/],
  ['t-num', /\b\d+(?:\.\d+)?\b/],
  ['t-dec', /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/],
  ['t-pun', /[{}[\]().,;:?!<>|&^~+=*/%\\-]/],
]

const SQL_RULES: Rule[] = [
  ['t-com', /--[^\n]*/],
  ['t-com', /\/\*[\s\S]*?\*\//],
  ['t-str', /'(?:[^'\\]|\\.)*'/],
  ['t-kw',  /\b(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|VIEW|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|DEFAULT|AND|OR|IN|EXISTS|BETWEEN|LIKE|DISTINCT|COUNT|SUM|AVG|MAX|MIN|ROUND|WITH|UNION|ALL)\b/i],
  ['t-fn',  /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/],
  ['t-num', /\b\d+(?:\.\d+)?\b/],
  ['t-pun', /[{}[\]().,;:?!<>|&^~+=*/%\\-]/],
]

const BASH_RULES: Rule[] = [
  ['t-com', /#[^\n]*/],
  ['t-str', /"(?:[^"\\]|\\.)*"/],
  ['t-str', /'(?:[^'\\]|\\.)*'/],
  ['t-kw',  /\b(?:if|then|else|elif|fi|for|do|done|while|case|esac|function|return|exit|echo|export|local|readonly|source|unset|set|shift|trap)\b/],
  ['t-fn',  /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/],
  ['t-num', /\b\d+\b/],
  ['t-dec', /\$\{?[a-zA-Z_][a-zA-Z0-9_]*\}?/],
  ['t-pun', /[{}[\]().,;:?!<>|&^~+=*/%\\-]/],
]

const JSON_RULES: Rule[] = [
  ['t-kw',  /\b(?:true|false|null)\b/],
  ['t-str', /"(?:[^"\\]|\\.)*"(?=\s*:)/],
  ['t-str', /"(?:[^"\\]|\\.)*"/],
  ['t-num', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
  ['t-pun', /[{}[\]().,;:]/],
]

const CSS_RULES: Rule[] = [
  ['t-com', /\/\*[\s\S]*?\*\//],
  ['t-str', /"(?:[^"\\]|\\.)*"/],
  ['t-str', /'(?:[^'\\]|\\.)*'/],
  ['t-dec', /[.#]?[a-zA-Z][a-zA-Z0-9_-]*(?=\s*{)/],
  ['t-kw',  /\b(?:display|flex|grid|position|top|right|bottom|left|width|height|margin|padding|border|background|color|font|transition|transform|opacity|overflow|z-index|cursor|gap|align-items|justify-content|content|inset|pointer-events)\b/],
  ['t-fn',  /[a-zA-Z-]+(?=\s*\()/],
  ['t-num', /\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|deg|s|ms)?\b/],
  ['t-pun', /[{}[\]().,;:?!<>|&^~+=*/%\\-]/],
]

function getRules(lang: string): Rule[] {
  switch (lang) {
    case 'js':
    case 'ts':   return JS_TS_RULES
    case 'py':   return PY_RULES
    case 'sql':  return SQL_RULES
    case 'bash': return BASH_RULES
    case 'json': return JSON_RULES
    case 'css':  return CSS_RULES
    default:     return []
  }
}

export function highlight(code: string, lang: string): string {
  const rules = getRules(lang)
  if (rules.length === 0) return esc(code)

  // Build a combined regex that tries each rule in order
  const combined = new RegExp(
    rules.map(([, re]) => `(${re.source})`).join('|'),
    'gm',
  )

  let result = ''
  let lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = combined.exec(code)) !== null) {
    // Append escaped text before the match
    if (match.index > lastIndex) {
      result += esc(code.slice(lastIndex, match.index))
    }

    // Find which group matched
    const matchedText = match[0]
    let ruleIdx = -1
    for (let i = 0; i < rules.length; i++) {
      if (match[i + 1] !== undefined) { ruleIdx = i; break }
    }

    if (ruleIdx >= 0) {
      result += span(rules[ruleIdx][0], esc(matchedText))
    } else {
      result += esc(matchedText)
    }

    lastIndex = match.index + matchedText.length
    if (matchedText.length === 0) { combined.lastIndex++; lastIndex++ }
  }

  // Append remaining text
  if (lastIndex < code.length) {
    result += esc(code.slice(lastIndex))
  }

  return result
}
