import { chromium } from 'playwright-core'

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

// ---- 5) language toggle -> English ----
await page.locator('.lang-chip').click()
await page.waitForTimeout(400)
check(
  'english heading after toggle',
  (await page.locator('.brand h1').innerText()).includes('Dairy'),
  await page.locator('.brand h1').innerText(),
)

// ---- 6) products tab shows add form ----
await page.locator('.bottom-nav button', { hasText: 'Products' }).click()
await page.waitForSelector('.products', { timeout: 3000 })
await page.locator('.products .input').first().fill('Curd Fresh')
check('add form present', (await page.locator('.products .btn-primary').count()) > 0)

check('no console/page errors', errors.length === 0, JSON.stringify(errors, null, 2))

await browser.close()
console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.length}`}`)
process.exit(failures.length === 0 ? 0 : 1)
