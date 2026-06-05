export type PhaseId = 'spark' | 'explore' | 'proto' | 'valid' | 'archived'
export type CategoryId = 'dev' | 'producto' | 'research' | 'infra' | 'ia' | 'diseno'
export type Lang = 'js' | 'ts' | 'py' | 'sql' | 'bash' | 'json' | 'css'
export type LinkType = 'github' | 'figma' | 'doc' | 'link'

export interface Phase { id: PhaseId; label: string; color: string }
export interface Category { id: CategoryId; label: string }
export interface Snippet { id: string; title: string; lang: Lang; code: string; desc?: string; tags?: string[] }
export interface IdeaLink { type: LinkType; label: string; url: string }
export interface Idea { id: string; title: string; category: CategoryId; phase: PhaseId; updated: string; notes: string; links: IdeaLink[]; snippets: Snippet[] }

/** Snippet enriched with parent-idea context, returned by GET /api/lab/snippets. */
export interface FlatSnippet extends Snippet {
  ideaId: string
  ideaTitle: string
}
