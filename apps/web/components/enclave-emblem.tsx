export function EnclaveEmblem({ className = "" }: { className?: string }) {
  const dots = []
  const cols = 12
  const rows = 12
  const spacing = 50
  const offsetX = 25
  const offsetY = 25

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={offsetX + c * spacing}
          cy={offsetY + r * spacing}
          r="2"
          fill="currentColor"
          opacity="0.4"
        />
      )
    }
  }

  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {dots}
    </svg>
  )
}
