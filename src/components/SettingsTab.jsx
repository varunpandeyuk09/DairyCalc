import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { setSetting } from '../db.js'
import { makeT } from '../i18n.js'
import { exportBackup, importBackup, resetAllData, shareBackup } from '../utils/backup.js'

export default function SettingsTab({ lang, settings = {}, onClose }) {
  const t = makeT(lang)
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [shareErr, setShareErr] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinErr, setPinErr] = useState('')

  const pin = settings.pin || ''
  const locked = !!settings.locked

  const flash = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const doShare = async () => {
    setShareErr(false)
    try {
      const ok = await shareBackup()
      if (!ok) setShareErr(true)
    } catch {
      /* user cancelled share sheet */
    }
  }

  const saveNewPin = () => {
    const p = pinInput.trim()
    if (!/^\d{4}$/.test(p)) {
      setPinErr(lang === 'hi' ? 'ठीक 4 अंक डालें' : 'Enter exactly 4 digits')
      return
    }
    setSetting('pin', p)
    setPinInput('')
    setPinErr('')
    flash(t('pinSaved'))
  }

  const doUnlock = () => {
    if (pinInput.trim() === pin) {
      setSetting('locked', false)
      setPinInput('')
      setPinErr('')
    } else {
      setPinErr(t('wrongPin'))
    }
  }

  const doChangePin = () => {
    if (oldPin.trim() !== pin) return setPinErr(t('wrongPin'))
    if (!/^\d{4}$/.test(newPin.trim())) {
      setPinErr(lang === 'hi' ? 'ठीक 4 अंक डालें' : 'Enter exactly 4 digits')
      return
    }
    setSetting('pin', newPin.trim())
    setOldPin('')
    setNewPin('')
    setPinErr('')
    flash(t('pinSaved'))
  }

  return (
    <div className="settings">
      <header className="page-head">
        <div>
          <span className="eyebrow">⚙️</span>
          <h2>{t('settings')}</h2>
        </div>
        {onClose && (
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('cancel')}>
            <Icon name="close" size={18} />
          </button>
        )}
      </header>

      {msg && <div className="toast">{msg}</div>}

      <section className="card">
        <h3 className="card-title">{t('ownerLock')}</h3>

        {!pin ? (
          <>
            <p className="hint">{t('setPinHint')}</p>
            <div className="inline-form lock-form">
              <input
                className="input small"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''))
                  setPinErr('')
                }}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={saveNewPin}>
                {t('save')}
              </button>
            </div>
          </>
        ) : locked ? (
          <>
            <p className="hint">{t('lockedHint')}</p>
            <div className="inline-form lock-form">
              <input
                className="input small"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''))
                  setPinErr('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && doUnlock()}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={doUnlock}>
                {t('unlock')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="hint">{t('unlockedHint')}</p>
            <div className="btn-col lock-form">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSetting('locked', true)}
              >
                🔒 {t('lockNow')}
              </button>
              <div className="inline-form">
                <input
                  className="input small"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder={t('oldPin')}
                  value={oldPin}
                  onChange={(e) => {
                    setOldPin(e.target.value.replace(/\D/g, ''))
                    setPinErr('')
                  }}
                />
                <input
                  className="input small"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder={t('newPin')}
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, ''))
                    setPinErr('')
                  }}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={doChangePin}>
                  {t('changePin')}
                </button>
              </div>
            </div>
          </>
        )}
        {pinErr && <p className="error">{pinErr}</p>}
      </section>

      <section className="card">
        <h3 className="card-title">{t('language')}</h3>
        <div className="segmented">
          <button
            type="button"
            className={lang === 'hi' ? 'active' : ''}
            onClick={() => setSetting('lang', 'hi')}
          >
            हिंदी
          </button>
          <button
            type="button"
            className={lang === 'en' ? 'active' : ''}
            onClick={() => setSetting('lang', 'en')}
          >
            English
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">{t('dataBackup')}</h3>
        <p className="hint">{t('helperHint')}</p>
        <div className="btn-col">
          <button type="button" className="btn btn-outline" onClick={() => exportBackup()}>
            ⬇️ {t('exportB')}
          </button>
          <button type="button" className="btn btn-primary" onClick={doShare}>
            <Icon name="share" size={16} /> {t('shareB')}
          </button>
          {shareErr && (
            <p className="hint">
              {lang === 'hi'
                ? 'इस ब्राउज़र में शेयर उपलब्ध नहीं — एक्सपोर्ट फ़ाइल WhatsApp से भेजें।'
                : 'Share not available in this browser — send the exported file via WhatsApp.'}
            </p>
          )}
          {!locked && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileRef.current?.click()}
              >
                ⬆️ {t('importB')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  try {
                    const res = await importBackup(file)
                    if (res) {
                      flash(
                        lang === 'hi'
                          ? `जुड़ गया ✓ ${res.addedEntries} एंट्री, ${res.addedProducts} प्रोडक्ट`
                          : `Merged ✓ ${res.addedEntries} entries, ${res.addedProducts} products`,
                      )
                    }
                  } catch (err) {
                    window.alert(`Import failed: ${err.message}`)
                  }
                }}
              />
              <button type="button" className="btn btn-danger-outline" onClick={() => resetAllData()}>
                🗑️ {t('resetAll')}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
