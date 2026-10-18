import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Icon from './components/Icon.jsx'
import Calculator from './components/Calculator.jsx'
import Register from './components/Register.jsx'
import Products from './components/Products.jsx'
import SettingsTab from './components/SettingsTab.jsx'
import { db, setSetting } from './db.js'
import { makeT } from './i18n.js'

export default function App() {
  const [view, setView] = useState('calc')
  const lang = useLiveQuery(() => db.settings.get('lang').then((r) => r?.value), [], 'hi')
  const t = makeT(lang)

  useEffect(() => {
    document.documentElement.lang = lang || 'hi'
  }, [lang])

  const toggleLang = () => setSetting('lang', lang === 'hi' ? 'en' : 'hi')

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark">🥛</span>
          <div>
            <h1>{lang === 'hi' ? 'डायरी कैलकुलेटर' : 'Dairy Calculator'}</h1>
            <p className="brand-sub">{t('tagline')}</p>
          </div>
        </div>
        <div className="top-actions">
          <button type="button" className="lang-chip" onClick={toggleLang} aria-label="Language">
            {t('langToggle')}
          </button>
          <button
            type="button"
            className={`icon-btn ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView(view === 'settings' ? 'calc' : 'settings')}
            aria-label={t('settings')}
          >
            <Icon name="gear" size={20} />
          </button>
        </div>
      </header>

      <main>
        {view === 'calc' && <Calculator lang={lang} />}
        {view === 'register' && <Register lang={lang} />}
        {view === 'products' && <Products lang={lang} />}
        {view === 'settings' && <SettingsTab lang={lang} onClose={() => setView('calc')} />}
      </main>

      <nav className="bottom-nav">
        {[
          ['calc', 'calc', t('calc')],
          ['register', 'book', t('register')],
          ['products', 'box', t('products')],
        ].map(([key, icon, label]) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'active' : ''}
            onClick={() => setView(key)}
          >
            <Icon name={icon} size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
