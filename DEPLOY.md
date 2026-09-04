# CycleReminder — Deploy-Anleitung

## Was heute Nacht fertig gebaut wurde
- ✅ Echter Web Push (Notifications kommen auch wenn App geschlossen ist)
- ✅ Netlify Function: `subscribe` — speichert Push-Token + Zyklus-Daten
- ✅ Netlify Function: `notify` — läuft täglich 10:00 Uhr und sendet Push
- ✅ Service Worker empfängt Push und zeigt Notification
- ✅ App synct automatisch nach jedem Period-Log mit dem Server
- ✅ Alle Code-Warnungen behoben

---

## Morgen deployen — 4 Schritte

### Schritt 1 — Terminal Tab 2 öffnen, in Projektordner wechseln
```
cd "/Users/Paul/Documents/Claude/Projects/App Periode/cycle-reminder"
```

### Schritt 2 — Neue Pakete installieren
```
npm install
```

### Schritt 3 — Build erstellen
```
npm run build
```

### Schritt 4 — dist-Ordner im Finder öffnen
```
open "/Users/Paul/Documents/Claude/Projects/App Periode/cycle-reminder/dist"
```

### Schritt 5 — Netlify Redeploy
- app.netlify.com → Projekt `periodlytracking`
- `dist`-Ordner auf "Drag and drop your project folder here" ziehen
- Warten bis deployed

---

## Nach dem Deploy testen

1. iPhone → Safari → https://periodlytracking.netlify.app
2. Alten Homescreen-Icon löschen (langes Drücken → entfernen)
3. Teilen → "Zum Home-Bildschirm" → neue Version hinzufügen
4. App öffnen → 🔔 "Enable reminders" tippen → Erlauben
5. "Period started" tippen
6. App schließen
7. Warten auf Notification (kommt täglich 10:00 Uhr)

---

## Notification-Zeitplan (täglich 10:00 Uhr)
Die App sendet Notifications wenn:
- Periode in X Tagen erwartet (konfigurierbar in Settings)
- Periode am erwarteten Tag
- Periode 1–3 Tage überfällig
- Periode läuft seit 5+ Tagen (Ende-Reminder)

---

## Netlify URL
https://periodlytracking.netlify.app
