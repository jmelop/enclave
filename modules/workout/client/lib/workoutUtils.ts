// Formatting only. Every derived metric comes from workout/server/service.ts.

// Today as YYYY-MM-DD from local parts. Never toISOString(): that converts to
// UTC and returns yesterday between 00:00 and 02:00 in timezones ahead of UTC.
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(iso: string, opts: { short?: boolean } = {}): string {
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (opts.short) return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function dayOfWeek(iso: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(iso + 'T00:00:00').getDay()]
}
