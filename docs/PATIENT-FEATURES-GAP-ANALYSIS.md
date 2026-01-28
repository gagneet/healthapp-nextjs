# Patient Features Gap Analysis

**Date**: January 28, 2026
**Status**: Documentation vs Codebase Verification
**Purpose**: Identify what's documented vs what's actually implemented

---

## Executive Summary

✅ **Most core features are implemented** (APIs + basic UI)
⚠️ **Key enhancements needed** for production-ready patient experience
❌ **Critical missing features** identified for high-priority implementation

---

## Verification Results

### ✅ FULLY IMPLEMENTED Features

| Feature | API | Page | Status |
|---------|-----|------|--------|
| Medication Tracking | ✅ | ✅ | Complete with adherence stats |
| Medication Side Effects | ✅ | ✅ | Completed 2026-01-28 |
| Medication Refills | ✅ | ✅ | Completed 2026-01-28 |
| Diet Tracking | ✅ | ✅ | Plan + log endpoints |
| Exercise Tracking | ✅ | ✅ | Activity + plan endpoints |
| Appointments | ✅ | ✅ | List + reschedule |
| Care Plans | ✅ | ✅ | View + details |
| Prescriptions | ✅ | ✅ | View prescriptions |
| Symptoms Logging | ✅ | ✅ | Report symptoms |
| Profile Management | ✅ | ✅ | Edit profile |
| Reminders | ✅ | ✅ | View reminders |
| Achievements/Gamification | ✅ | ✅ | Points system |

### ⚠️ PARTIALLY IMPLEMENTED (Needs Enhancement)

#### 1. **Settings & Notifications** ⚠️
- **What Exists**:
  - Basic settings page at `app/dashboard/patient/settings/page.tsx`
  - API endpoint: `/api/patient/settings`
  - Basic notification toggles (email, SMS, push)
  - Basic reminder preferences (medication, appointments, vitals)

- **What's Missing**:
  - Quiet hours configuration (quietHoursStart, quietHoursEnd from schema)
  - Reminder lead time customization (currently defaults to 15 min)
  - Granular notification preferences (lab result alerts, achievement alerts, care team messages)
  - Exercise and meal reminders toggles
  - Timezone selection
  - Alert preferences (critical alerts, emergency alerts)

- **Priority**: HIGH - Users need control over notification timing

#### 2. **Video Consultations** ⚠️
- **What Exists**:
  - Page: `app/dashboard/patient/video-consultations/page.tsx`
  - API: `/api/patient/video-consultations` (GET list)
  - API: `/api/patient/video-consultations/[id]/join` (POST join)
  - VideoConsultationRoom component

- **What's Missing**:
  - **Booking flow** - NO way for patient to request/schedule new consultations
  - Filter by upcoming/past consultations
  - Consultation history with notes
  - Reschedule consultation feature
  - Cancel consultation feature
  - Pre-consultation questionnaire
  - Tech check before joining

- **Priority**: HIGH - Core telemedicine feature

#### 3. **Goals Tracking** ⚠️
- **What Exists**:
  - Page: `app/dashboard/patient/goals/page.tsx` (basic list)
  - API: `/api/patient/goals` (GET list, POST create)
  - API: `/api/patient/goals/[id]/progress` (progress endpoint EXISTS but NOT USED)
  - Schema supports milestones and progress logs

- **What's Missing**:
  - **Progress logging UI** - No way to log daily progress
  - **Progress charts** - No visualization of progress over time
  - **Milestones UI** - Schema supports milestones but no UI
  - Goal details page with history
  - Goal completion celebration/feedback
  - Progress insights and recommendations
  - Goal reminders integration

- **Priority**: MEDIUM - Nice to have for patient engagement

#### 4. **Lab Results** ⚠️
- **What Exists**:
  - Page: `app/dashboard/patient/lab-results/page.tsx`
  - API: `/api/patient/lab-orders` (list orders)
  - API: `/api/patient/lab-orders/[id]` (order details)
  - Basic result display (value, range, flags)

- **What's Missing**:
  - **Trends visualization** - No charts showing result changes over time
  - Historical comparison (e.g., "Your glucose is 10 points lower than last month")
  - Abnormal result highlighting/explanations
  - Export results as PDF
  - Share results with external provider
  - Result interpretation/educational content

- **Priority**: MEDIUM - Enhances patient understanding

#### 5. **Messaging** ⚠️
- **What Exists**:
  - Page: `app/dashboard/patient/messages/page.tsx`
  - API: `/api/patient/messages` (list conversations)
  - API: `/api/patient/messages/[conversationId]` (get + send)
  - Basic conversation list and messaging

