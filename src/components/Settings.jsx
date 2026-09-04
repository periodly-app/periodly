import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../lib/storage'
import { requestNotificationPermission, getNotificationPermission } from '../lib/notifications'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  async function handleChange(key, value) {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await saveSettings(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleRequestNotifications() {
    const result = await requestNotificationPermission()
    setNotifPermission(result)
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-4 py-6 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-stone-700 font-semibold text-lg">Settings</h2>
        {saved && (
          <span className="text-rose-400 text-sm font-medium">Saved ✓</span>
        )}
      </div>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-rose-50">
          <SettingRow
            label="Reminders"
            description={
              notifPermission === 'granted' ? 'Enabled' :
              notifPermission === 'denied' ? 'Blocked — allow in iPhone Settings' :
              'Tap to enable'
            }
            last={false}
          >
            {notifPermission === 'granted' ? (
              <span className="text-rose-400 text-sm font-medium">On ✓</span>
            ) : (
              <button
                onClick={handleRequestNotifications}
                className="px-3 py-1.5 bg-rose-400 text-white text-xs font-medium rounded-full"
              >
                Enable
              </button>
            )}
          </SettingRow>

          <StepperRow
            label="Days before period"
            description="Notify X days before expected start"
            value={settings.notificationDaysBefore}
            min={0}
            max={5}
            onChange={v => handleChange('notificationDaysBefore', v)}
            last={false}
          />

          <StepperRow
            label="Period end check"
            description="Ask 'Has it ended?' after X days"
            value={settings.periodEndNotificationDay}
            min={3}
            max={10}
            onChange={v => handleChange('periodEndNotificationDay', v)}
            last={false}
          />

          <StepperRow
            label="Auto-end after"
            description="Auto-mark period as ended after X days"
            value={settings.autoEndDay}
            min={5}
            max={14}
            onChange={v => handleChange('autoEndDay', v)}
            last={true}
          />
        </div>
      </Section>

      {/* Zyklus */}
      <Section title="Cycle">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-rose-50">
          <StepperRow
            label="Default cycle length"
            description="Used until enough data is collected"
            value={settings.cycleLength}
            min={21}
            max={40}
            onChange={v => handleChange('cycleLength', v)}
            last={false}
          />

          <StepperRow
            label="Early confirmation window"
            description="Ask to confirm if period starts X days early"
            value={settings.confirmWindowEarly}
            min={1}
            max={10}
            onChange={v => handleChange('confirmWindowEarly', v)}
            last={false}
          />

          <StepperRow
            label="Late confirmation window"
            description="Ask to confirm if period starts X days late"
            value={settings.confirmWindowLate}
            min={1}
            max={10}
            onChange={v => handleChange('confirmWindowLate', v)}
            last={true}
          />
        </div>
      </Section>

      {/* App Info */}
      <Section title="About">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-rose-50">
          <SettingRow label="Version" last={false}>
            <span className="text-stone-400 text-sm">0.1.0</span>
          </SettingRow>
          <SettingRow label="Data storage" last={true}>
            <span className="text-stone-400 text-sm">On this device</span>
          </SettingRow>
        </div>
      </Section>

    </div>
  )
}

// --- Hilfskomponenten ---

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <p className="text-stone-400 text-xs uppercase tracking-wide font-medium mb-2 px-1">{title}</p>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children, last }) {
  return (
    <div className={`px-4 py-3.5 flex items-center justify-between gap-4 ${!last ? 'border-b border-stone-50' : ''}`}>
      <div className="flex-1">
        <p className="text-stone-700 text-sm font-medium">{label}</p>
        {description && <p className="text-stone-400 text-xs mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function StepperRow({ label, description, value, min, max, onChange, last }) {
  return (
    <div className={`px-4 py-3.5 flex items-center justify-between gap-4 ${!last ? 'border-b border-stone-50' : ''}`}>
      <div className="flex-1">
        <p className="text-stone-700 text-sm font-medium">{label}</p>
        {description && <p className="text-stone-400 text-xs mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => value > min && onChange(value - 1)}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-lg font-medium transition-all
            ${value <= min ? 'text-stone-200' : 'text-stone-500 active:bg-stone-100'}`}
          disabled={value <= min}
        >
          −
        </button>
        <span className="text-stone-700 font-semibold text-base w-6 text-center">{value}</span>
        <button
          onClick={() => value < max && onChange(value + 1)}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-lg font-medium transition-all
            ${value >= max ? 'text-stone-200' : 'text-rose-400 active:bg-rose-50'}`}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  )
}
