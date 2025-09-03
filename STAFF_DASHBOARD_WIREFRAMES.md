# Staff Dashboard - Visual Wireframes & Component Library

**Project:** DirectoryBolt Phase 3.4 Staff Dashboard  
**Designer:** UX Design Specialist  
**Implementation:** Riley (Senior Frontend Engineer)  
**Date:** 2025-09-03  

---

## MAIN DASHBOARD LAYOUT

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📊 DirectoryBolt Staff Dashboard                    👤 Staff • 🔔 Alerts (3)  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─ Quick Actions ────────────────┐  ┌─ Live Status ────────────────────────────┐ │
│ │                                │  │                                          │ │
│ │  🚀 PROCESS NEXT CUSTOMER     │  │  🔄 2 Active    📈 94% Success          │ │
│ │                                │  │  ⏱️ 23m avg     💰 $2,847 pending       │ │
│ │  TechStart Inc (PRO)           │  │                                          │ │
│ │  200 dirs • ⏱️ 3.2h wait      │  │  System Status: ✅ Operational          │ │
│ │                                │  │                                          │ │
│ │  [🚀 Start Processing]         │  │  [📊 View Live Dashboard]               │ │
│ │                                │  │                                          │ │
│ └────────────────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Customer Queue ───────────────────────────────────────────────────────────────┐ │
│ │                                                                               │ │
│ │ 📋 Pending Customers (23)                               🔄 Auto-refresh: ON │ │
│ │                                                                               │ │
│ │ ┌─ Filters & Sort ────────────────────────────────────────────────────────┐  │ │
│ │ │ [🔥 High Priority] [⏰ Oldest First] [💰 Package ▼] [🔍 Search...]    │  │ │
│ │ └─────────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                               │ │
│ │ ┌─ Priority Queue Item ──────────────────────────────────────────────────┐   │ │
│ │ │ 🔴 PRO    DIR-2025-001234           TechStart Inc            ⏱️ 3.2h │   │ │
│ │ │                                                                        │   │ │
│ │ │ 📧 john@techstart.com • 200 directories • Priority: 105               │   │ │
│ │ │ 🌐 techstart.com • Purchased: 2025-09-01 11:30 AM                     │   │ │
│ │ │                                                                        │   │ │
│ │ │ [🚀 Process Now] [👁️ Details] [✉️ Contact] [⏰ Schedule]             │   │ │
│ │ └────────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                               │ │
│ │ ┌─ Standard Queue Item ──────────────────────────────────────────────────┐   │ │
│ │ │ 🟡 GROWTH DIR-2025-001235           Marketing Pro          ⏱️ 1.8h  │   │ │
│ │ │ 📧 sarah@marketpro.co • 100 directories • Priority: 78                │   │ │
│ │ │ [🚀 Process Now] [👁️ Details] [✉️ Contact]                           │   │ │
│ │ └────────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                               │ │
│ │ [← Previous] Page 1 of 5 [Next →]                                           │ │
│ │                                                                               │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────────────────┐
│ 📊 Staff Dashboard      ☰  │
├─────────────────────────────┤
│                             │
│ ┌─ Next Customer ─────────┐ │
│ │ 🚀 TechStart Inc (PRO)  │ │
│ │ 200 dirs • 3.2h wait    │ │
│ │                         │ │
│ │ [🚀 Process Now]        │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ Status ────────────────┐ │
│ │ 🔄 2 Active • 94% OK    │ │
│ │ 💰 $2,847 pending       │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ Queue (23) ────────────┐ │
│ │ 🔴 DIR-001234 PRO       │ │
│ │ TechStart Inc • 3.2h    │ │
│ │ [Process] [Details]     │ │
│ ├─────────────────────────┤ │
│ │ 🟡 DIR-001235 GROWTH    │ │
│ │ Marketing Pro • 1.8h    │ │
│ │ [Process] [Details]     │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

## PROCESSING INTERFACE WIREFRAMES

