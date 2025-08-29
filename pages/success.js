import { useRouter } from 'next/router'
import SuccessPage from '../components/checkout/SuccessPage'

export default function Success() {
  const router = useRouter()
  const { session_id, type, customer_id, subscription_cancelled } = router.query

  // Show subscription cancellation notice if they cancelled the subscription upsell
  if (subscription_cancelled === 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-warning-500 rounded-full flex items-center justify-center">
            <div className="text-3xl">⚠️</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Subscription Setup Cancelled</h1>
          <p className="text-lg text-secondary-300 mb-8">
            No worries! Your directory submission purchase is still complete. 
            You can always add the Auto Update service later from your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push(`/success?session_id=${session_id}&type=package`)}
              className="px-8 py-3 bg-volt-500 hover:bg-volt-400 text-secondary-900 font-bold rounded-xl transition-all duration-300"
            >
              View Order Summary
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 border border-secondary-600 text-secondary-300 font-medium rounded-xl hover:bg-secondary-700 hover:border-secondary-500 transition-all duration-300"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SuccessPage 
      sessionId={session_id as string}
      type={type as string}
      customerId={customer_id as string}
    />
  )
}