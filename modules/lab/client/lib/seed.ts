import type { Phase, Category, Idea } from '@/types/lab'

export const PHASES: Phase[] = [
  { id: 'spark',    label: 'Seed',      color: '#93c5fd' },
  { id: 'explore',  label: 'Exploring', color: '#c4b5fd' },
  { id: 'proto',    label: 'Prototype', color: '#f7a25e' },
  { id: 'valid',    label: 'Validated', color: '#5eead4' },
  { id: 'archived', label: 'Archived',  color: '#8a8f98' },
]

export const CATEGORIES: Category[] = [
  { id: 'dev',      label: 'Dev' },
  { id: 'producto', label: 'Product' },
  { id: 'research', label: 'Research' },
  { id: 'infra',    label: 'Infra' },
  { id: 'ia',       label: 'AI' },
  { id: 'diseno',   label: 'Design' },
]

export const SEED_IDEAS: Idea[] = [
  {
    id: 'idea-1',
    title: 'Edge Cache Layer',
    category: 'infra',
    phase: 'proto',
    updated: '2026-05-20',
    notes: 'Cache API responses at the edge using Cloudflare Workers KV. Reduces cold starts and improves p99 latency by 40%. Need to define TTL strategy per endpoint type.',
    links: [
      { type: 'github', label: 'poc-edge-cache', url: 'https://github.com' },
      { type: 'doc',    label: 'RFC draft',      url: 'https://notion.so' },
    ],
    snippets: [
      {
        id: 'snip-1-1',
        title: 'KV cache middleware',
        lang: 'ts',
        code: `// Edge cache middleware (Workers KV)
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  kv: KVNamespace,
): Promise<T> {
  const cached = await kv.get(key, 'json')
  if (cached !== null) return cached as T
  const data = await fetcher()
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl })
  return data
}`,
        desc: 'Generic KV-backed cache wrapper for Cloudflare Workers',
        tags: ['cache', 'workers', 'kv'],
      },
      {
        id: 'snip-1-2',
        title: 'Cache key builder',
        lang: 'ts',
        code: `function cacheKey(req: Request): string {
  const url = new URL(req.url)
  return \`\${url.pathname}\${url.search}\`
}`,
        desc: 'Build deterministic cache keys from request URL',
        tags: ['cache', 'utils'],
      },
    ],
  },
  {
    id: 'idea-2',
    title: 'Onboarding Flow',
    category: 'producto',
    phase: 'explore',
    updated: '2026-05-22',
    notes: 'Step-by-step onboarding wizard for new users. Should cover account setup, first module tour, and invite teammates. Track completion rate per step to find drop-offs.',
    links: [
      { type: 'figma', label: 'Figma mockup', url: 'https://figma.com' },
    ],
    snippets: [
      {
        id: 'snip-2-1',
        title: 'Onboarding step hook',
        lang: 'ts',
        code: `import { useState, useCallback } from 'react'

export function useOnboarding(steps: string[]) {
  const [step, setStep] = useState(0)
  const next = useCallback(() => setStep(s => Math.min(s + 1, steps.length - 1)), [steps.length])
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), [])
  const isLast = step === steps.length - 1
  return { step, currentStep: steps[step], next, back, isLast }
}`,
        desc: 'Simple multi-step onboarding hook with bounds checking',
        tags: ['react', 'hook', 'onboarding'],
      },
    ],
  },
  {
    id: 'idea-3',
    title: 'LLM Summaries',
    category: 'ia',
    phase: 'spark',
    updated: '2026-05-25',
    notes: 'Auto-summarize long notes and idea descriptions using Claude. Could run on save with debounce. Need to evaluate cost per summary and whether to cache results.',
    links: [],
    snippets: [
      {
        id: 'snip-3-1',
        title: 'Claude summary call',
        lang: 'ts',
        code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function summarize(text: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: \`Summarize in 2 sentences:\\n\\n\${text}\`,
    }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}`,
        desc: 'Single-turn Claude call for text summarization',
        tags: ['llm', 'claude', 'ai'],
      },
      {
        id: 'snip-3-2',
        title: 'Debounced auto-summarize',
        lang: 'ts',
        code: `import { useEffect, useRef } from 'react'

export function useAutoSummarize(
  text: string,
  onSummary: (s: string) => void,
  delay = 1500,
) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (ref.current) clearTimeout(ref.current)
    if (text.length < 80) return
    ref.current = setTimeout(async () => {
      const summary = await summarize(text)
      onSummary(summary)
    }, delay)
    return () => { if (ref.current) clearTimeout(ref.current) }
  }, [text, onSummary, delay])
}`,
        desc: 'Debounced hook that calls summarize() after user stops typing',
        tags: ['react', 'hook', 'debounce'],
      },
    ],
  },
  {
    id: 'idea-4',
    title: 'Command Palette',
    category: 'dev',
    phase: 'valid',
    updated: '2026-05-18',
    notes: 'Global ⌘K command palette for quick navigation and actions across all modules. Filter by module, action, or recent. Should support keyboard-only interaction.',
    links: [
      { type: 'github', label: 'cmdk-poc', url: 'https://github.com' },
    ],
    snippets: [
      {
        id: 'snip-4-1',
        title: 'Cmd+K listener',
        lang: 'ts',
        code: `import { useEffect } from 'react'

export function useCmdK(onOpen: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}`,
        desc: 'Global keyboard shortcut handler for command palette',
        tags: ['keyboard', 'shortcut', 'ux'],
      },
    ],
  },
  {
    id: 'idea-5',
    title: 'Slow Query Detection',
    category: 'infra',
    phase: 'explore',
    updated: '2026-05-15',
    notes: 'Detect and log PostgreSQL queries that exceed a configurable threshold. Surface top offenders in the dashboard. Could also suggest missing indexes automatically.',
    links: [
      { type: 'doc', label: 'pg_stat_statements', url: 'https://postgresql.org' },
    ],
    snippets: [
      {
        id: 'snip-5-1',
        title: 'Top slow queries',
        lang: 'sql',
        code: `-- Top 10 slowest queries (requires pg_stat_statements)
SELECT
  query,
  calls,
  round((mean_exec_time)::numeric, 2)  AS mean_ms,
  round((total_exec_time)::numeric, 2) AS total_ms,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;`,
        desc: 'Query pg_stat_statements for worst mean execution time',
        tags: ['postgres', 'performance', 'sql'],
      },
      {
        id: 'snip-5-2',
        title: 'Slow query logger middleware',
        lang: 'py',
        code: `import time
import logging

logger = logging.getLogger("slow_queries")
THRESHOLD_MS = 200

def slow_query_middleware(execute, sql, params, many, context):
    start = time.perf_counter()
    result = execute(sql, params, many, context)
    elapsed = (time.perf_counter() - start) * 1000
    if elapsed > THRESHOLD_MS:
        logger.warning("Slow query (%.1fms): %s", elapsed, sql[:120])
    return result`,
        desc: 'Django-style execute hook that logs queries over threshold',
        tags: ['python', 'django', 'db'],
      },
    ],
  },
  {
    id: 'idea-6',
    title: 'Focus Mode',
    category: 'diseno',
    phase: 'spark',
    updated: '2026-05-28',
    notes: 'Full-screen distraction-free mode that hides the sidebar and topbar. Activated with ⌘⇧F. Fades UI chrome and centers content. Should persist preference per module.',
    links: [],
    snippets: [
      {
        id: 'snip-6-1',
        title: 'Focus mode toggle hook',
        lang: 'ts',
        code: `import { useState, useEffect } from 'react'

export function useFocusMode() {
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setFocused(f => !f)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return focused
}`,
        desc: 'Toggle focus mode with Cmd+Shift+F keyboard shortcut',
        tags: ['keyboard', 'ux', 'focus'],
      },
      {
        id: 'snip-6-2',
        title: 'CSS focus mode transition',
        lang: 'css',
        code: `.app-chrome {
  transition: opacity 0.3s ease;
}
.focus-mode .app-chrome {
  opacity: 0;
  pointer-events: none;
}
.focus-mode .module-content {
  margin-left: 0;
  transition: margin-left 0.3s ease;
}`,
        desc: 'CSS classes for smooth focus mode chrome hiding',
        tags: ['css', 'animation', 'focus'],
      },
    ],
  },
]