### Processing Confirmation Modal
```
┌────────────────────────────────────────────────────────────────┐
│                    ⚠️ Confirm Processing                       │
│                                                                │
│  You are about to start processing for:                       │
│                                                                │
│  📋 Customer: DIR-2025-001234                                 │
│  🏢 Business: TechStart Inc                                   │
│  📦 Package: PRO (200 directories)                            │
│  ⏱️ Estimated Time: 45-60 minutes                            │
│  💰 Value: $159                                               │
│                                                                │
│  ⚠️ Processing cannot be stopped once started.                │
│  ⚠️ Customer will receive automated status emails.            │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🎯 Processing Options:                                   │ │
│  │                                                          │ │
│  │ ○ Standard Processing (45-60 min)                       │ │
│  │ ● Priority Processing (30-45 min) +$25                  │ │
│  │ ○ Schedule for Later                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [❌ Cancel]  [⚡ Priority Mode]  [🚀 Start Processing]       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Active Processing Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🔄 ACTIVE PROCESSING DASHBOARD                              🔴 LIVE • 2:45 PM  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─ Processing Job #1 ─────────────────────────────────────────────────────────┐ │
│ │                                                                             │ │
│ │ 🔄 TechStart Inc (DIR-2025-001234)                      ⏱️ 12m 34s elapsed │ │
│ │                                                                             │ │
│ │ Progress: ████████████████░░░░ 67% (134/200 directories)                  │ │
│ │                                                                             │ │
│ │ Current: 🌐 Submitting to Google My Business...                           │ │
│ │                                                                             │ │
│ │ ✅ Successful: 121    ❌ Failed: 13    ⏳ Remaining: 66                   │ │
│ │                                                                             │ │
│ │ [🛑 Emergency Stop] [👁️ Live Log] [📊 Details] [📞 Contact Customer]     │ │
│ │                                                                             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Processing Job #2 ─────────────────────────────────────────────────────────┐ │
│ │ 🔄 Marketing Pro (DIR-2025-001235)                      ⏱️ 4m 12s elapsed  │ │
│ │ Progress: ███░░░░░░░░░░░░░░░ 23% (23/100 directories)                      │ │
│ │ Current: 🏢 Submitting to LinkedIn Company Pages...                        │ │
│ │ ✅ Successful: 21    ❌ Failed: 2    ⏳ Remaining: 77                      │ │
│ │ [🛑 Stop] [👁️ Log] [📊 Details]                                           │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ System Performance ────────────────────────────────────────────────────────┐ │
│ │                                                                             │ │
│ │ 📊 Processing Stats                    🌐 API Health                       │ │
│ │ ⚡ Speed: 3.2 dirs/min                ✅ Google: Operational              │ │
│ │ 🎯 Success Rate: 94.2%                ✅ LinkedIn: Operational            │ │
│ │ 🚨 Current Errors: 5.8%               ⚠️ Yelp: Rate limited              │ │
│ │ 🔥 Priority Queue: 8 waiting           ❌ YellowPages: Maintenance        │ │
│ │                                                                             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Live Activity Feed ────────────────────────────────────────────────────────┐ │
│ │                                                                             │ │
│ │ 🕐 2:45:23 PM  ✅ DIR-1234 → Google My Business: Success                  │ │
│ │ 🕐 2:45:18 PM  ❌ DIR-1235 → Yelp: Failed (Captcha required)              │ │
│ │ 🕐 2:45:12 PM  ✅ DIR-1234 → LinkedIn Company: Success                    │ │
│ │ 🕐 2:44:56 PM  🔄 DIR-1236 → Facebook Business: Processing...             │ │
│ │ 🕐 2:44:43 PM  ✅ DIR-1235 → Better Business Bureau: Success              │ │
│ │                                                                             │ │
│ │ [📜 View Full Log] [📊 Export Activity] [🔍 Filter...]                    │ │
│ │                                                                             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ALERTS & INTERVENTION WIREFRAMES

### Alert Banner (Top of Dashboard)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🚨 3 customers require manual intervention • 1 critical • 2 warnings           │
│ [🔥 View Critical] [📋 View All] [⚙️ Auto-Resolve] [🔕 Dismiss All]            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Manual Intervention Modal
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    🚨 CRITICAL: Manual Intervention Required                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Customer: TechStart Inc (DIR-2025-001234)                                      │
│  Issue: Multiple directory submission failures                                   │
│  Severity: CRITICAL • Escalation: Required                                      │
│  Time: 12 minutes ago (2:33 PM)                                                 │
│                                                                                  │
│  ┌─ Failure Details ──────────────────────────────────────────────────────────┐ │
│  │                                                                            │ │
│  │ 7 out of 10 directories failed submission:                                │ │
│  │                                                                            │ │
│  │ ❌ Yelp Business         → Captcha verification required                  │ │
│  │ ❌ Yellow Pages          → Login credentials needed                       │ │
│  │ ❌ Local.com            → Duplicate business listing detected             │ │
│  │ ❌ CitySearch           → Site in maintenance mode                        │ │
│  │ ❌ MerchantCircle       → Business category not supported                 │ │
│  │ ❌ Hotfrog              → Phone verification required                     │ │
│  │ ❌ Cylex                → Form structure changed                          │ │
│  │                                                                            │ │
│  │ ✅ Google My Business   → Success                                         │ │
│  │ ✅ LinkedIn Company     → Success                                         │ │
│  │ ✅ Facebook Business    → Success                                         │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌─ Recommended Actions ──────────────────────────────────────────────────────┐ │
│  │                                                                            │ │
│  │ 🎯 AUTO-RETRY: Schedule retry in 2 hours (85% success probability)        │ │
│  │ 📞 CONTACT: Request additional verification from customer                  │ │
│  │ ⏭️ PARTIAL: Complete order with successful directories only               │ │
│  │ 🎫 ESCALATE: Create technical support ticket                              │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌─ Customer Communication ───────────────────────────────────────────────────┐ │
│  │                                                                            │ │
│  │ Last Contact: None                                                         │ │
│  │ Contact Preference: Email (john@techstart.com)                            │ │
│  │ Customer Value: HIGH ($159 order)                                         │ │
│  │                                                                            │ │
│  │ [📧 Send Update Email] [📞 Schedule Call] [💬 Internal Note]              │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  [❌ Cancel] [⏰ Retry in 2h] [📞 Contact Customer] [⏭️ Complete Partial]      │
│  [🎫 Create Ticket] [✅ Mark Resolved]                                          │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Intervention Queue List
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🚨 Manual Intervention Queue (3 items)                 [🔄 Refresh] [⚙️ Auto] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─ CRITICAL ──────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 DIR-2025-001234 • TechStart Inc                    ⏱️ 12 minutes ago    │ │
│ │ Issue: 7/10 directories failed • Multiple errors                           │ │
│ │ [🚨 Handle Now] [📞 Contact] [🎫 Ticket] [⏭️ Skip Failed]                 │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ WARNING ──────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 DIR-2025-001235 • Marketing Pro                    ⏱️ 8 minutes ago     │ │
│ │ Issue: Quality review needed • 3 duplicate listings detected               │ │
│ │ [👁️ Review] [✅ Approve] [❌ Reject] [📝 Note]                             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ INFO ─────────────────────────────────────────────────────────────────────┐ │
│ │ ℹ️ DIR-2025-001236 • LocalBiz LLC                     ⏱️ 25 minutes ago    │ │
│ │ Status: Completed with warnings • Manual review requested                  │ │
│ │ [📋 View Report] [✅ Acknowledge] [📤 Send Report]                          │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ANALYTICS & REPORTS WIREFRAMES

### Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📈 Analytics & Reports                   [📅 Today ▼] [🔄 Refresh] [CSV⬇️]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─ Key Performance Indicators ───────────────────────────────────────────────┐  │
│ │                                                                             │  │
│ │  📊 Total Processed      🎯 Success Rate      ⏱️ Avg Time/Customer         │  │
│ │      156 customers           94.2%               47 minutes                │  │
│ │      ↑ 23% vs yesterday      ↑ 2.1%             ↓ 8 minutes               │  │
│ │                                                                             │  │
│ │  💰 Revenue Generated    ❌ Failed Jobs       👥 Processing Hours          │  │
│ │      $12,847                 9 customers          24.5 hours               │  │
│ │      ↑ $2,100 today          ↓ 3 vs yesterday     ↑ 3.2 hours             │  │
│ │                                                                             │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│ ┌─ Processing Distribution ───────────────────────────────────────────────────┐  │
│ │                                                                             │  │
│ │  📦 Package Breakdown:                    💰 Revenue by Package:           │  │
│ │                                                                             │  │
│ │  PRO       ████████████ 45% (70)        PRO       $11,130 (87%)           │  │
│ │  GROWTH    ███████ 35% (55)             GROWTH    $4,895 (38%)            │  │
│ │  STARTER   ████ 20% (31)                STARTER   $1,519 (12%)            │  │
│ │                                                                             │  │
│ │  📈 Trend: PRO packages ↑15% this week                                     │  │
│ │                                                                             │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│ ┌─ Directory Performance Analysis ────────────────────────────────────────────┐  │
│ │                                                                             │  │
│ │  🏆 Top Performing Directories:          ⚠️ Problem Directories:           │  │
│ │                                                                             │  │
│ │  📈 Google My Business  523 | 98.2%     ❌ Yelp Business    234 | 67.3%   │  │
│ │  📈 LinkedIn Company    489 | 96.7%     ❌ Yellow Pages     198 | 71.2%   │  │
│ │  📈 Facebook Business   445 | 94.1%     ❌ Local.com        156 | 73.8%   │  │
│ │  📈 Better Business     398 | 92.8%     ❌ CitySearch       134 | 69.4%   │  │
│ │                                                                             │  │
│ │  [📊 View Full Report] [🔧 Fix Issues] [📈 Optimize Routes]                │  │
│ │                                                                             │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│ ┌─ Failure Analysis ──────────────────────────────────────────────────────────┐  │
│ │                                                                             │  │
│ │  📋 Common Failure Reasons:                                                │  │
│ │                                                                             │  │
│ │  🤖 Captcha Required          ████████ 28% (67 failures)                  │  │
│ │  🔒 Login Required            ██████ 19% (45 failures)                    │  │
│ │  📋 Duplicate Listing         ██████ 25% (60 failures)                    │  │
│ │  📝 Form Structure Changed    ████ 16% (38 failures)                      │  │
│ │  🌐 Site Maintenance/Down     ███ 12% (29 failures)                       │  │
│ │                                                                             │  │
│ │  📈 Trend Analysis: Captcha failures ↑23% this week                       │  │
│ │  💡 Suggestion: Update anti-captcha strategies                             │  │
│ │                                                                             │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### CSV Export Configuration
```
┌────────────────────────────────────────────────────────────────┐
│                    📊 Generate Export Report                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📅 Date Range:                                               │
│  [📅 2025-09-01] to [📅 2025-09-03]                          │
│                                                                │
│  🎯 Quick Presets:                                            │
│  [📅 Today] [📅 Yesterday] [📅 This Week] [📅 This Month]    │
│                                                                │
│  ✅ Data to Include:                                           │
│  ☑️ Customer Information (Name, Email, Package)               │
│  ☑️ Processing Results (Success/Failure counts)               │
│  ☑️ Directory Submission Details                              │
│  ☑️ Timing Information (Start, End, Duration)                 │
│  ☑️ Revenue and Billing Data                                  │
│  ☐ Internal Processing Logs (Debug info)                     │
│  ☐ Customer Contact Information (Phone, Address)             │
│                                                                │
│  📄 Export Format:                                            │
│  ● CSV (Comma Separated)                                      │
│  ○ Excel (.xlsx)                                              │
│  ○ JSON (API format)                                          │
│                                                                │
│  ⚙️ Advanced Options:                                          │
│  ☑️ Include column headers                                     │
│  ☑️ Filter out test customers                                 │
│  ☐ Anonymize customer data                                    │
│                                                                │
│  📊 Estimated file size: 2.3 MB (1,247 records)              │
│  ⏱️ Generation time: ~15 seconds                              │
│                                                                │
│  [❌ Cancel] [📋 Preview] [📁 Generate Export]                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## RESPONSIVE COMPONENT PATTERNS

