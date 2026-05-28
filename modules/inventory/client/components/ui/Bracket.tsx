type Corner = 'tl' | 'tr' | 'bl' | 'br'

interface BracketProps {
  corner: Corner
}

export function Bracket({ corner }: BracketProps) {
  return <span className={`brk brk-${corner}`} />
}
