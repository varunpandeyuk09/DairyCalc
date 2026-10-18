import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Icon from './Icon.jsx'
import { db } from '../db.js'
import { makeT, productName } from '../i18n.js'
import {
  fmtGrams,
  fmtRupees,
  formatDateLabel,
  formatMonthLabel,
  monthKey,
  shiftDate,
  todayISO,
} from '../utils/format.js'

export default function Register({ lang }) {
  const t = makeT(lang)
  const [date, setDate] = useState(todayISO())

  const entries =
    useLiveQuery(() => db.entries.where('date').equals(date).sortBy('createdAt'), [date]) || []
  const monthEntries =
    useLiveQuery(
      () => db.entries.filter((e) => e.date.startsWith(monthKey(date))).toArray(),
      [date],
    ) || []

  const dayTotal = entries.reduce((s, e) => s + (Number(e.rupees) || 0), 0)
  const monthTotal = monthEntries.reduce((s, e) => s + (Number(e.rupees) || 0), 0)

  const grouped = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      const key = `${e.nameHi}|${e.nameEn}|${e.rate}`
      const cur = map.get(key) || {
        emoji: e.emoji,
        nameHi: e.nameHi,
        nameEn: e.nameEn,
        rate: e.rate,
        grams: 0,
        rupees: 0,
      }
      cur.grams += Number(e.grams) || 0
      cur.rupees += Number(e.rupees) || 0
      map.set(key, cur)
    }
    return [...map.values()]
  }, [entries])

  const remove = async (id) => {
    if (!window.confirm(t('deleteEntryConfirm'))) return
    await db.entries.delete(id)
  }

  return (
    <div className="register">
      <div className="stat-row">
        <div className="stat-card">
          <span className="label">{t('monthTotal')}</span>
          <span className="stat-value">₹{fmtRupees(monthTotal)}</span>
          <span className="stat-sub">{formatMonthLabel(monthKey(date), lang)}</span>
        </div>
        <div className="stat-card">
          <span className="label">{t('dayTotal')}</span>
          <span className="stat-value accent">₹{fmtRupees(dayTotal)}</span>
          <span className="stat-sub">{entries.length} entries</span>
        </div>
      </div>

      <div className="date-nav">
        <button type="button" className="icon-btn" onClick={() => setDate((d) => shiftDate(d, -1))} aria-label="Previous day">
          <Icon name="left" size={18} />
        </button>
        <div className="date-label">
          {date === todayISO() && <span className="today-badge">{t('today')}</span>}
          <strong>{formatDateLabel(date, lang)}</strong>
        </div>
        <button
          type="button"
          className="icon-btn"
          disabled={date >= todayISO()}
          onClick={() => setDate((d) => shiftDate(d, 1))}
          aria-label="Next day"
        >
          <Icon name="right" size={18} />
        </button>
      </div>

      {grouped.length > 0 && (
        <div className="group-list">
          {grouped.map((g) => (
            <div className="group-row" key={`${g.nameHi}-${g.rate}`}>
              <span>
                {g.emoji} {productName(g, lang)} · ₹{g.rate}
              </span>
              <span className="group-nums">
                {fmtGrams(g.grams)}g · ₹{fmtRupees(g.rupees)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="entry-list">
        {entries.length === 0 && <p className="hint center">{t('noEntries')}</p>}
        {entries.map((e) => (
          <div className="entry-row" key={e.id}>
            <span className="entry-emoji">{e.emoji}</span>
            <div className="entry-main">
              <span className="entry-name">
                {productName(e, lang)} · ₹{e.rate}
              </span>
              <span className="entry-sub">
                {fmtGrams(e.grams)}g = ₹{fmtRupees(e.rupees)}
              </span>
            </div>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => remove(e.id)}
              aria-label={t('delete')}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