### Mobile-First Queue Item
```
┌─────────────────────────────┐
│ 🔴 PRO • DIR-001234         │
│ ⏱️ 3.2h                     │
├─────────────────────────────┤
│ TechStart Inc               │
│ john@techstart.com          │
│ 200 directories             │
├─────────────────────────────┤
│ [🚀 Process]     [👁️ View] │
└─────────────────────────────┘
```

### Tablet Queue Item
```
┌───────────────────────────────────────────────────────────┐
│ 🔴 PRO  DIR-001234           TechStart Inc         ⏱️ 3.2h │
│                                                           │
│ 📧 john@techstart.com • 200 directories • Priority: 105  │
│                                                           │
│ [🚀 Process Now] [👁️ Details] [✉️ Contact]               │
└───────────────────────────────────────────────────────────┘
```

### Processing Progress (Mobile)
```
┌─────────────────────────────┐
│ 🔄 TechStart Inc            │
│ 12m 34s elapsed             │
├─────────────────────────────┤
│ ████████░░░░░ 67%          │
│ (134/200 directories)       │
├─────────────────────────────┤
│ Current:                    │
│ Google My Business...       │
├─────────────────────────────┤
│ ✅ 121  ❌ 13  ⏳ 66        │
├─────────────────────────────┤
│ [🛑 Stop] [👁️ Log]         │
└─────────────────────────────┘
```

