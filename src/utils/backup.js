import { db, ensureSeeded } from '../db.js'

export async function exportBackup() {
  const data = {
    app: 'dairy-calc',
    version: 1,
    exportedAt: new Date().toISOString(),
    products: await db.products.toArray(),
    entries: await db.entries.toArray(),
    settings: await db.settings.toArray(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dairy-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  return blob
}

export async function shareBackup() {
  const data = {
    app: 'dairy-calc',
    version: 1,
    exportedAt: new Date().toISOString(),
    products: await db.products.toArray(),
    entries: await db.entries.toArray(),
    settings: await db.settings.toArray(),
  }
  const file = new File([JSON.stringify(data)], `dairy-backup-${new Date().toISOString().slice(0, 10)}.json`, {
    type: 'application/json',
  })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Dairy backup' })
    return true
  }
  return false
}

const norm = (s) => String(s || '').trim().toLowerCase()

// Merge import: naye products/entries add hota hai, local data safe rehta hai.
// Entries ko createdAt (unique per add) se dedupe kiya jata hai — do phones
// ki entries aapas mein jud jati hain bina kuch delete kiye.
export async function importBackup(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (data.app !== 'dairy-calc' || !Array.isArray(data.products)) {
    throw new Error('Not a valid Dairy Calc backup file')
  }

  const localProducts = await db.products.toArray()
  const localEntries = await db.entries.toArray()
  const haveProduct = new Set(localProducts.map((p) => `${norm(p.nameHi)}|${p.rate}`))
  const haveEntry = new Set(localEntries.map((e) => entryKey(e)))

  const newProducts = (data.products || [])
    .filter((p) => p && !haveProduct.has(`${norm(p.nameHi)}|${p.rate}`))
    .map(({ id: _id, ...rest }) => rest)
  const newEntries = (data.entries || [])
    .filter((e) => e && !haveEntry.has(entryKey(e)))
    .map(({ id: _id, ...rest }) => rest)

  const ok = window.confirm(
    `Merge backup? ${newProducts.length} new products and ${newEntries.length} new entries will be added. Nothing is deleted.`,
  )
  if (!ok) return null

  await db.transaction('rw', db.products, db.entries, async () => {
    if (newProducts.length) await db.products.bulkAdd(newProducts)
    if (newEntries.length) await db.entries.bulkAdd(newEntries)
  })
  return { addedProducts: newProducts.length, addedEntries: newEntries.length }
}

function entryKey(e) {
  return `${e.createdAt ?? ''}|${e.date}|${e.nameHi}|${e.rate}|${e.rupees}|${e.grams}`
}

export async function resetAllData() {
  const ok = window.confirm('Delete ALL products, entries and settings? This cannot be undone.')
  if (!ok) return
  await db.transaction('rw', db.products, db.entries, db.settings, async () => {
    await db.products.clear()
    await db.entries.clear()
    await db.settings.clear()
  })
  await ensureSeeded()
}
