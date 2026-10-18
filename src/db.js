import Dexie from 'dexie'

export const db = new Dexie('dairy-calc')

db.version(1).stores({
  products: '++id, name',
  entries: '++id, date, productId',
  settings: 'key',
})

export const DEFAULT_SETTINGS = {
  lang: 'hi',
}

export const DEFAULT_PRODUCTS = [
  { nameHi: 'दूध', nameEn: 'Milk', emoji: '🥛', rate: 60 },
  { nameHi: 'दूध', nameEn: 'Milk', emoji: '🥛', rate: 70 },
  { nameHi: 'दूध', nameEn: 'Milk', emoji: '🥛', rate: 80 },
  { nameHi: 'दही', nameEn: 'Curd', emoji: '🥣', rate: 90 },
  { nameHi: 'देसी घी', nameEn: 'Desi Ghee', emoji: '🧈', rate: 1100 },
  { nameHi: 'लस्सी', nameEn: 'Lassi', emoji: '🥤', rate: 50 },
  { nameHi: 'पनीर', nameEn: 'Paneer', emoji: '🧀', rate: 360 },
  { nameHi: 'मक्खन', nameEn: 'Butter', emoji: '🧈', rate: 600 },
]

export async function ensureSeeded() {
  const count = await db.products.count()
  if (count === 0) await db.products.bulkAdd(DEFAULT_PRODUCTS)

  const existing = await db.settings.toArray()
  const have = new Set(existing.map((s) => s.key))
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!have.has(key)) await db.settings.put({ key, value })
  }
}

export async function getSetting(key) {
  const row = await db.settings.get(key)
  return row ? row.value : DEFAULT_SETTINGS[key]
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}