- **What's Missing**:
  - **Provider details** - Conversations don't show doctor/HSP info (name, specialty, photo)
  - Attachment support (images, PDFs)
  - Message read receipts
  - Typing indicators
  - Message search/filter
  - Priority/urgent message flag
  - Auto-responses/FAQs
  - Start new conversation UI (currently only shows existing)

- **Priority**: MEDIUM - Improves care team communication

#### 6. **Caregiver Access** ⚠️
- **What Exists**:
  - Page: `app/dashboard/patient/caregivers/page.tsx`
  - API: `/api/patient/caregivers` (list + add)
  - Basic caregiver list display
  - Access level and status shown

- **What's Missing**:
  - **Email invite workflow** - Currently requires manual user ID entry
  - Invite token generation/acceptance flow
  - Access level customization (VIEW_ONLY, VIEW_AND_LOG, FULL_ACCESS)
  - Granular permissions configuration (medications, vitals, appointments, etc.)
  - Revoke access functionality
  - Caregiver dashboard/view (what caregivers see)
  - Emergency contact management (separate from caregivers)

- **Priority**: LOW-MEDIUM - Important for elderly/chronic patients

### ❌ COMPLETELY MISSING Features

#### 1. **Patient Alert Center** ❌ CRITICAL
- **What Exists**: NOTHING - No page, no dedicated API
- **What's Needed**:
  - Central alerts page (`/dashboard/patient/alerts`)
  - API: `/api/patient/alerts` (list all alerts)
  - API: `/api/patient/alerts/[id]/acknowledge` (mark as read)
  - Alert types:
    - Critical vital readings (high BP, low glucose, etc.)
    - Missed medications (consecutive skips)
    - Upcoming appointment reminders
    - Lab result availability
    - Care plan updates
    - Doctor messages
  - Emergency alerts subsection (RED alerts)
  - Alert history with resolution status
  - Alert preferences (which alerts to show)
  - Badge count on navigation

- **Schema Exists**:
  - `PatientReminder` model exists for scheduled alerts
  - `Notification` model exists for general notifications
  - `EmergencyContact` model exists but not used

- **Priority**: CRITICAL - Patients need centralized alert management

#### 2. **Emergency Alerts** ❌ CRITICAL
- **What Exists**: Schema model `EmergencyAlert` but NO implementation
- **What's Needed**:
  - Emergency alert creation when critical vitals detected
  - Automatic notification to emergency contacts
  - Emergency contact phone call/SMS triggers
  - "Call 911" button for critical situations
  - Emergency history log
  - False alarm reporting
  - Emergency contact management UI

- **Priority**: CRITICAL - Safety-critical feature

---

## Implementation Priority Matrix

### 🔴 CRITICAL (Implement First)
1. **Patient Alert Center** - Centralized alert/notification management
2. **Emergency Alerts System** - Safety-critical feature
3. **Video Consultation Booking** - Core telemedicine feature incomplete

### 🟡 HIGH (Next Sprint)
4. **Enhanced Notification Preferences** - User needs control over alerts
5. **Lab Results Trends** - Improves patient understanding
6. **Messaging Provider Details** - Better care team communication

### 🟢 MEDIUM (Future Enhancements)
7. **Goal Progress Tracking UI** - Engagement feature
8. **Caregiver Email Invites** - Improves access management
9. **Video Consultation Pre-check** - UX improvement

---

## API Routes Summary

### Existing Patient API Routes (42 total)
```
✅ /api/patient/appointments (4 routes)
✅ /api/patient/care-plans (2 routes)
✅ /api/patient/caregivers (1 route)
✅ /api/patient/dashboard/[id] (1 route)
✅ /api/patient/diet (5 routes)
✅ /api/patient/education (1 route)
✅ /api/patient/events/[eventId]/complete (1 route)
✅ /api/patient/events/[eventId]/missed (1 route)
✅ /api/patient/exercise (5 routes)
✅ /api/patient/gamification (1 route)
✅ /api/patient/goals (3 routes) - progress endpoint exists!
✅ /api/patient/lab-orders (2 routes)
✅ /api/patient/medications (6 routes)
✅ /api/patient/messages (2 routes)
✅ /api/patient/reminders (1 route)
✅ /api/patient/settings (1 route)
✅ /api/patient/video-consultations (2 routes)
✅ /api/patient/vitals (4 routes)
```

