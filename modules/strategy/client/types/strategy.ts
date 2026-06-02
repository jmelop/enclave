export type GoalStatus = 'active' | 'at-risk' | 'blocked' | 'done'
export type GoalHue = 'amber' | 'blue' | 'violet' | 'teal' | 'rose'
export type PlanHorizon = 'week' | 'month'
export type IntelType = 'note' | 'result'
export type Verdict = 'win' | 'loss'

export interface Goal {
  id: string
  name: string
  hue: GoalHue
  desc: string
  northStar?: boolean
  status: GoalStatus
  progress: number
  metric: string
  metricUnit: string
  metricNow: string
  due: string
  cadence: string
  owner: string
  parent?: string
}

export interface Plan {
  id: string
  goal: string
  title: string
  horizon: PlanHorizon
  done: boolean
  due: string
}

export interface Retro {
  id: string
  goal: string
  cadence: 'weekly' | 'monthly'
  period: string
  date: string
  good: string
  bad: string
  change: string
}

export interface Intel {
  id: string
  type: IntelType
  goal: string
  date: string
  title: string
  // note fields
  body?: string
  // result fields
  did?: string
  expected?: string
  happened?: string
  verdict?: Verdict
}
