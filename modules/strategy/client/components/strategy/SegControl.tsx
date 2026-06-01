interface SegOption {
  value: string
  label: string
}

interface SegControlProps {
  value: string
  options: SegOption[]
  onChange: (v: string) => void
}

export function SegControl({ value, options, onChange }: SegControlProps) {
  return (
    <div className="seg-control">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`seg-btn${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