---

## ACCESSIBILITY SPECIFICATIONS

### Keyboard Navigation Flow
```
1. Tab Order: Header → Quick Actions → Queue Filters → Queue Items
2. Queue Item Focus: Process Button → Details Button → Contact Button
3. Modal Focus: Trap focus within modal, return to trigger on close
4. Skip Links: "Skip to main content", "Skip to queue"
```

### Screen Reader Labels
```jsx
// Queue Item Example
<div role="article" aria-label="Customer TechStart Inc, PRO package, 3.2 hours waiting">
  <button aria-label="Process customer TechStart Inc with PRO package">
    Process Now
  </button>
  <button aria-label="View details for TechStart Inc submission">
    Details
  </button>
</div>

// Processing Progress
<div role="progressbar" aria-valuenow={67} aria-valuemin={0} aria-valuemax={100}>
  67% complete, 134 of 200 directories processed
</div>
```

### Color Accessibility
```
High Priority (Red):    #dc2626 (4.5:1 contrast ratio)
Medium Priority (Yellow): #ca8a04 (4.5:1 contrast ratio)
Low Priority (Green):   #059669 (4.5:1 contrast ratio)
Focus Indicators:       #ccff0a (volt-400, 7:1 contrast)
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse-volt-slow { animation: none; }
  .hover:scale-105 { transform: none; }
  .transition-all { transition: none; }
}
```

