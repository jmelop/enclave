import { useState } from 'react'
import type { GoalHue, GoalStatus, PlanHorizon, IntelType, Verdict } from '@/types/strategy'
import { useStrategyStore } from '@/store/strategyStore'
import { useToast } from '@venator-ui/ui'

export type ModalType = 'goal' | 'plan' | 'result' | 'intel'

// Flat optional bag for all form-prefilable fields. cadence stays string
// to remain compatible with Goal.cadence (string) and Result.cadence ('weekly'|'monthly').
export type StrategyPrefill = {
  name?: string; desc?: string; hue?: GoalHue; status?: GoalStatus
  progress?: number; metric?: string; metricUnit?: string; metricNow?: string
  northStar?: boolean; cadence?: string; owner?: string; parent?: string
  title?: string; goal?: string; horizon?: PlanHorizon; done?: boolean; due?: string
  period?: string; good?: string; bad?: string; change?: string; date?: string
  type?: IntelType; body?: string; did?: string; expected?: string
  happened?: string; verdict?: Verdict
}

interface CreateModalProps {
  type: ModalType
  editId?: string
  prefill?: StrategyPrefill
  onClose: () => void
}

const TITLES: Record<ModalType, [string, string]> = {
  goal:   ['New goal',   'Edit goal'],
  plan:   ['New plan',   'Edit plan'],
  result: ['New result', 'Edit result'],
  intel:  ['New intel',  'Edit intel'],
}

