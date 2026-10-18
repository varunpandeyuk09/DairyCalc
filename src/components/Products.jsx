import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db.js'
import { makeT, productName } from '../i18n.js'
import { EMOJI_CHOICES, guessEmoji } from '../utils/format.js'

export default function Products({ lang, locked }) {
  const t = makeT(lang)
  const products = useLiveQuery(() => db.products.orderBy('id').toArray(), []) || []

  const [nameHi, setNameHi] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [rate, setRate] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')
  const [editId, setEditId] = useState(null)
  const [editRate, setEditRate] = useState('')

  const add = async () => {
    const hi = nameHi.trim()
    const en = nameEn.trim()
    const r = Number(rate)
    if (!hi && !en) return setError(lang === 'hi' ? 'नाम डालें' : 'Enter a name')
    if (!r || r <= 0) return setError(lang === 'hi' ? 'सही रेट डालें' : 'Enter a valid rate')
    await db.products.add({
      nameHi: hi || en,
      nameEn: en || hi,
      emoji: emoji || guessEmoji(hi || en),
      rate: r,
    })
    setNameHi('')
    setNameEn('')
    setRate('')
    setEmoji('')
    setError('')
  }

  const saveRate = async (p) => {
    const r = Number(editRate)
    if (r > 0) await db.products.update(p.id, { rate: r })
    setEditId(null)
  }

  const remove = async (p) => {
    if (!window.confirm(t('deleteProductConfirm'))) return
    await db.products.delete(p.id)
  }

  return (
    <div className="products">
      {locked && <p className="hint">{t('readOnlyNotice')}</p>}
      {!locked && (
        <section className="card">
          <h3 className="card-title">{t('addProductTitle')}</h3>
          <label className="field-label">{t('nameHi')}</label>
          <input
            className="input"
            placeholder="जैसे दूध"
            value={nameHi}
            onChange={(e) => {
              setNameHi(e.target.value)
              setError('')
            }}
          />
          <label className="field-label">{t('nameEn')}</label>
          <input
            className="input"
            placeholder="e.g. Milk"
            value={nameEn}
            onChange={(e) => {
              setNameEn(e.target.value)
              setError('')
            }}
          />
          <label className="field-label">{t('rateLabel')}</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            placeholder="60"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value.replace(/[^0-9.]/g, ''))
              setError('')
            }}
          />
          <label className="field-label">{t('emoji')}</label>
          <div className="emoji-row">
            {EMOJI_CHOICES.map((em) => (
              <button
                key={em}
                type="button"
                className={`emoji-chip ${emoji === em ? 'active' : ''}`}
                onClick={() => setEmoji(em)}
              >
                {em}
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <button type="button" className="btn btn-primary full" onClick={add}>
            {t('add')}
          </button>
        </section>
      )}

      <section className="card">
        {products.map((p) => (
          <div className="product-row" key={p.id}>
            <span className="entry-emoji">{p.emoji}</span>
            <div className="entry-main">
              <span className="entry-name">{productName(p, lang)}</span>
              {editId === p.id ? (
                <div className="inline-form">
                  <input
                    className="input small"
                    inputMode="decimal"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value.replace(/[^0-9.]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && saveRate(p)}
                    autoFocus
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => saveRate(p)}>
                    {t('save')}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <span className="entry-sub">
                  ₹{p.rate}
                  {t('perKilo')}
                </span>
              )}
            </div>
            {!locked && editId !== p.id && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setEditId(p.id)
                    setEditRate(String(p.rate))
                  }}
                >
                  {t('edit')}
                </button>
                <button type="button" className="icon-btn danger" onClick={() => remove(p)} aria-label={t('delete')}>
                  ×
                </button>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
