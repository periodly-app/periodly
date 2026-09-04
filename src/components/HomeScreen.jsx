import { useState, useEffect } from 'react'
import {
  savePeriodStart,
  savePeriodEnd,
  getLastEntry,
  calculateStats,
  getSettings,
  applyAutoEnd,
  toDateStr,
  daysBetween,
  formatDate,
} from '../lib/storage'
import {
  requestNotificationPermission,
  getNotificationPermission,
  checkAndShowReminders,
  getInAppReminder,
} from '../lib/notifications'
import { syncWithServer } from '../lib/push'

export default function HomeScreen() {
  const [lastEntry, setLastEntry] = useState(null)
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())
  const [inAppReminder, setInAppReminder] = useState(null)

  const today = toDateStr(new Date())

  useEffect(() => {
    applyAutoEnd().then(() => loadData())
    checkAndShowReminders()
    getInAppReminder().then(setInAppReminder)
  }, [])

  async function loadData() {
    setLoading(true)
    const [entry, s, sett] = await Promise.all([
      getLastEntry(),
      calculateStats(),
      getSettings(),
    ])
    setLastEntry(entry)
    setStats(s)
    setSettings(sett)
    setLoading(false)
    return { entry, s, sett }
  }

  async function handleRequestNotifications() {
    const result = await requestNotificationPermission()
    setNotifPermission(result)
    if (result === 'granted') {
      const [entry, s, sett] = await Promise.all([
        getLastEntry(), calculateStats(), getSettings()
      ])
      syncWithServer({ stats: s, lastEntry: entry, settings: sett })
    }
  }

  async function syncAfterLog() {
    if (getNotificationPermission() !== 'granted') return
    const [entry, s, sett] = await Promise.all([
      getLastEntry(), calculateStats(), getSettings()
    ])
    syncWithServer({ stats: s, lastEntry: entry, settings: sett })
  }

  function getCycleDay() {
    if (!lastEntry) return null
    return daysBetween(new Date(lastEntry.startDate), new Date(today)) + 1
  }

  function isPeriodActive() {
    return lastEntry && !lastEntry.endDate
  }

  function alreadyLoggedToday() {
    return lastEntry && lastEntry.startDate === today
  }

  function daysUntilNext() {
    if (!stats?.nextExpectedDate) return null
    return daysBetween(new Date(today), new Date(stats.nextExpectedDate))
  }

  function needsConfirm() {
    if (!stats?.nextExpectedDate || !settings) return false
    const diff = daysBetween(new Date(today), new Date(stats.nextExpectedDate))
    return diff > settings.confirmWindowEarly || diff < -settings.confirmWindowLate
  }

  async function handlePeriodStart() {
    if (alreadyLoggedToday()) {
      setFeedback({ type: 'info', text: "Already logged for today ✓" })
      setTimeout(() => setFeedback(null), 3000)
      return
    }

    if (needsConfirm()) {
      const diff = daysUntilNext()
      let msg = 'Log period start today?'
      if (diff !== null && diff > 0) {
        msg = `Period started? That would be ${diff} day${diff !== 1 ? 's' : ''} earlier than expected.`
      } else if (diff !== null && diff < 0) {
        msg = `Period started? That would be ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} later than expected.`
      }
      setConfirmMessage(msg)
      setShowConfirm(true)
      return
    }

    await doSavePeriodStart()
  }

  async function doSavePeriodStart() {
    setShowConfirm(false)
    await savePeriodStart()
    setFeedback({ type: 'success', text: "Period start logged ✓" })
    setTimeout(() => setFeedback(null), 3000)
    await loadData()
    syncAfterLog()
  }

  async function handlePeriodEnd() {
    if (!lastEntry || lastEntry.endDate) return
    await savePeriodEnd(lastEntry.id)
    setFeedback({ type: 'success', text: "Period end logged ✓" })
    setTimeout(() => setFeedback(null), 3000)
    await loadData()
    syncAfterLog()
  }

  const cycleDay = getCycleDay()
  const daysToNext = daysUntilNext()
  const periodActive = isPeriodActive()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-6 py-8 relative">

      {/* In-App Reminder Banner */}
      {inAppReminder && (
        <div className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 ${
          inAppReminder.type === 'end' ? 'bg-amber-50 border border-amber-100' : 'bg-rose-50 border border-rose-100'
        }`}>
          <span className="text-xl">{inAppReminder.type === 'end' ? '💭' : '🩸'}</span>
          <p className={`text-sm font-medium flex-1 ${
            inAppReminder.type === 'end' ? 'text-amber-600' : 'text-rose-500'
          }`}>
            {inAppReminder.message}
          </p>
        </div>
      )}

      {/* Notification Button — sichtbar bis Notifications aktiv */}
      {notifPermission !== 'granted' && (
        <button
          onClick={handleRequestNotifications}
          className="w-full bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-3 text-left active:bg-rose-100 transition-all"
        >
          <span className="text-xl">🔔</span>
          <div className="flex-1">
            <p className="text-rose-500 text-sm font-medium">
              {notifPermission === 'denied' ? 'Notifications blocked' : 'Enable reminders'}
            </p>
            <p className="text-stone-400 text-xs">
              {notifPermission === 'denied'
                ? 'Allow in iPhone Settings → CycleReminder'
                : 'Tap to get notified before your period'}
            </p>
          </div>
          <span className="text-rose-300 text-lg">›</span>
        </button>
      )}

      {/* Header */}
      <div className="w-full text-center">
        <p className="text-stone-400 text-sm font-medium tracking-wide uppercase">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="mt-4">
          {lastEntry ? (
            periodActive ? (
              <div>
                <p className="text-rose-400 text-sm font-medium">Period active</p>
                <p className="text-stone-700 text-2xl font-semibold mt-1">Day {cycleDay}</p>
              </div>
            ) : (
              <div>
                <p className="text-stone-500 text-sm font-medium">Cycle day</p>
                <p className="text-stone-700 text-2xl font-semibold mt-1">{cycleDay}</p>
              </div>
            )
          ) : (
            <p className="text-stone-400 text-base mt-2">No data yet — tap to start</p>
          )}
        </div>
      </div>

      {/* Haupt-Button */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handlePeriodStart}
          className={`
            w-52 h-52 rounded-full shadow-lg transition-all duration-200 active:scale-95
            flex flex-col items-center justify-center gap-2
            ${alreadyLoggedToday()
              ? 'bg-rose-100 border-2 border-rose-200'
              : 'bg-rose-300 hover:bg-rose-400 active:bg-rose-500'}
          `}
        >
          <span className="text-4xl">{alreadyLoggedToday() ? '✓' : '🩸'}</span>
          <span className={`text-base font-semibold ${alreadyLoggedToday() ? 'text-rose-400' : 'text-white'}`}>
            {alreadyLoggedToday() ? 'Logged today' : 'Period started'}
          </span>
        </button>

        {periodActive && !alreadyLoggedToday() && (
          <button
            onClick={handlePeriodEnd}
            className="px-6 py-2 rounded-full border border-stone-300 text-stone-500 text-sm font-medium hover:bg-stone-50 active:bg-stone-100 transition-all"
          >
            Period ended today
          </button>
        )}
      </div>

      {/* Nächste Periode Info */}
      <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
        {stats?.nextExpectedDate ? (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wide font-medium">Next period expected</p>
              <p className="text-stone-700 font-semibold text-base mt-1">
                {formatDate(stats.nextExpectedDate)}
              </p>
            </div>
            {daysToNext !== null && (
              <div className="text-right">
                <p className="text-stone-400 text-xs uppercase tracking-wide font-medium">In</p>
                <p className={`font-bold text-xl mt-1 ${daysToNext <= 3 ? 'text-rose-400' : 'text-stone-600'}`}>
                  {daysToNext > 0 ? `${daysToNext}d` : daysToNext === 0 ? 'Today' : `${Math.abs(daysToNext)}d late`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-stone-400 text-sm">
              {stats?.totalEntries >= 1
                ? 'Log one more cycle to see predictions'
                : 'Tap the button to start tracking'}
            </p>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`
          fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-lg text-sm font-medium
          ${feedback.type === 'success' ? 'bg-rose-400 text-white' : 'bg-stone-700 text-white'}
        `}>
          {feedback.text}
        </div>
      )}

      {/* Bestätigungs-Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-stone-700 text-base font-medium text-center leading-relaxed">
              {confirmMessage}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-500 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={doSavePeriodStart}
                className="flex-1 py-3 rounded-2xl bg-rose-400 text-white font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
