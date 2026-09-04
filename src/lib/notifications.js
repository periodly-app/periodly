import { calculateStats, getLastEntry, toDateStr, daysBetween, getSettings } from './storage'

// Notification Permission anfragen
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Beim App-Öffnen: prüfen ob Reminder fällig
export async function checkAndShowReminders() {
  if (getNotificationPermission() !== 'granted') return

  const [stats, lastEntry, settings] = await Promise.all([
    calculateStats(),
    getLastEntry(),
    getSettings(),
  ])

  const today = toDateStr(new Date())
  const reminders = []

  // 1. Nächste Periode bald — Reminder X Tage vorher
  if (stats?.nextExpectedDate) {
    const daysUntil = daysBetween(new Date(today), new Date(stats.nextExpectedDate))
    if (daysUntil >= 0 && daysUntil <= settings.notificationDaysBefore) {
      reminders.push({
        title: 'Period expected soon',
        body: daysUntil === 0
          ? 'Your period is expected today. Has it started?'
          : `Your period is expected tomorrow. Heads up!`,
        tag: 'period-start-reminder',
      })
    }
    // Überfällig? Sanfter Reminder
    if (daysUntil < 0 && daysUntil >= -3 && lastEntry?.startDate !== today) {
      const late = Math.abs(daysUntil)
      reminders.push({
        title: 'Period check-in',
        body: `Your period was expected ${late} day${late !== 1 ? 's' : ''} ago. Has it started?`,
        tag: 'period-late-reminder',
      })
    }
  }

  // 2. Periode läuft — Ende-Reminder nach X Tagen
  if (lastEntry && !lastEntry.endDate) {
    const daysSinceStart = daysBetween(new Date(lastEntry.startDate), new Date(today))
    if (daysSinceStart >= settings.periodEndNotificationDay) {
      reminders.push({
        title: 'Has your period ended?',
        body: `You logged your period ${daysSinceStart} days ago. Has it ended?`,
        tag: 'period-end-reminder',
      })
    }
  }

  // Notifications anzeigen
  for (const r of reminders) {
    showNotification(r.title, r.body, r.tag)
  }

  return reminders
}

function showNotification(title, body, tag) {
  if (Notification.permission !== 'granted') return

  // Via Service Worker (wenn verfügbar) — sonst direkt
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        tag,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
      })
    })
  } else {
    new Notification(title, { body, tag })
  }
}

// Hilfsfunktion für In-App Reminder Banner (als Fallback)
export async function getInAppReminder() {
  const [stats, lastEntry, settings] = await Promise.all([
    calculateStats(),
    getLastEntry(),
    getSettings(),
  ])

  const today = toDateStr(new Date())

  // Periode Ende-Reminder
  if (lastEntry && !lastEntry.endDate) {
    const daysSinceStart = daysBetween(new Date(lastEntry.startDate), new Date(today))
    if (daysSinceStart >= settings.periodEndNotificationDay) {
      return {
        type: 'end',
        message: `Has your period ended? It started ${daysSinceStart} days ago.`,
        entryId: lastEntry.id,
      }
    }
  }

  // Nächste Periode bald
  if (stats?.nextExpectedDate) {
    const daysUntil = daysBetween(new Date(today), new Date(stats.nextExpectedDate))
    if (daysUntil >= 0 && daysUntil <= 2) {
      return {
        type: 'start',
        message: daysUntil === 0
          ? 'Your period is expected today.'
          : `Your period is expected in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
      }
    }
    if (daysUntil < 0 && daysUntil >= -3) {
      return {
        type: 'late',
        message: `Your period is ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} late.`,
      }
    }
  }

  return null
}
