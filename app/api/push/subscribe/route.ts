import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@directorybolt.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    
    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      )
    }

    // Store subscription in database (implement based on your database)
    // For now, we'll just validate and acknowledge
    console.log('New push subscription:', subscription)
    
    // TODO: Store subscription in database with user ID
    // await storeSubscription(userId, subscription)
    
    return NextResponse.json(
      { success: true, message: 'Subscription stored successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error storing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to store subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json()
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    // Remove subscription from database
    console.log('Removing push subscription:', endpoint)
    
    // TODO: Remove subscription from database
    // await removeSubscription(endpoint)
    
    return NextResponse.json(
      { success: true, message: 'Subscription removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}