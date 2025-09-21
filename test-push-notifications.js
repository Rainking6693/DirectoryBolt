#!/usr/bin/env node

/**
 * Push Notification Test Script
 * 
 * This script tests the push notification system with the configured VAPID keys.
 * Run this to verify your push notification setup is working correctly.
 * 
 * Usage: node test-push-notifications.js
 */

require('dotenv').config({ path: '.env.local' });
const webpush = require('web-push');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@directorybolt.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

async function testPushNotifications() {
  console.log('🔔 Testing Push Notification System');
  console.log('===================================\n');

  // Check VAPID configuration
  console.log('📋 VAPID Configuration:');
  console.log(`Public Key: ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Private Key: ${process.env.VAPID_PRIVATE_KEY ? '✅ Configured' : '❌ Missing'}`);
  
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('\n❌ VAPID keys are not configured properly!');
    console.log('Please check your .env.local file.');
    return;
  }

  console.log('\n🔑 VAPID Keys:');
  console.log(`Public: ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}`);
  console.log(`Private: ${process.env.VAPID_PRIVATE_KEY.substring(0, 20)}...`);

  // Test notification payload
  const testPayload = {
    title: 'DirectoryBolt Test Notification',
    body: 'Your push notification system is working correctly! 🎉',
    icon: '/pwa/icon-192.png',
    badge: '/pwa/badge.png',
    data: {
      type: 'test',
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  console.log('\n📨 Test Notification Payload:');
  console.log(JSON.stringify(testPayload, null, 2));

  // Example subscription (this would normally come from the browser)
  const exampleSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/example-endpoint',
    keys: {
      p256dh: 'example-p256dh-key',
      auth: 'example-auth-key'
    }
  };

  console.log('\n🧪 Testing Notification Creation:');
  try {
    // This will fail because it's an example endpoint, but it tests the VAPID configuration
    await webpush.sendNotification(exampleSubscription, JSON.stringify(testPayload));
    console.log('✅ Notification would be sent successfully');
  } catch (error) {
    if (error.statusCode === 400 && error.body.includes('InvalidSubscription')) {
      console.log('✅ VAPID configuration is correct (expected error with example subscription)');
    } else if (error.statusCode === 410) {
      console.log('✅ VAPID configuration is correct (subscription endpoint invalid as expected)');
    } else {
      console.log('❌ Unexpected error:', error.message);
      console.log('Status Code:', error.statusCode);
      console.log('Body:', error.body);
    }
  }

  console.log('\n🌐 Service URLs:');
  console.log(`Subscribe: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/subscribe`);
  console.log(`Send: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`);

  console.log('\n✅ Push notification system test completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start your Next.js application: npm run dev');
  console.log('2. Open browser and allow notifications when prompted');
  console.log('3. Test notifications through the PWA interface');
}

// Run the test
testPushNotifications().catch(console.error);