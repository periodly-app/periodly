import { useState, useEffect } from 'react'
import { calculateStats, getAllEntries, exportData, formatDate } from '../lib/storage'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [s, e] = await Promise.all([calculateStats(), getAllEntries()])
    setStats(s)
    setEntries(e)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
        <span className="text-5xl">📊</span>
        <p className="text-stone-600 font-medium">No data yet</p>
        <p className="text-stone-400 text-sm">Statistics appear after your first logged period.</p>
      </div>
    )
  }

  const StatCard = ({ label, value, unit, note }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
      <p className="text-stone-400 text-xs uppercase tracking-wide font-medium">{label}</p>
      <div className="flex items-baseline gap-1 mt-2">
        <p className="text-stone-700 text-3xl font-bold">{value ?? '—'}</p>
        {unit && <p className="text-stone-400 text-sm">{unit}</p>}
      </div>
      {note && <p className="text-stone-400 text-xs mt-1">{note}</p>}
    </div>
  )

  return (
    <div className="flex flex-col h-full px-4 py-6 overflow-y-auto">
      <h2 className="text-stone-700 font-semibold text-lg mb-5 px-1">Statistics</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Avg cycle"
          value={stats.avgCycleLength}
          unit="days"
          note={stats.cycleLengths.length < 1 ? 'Need 2+ entries' : `Based on ${stats.cycleLengths.length} cycle${stats.cycleLengths.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Avg duration"
          value={stats.avgPeriodDuration}
          unit="days"
          note="Period length"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-50">
          <p className="text-stone-400 text-xs uppercase tracking-wide font-medium">Next expected</p>
          <p className="text-stone-700 text-xl font-semibold mt-2">
            {stats.nextExpectedDate ? formatDate(stats.nextExpectedDate) : '—'}
          </p>
          {!stats.nextExpectedDate && (
            <p className="text-stone-400 text-xs mt-1">Log 2+ periods for predictions</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Total logged"
          value={stats.totalEntries}
          unit="periods"
        />
        <StatCard
          label="Last start"
          value={stats.lastStartDate ? formatDate(stats.lastStartDate) : '—'}
        />
      </div>

      {/* Export */}
      <div className="mt-auto">
        <button
          onClick={exportData}
          className="w-full py-3 rounded-2xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 active:bg-stone-100 transition-all flex items-center justify-center gap-2"
        >
          <span>↑</span>
          Export data as JSON
        </button>
        <p className="text-stone-300 text-xs text-center mt-2">Backup your data to Files</p>
      </div>
    </div>
  )
}
