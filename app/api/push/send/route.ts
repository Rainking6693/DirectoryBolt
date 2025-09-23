import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure web-push only when keys are available to avoid build-time failures
let vapidConfigured = false
function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails('mailto:support@directorybolt.com', publicKey, privateKey)
      vapidConfigured = true
      return true
    } catch (_) {
      return false
    }
  }
  return false
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  tag?: string
}

export async function POST(request: NextRequest) {
  try {
    // Guard: if VAPID keys are not configured, return a clear error instead of crashing build/runtime
    if (!ensureVapidConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications not configured: missing VAPID keys' },
        { status: 503 }
      )
    }
    const { userId, payload, subscriptions } = await request.json()
    
    // Validate required fields
    if (!payload?.title || !payload?.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Get user subscriptions from database or use provided ones
    let userSubscriptions = subscriptions
    if (!userSubscriptions && userId) {
      // TODO: Fetch subscriptions from database
      // userSubscriptions = await getUserSubscriptions(userId)
      console.log('Fetching subscriptions for user:', userId)
      userSubscriptions = [] // Placeholder
    }

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found for user' },
        { status: 404 }
      )
    }

    // Prepare notification payload
    const notificationPayload: NotificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/pwa/icon-192.png',
      badge: payload.badge || '/pwa/badge.png',
      data: payload.data || {},
      requireInteraction: payload.requireInteraction || false,
      tag: payload.tag
    }

    // Add actions if provided
    if (payload.actions && Array.isArray(payload.actions)) {
      notificationPayload.actions = payload.actions
    }

    // Send notifications to all user subscriptions
    const sendPromises = userSubscriptions.map(async (subscription: any) => {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        )
        
        return { success: true, endpoint: subscription.endpoint }
      } catch (error: any) {
        console.error('Failed to send notification to:', subscription.endpoint, error)
        
        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          // TODO: Remove expired subscription from database
          // await removeExpiredSubscription(subscription.endpoint)
          console.log('Removed expired subscription:', subscription.endpoint)
        }
        
        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Notifications sent: ${successful} successful, ${failed} failed`,
      results,
      stats: {
        total: results.length,
        successful,
        failed
      }
    })
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

// Send notification to specific user
export async function PUT(request: NextRequest) {
  try {
    // Guard: ensure VAPID is configured before attempting to send
    if (!ensureVapidConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications not configured: missing VAPID keys' },
        { status: 503 }
      )
    }
    const { userId, type, data } = await request.json()
    
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and notification type are required' },
        { status: 400 }
      )
    }

    // Generate notification payload based on type
    let payload: NotificationPayload
    
    switch (type) {
      case 'directory_update':
        payload = {
          title: 'Directory Update',
          body: `Your submission to ${data.directoryName} has been ${data.status}`,
          data: { type: 'directory_update', ...data },
          actions: [
            { action: 'view_directory', title: 'View Directory' },
            { action: 'view_dashboard', title: 'Open Dashboard' }
          ],
          requireInteraction: true
        }
        break
        
      case 'analytics_report':
        payload = {
          title: 'Analytics Update',
          body: data.message || 'Your analytics report is ready',
          data: { type: 'analytics', ...data },
          actions: [
            { action: 'view_analytics', title: 'View Analytics' },
            { action: 'share', title: 'Share Progress' }
          ]
        }
        break
        
      case 'engagement':
        payload = {
          title: 'DirectoryBolt Update',
          body: data.message,
          data: { type: 'engagement', ...data },
          actions: data.actionUrl ? [
            { action: 'take_action', title: 'Take Action' },
            { action: 'dismiss', title: 'Dismiss' }
          ] : [
            { action: 'dismiss', title: 'Dismiss' }
          ]
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Send notification using POST method
    const response = await fetch(
      new URL('/api/push/send', request.url),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, payload })
      }
    )

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error('Error sending user notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}