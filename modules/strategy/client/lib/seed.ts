import type { Goal, Plan, Result, Intel, GoalHue } from '@/types/strategy'

// ─── Goal hue palette ────────────────────────────────────────────────────────

export const GOAL_HUES: Record<GoalHue, string> = {
  amber:  '#fbbf24',
  blue:   '#7cc4fb',
  violet: '#c4b5fd',
  teal:   '#5eead4',
  rose:   '#fb9aa0',
}

// ─── Reference date for daysLeft ─────────────────────────────────────────────

const REF_DATE = new Date('2026-06-01')

// ─── Utilities ────────────────────────────────────────────────────────────────

export function goalColor(goal: Goal | undefined): string {
  if (!goal) return '#8a8f98'
  return GOAL_HUES[goal.hue] ?? '#8a8f98'
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysLeft(iso: string): number {
  const d = new Date(iso + 'T00:00:00')
  return Math.round((d.getTime() - REF_DATE.getTime()) / 86_400_000)
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export const GOALS: Goal[] = [
  {
    id: 'g1',
    name: 'Meridian',
    hue: 'amber',
    northStar: true,
    desc: 'Reach $10k MRR with the Meridian SaaS product by end of Q3.',
    status: 'active',
    progress: 46,
    metric: 'MRR',
    metricUnit: '$',
    metricNow: '4 600',
    due: '2026-09-30',
    cadence: 'weekly',
    owner: 'Juan',
  },
  {
    id: 'g2',
    name: 'Halo',
    hue: 'blue',
    desc: 'Grow Halo to 500 paying users before year-end.',
    status: 'active',
    progress: 58,
    metric: 'Paying users',
    metricUnit: '',
    metricNow: '290',
    due: '2026-12-31',
    cadence: 'weekly',
    owner: 'Juan',
  },
  {
    id: 'g3',
    name: 'English C1',
    hue: 'violet',
    desc: 'Pass the Cambridge CAE exam with a C1 grade.',
    status: 'active',
    progress: 70,
    metric: 'CAE exam',
    metricUnit: '',
    metricNow: 'B2+',
    due: '2026-11-15',
    cadence: 'weekly',
    owner: 'Juan',
  },
  {
    id: 'g4',
    name: 'Fitness recomp',
    hue: 'teal',
    desc: 'Recomposition: reach 13% body fat while maintaining muscle.',
    status: 'at-risk',
    progress: 32,
    metric: 'Body fat %',
    metricUnit: '%',
    metricNow: '18',
    due: '2026-10-01',
    cadence: 'weekly',
    owner: 'Juan',
  },
  {
    id: 'g5',
    name: 'Runway 9m',
    hue: 'rose',
    desc: 'Build a 9-month personal financial runway in savings.',
    status: 'active',
    progress: 53,
    metric: 'Months savings',
    metricUnit: 'mo',
    metricNow: '4.8',
    due: '2026-12-31',
    cadence: 'monthly',
    owner: 'Juan',
  },
]

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'p1',
    goal: 'g1',
    title: 'Ship onboarding flow v2',
    horizon: 'week',
    done: false,
    due: '2026-06-07',
  },
  {
    id: 'p2',
    goal: 'g1',
    title: 'Run 3 sales calls with warm leads',
    horizon: 'week',
    done: true,
    due: '2026-06-05',
  },
  {
    id: 'p3',
    goal: 'g2',
    title: 'Launch referral program landing page',
    horizon: 'week',
    done: false,
    due: '2026-06-08',
  },
  {
    id: 'p4',
    goal: 'g2',
    title: 'Write 2 blog posts for SEO',
    horizon: 'month',
    done: false,
    due: '2026-06-30',
  },
  {
    id: 'p5',
    goal: 'g3',
    title: 'Complete Cambridge vocabulary unit 7',
    horizon: 'week',
    done: true,
    due: '2026-06-04',
  },
  {
    id: 'p6',
    goal: 'g3',
    title: 'Do 2 mock CAE reading tests',
    horizon: 'week',
    done: false,
    due: '2026-06-10',
  },
  {
    id: 'p7',
    goal: 'g4',
    title: 'Log all meals Mon–Sun',
    horizon: 'week',
    done: false,
    due: '2026-06-07',
  },
  {
    id: 'p8',
    goal: 'g5',
    title: 'Transfer $800 to savings account',
    horizon: 'month',
    done: false,
    due: '2026-06-30',
  },
]

