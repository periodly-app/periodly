import { getStore } from '@netlify/blobs'
import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:${process.env.CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24))
}

export default async () => {
  const store = getStore({ name: 'notifications', consistency: 'strong' })
  const raw = await store.get('user')

  if (!raw) {
    console.log('No subscription found')
    return new Response('No subscription', { status: 200 })
  }

  const data = JSON.parse(raw)
  const { subscription, nextExpectedDate, activePeriodStart, settings } = data

  const today = new Date().toISOString().split('T')[0]
  let notification = null

  // 1. Periode bald / überfällig
  if (nextExpectedDate) {
    const daysUntil = daysBetween(today, nextExpectedDate)

    if (daysUntil === settings.notificationDaysBefore) {
      notification = {
        title: 'Period expected soon 🩸',
        body: daysUntil === 0
          ? 'Your period is expected today. Has it started?'
          : `Your period is expected in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
      }
    } else if (daysUntil < 0 && daysUntil >= -3) {
      notification = {
        title: 'Period check-in',
        body: `Your period was expected ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago. Has it started?`,
      }
    }
  }

  // 2. Periode Ende-Reminder
  if (!notification && activePeriodStart) {
    const daysSinceStart = daysBetween(activePeriodStart, today)
    if (daysSinceStart >= settings.periodEndNotificationDay) {
      notification = {
        title: 'Has your period ended?',
        body: `You logged your period ${daysSinceStart} days ago. Has it ended?`,
      }
    }
  }

  if (notification) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: notification.title,
          body: notification.body,
          url: '/',
        })
      )
      console.log('Notification sent:', notification.title)
    } catch (error) {
      console.error('Push failed:', error)
      // Subscription ungültig — löschen
      if (error.statusCode === 410) {
        await store.delete('user')
      }
    }
  } else {
    console.log('No notification due today')
  }

  return new Response('OK', { status: 200 })
}

export const config = {
  schedule: '0 8 * * *', // Täglich 8:00 Uhr UTC (= 10:00 Uhr Sommerzeit)
}
