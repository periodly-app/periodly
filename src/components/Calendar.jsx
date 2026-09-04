import { useState, useEffect } from 'react'
import { getAllEntries, toDateStr, formatDateShort } from '../lib/storage'

export default function Calendar() {
  const [entries, setEntries] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = toDateStr(new Date())

  useEffect(() => {
    getAllEntries().then(setEntries)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Alle Perioden-Tage berechnen
  const periodDays = new Set()
  const startDays = new Set()
  const endDays = new Set()

  for (const entry of entries) {
    startDays.add(entry.startDate)
    if (entry.endDate) endDays.add(entry.endDate)

    if (entry.endDate) {
      let d = new Date(entry.startDate + 'T00:00:00')
      const end = new Date(entry.endDate + 'T00:00:00')
      while (d <= end) {
        periodDays.add(toDateStr(d))
        d.setDate(d.getDate() + 1)
      }
    } else {
      // Aktive Periode ohne Ende — bis heute markieren
      let d = new Date(entry.startDate + 'T00:00:00')
      const end = new Date(today + 'T00:00:00')
      while (d <= end) {
        periodDays.add(toDateStr(d))
        d.setDate(d.getDate() + 1)
      }
    }
  }

  // Kalender-Grid aufbauen
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7 // Montag = 0

  const days = []
  // Leere Zellen vor dem 1.
  for (let i = 0; i < startWeekday; i++) days.push(null)
  // Tage des Monats
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)

  function dateStr(day) {
    if (!day) return null
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  return (
    <div className="flex flex-col h-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500">
          ‹
        </button>
        <h2 className="text-stone-700 font-semibold text-base">{monthName}</h2>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500">
          ›
        </button>
      </div>

      {/* Wochentage */}
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map(wd => (
          <div key={wd} className="text-center text-stone-400 text-xs font-medium py-1">{wd}</div>
        ))}
      </div>

      {/* Tage */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, idx) => {
          const ds = dateStr(day)
          const isPeriod = ds && periodDays.has(ds)
          const isStart = ds && startDays.has(ds)
          const isEnd = ds && endDays.has(ds)
          const isToday = ds === today

          return (
            <div key={idx} className="flex items-center justify-center py-1">
              {day ? (
                <div className={`
                  w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${isStart ? 'bg-rose-400 text-white ring-2 ring-rose-300' :
                    isEnd ? 'bg-rose-300 text-white' :
                    isPeriod ? 'bg-rose-100 text-rose-500' :
                    isToday ? 'ring-2 ring-stone-300 text-stone-700' :
                    'text-stone-600'}
                `}>
                  {day}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Legende */}
      <div className="mt-6 flex gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <span className="text-stone-400 text-xs">Start</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-100" />
          <span className="text-stone-400 text-xs">Period</span>
        </div>
      </div>

      {/* Letzte Einträge */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-stone-500 text-xs uppercase tracking-wide font-medium mb-3 px-1">History</h3>
          <div className="space-y-2">
            {entries.slice(0, 5).map(e => (
              <div key={e.id} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center shadow-sm border border-rose-50">
                <div>
                  <p className="text-stone-700 text-sm font-medium">{formatDateShort(e.startDate)}</p>
                  {e.endDate && (
                    <p className="text-stone-400 text-xs">ended {formatDateShort(e.endDate)}</p>
                  )}
                </div>
                {e.endDate ? (
                  <span className="text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded-full">
                    {Math.round((new Date(e.endDate) - new Date(e.startDate)) / 86400000)} days
                  </span>
                ) : (
                  <span className="text-xs text-rose-400 bg-rose-50 px-2 py-1 rounded-full">active</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