---

## PERFORMANCE OPTIMIZATION NOTES

### Lazy Loading Strategy
- Queue items: Virtual scrolling for 500+ items
- Analytics charts: Load on tab focus
- Activity feed: Infinite scroll with pagination

### Real-Time Updates
- WebSocket connection management
- Optimistic UI updates
- Error boundary for connection failures
- Automatic reconnection logic

### Caching Strategy
- Queue data: 30-second cache
- Analytics: 5-minute cache  
- Static data: Browser cache with versioning

---

## DEVELOPMENT NOTES FOR RILEY

### Component File Structure
```
components/staff-dashboard/
├── layout/
│   ├── StaffDashboardLayout.tsx
│   ├── Navigation.tsx
│   └── AlertBanner.tsx
├── queue/
│   ├── QueueInterface.tsx
│   ├── QueueItem.tsx
│   ├── QueueFilters.tsx
│   └── ProcessModal.tsx
├── processing/
│   ├── ProcessingDashboard.tsx
│   ├── ActiveJob.tsx
│   ├── ProgressBar.tsx
│   └── ActivityFeed.tsx
├── analytics/
│   ├── AnalyticsDashboard.tsx
│   ├── KPIGrid.tsx
│   ├── ExportModal.tsx
│   └── Charts.tsx
└── alerts/
    ├── AlertsList.tsx
    ├── InterventionModal.tsx
    └── ActionButtons.tsx
```

### State Management Pattern
```tsx
// Use React Context for dashboard-wide state
const StaffDashboardContext = createContext({
  queueData: [],
  processingJobs: [],
  alerts: [],
  refreshQueue: () => {},
  processCustomer: (id: string) => {},
})

// Custom hooks for data fetching
const useQueueData = () => {
  // WebSocket connection
  // Polling fallback  
  // Optimistic updates
}
```

### Styling Utilities
```css
/* Extend existing design system */
.queue-item {
  @apply card hover:border-volt-500/50 transition-all duration-300;
}

.priority-high {
  @apply border-l-4 border-red-500 bg-red-500/5;
}

.processing-active {
  @apply bg-volt-500/5 border border-volt-500/20;
}
```

**Ready for Implementation!** All wireframes and components designed with the existing DirectoryBolt design system and technical constraints in mind.