// ─── Results ──────────────────────────────────────────────────────────────────

export const RESULTS: Result[] = [
  {
    id: 'r1',
    goal: 'g1',
    cadence: 'weekly',
    period: 'W22 2026',
    date: '2026-05-31',
    good: 'Closed two annual deals; MRR moved from $4 200 to $4 600.',
    bad: 'Demo-to-close cycle still 12 days — too slow for the pipeline.',
    change: 'Add async video demo as first touch to cut cycle time.',
  },
  {
    id: 'r2',
    goal: 'g4',
    cadence: 'weekly',
    period: 'W22 2026',
    date: '2026-05-31',
    good: 'Hit all 4 gym sessions; protein average was 165 g/day.',
    bad: 'Weekend eating was inconsistent — body fat stalled at 18%.',
    change: 'Pre-plan weekend meals on Friday afternoon.',
  },
  {
    id: 'r3',
    goal: 'g2',
    cadence: 'monthly',
    period: 'May 2026',
    date: '2026-05-31',
    good: 'Added 42 paying users, highest month so far.',
    bad: 'Churn rate ticked up to 4.1% — retention is a concern.',
    change: 'Schedule win-back email sequence for day-14 inactive users.',
  },
  {
    id: 'r4',
    goal: 'g5',
    cadence: 'monthly',
    period: 'May 2026',
    date: '2026-05-31',
    good: 'Saved $950, ahead of $800 target.',
    bad: 'Unexpected car repair cost $340.',
    change: 'Add a $500 buffer line to monthly budget for unexpected costs.',
  },
]

// ─── Intel ────────────────────────────────────────────────────────────────────

export const INTEL: Intel[] = [
  {
    id: 'i1',
    type: 'note',
    goal: 'g1',
    date: '2026-05-28',
    title: 'Competitor launched freemium tier',
    body: 'Apex just launched a free plan capped at 3 seats. Worth monitoring conversion rates. Our differentiation remains the analytics depth and API — keep messaging focused there.',
  },
  {
    id: 'i2',
    type: 'result',
    goal: 'g1',
    date: '2026-05-25',
    title: 'A/B test: pricing page CTA copy',
    did: 'Ran A/B test on pricing CTA: "Start free trial" vs "Get started".',
    expected: '"Get started" variant would increase click-through by 10%.',
    happened: '"Start free trial" won with +18% click-through (p < 0.05, n = 1 200).',
    verdict: 'win',
  },
  {
    id: 'i3',
    type: 'note',
    goal: 'g3',
    date: '2026-05-27',
    title: 'CAE listening section is the weak point',
    body: 'Mock test score breakdown: reading 68%, writing 72%, listening 55%, speaking 74%. Need to dedicate 2x more time to listening comprehension exercises.',
  },
  {
    id: 'i4',
    type: 'result',
    goal: 'g4',
    date: '2026-05-20',
    title: 'Creatine loading experiment',
    did: 'Loaded 20 g/day creatine for 5 days then 5 g/day maintenance.',
    expected: 'Strength increase of ~5% on main lifts within 2 weeks.',
    happened: 'Bench +4 kg, squat +7.5 kg after 3 weeks. Water weight +1.2 kg.',
    verdict: 'win',
  },
  {
    id: 'i5',
    type: 'note',
    goal: 'g2',
    date: '2026-05-22',
    title: 'Top churn reasons from exit survey',
    body: 'Exit survey (n = 24): 42% "missing integrations", 29% "too expensive", 21% "found alternative", 8% "project ended". Integrations roadmap should be prioritised.',
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function goalById(id: string): Goal | undefined {
  return GOALS.find(g => g.id === id)
}
