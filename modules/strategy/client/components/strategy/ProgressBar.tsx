interface ProgressBarProps {
  value: number
  color: string
}

export function ProgressBar({ value, color }: ProgressBarProps) {
  return (
    <div className="bar">
      <div
        className="bar-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}
