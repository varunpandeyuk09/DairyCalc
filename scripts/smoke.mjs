import { chromium } from 'playwright-core'
import fs from 'node:fs'

const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:4173/'

const failures = []
const errors = []

const check = (name, cond, detail = '') => {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failures.push(name)
    console.log(`FAIL  ${name} ${detail}`)
  }
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.app', { timeout: 15000 })

// ---- 1) seeded products + Hindi UI ----
check('product chips rendered', (await page.locator('.prod-chip').count()) >= 8)
check('hindi heading', (await page.locator('.brand h1').innerText()).includes('डायरी'))

// ---- 2) calc: milk 60/kg, ₹30 -> 500 g ----
await page.locator('.prod-chip', { hasText: '₹60' }).first().click()
await page.locator('#calc-input').fill('30')
await page.waitForTimeout(200)
check(
  'rupees 30 -> 500 grams',
  (await page.locator('.result-num').innerText()).trim() === '500',
  await page.locator('.result-num').innerText(),
)

// ---- 3) grams mode: 1000g -> ₹60 ----
await page.locator('.segmented button', { hasText: 'ग्राम' }).click()
await page.locator('#calc-input').fill('1000')
await page.waitForTimeout(200)
check(
  '1000 grams -> 60 rupees',
  (await page.locator('.result-num').innerText()).trim() === '60',
  await page.locator('.result-num').innerText(),
)

// ---- 4) save entry -> register shows it ----
await page.locator('#calc-input').fill('500')
await page.locator('.btn-primary', { hasText: 'बही में सेव' }).click()
await page.waitForTimeout(400)
await page.locator('.bottom-nav button', { hasText: 'बही' }).click()
await page.waitForSelector('.entry-row', { timeout: 5000 })
check(
  'entry appears in register',
  (await page.locator('.entry-row', { hasText: 'दूध' }).count()) > 0,
)
check(
  'day total shows 30',
  (await page.locator('.stat-value.accent').innerText()).includes('30'),
  await page.locator('.stat-value.accent').innerText(),
)

// ---- 5) merge import: worker's backup adds entries, keeps old ones ----
const backup = {
  app: 'dairy-calc',
  version: 1,
  products: [{ nameHi: 'मलाई', nameEn: 'Malai', emoji: '🍦', rate: 200 }],
  entries: [
    {
      date: todayISO(),
      productId: 999,
      nameHi: 'मलाई',
      nameEn: 'Malai',
      emoji: '🍦',
      rate: 200,
      rupees: 40,
      grams: 200,
      createdAt: 1111111111111,
    },
    {
      date: todayISO(),
      productId: 1,
      nameHi: 'दूध',
      nameEn: 'Milk',
      emoji: '🥛',
      rate: 60,
      rupees: 60,
      grams: 1000,
      createdAt: 2222222222222,
    },
  ],
  settings: [],
}
const backupPath = 'test-backup.json'
fs.writeFileSync(backupPath, JSON.stringify(backup))
await page.locator('.top-actions .icon-btn').click()
await page.waitForSelector('.settings', { timeout: 3000 })
page.once('dialog', (d) => d.accept())
await page.locator('.settings input[type="file"]').setInputFiles(backupPath)
await page.waitForTimeout(900)
await page.locator('.bottom-nav button', { hasText: 'बही' }).click()
await page.waitForTimeout(300)
const mergedCount = await page.locator('.entry-row').count()
check('merge import keeps old + adds new entries', mergedCount === 3, `(${mergedCount} entries)`)
fs.unlinkSync(backupPath)

// ---- 6) language toggle -> English ----
await page.locator('.lang-chip').click()
await page.waitForTimeout(400)
check(
  'english heading after toggle',
  (await page.locator('.brand h1').innerText()).includes('Dairy'),
  await page.locator('.brand h1').innerText(),
)

// ---- 7) products tab shows add form ----
await page.locator('.bottom-nav button', { hasText: 'Products' }).click()
await page.waitForSelector('.products', { timeout: 3000 })
await page.locator('.products .input').first().fill('Curd Fresh')
check('add form present', (await page.locator('.products .btn-primary').count()) > 0)

// ---- 8) owner lock: worker mode hides product edits ----
await page.locator('.top-actions .icon-btn').click()
await page.waitForSelector('.settings', { timeout: 3000 })
await page.locator('.settings .input.small').first().fill('1234')
await page
  .locator('.settings .card', { hasText: 'Owner lock' })
  .locator('.btn-primary.btn-sm')
  .click()
await page.waitForTimeout(300)
await page.locator('.settings .btn-primary', { hasText: 'Lock now' }).click()
await page.waitForTimeout(300)
await page.locator('.bottom-nav button', { hasText: 'Products' }).click()
await page.waitForTimeout(300)
check('locked: add form hidden', (await page.locator('.products .card-title').count()) === 0)
check('locked: edit buttons hidden', (await page.locator('.products .btn-outline.btn-sm').count()) === 0)

// ---- 9) unlock requires correct PIN ----
await page.locator('.top-actions .icon-btn').click()
await page.waitForSelector('.settings', { timeout: 3000 })
await page.locator('.settings .input.small').first().fill('9999')
await page.locator('.settings .btn-primary.btn-sm', { hasText: 'Unlock' }).click()
await page.waitForTimeout(200)
check('wrong pin stays locked', await page.locator('.settings .error').isVisible())
await page.locator('.settings .input.small').first().fill('1234')
await page.locator('.settings .btn-primary.btn-sm', { hasText: 'Unlock' }).click()
await page.waitForTimeout(300)
check(
  'unlocked: import visible again',
  (await page.locator('.settings .btn-outline', { hasText: 'Import' }).count()) === 1,
)

// ---- 10) worker link provisions a fresh device into locked mode ----
const refCode = 'f3a9c1d8b7e6a5f4c3b2a19087654321fedcba9876543210abcdef0123456789'
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } })
await p2.goto(`${URL}?ref=${refCode}`, { waitUntil: 'networkidle' })
await p2.waitForSelector('.app', { timeout: 15000 })
check('worker link: url cleaned of ref', !p2.url().includes('ref='))
await p2.locator('.bottom-nav button', { hasText: /Products|प्रोडक्ट/ }).click()
await p2.waitForTimeout(400)
check('worker link: products read-only', (await p2.locator('.products .card-title').count()) === 0)
await p2.locator('.top-actions .icon-btn').click()
await p2.waitForSelector('.settings', { timeout: 3000 })
check(
  'worker link: settings asks for PIN',
  (await p2.locator('.settings .btn-primary.btn-sm', { hasText: /Unlock|अनलॉक/ }).count()) === 1,
)
await p2.close()

check('no console/page errors', errors.length === 0, JSON.stringify(errors, null, 2))

await browser.close()
console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.length}`}`)
process.exit(failures.length === 0 ? 0 : 1)
