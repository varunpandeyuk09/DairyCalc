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

export async function importBackup(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (data.app !== 'dairy-calc' || !Array.isArray(data.products)) {
    throw new Error('Not a valid Dairy Calc backup file')
  }
  const ok = window.confirm(
    `Import ${data.products.length} products and ${data.entries?.length || 0} entries? This replaces all current data.`,
  )
  if (!ok) return false

  await db.transaction('rw', db.products, db.entries, db.settings, async () => {
    await db.products.clear()
    await db.entries.clear()
    await db.settings.clear()
    if (data.products.length) await db.products.bulkPut(data.products)
    if (data.entries?.length) await db.entries.bulkAdd(data.entries)
    if (data.settings?.length) await db.settings.bulkPut(data.settings)
  })
  return true
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
