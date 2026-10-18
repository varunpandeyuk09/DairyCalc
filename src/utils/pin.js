// PIN ko kabhi store/share nahi karte — sirf uska hash (PBKDF2). Worker link
// mein bhi hash jaata hai, jo dekh kar PIN ka andaza ya ulta nikalna mushkil
// hai, aur usme "worker"/"pin" jaisa koi shabd bhi nahi hota.

const SALT = 'dairy-calc-lock-2026'

export async function hashPin(pin) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  )
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(input, stored) {
  if (!stored || !input) return false
  // Purane installs mein PIN seedha store hota tha — unke liye legacy check.
  if (/^\d{4}$/.test(stored)) return String(input) === stored
  return (await hashPin(input)) === stored
}

export function isPinHash(value) {
  return /^[0-9a-f]{32,128}$/.test(String(value || ''))
}
