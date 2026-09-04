import { openDB } from 'idb'

const DB_NAME = 'cycle-reminder-db'
const DB_VERSION = 1
const STORE_ENTRIES = 'entries'
const STORE_SETTINGS = 'settings'

// Datenbank öffnen / initialisieren
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const store = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id', autoIncrement: true })
        store.createIndex('startDate', 'startDate', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS)
      }
    },
  })
}

// --- Einträge ---

export async function savePeriodStart(date = new Date()) {
  const db = await getDB()
  const dateStr = toDateStr(date)
  const entry = {
    startDate: dateStr,
    endDate: null,
    createdAt: new Date().toISOString(),
  }
  const id = await db.add(STORE_ENTRIES, entry)
  return { id, ...entry }
}

export async function savePeriodEnd(id, date = new Date()) {
  const db = await getDB()
  const entry = await db.get(STORE_ENTRIES, id)
  if (!entry) throw new Error('Entry not found')
  entry.endDate = toDateStr(date)
  await db.put(STORE_ENTRIES, entry)
  return entry
}

export async function getAllEntries() {
  const db = await getDB()
  const all = await db.getAll(STORE_ENTRIES)
  return all.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
}

export async function getLastEntry() {
  const entries = await getAllEntries()
  return entries[0] || null
}

export async function deleteEntry(id) {
  const db = await getDB()
  await db.delete(STORE_ENTRIES, id)
}

// --- Statistik ---

export async function calculateStats() {
  const entries = await getAllEntries()
  if (entries.length === 0) return null

  // Zykluslängen berechnen (mind. 2 Einträge nötig)
  let cycleLengths = []
  const sorted = [...entries].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(new Date(sorted[i - 1].startDate), new Date(sorted[i].startDate))
    if (diff > 10 && diff < 60) cycleLengths.push(diff) // Plausibilitätscheck
  }

  // Periodendauer berechnen
  let durations = []
  for (const e of sorted) {
    if (e.endDate) {
      const d = daysBetween(new Date(e.startDate), new Date(e.endDate))
      if (d > 0 && d < 15) durations.push(d)
    }
  }

  const avgCycle = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null

  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null

  const lastStart = sorted[sorted.length - 1]?.startDate
  const nextExpected = avgCycle && lastStart
    ? addDays(new Date(lastStart), avgCycle)
    : null

  return {
    totalEntries: entries.length,
    avgCycleLength: avgCycle,
    avgPeriodDuration: avgDuration,
    lastStartDate: lastStart || null,
    nextExpectedDate: nextExpected ? toDateStr(nextExpected) : null,
    cycleLengths,
  }
}

// --- Settings ---

export async function getSettings() {
  const db = await getDB()
  const settings = await db.get(STORE_SETTINGS, 'main')
  return settings || defaultSettings()
}

export async function saveSettings(settings) {
  const db = await getDB()
  await db.put(STORE_SETTINGS, settings, 'main')
}

export function defaultSettings() {
  return {
    cycleLength: 28,
    confirmWindowEarly: 5,
    confirmWindowLate: 3,
    notificationDaysBefore: 1,
    periodEndNotificationDay: 5,
    autoEndDay: 7,
  }
}

// --- Auto-Ende Logik ---

export async function applyAutoEnd() {
  const [lastEntry, settings] = await Promise.all([getLastEntry(), getSettings()])
  if (!lastEntry || lastEntry.endDate) return null // Nichts zu tun

  const today = toDateStr(new Date())
  const daysSinceStart = daysBetween(new Date(lastEntry.startDate), new Date(today))

  if (daysSinceStart >= settings.autoEndDay) {
    // Automatisch beenden — Ende = Start + autoEndDay
    const autoEndDate = addDays(new Date(lastEntry.startDate), settings.autoEndDay)
    await savePeriodEnd(lastEntry.id, autoEndDate)
    return { entry: lastEntry, autoEndDate: toDateStr(autoEndDate) }
  }

  return null
}

// --- Export / Import ---

export async function exportData() {
  const entries = await getAllEntries()
  const settings = await getSettings()
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    settings,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cycle-reminder-backup-${toDateStr(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// --- Hilfsfunktionen ---

export function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

export function daysBetween(a, b) {
  const ms = b - a
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
