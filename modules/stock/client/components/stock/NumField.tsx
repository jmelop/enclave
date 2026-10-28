import { useEffect, useState } from 'react'
import { Button, Input, Label } from '@venator-ui/ui'
import { round2 } from '@/lib/utils'

interface NumFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  int?: boolean
  prefix?: string
}

// [–] € [input] [+] stepper, clamped at 0. Money rounds to cents, counts to integers.
export function NumField({ label, value, onChange, step = 1, int = false, prefix }: NumFieldProps) {
  // Raw text so "12," or an empty field can be typed without snapping back.
  const [text, setText] = useState(String(value))
  useEffect(() => {
    setText((t) => (parse(t) === value ? t : String(value)))
  }, [value])

  function parse(raw: string): number {
    const v = int ? parseInt(raw, 10) : parseFloat(raw.replace(',', '.'))
    return Number.isNaN(v) ? 0 : Math.max(0, int ? Math.round(v) : round2(v))
  }

  const commit = (v: number) => {
    const next = Math.max(0, int ? Math.round(v) : round2(v))
    setText(String(next))
    onChange(next)
  }

  return (
    <div className="stk-nf">
      <Label className="stk-field-lbl">{label}</Label>
      <div className="stk-nf-box">
        <Button type="button" variant="ghost" size="sm" iconOnly aria-label="decrease" onClick={() => commit(value - step)}>–</Button>
        {prefix && <span className="stk-nf-pre mono">{prefix}</span>}
        <Input
          className="stk-nf-input mono"
          inputMode={int ? 'numeric' : 'decimal'}
          value={text}
          onChange={(e) => { setText(e.target.value); onChange(parse(e.target.value)) }}
          onBlur={() => setText(String(value))}
        />
        <Button type="button" variant="ghost" size="sm" iconOnly aria-label="increase" onClick={() => commit(value + step)}>+</Button>
      </div>
    </div>
  )
}
