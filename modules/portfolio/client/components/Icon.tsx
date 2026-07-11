interface IconProps {
  name: string
  size?: number
  stroke?: number
}

export function Icon({ name, size = 16, stroke = 1.5 }: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'plus':      return <svg {...p}><path d="M8 3v10M3 8h10"/></svg>
    case 'close':     return <svg {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>
    case 'eye':       return <svg {...p}><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>
    case 'wallet':    return <svg {...p}><path d="M2 4.5A1.5 1.5 0 013.5 3h9A1.5 1.5 0 0114 4.5v7A1.5 1.5 0 0112.5 13h-9A1.5 1.5 0 012 11.5v-7z"/><path d="M11 8h2"/></svg>
    case 'pie':       return <svg {...p}><path d="M8 2v6h6"/><path d="M14 8a6 6 0 11-6-6"/></svg>
    case 'chart':     return <svg {...p}><path d="M3 13V7M7 13V4M11 13V9"/><path d="M2 14h12"/></svg>
    case 'trendUp':   return <svg {...p}><path d="M2 11l4-4 3 3 5-5"/><path d="M10 5h4v4"/></svg>
    case 'trendDown': return <svg {...p}><path d="M2 5l4 4 3-3 5 5"/><path d="M10 11h4V7"/></svg>
    case 'refresh':   return <svg {...p}><path d="M2 8a6 6 0 0110-4.5L13 5"/><path d="M14 8a6 6 0 01-10 4.5L3 11"/><path d="M11 2v3h3M5 14v-3H2"/></svg>
    case 'download':  return <svg {...p}><path d="M8 2v8"/><path d="M5 7l3 3 3-3"/><path d="M3 13h10"/></svg>
    case 'upload':    return <svg {...p}><path d="M8 14V6"/><path d="M5 9l3-3 3 3"/><path d="M3 13h10"/></svg>
    case 'dots':      return <svg {...p}><circle cx="3.5" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="12.5" cy="8" r="1"/></svg>
    case 'search':    return <svg {...p}><circle cx="7" cy="7" r="4.5"/><path d="M13.5 13.5L10.5 10.5"/></svg>
    case 'bell':      return <svg {...p}><path d="M4 12V7a4 4 0 118 0v5l1 1H3l1-1z"/><path d="M6.5 14a1.5 1.5 0 003 0"/></svg>
    case 'cog':       return <svg {...p}><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M15 8h-2M3 8H1M12.7 3.3l-1.4 1.4M4.7 11.3l-1.4 1.4M12.7 12.7l-1.4-1.4M4.7 4.7L3.3 3.3"/></svg>
    case 'home':      return <svg {...p}><path d="M2 7l6-5 6 5v7H2V7z"/><path d="M6 14V9h4v5"/></svg>
    case 'bolt':      return <svg {...p}><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z"/></svg>
    case 'lock':      return <svg {...p}><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
    case 'bank':      return <svg {...p}><path d="M2 6l6-3 6 3v1H2V6z"/><path d="M3 7v6M6 7v6M10 7v6M13 7v6M2 13h12"/></svg>
    case 'briefcase': return <svg {...p}><rect x="2" y="5" width="12" height="8" rx="1.5"/><path d="M5.5 5V3.5h5V5"/><path d="M2 9h12"/></svg>
    case 'coin':      return <svg {...p}><circle cx="8" cy="8" r="5.5"/><path d="M6.5 6.5h2.5a1.25 1.25 0 010 2.5H6.5"/><path d="M6.5 9h3a1.25 1.25 0 010 2.5H6.5"/></svg>
    case 'flask':     return <svg {...p}><path d="M6 2v4l-3 7a1.5 1.5 0 001.4 2h7.2A1.5 1.5 0 0013 13l-3-7V2"/><path d="M5 2h6"/></svg>
    case 'gem':       return <svg {...p}><path d="M3 6l3-3h4l3 3-5 7-5-7z"/><path d="M3 6h10M6 3l2 3M10 3l-2 3"/></svg>
    case 'globe':     return <svg {...p}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 3 4 3 6s-1 4-3 6c-2-2-3-4-3-6s1-4 3-6z"/></svg>
    default: return null
  }
}