export function CreateModal({ type, editId, prefill, onClose }: CreateModalProps) {
  const addGoal      = useStrategyStore(s => s.addGoal)
  const addPlan      = useStrategyStore(s => s.addPlan)
  const addResult    = useStrategyStore(s => s.addResult)
  const addIntel     = useStrategyStore(s => s.addIntel)
  const updateGoal   = useStrategyStore(s => s.updateGoal)
  const updatePlan   = useStrategyStore(s => s.updatePlan)
  const updateResult = useStrategyStore(s => s.updateResult)
  const updateIntel  = useStrategyStore(s => s.updateIntel)
  const goals        = useStrategyStore(s => s.goals)
  const { toast }    = useToast()

  // Goal fields
  const [goalName, setGoalName]             = useState(prefill?.name ?? '')
  const [goalDesc, setGoalDesc]             = useState(prefill?.desc ?? '')
  const [goalHue, setGoalHue]               = useState<GoalHue>(prefill?.hue ?? 'amber')
  const [goalStatus, setGoalStatus]         = useState<GoalStatus>(prefill?.status ?? 'active')
  const [goalDue, setGoalDue]               = useState(prefill?.due ?? '')
  const [goalMetric, setGoalMetric]         = useState(prefill?.metric ?? '')
  const [goalMetricUnit, setGoalMetricUnit] = useState(prefill?.metricUnit ?? '')
  const [goalMetricNow, setGoalMetricNow]   = useState(prefill?.metricNow ?? '')

  // Plan fields
  const [planTitle, setPlanTitle]     = useState(prefill?.title ?? '')
  const [planGoal, setPlanGoal]       = useState(prefill?.goal ?? (goals[0]?.id ?? ''))
  const [planHorizon, setPlanHorizon] = useState<PlanHorizon>(prefill?.horizon ?? 'week')
  const [planDue, setPlanDue]         = useState(prefill?.due ?? '')

  // Result fields
  const [resultGoal, setResultGoal]     = useState(prefill?.goal ?? (goals[0]?.id ?? ''))
  const [resultPeriod, setResultPeriod] = useState(prefill?.period ?? '')
  const [resultGood, setResultGood]     = useState(prefill?.good ?? '')
  const [resultBad, setResultBad]       = useState(prefill?.bad ?? '')
  const [resultChange, setResultChange] = useState(prefill?.change ?? '')

  // Intel fields
  const [intelGoal, setIntelGoal]         = useState(prefill?.goal ?? (goals[0]?.id ?? ''))
  const [intelType, setIntelType]         = useState<IntelType>(prefill?.type ?? 'note')
  const [intelTitle, setIntelTitle]       = useState(prefill?.title ?? '')
  const [intelBody, setIntelBody]         = useState(prefill?.body ?? '')
  const [intelDid, setIntelDid]           = useState(prefill?.did ?? '')
  const [intelExpected, setIntelExpected] = useState(prefill?.expected ?? '')
  const [intelHappened, setIntelHappened] = useState(prefill?.happened ?? '')
  const [intelVerdict, setIntelVerdict]   = useState<Verdict>(prefill?.verdict ?? 'win')

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (type === 'goal') {
        if (editId) {
          await updateGoal(editId, {
            name: goalName, desc: goalDesc, hue: goalHue, status: goalStatus,
            progress: prefill?.progress ?? 0,
            metric: goalMetric, metricUnit: goalMetricUnit, metricNow: goalMetricNow,
            due: goalDue,
            cadence: prefill?.cadence ?? 'weekly',
            owner: prefill?.owner ?? 'Juan',
            northStar: prefill?.northStar,
          })
        } else {
          await addGoal({
            name: goalName, desc: goalDesc, hue: goalHue, status: goalStatus,
            progress: 0, metric: goalMetric, metricUnit: goalMetricUnit, metricNow: goalMetricNow,
            due: goalDue, cadence: 'weekly', owner: 'Juan',
          })
        }
      } else if (type === 'plan') {
        if (editId) {
          await updatePlan(editId, {
            goal: planGoal, title: planTitle, horizon: planHorizon,
            done: prefill?.done ?? false, due: planDue,
          })
        } else {
          await addPlan({ goal: planGoal, title: planTitle, horizon: planHorizon, done: false, due: planDue })
        }
      } else if (type === 'result') {
        if (editId) {
          await updateResult(editId, {
            goal: resultGoal, cadence: (prefill?.cadence as 'weekly' | 'monthly' | undefined) ?? 'weekly', period: resultPeriod,
            date: prefill?.date ?? new Date().toISOString().slice(0, 10),
            good: resultGood, bad: resultBad, change: resultChange,
          })
        } else {
          await addResult({
            goal: resultGoal, cadence: 'weekly', period: resultPeriod,
            date: new Date().toISOString().slice(0, 10),
            good: resultGood, bad: resultBad, change: resultChange,
          })
        }
      } else {
        const payload = {
          type: intelType, goal: intelGoal,
          date: prefill?.date ?? new Date().toISOString().slice(0, 10),
          title: intelTitle,
          body: intelType === 'note' ? intelBody : undefined,
          did: intelType === 'result' ? intelDid : undefined,
          expected: intelType === 'result' ? intelExpected : undefined,
          happened: intelType === 'result' ? intelHappened : undefined,
          verdict: intelType === 'result' ? intelVerdict : undefined,
        }
        if (editId) await updateIntel(editId, payload)
        else await addIntel(payload)
      }
      onClose()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Save failed', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const title = TITLES[type][editId ? 1 : 0]

  return (
    <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost" style={{ padding: '0 8px', height: 30 }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {type === 'goal' && (
            <>
              <div className="field">
                <label className="field-lbl">Name</label>
                <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Goal name" />
              </div>
              <div className="field">
                <label className="field-lbl">Description</label>
                <textarea value={goalDesc} onChange={e => setGoalDesc(e.target.value)} placeholder="What does success look like?" rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="field-lbl">Hue</label>
                  <select value={goalHue} onChange={e => setGoalHue(e.target.value as GoalHue)}>
                    <option value="amber">Amber</option>
                    <option value="blue">Blue</option>
                    <option value="violet">Violet</option>
                    <option value="teal">Teal</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-lbl">Status</label>
                  <select value={goalStatus} onChange={e => setGoalStatus(e.target.value as GoalStatus)}>
                    <option value="active">Active</option>
                    <option value="at-risk">At risk</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-lbl">Metric</label>
                <input value={goalMetric} onChange={e => setGoalMetric(e.target.value)} placeholder="e.g. MRR" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="field-lbl">Unit</label>
                  <input value={goalMetricUnit} onChange={e => setGoalMetricUnit(e.target.value)} placeholder="$, %, mo…" />
                </div>
                <div className="field">
                  <label className="field-lbl">Current value</label>
                  <input value={goalMetricNow} onChange={e => setGoalMetricNow(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="field">
                <label className="field-lbl">Due date</label>
                <input type="date" value={goalDue} onChange={e => setGoalDue(e.target.value)} />
              </div>
            </>
          )}

          {type === 'plan' && (
            <>
              <div className="field">
                <label className="field-lbl">Title</label>
                <input value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder="What will you do?" />
              </div>
              <div className="field">
                <label className="field-lbl">Goal</label>
                <select value={planGoal} onChange={e => setPlanGoal(e.target.value)}>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="field-lbl">Horizon</label>
                  <select value={planHorizon} onChange={e => setPlanHorizon(e.target.value as PlanHorizon)}>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-lbl">Due date</label>
                  <input type="date" value={planDue} onChange={e => setPlanDue(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {type === 'result' && (
            <>
              <div className="field">
                <label className="field-lbl">Goal</label>
                <select value={resultGoal} onChange={e => setResultGoal(e.target.value)}>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-lbl">Period</label>
                <input value={resultPeriod} onChange={e => setResultPeriod(e.target.value)} placeholder="e.g. W23 2026 or Jun 2026" />
              </div>
              <div className="field">
                <label className="field-lbl" style={{ color: 'var(--success)' }}>What went well?</label>
                <textarea value={resultGood} onChange={e => setResultGood(e.target.value)} placeholder="Wins this period…" rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div className="field">
                <label className="field-lbl" style={{ color: 'var(--danger)' }}>What went badly?</label>
                <textarea value={resultBad} onChange={e => setResultBad(e.target.value)} placeholder="Blockers or misses…" rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div className="field">
                <label className="field-lbl" style={{ color: 'var(--info)' }}>What will you change?</label>
                <textarea value={resultChange} onChange={e => setResultChange(e.target.value)} placeholder="Adjustments for next cycle…" rows={2} style={{ resize: 'vertical' }} />
              </div>
            </>
          )}

          {type === 'intel' && (
            <>
              <div className="field">
                <label className="field-lbl">Goal</label>
                <select value={intelGoal} onChange={e => setIntelGoal(e.target.value)}>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-lbl">Type</label>
                <select value={intelType} onChange={e => setIntelType(e.target.value as IntelType)}>
                  <option value="note">Note</option>
                  <option value="result">Experiment result</option>
                </select>
              </div>
              <div className="field">
                <label className="field-lbl">Title</label>
                <input value={intelTitle} onChange={e => setIntelTitle(e.target.value)} placeholder="Intel title" />
              </div>
              {intelType === 'note' && (
                <div className="field">
                  <label className="field-lbl">Body</label>
                  <textarea value={intelBody} onChange={e => setIntelBody(e.target.value)} placeholder="Notes…" rows={4} style={{ resize: 'vertical' }} />
                </div>
              )}
              {intelType === 'result' && (
                <>
                  <div className="field">
                    <label className="field-lbl">What did you do?</label>
                    <textarea value={intelDid} onChange={e => setIntelDid(e.target.value)} placeholder="Experiment description…" rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="field">
                    <label className="field-lbl">What did you expect?</label>
                    <textarea value={intelExpected} onChange={e => setIntelExpected(e.target.value)} placeholder="Hypothesis…" rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="field">
                    <label className="field-lbl">What actually happened?</label>
                    <textarea value={intelHappened} onChange={e => setIntelHappened(e.target.value)} placeholder="Outcome…" rows={2} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="field">
                    <label className="field-lbl">Verdict</label>
                    <select value={intelVerdict} onChange={e => setIntelVerdict(e.target.value as Verdict)}>
                      <option value="win">Win</option>
                      <option value="loss">Loss</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Save changes' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