### Missing API Routes (Needed)
```
❌ /api/patient/alerts - List all patient alerts
❌ /api/patient/alerts/[id]/acknowledge - Acknowledge alert
❌ /api/patient/alerts/emergency - Emergency alerts only
❌ /api/patient/emergency-contacts - Manage emergency contacts
❌ /api/patient/video-consultations/book - Book new consultation
❌ /api/patient/lab-orders/[id]/trends - Historical trends
❌ /api/patient/messages/[conversationId]/provider - Get provider details
❌ /api/patient/caregivers/invite - Send email invite
❌ /api/patient/caregivers/[id]/revoke - Revoke caregiver access
```

---

## Pages Summary

### Existing Patient Pages (19 total)
```
✅ /dashboard/patient (main dashboard)
✅ /dashboard/patient/achievements
✅ /dashboard/patient/appointments
✅ /dashboard/patient/care-plans
✅ /dashboard/patient/caregivers
✅ /dashboard/patient/diet
✅ /dashboard/patient/education
✅ /dashboard/patient/exercise
✅ /dashboard/patient/goals
✅ /dashboard/patient/lab-results
✅ /dashboard/patient/medications
✅ /dashboard/patient/messages
✅ /dashboard/patient/prescriptions
✅ /dashboard/patient/profile
✅ /dashboard/patient/reminders
✅ /dashboard/patient/settings
✅ /dashboard/patient/symptoms
✅ /dashboard/patient/video-consultations
✅ /dashboard/patient/vitals
```

### Missing Pages (Needed)
```
❌ /dashboard/patient/alerts - Alert center (CRITICAL)
❌ /dashboard/patient/alerts/emergency - Emergency alerts
❌ /dashboard/patient/video-consultations/book - Book consultation
❌ /dashboard/patient/goals/[id] - Goal details with progress
❌ /dashboard/patient/emergency-contacts - Manage emergency contacts
```

---

## Schema Utilization

### Well-Utilized Models
- ✅ MedicationLog - Used extensively
- ✅ DietPlan, MealLog, FoodLogItem - Fully implemented
- ✅ ExercisePlan, ExerciseLog - Fully implemented
- ✅ HealthGoal - Created but UI incomplete
- ✅ MessageConversation, PatientMessage - Implemented
- ✅ EducationalContent - Implemented

### Under-Utilized Models
- ⚠️ GoalMilestone - Schema exists, NO UI
- ⚠️ GoalProgressLog - API exists, NO UI
- ⚠️ PatientNotificationPreference - Partially implemented
- ⚠️ PatientReminder - Exists but not used for alert center
- ⚠️ CaregiverAccess - Basic implementation, needs invite flow

### Unused Models (Schema exists, ZERO implementation)
- ❌ EmergencyContact - Critical safety feature MISSING
- ❌ EmergencyAlert - Critical safety feature MISSING
- ❌ DailyActivitySummary - Wearable integration MISSING
- ❌ PatientSettings - Advanced preferences MISSING

---

## Recommendations

### Immediate Actions (This Sprint)
1. **Implement Patient Alert Center**
   - Page: `/dashboard/patient/alerts`
   - API: `/api/patient/alerts`
   - Use existing `PatientReminder` + `Notification` models
   - Badge count in navigation

2. **Implement Emergency Alerts**
   - Use `EmergencyContact` model
   - Trigger on critical vital thresholds
   - SMS/email notification to contacts

3. **Add Video Consultation Booking**
   - New page: `/dashboard/patient/video-consultations/book`
   - API: `/api/patient/video-consultations/book`
   - Doctor selection, date/time picker

### Next Sprint
4. **Enhance Notification Preferences** - Add all schema fields to settings
5. **Add Lab Results Trends** - Charts showing result changes over time
6. **Add Messaging Provider Details** - Show doctor/HSP info in conversations

### Future Enhancements
7. **Goal Progress Tracking** - Use existing `/goals/[id]/progress` API
8. **Caregiver Email Invites** - Implement invite token system
9. **Wearable Integration** - Use `DailyActivitySummary` model

---

## Testing Checklist

Before marking features as "complete":
- [ ] API endpoint exists and is tested
- [ ] Page/component exists and renders correctly
- [ ] Feature is documented in user-facing help
- [ ] Feature is covered by automated tests
- [ ] Feature works on mobile devices
- [ ] Feature handles error cases gracefully
- [ ] Feature integrates with existing workflows

---

**Conclusion**: While extensive work has been done on patient features, several critical safety features (alerts, emergency contacts) and key user experience improvements (booking flow, trends, provider details) are needed for production readiness.
