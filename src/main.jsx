import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ensureSeeded, getSetting, setSetting } from './db.js'
import { hashPin, isPinHash } from './utils/pin.js'
import './index.css'

// Purane installs: PIN seedha (4-digit) store hua tha — ab hash mein migrate.
async function migrateLegacyPin() {
  const pin = await getSetting('pin')
  if (pin && /^\d{4}$/.test(pin)) await setSetting('pin', await hashPin(pin))
}

// Worker link: ?ref=<hash> — URL mein na PIN hota hai, na "worker" jaisa koi
// shabd. Fresh device (helper ka phone) par kholne par app apne aap worker
// mode mein lock ho jati hai. PIN turant URL se hata diya jata hai.
async function provisionFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref') || ''
  if (!isPinHash(ref)) return
  const current = await getSetting('pin')
  if (!current) {
    await setSetting('pin', ref)
    await setSetting('locked', true)
  }
  window.history.replaceState({}, '', window.location.pathname)
}

ensureSeeded()
  .then(() => migrateLegacyPin())
  .then(() => provisionFromUrl())
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
