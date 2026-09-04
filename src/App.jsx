import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import Calendar from './components/Calendar'
import Stats from './components/Stats'
import Settings from './components/Settings'

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'stats', label: 'Stats', icon: StatsIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="flex flex-col h-screen bg-nude-50 max-w-md mx-auto">

      {/* App Title Bar */}
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-stone-700 font-semibold text-xl tracking-tight">Periodly</h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'stats' && <Stats />}
        {activeTab === 'settings' && <Settings />}
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-stone-100 px-4 py-2 flex justify-around items-center shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-all ${
              activeTab === id ? 'text-rose-400' : 'text-stone-400'
            }`}
          >
            <Icon active={activeTab === id} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// --- Icons ---

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#fb7185' : 'none'}
      stroke={active ? '#fb7185' : '#a8a29e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function CalendarIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fb7185' : '#a8a29e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function StatsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fb7185' : '#a8a29e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fb7185' : '#a8a29e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
