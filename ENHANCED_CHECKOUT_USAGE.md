# Enhanced Checkout System Usage Guide

This guide explains how to use the new enhanced checkout system with add-on support and improved error handling.

## 🎯 Overview

The enhanced checkout system includes:
- **EnhancedCheckout.tsx**: Full checkout flow with plan and add-on selection
- **Updated CheckoutButton.jsx**: Improved with add-on support and error handling
- **Enhanced Success Page**: Displays order summary with selected items
- **API Integration**: Works with create-checkout-session-v3.js endpoint

## 🚀 Quick Start

### Using the EnhancedCheckout Component

```tsx
import EnhancedCheckout from '@/components/checkout/EnhancedCheckout'

// Define your plans
const plans = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    directories: 50,
    description: 'Perfect for small businesses',
    features: ['50 directory submissions', 'Email support']
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 89,
    directories: 100,
    description: 'Most popular choice',
    features: ['100 directory submissions', 'Priority support'],
    popular: true
  }
}

// Use the component
function CheckoutPage() {
  return (
    <EnhancedCheckout
      selectedPlan="growth"
      plans={plans}
      onCheckoutStart={() => console.log('Checkout started')}
      onCheckoutComplete={(data) => console.log('Checkout completed', data)}
      onError={(error) => console.error('Checkout error', error)}
    />
  )
}
```

### Using the Enhanced CheckoutButton

```jsx
import CheckoutButton, { StartTrialButton } from '@/components/CheckoutButton'

// Basic usage with add-ons
function PricingCard() {
  return (
    <CheckoutButton
      plan="growth"
      addons={['fasttrack', 'premium']}
      customerEmail="user@example.com"
      metadata={{
        customer_name: 'John Doe',
        business_name: 'Acme Corp'
      }}
      onSuccess={(data) => console.log('Success!', data)}
      onError={(error) => console.error('Error!', error)}
    >
      Get Started - $139
    </CheckoutButton>
  )
}

// Using preset buttons
function QuickStart() {
  return (
    <StartTrialButton
      plan="starter"
      addons={['fasttrack']}
      customerEmail="user@example.com"
    />
  )
}
```

## 📦 Available Add-ons

| Add-on ID | Name | Price | Description |
|-----------|------|-------|-------------|
| `fasttrack` | Fast-Track Submission | $25 | 1-2 business days instead of 5-7 |
| `premium` | Premium Directories Only | $15 | High-authority directories (DA 70+) |
| `qa` | Manual QA Review | $10 | Human verification of submissions |
| `csv` | CSV Export | $9 | Download detailed CSV report |

## 🛠 API Usage

### Create Checkout Session with Add-ons

```javascript
const response = await fetch('/api/create-checkout-session-v3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plan: 'growth',
    addons: ['fasttrack', 'premium'],
    customerEmail: 'user@example.com',
    metadata: {
      customer_name: 'John Doe',
      business_name: 'Acme Corp'
    }
  })
})

const data = await response.json()
if (data.success) {
  window.location.href = data.checkoutUrl
}
```

### Fetch Session Details

```javascript
const response = await fetch(`/api/checkout-session-details?session_id=${sessionId}`)
const sessionData = await response.json()
console.log('Order details:', sessionData)
```

## 📱 Mobile Responsive Features

The checkout system is fully mobile responsive with:
- Responsive grid layouts (`sm:grid-cols-2`, `lg:grid-cols-3`)
- Mobile-friendly button sizing (`py-3 sm:py-4`)
- Sticky sidebar on desktop, stacked on mobile
- Touch-friendly interactive elements

## 🔧 Error Handling

The enhanced system includes comprehensive error handling:

### Client-Side Errors
- Form validation errors
- Network request failures
- Invalid plan/add-on selections
- Stripe configuration issues

### Server-Side Errors
- Invalid request payloads
- Stripe API errors
- Missing required parameters
- Session creation failures

### Error Display
Errors are displayed with:
- Clear error messages
- Retry functionality
- Debug information in development
- User-friendly fallbacks

## 🎨 Customization

### Styling
The components use Tailwind CSS with a dark theme:
- Primary color: `volt-500` (electric blue)
- Background: `secondary-900` to `secondary-800` gradient
- Error states: Red color scheme
- Success states: Green color scheme

### Adding Custom Add-ons
```typescript
// In EnhancedCheckout.tsx, update the ADD_ONS object
const ADD_ONS = {
  // ... existing add-ons
  custom_addon: {
    id: 'custom_addon',
    name: 'Custom Service',
    price: 50,
    description: 'Your custom service description',
    icon: '🎯'
  }
}
```

## 🧪 Testing

### Manual Testing
1. Navigate to the checkout page
2. Select different plans and add-ons
3. Complete customer information
4. Verify pricing calculations
5. Test error scenarios (invalid email, etc.)

### Automated Testing
Run the test script:
```bash
./test-checkout-api.sh
```

Or use the Node.js test suite:
```bash
node test-enhanced-checkout-flow.js
```

## 📊 Success Page

The enhanced success page displays:
- Order confirmation with session ID
- Complete order summary
- Selected plan details
- List of add-ons with prices
- Total amount paid
- Next steps timeline

## 🔒 Security Features

- Server-side validation of all inputs
- Stripe secure checkout integration
- CSRF protection on API endpoints
- Input sanitization and validation
- Secure metadata handling

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set proper Stripe keys in environment variables
- [ ] Configure success/cancel URLs for your domain
- [ ] Test all add-on combinations
- [ ] Verify mobile responsiveness
- [ ] Test error handling scenarios
- [ ] Validate session detail retrieval
- [ ] Check analytics integration
- [ ] Verify email confirmations work

## 📞 Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Verify Stripe configuration
3. Test API endpoints directly
4. Review error logs in the application
5. Contact support at support@directorybolt.com

## 🔄 Future Enhancements

Planned improvements:
- Subscription plan support
- Discount codes
- Multi-currency support
- Saved payment methods
- Order history
- Advanced analytics