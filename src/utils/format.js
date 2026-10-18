export function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function monthKey(iso) {
  return iso.slice(0, 7)
}

export function formatDateLabel(iso, lang) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatMonthLabel(monthIso, lang) {
  const d = new Date(`${monthIso}-01T00:00:00`)
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

// ₹30, ₹30.5 — whole rupees stay whole.
export function fmtRupees(n) {
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

// 500, 500.5 — grams with at most 1 decimal.
export function fmtGrams(n) {
  if (!Number.isFinite(n)) return '0'
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

export function rupeesToGrams(rupees, ratePerKg) {
  if (!ratePerKg) return 0
  return (rupees / ratePerKg) * 1000
}

export function gramsToRupees(grams, ratePerKg) {
  if (!ratePerKg) return 0
  return (grams / 1000) * ratePerKg
}

// A small emoji guesser so new products don't all look the same.
const NAME_TO_EMOJI = [
  [/दूध|milk|dudh/i, '🥛'],
  [/दही|curd|yogurt|dahi/i, '🥣'],
  [/घी|ghee/i, '🧈'],
  [/मक्खन|makhan|butter/i, '🧈'],
  [/पनीर|paneer|cheese/i, '🧀'],
  [/लस्सी|lassi|shake/i, '🥤'],
  [/दही मलाई|cream|malai/i, '🍦'],
  [/शहद|honey/i, '🍯'],
  [/अंडा|egg/i, '🥚'],
  [/चीनी|sugar|cheeni/i, '🍬'],
  [/चाय|tea|chai/i, '🍵'],
  [/कॉफी|coffee/i, '☕'],
  [/आटा|flour|atta/i, '🌾'],
  [/चावल|rice|chawal/i, '🍚'],
  [/तेल|oil|tel/i, '🫗'],
  [/सब्जी|sabzi|vegetable/i, '🥬'],
  [/फल|fruit|phal/i, '🍎'],
]

export function guessEmoji(name) {
  const s = String(name || '')
  for (const [re, emoji] of NAME_TO_EMOJI) {
    if (re.test(s)) return emoji
  }
  return '🥛'
}

export const EMOJI_CHOICES = ['🥛', '🥣', '🧈', '🧀', '🥤', '🍯', '🥚', '🍚', '🌾', '☕', '🍵', '🍬']
