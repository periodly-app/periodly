import { getStore } from '@netlify/blobs'

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await request.json()
    const { subscription, nextExpectedDate, activePeriodStart, settings } = body

    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ error: 'Invalid subscription' }), { status: 400 })
    }

    const store = getStore({ name: 'notifications', consistency: 'strong' })
    await store.set('user', JSON.stringify({
      subscription,
      nextExpectedDate: nextExpectedDate || null,
      activePeriodStart: activePeriodStart || null,
      settings: {
        notificationDaysBefore: settings?.notificationDaysBefore ?? 1,
        periodEndNotificationDay: settings?.periodEndNotificationDay ?? 5,
      },
      updatedAt: new Date().toISOString(),
    }))

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export const config = {
  path: '/api/subscribe',
}
