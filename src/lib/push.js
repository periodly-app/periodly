const VAPID_PUBLIC_KEY = 'BFsSLyUtZPfUOrZEPdl-AvGRmen6nnAxJQ3WGJBYXerukin974OnXAc-ZjJkj8tL0AHCHjccFxO63I8-WnkvBrk'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Push Subscription erstellen oder vorhandene zurückgeben
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push nicht unterstützt')
    return null
  }

  try {
    const reg = await navigator.serviceWorker.ready
    let subscription = await reg.pushManager.getSubscription()

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

// Subscription + Schedule an Server senden
export async function syncWithServer({ stats, lastEntry, settings }) {
  const subscription = await subscribeToPush()
  if (!subscription) return false

  try {
    const payload = {
      subscription: subscription.toJSON(),
      nextExpectedDate: stats?.nextExpectedDate || null,
      activePeriodStart: lastEntry && !lastEntry.endDate ? lastEntry.startDate : null,
      settings: {
        notificationDaysBefore: settings?.notificationDaysBefore ?? 1,
        periodEndNotificationDay: settings?.periodEndNotificationDay ?? 5,
      },
    }

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return res.ok
  } catch (error) {
    console.error('Sync with server failed:', error)
    return false
  }
}
