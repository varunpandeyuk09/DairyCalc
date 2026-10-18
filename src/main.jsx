import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ensureSeeded, getSetting, setSetting } from './db.js'
import './index.css'

// Worker link: ?mode=worker&pin=1234 — agar device par abhi tak koi PIN set
// nahi hai (fresh install, jaise helper ka phone) to app turant worker mode
// mein lock ho jata hai. URL se PIN turant hata diya jata hai.
async function provisionFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const pin = params.get('pin') || ''
  if (params.get('mode') !== 'worker' || !/^\d{4}$/.test(pin)) return
  const current = await getSetting('pin')
  if (!current) {
    await setSetting('pin', pin)
    await setSetting('locked', true)
  }
  window.history.replaceState({}, '', window.location.pathname)
}

ensureSeeded()
  .then(() => provisionFromUrl())
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
