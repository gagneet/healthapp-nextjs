# Patient Features Implementation Plan
## Healthcare Management Platform - Complete Patient Module Analysis

**Document Version**: 1.0
**Created**: January 28, 2026
**Purpose**: Complete implementation guide for AI Agent to implement Patient-side features

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Implementation Status](#2-current-implementation-status)
3. [Gap Analysis](#3-gap-analysis)
4. [Complete Feature Implementation Plan](#4-complete-feature-implementation-plan)
5. [Schema Changes Required](#5-schema-changes-required)
6. [API Implementation Requirements](#6-api-implementation-requirements)
7. [Frontend Component Requirements](#7-frontend-component-requirements)
8. [Implementation Priority Matrix](#8-implementation-priority-matrix)

---

## 1. Executive Summary

The Healthcare Management Platform is a patient adherence-focused application built with Next.js 14, Prisma, PostgreSQL, and Auth.js v5. The Patient module needs comprehensive implementation across 12 major feature areas to provide a complete healthcare adherence experience.

### Patient Role Capabilities (Per CLAUDE.md Business Rules)
- **View-only** access for prescribed plans (medications, care plans, appointments)
- **Input actual data**: Record what they ate, exercises done, vitals taken
- **Add symptoms** to their care plan
- **Mobile-optimized** interface for daily compliance tracking
- **Cannot**: Create medications, modify prescriptions, access other patients' data

---

## 2. Current Implementation Status

### ✅ IMPLEMENTED (Based on Documentation Analysis)

| Feature | Status | Location |
|---------|--------|----------|
| Patient Dashboard | Partial | `app/dashboard/patient/page.tsx` |
| Patient Layout | Complete | `app/dashboard/patient/layout.tsx` |
| Patient Sidebar | Complete | `components/dashboard/patient-sidebar.tsx` |
| Symptom Reporter | Complete | `components/patient/symptom-reporter.tsx` |
| Basic Auth | Complete | Auth.js v5 with Patient role |
| API - Get Patient | Complete | `/api/patients/[id]` |
| API - Patient Dashboard | Partial | `/api/patient/dashboard/[id]` |
| API - Symptoms | Complete | `/api/symptoms` |
| Database Schema | Complete | 46+ Prisma models |
| Gamification Schema | Complete | `PatientGameProfile`, badges, challenges |

### 🔶 PARTIALLY IMPLEMENTED

| Feature | Status | Missing |
|---------|--------|---------|
| Medication Tracking UI | 50% | Adherence logging, reminders UI |
| Vital Signs Recording | 60% | Full history, trends, device integration |
| Appointment Viewing | 40% | Calendar view, reminders, booking |
| Care Plan Viewing | 30% | Detailed view, progress tracking |
| Notifications | 20% | Patient-specific notification center |

### ❌ NOT IMPLEMENTED

| Feature | Priority | Effort |
|---------|----------|--------|
| Medication Adherence Logging | High | Medium |
| Diet Plan Tracking | High | High |
| Exercise/Workout Tracking | High | High |
| Gamification UI | High | High |
| Video Consultation (Patient) | High | Medium |
| Lab Results Viewing | Medium | Medium |
| Family/Caregiver Access | Medium | High |
| Health Goals & Targets | Medium | Medium |
| Educational Content | Medium | Medium |
| Wearable Device Integration | Low | High |
| Community Features | Low | Medium |
| AI Health Insights | Low | High |

---

## 3. Gap Analysis

### 3.1 Patient Dashboard Gaps

**Current State**: Basic dashboard showing limited data
**Required State**: Comprehensive adherence-focused dashboard with:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PATIENT DASHBOARD                             │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Today's     │ │ Adherence   │ │ Upcoming    │ │ Health      │ │
│ │ Tasks       │ │ Score       │ │ Appointments│ │ Score       │ │
│ │   12/15     │ │    87%      │ │   2 this    │ │   ★★★★☆    │ │
│ │ completed   │ │ this week   │ │   week      │ │             │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ MEDICATION SCHEDULE FOR TODAY                                ││
│ │ ☐ 8:00 AM - Metformin 500mg (Take with food)                ││
│ │ ☑ 12:00 PM - Lisinopril 10mg (Taken at 12:15 PM)            ││
│ │ ☐ 6:00 PM - Metformin 500mg (Take with food)                ││
│ │ ☐ 9:00 PM - Atorvastatin 20mg (Before bed)                  ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────┐ ┌──────────────────────────────────────┐│
│ │ QUICK ACTIONS       │ │ RECENT ACTIVITY                      ││
│ │ ○ Record Vitals     │ │ • Vitals recorded - 2 hours ago      ││
│ │ ○ Log Symptom       │ │ • Medication taken - 4 hours ago     ││
│ │ ○ Log Meal          │ │ • Appointment completed - Yesterday  ││
│ │ ○ Log Exercise      │ │ • Lab results available - 2 days ago ││
│ │ ○ Message Doctor    │ │                                      ││
│ └─────────────────────┘ └──────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Patient Feature Gaps

#### A. Medication Adherence System
- No medication logging UI for patients
- No reminder acknowledgment system
- No adherence statistics display
- No medication information/education
- No refill request functionality

#### B. Diet & Nutrition Tracking
- No meal logging interface
- No calorie/macro tracking
- No diet plan comparison (prescribed vs actual)
- No food database integration

#### C. Exercise & Activity Tracking
- No workout logging interface
- No activity tracking integration
- No exercise plan comparison
- No progress visualization

#### D. Vital Signs Management
- Limited vital recording UI
- No historical trends visualization
- No alert thresholds display
- No device data integration

#### E. Gamification & Engagement
- Schema exists but no UI
- No progress dashboards
- No badge displays
- No challenge interfaces
- No leaderboards
- No rewards system

---

## 4. Complete Feature Implementation Plan

### FEATURE AREA 1: Enhanced Patient Dashboard

**Description**: Complete patient dashboard with adherence tracking, daily tasks, and health metrics

**Components Required**:
```
app/dashboard/patient/
├── page.tsx                    # Main dashboard (ENHANCE)
├── layout.tsx                  # Layout (EXISTS)
├── medications/
│   ├── page.tsx               # Medications list
│   └── [id]/page.tsx          # Single medication detail
├── vitals/
│   ├── page.tsx               # Vitals history
│   └── record/page.tsx        # Record new vital
├── appointments/
│   ├── page.tsx               # Appointments list
│   └── [id]/page.tsx          # Appointment detail
├── care-plans/
│   ├── page.tsx               # Care plans list
│   └── [id]/page.tsx          # Care plan detail
├── diet/
│   ├── page.tsx               # Diet plan & tracking
│   └── log/page.tsx           # Log meal
├── exercise/
│   ├── page.tsx               # Exercise plan & tracking
│   └── log/page.tsx           # Log workout
├── symptoms/
│   ├── page.tsx               # Symptoms history
│   └── report/page.tsx        # Report symptom
├── lab-results/
│   └── page.tsx               # Lab results viewer
├── video-consultations/
│   ├── page.tsx               # Consultations list
│   └── [id]/page.tsx          # Join consultation
├── achievements/
│   └── page.tsx               # Gamification dashboard
├── messages/
│   └── page.tsx               # Secure messaging
├── profile/
│   └── page.tsx               # Patient profile
└── settings/
    └── page.tsx               # Patient settings
```

### FEATURE AREA 2: Medication Adherence System

**Priority**: HIGH
**Effort**: 3-4 days

**Features**:
1. Today's medication schedule with check-off
2. Medication history and adherence tracking
3. Medication details (dosage, instructions, warnings)
4. Refill requests
5. Drug information lookup
6. Side effect reporting
7. Adherence streak tracking

**UI Components**:
```typescript
// components/patient/medications/
├── MedicationSchedule.tsx      // Daily medication timeline
├── MedicationCard.tsx          // Individual medication display
├── MedicationCheckIn.tsx       // Mark medication as taken
├── MedicationDetails.tsx       // Full medication information
├── MedicationHistory.tsx       // Historical adherence view
├── AdherenceScore.tsx          // Visual adherence metrics
├── RefillRequestForm.tsx       // Request medication refill
└── SideEffectReporter.tsx      // Report side effects
```

### FEATURE AREA 3: Vital Signs Management

**Priority**: HIGH
**Effort**: 2-3 days

**Features**:
1. Record vital signs (BP, heart rate, temperature, weight, blood sugar)
2. Historical trends with charts
3. Alert thresholds visualization
4. Device integration ready
5. Export/share with doctor

**UI Components**:
```typescript
// components/patient/vitals/
├── VitalRecorder.tsx           // Form to record vitals
├── VitalTrendChart.tsx         // Historical line charts
├── VitalCard.tsx               // Single vital display
├── VitalAlertBanner.tsx        // Show if vitals are abnormal
├── VitalHistory.tsx            // Table of past readings
└── BloodPressureInput.tsx      // Specialized BP input
```

### FEATURE AREA 4: Diet & Nutrition Tracking

**Priority**: HIGH
**Effort**: 4-5 days

**Features**:
1. View prescribed diet plan
2. Log meals with food search
3. Calorie and macro tracking
4. Water intake tracking
5. Comparison: prescribed vs actual
6. Nutritional insights

**UI Components**:
```typescript
// components/patient/diet/
├── DietPlanView.tsx            // View prescribed diet
├── MealLogger.tsx              // Log meals eaten
├── FoodSearchInput.tsx         // Search food database
├── NutritionSummary.tsx        // Daily nutrition overview
├── WaterIntakeTracker.tsx      // Track water consumption
├── CalorieProgressBar.tsx      // Visual calorie tracking
├── MacroChart.tsx              // Protein/carbs/fat breakdown
└── DietComparisonView.tsx      // Prescribed vs actual
```

### FEATURE AREA 5: Exercise & Activity Tracking

**Priority**: HIGH
**Effort**: 3-4 days

**Features**:
1. View prescribed workout plan
2. Log completed exercises
3. Activity tracking integration
4. Progress visualization
5. Exercise library with instructions

**UI Components**:
```typescript
// components/patient/exercise/
├── WorkoutPlanView.tsx         // View prescribed exercises
├── ExerciseLogger.tsx          // Log completed workouts
├── ExerciseCard.tsx            // Individual exercise display
├── ActivitySummary.tsx         // Daily/weekly activity overview
├── StepCounter.tsx             // Steps and distance
├── ExerciseLibrary.tsx         // Browse exercise instructions
└── WorkoutCalendar.tsx         // Calendar view of workouts
```

### FEATURE AREA 6: Appointment Management

**Priority**: HIGH
**Effort**: 2-3 days

**Features**:
1. View upcoming appointments
2. Appointment reminders
3. Pre-appointment checklist
4. Video consultation joining
5. Appointment history
6. Request appointment changes

**UI Components**:
```typescript
// components/patient/appointments/
├── AppointmentList.tsx         // List of appointments
├── AppointmentCard.tsx         // Single appointment display
├── AppointmentCalendar.tsx     // Calendar view
├── AppointmentReminder.tsx     // Reminder notification
├── PreAppointmentChecklist.tsx // Preparation checklist
├── JoinVideoButton.tsx         // Join video consultation
└── RescheduleRequestForm.tsx   // Request reschedule
```

### FEATURE AREA 7: Video Consultation (Patient Side)

**Priority**: HIGH
**Effort**: 2-3 days

**Features**:
1. View scheduled consultations
2. Join video call with doctor
3. In-call chat messaging
4. View consultation notes after
5. Rate consultation experience

**UI Components**:
```typescript
// components/patient/video-consultation/
├── ConsultationList.tsx        // List of consultations
├── ConsultationWaitingRoom.tsx // Pre-call waiting area
├── PatientVideoRoom.tsx        // Video call interface
├── ConsultationChat.tsx        // In-call messaging
├── ConsultationSummary.tsx     // Post-call summary
└── ConsultationRating.tsx      // Rate the experience
```

### FEATURE AREA 8: Lab Results Viewer

**Priority**: MEDIUM
**Effort**: 2 days

**Features**:
1. View lab results
2. Understand normal ranges
3. Historical comparison
4. Download/export results
5. Ask doctor about results

**UI Components**:
```typescript
// components/patient/lab-results/
├── LabResultsList.tsx          // List of lab results
├── LabResultDetail.tsx         // Single result detail
├── LabResultChart.tsx          // Trend visualization
├── NormalRangeIndicator.tsx    // Visual range display
└── LabResultExport.tsx         // Download/share results
```

### FEATURE AREA 9: Gamification & Engagement

**Priority**: HIGH
**Effort**: 4-5 days

**Features**:
1. Progress dashboard with points/level
2. Achievement badges display
3. Daily/weekly challenges
4. Streak tracking
5. Rewards system
6. Leaderboard (optional, privacy-aware)

**UI Components**:
```typescript
// components/patient/gamification/
├── GamificationDashboard.tsx   // Main achievements page
├── PointsDisplay.tsx           // Current points/level
├── BadgeGallery.tsx            // All earned badges
├── BadgeCard.tsx               // Single badge display
├── ChallengeList.tsx           // Active challenges
├── ChallengeCard.tsx           // Single challenge
├── StreakCounter.tsx           // Current streak display
├── RewardsShop.tsx             // Redeem points (if applicable)
├── LeaderboardView.tsx         // Community leaderboard
└── ProgressTimeline.tsx        // Health journey timeline
```

### FEATURE AREA 10: Care Plan Viewing

**Priority**: HIGH
**Effort**: 2-3 days

**Features**:
1. View active care plans
2. Understand plan components
3. Track plan progress
4. View doctor notes
5. Request plan modifications

**UI Components**:
```typescript
// components/patient/care-plans/
├── CarePlanList.tsx            // List of care plans
├── CarePlanDetail.tsx          // Full care plan view
├── CarePlanProgress.tsx        // Progress tracking
├── CarePlanTimeline.tsx        // Plan timeline/milestones
├── TreatmentSection.tsx        // Treatment components
└── DoctorNotesView.tsx         // Read-only doctor notes
```

### FEATURE AREA 11: Symptom Management

**Priority**: HIGH
**Effort**: 2 days

**Features**:
1. Report new symptoms with body diagram
2. Symptom severity tracking
3. Symptom history
4. Pattern analysis
5. Share symptoms with care team

**UI Components**:
```typescript
// components/patient/symptoms/
├── SymptomReporter.tsx         // Report symptoms (EXISTS - ENHANCE)
├── BodyDiagram.tsx             // Interactive body map (EXISTS)
├── SymptomHistory.tsx          // Past symptoms list
├── SymptomSeveritySlider.tsx   // Rate severity
├── SymptomTimeline.tsx         // Timeline view
└── SymptomPatternAlert.tsx     // Pattern detection alerts
```

### FEATURE AREA 12: Notifications & Reminders

**Priority**: HIGH
**Effort**: 3-4 days

**Features**:
1. Medication reminders
2. Appointment reminders
3. Vital recording reminders
4. Exercise reminders
5. Push notification support
6. Email/SMS notifications
7. Notification preferences

**UI Components**:
```typescript
// components/patient/notifications/
├── NotificationCenter.tsx      // All notifications
├── NotificationCard.tsx        // Single notification
├── ReminderSettings.tsx        // Configure reminders
├── QuietHoursSettings.tsx      // Set do-not-disturb
└── NotificationPreferences.tsx // Notification channels
```

### FEATURE AREA 13: Family/Caregiver Access

**Priority**: MEDIUM
**Effort**: 4-5 days

**Features**:
1. Invite family members/caregivers
2. Set access permissions
3. Share health data
4. Caregiver dashboard
5. Emergency contact management

**UI Components**:
```typescript
// components/patient/family/
├── FamilyMemberList.tsx        // Manage family access
├── InviteCaregiverForm.tsx     // Send invitation
├── PermissionSettings.tsx      // Set what they can see
├── EmergencyContacts.tsx       // Manage emergency contacts
└── SharedDataView.tsx          // What's being shared
```

### FEATURE AREA 14: Health Goals & Targets

**Priority**: MEDIUM
**Effort**: 2-3 days

**Features**:
1. Set personal health goals
2. Track goal progress
3. Goal milestones
4. Doctor-set targets
5. Achievement celebrations

**UI Components**:
```typescript
// components/patient/goals/
├── GoalsDashboard.tsx          // Overview of all goals
├── GoalCard.tsx                // Single goal display
├── GoalProgressBar.tsx         // Visual progress
├── SetGoalForm.tsx             // Create new goal
├── GoalMilestones.tsx          // Track milestones
└── GoalCelebration.tsx         // Achievement animation
```

### FEATURE AREA 15: Educational Content

**Priority**: MEDIUM
**Effort**: 3-4 days

**Features**:
1. Condition-specific education
2. Medication information
3. Lifestyle recommendations
4. Video content library
5. FAQ and support

**UI Components**:
```typescript
// components/patient/education/
├── EducationLibrary.tsx        // Browse all content
├── ArticleCard.tsx             // Educational article
├── VideoPlayer.tsx             // Health videos
├── ConditionGuide.tsx          // Condition-specific info
├── MedicationInfo.tsx          // Drug information
└── FAQSection.tsx              // Frequently asked questions
```

### FEATURE AREA 16: Secure Messaging

**Priority**: MEDIUM
**Effort**: 3 days

**Features**:
1. Message care team
2. View message history
3. Attach files/images
4. Read receipts
5. Response time expectations

**UI Components**:
```typescript
// components/patient/messaging/
├── MessageInbox.tsx            // All conversations
├── ConversationView.tsx        // Single conversation
├── MessageComposer.tsx         // Write new message
├── AttachmentUpload.tsx        // Add files/images
└── MessageCard.tsx             // Single message display
```

---

## 5. Schema Changes Required

### 5.1 New Models to Add

```prisma
// ==============================================================
// MEDICATION ADHERENCE TRACKING
// ==============================================================

model MedicationLog {
  id                    String   @id @default(uuid())
  medicationId          String
  patientId             String
  scheduledTime         DateTime
  actualTime            DateTime?
  status                MedicationLogStatus @default(PENDING)
  skipReason            String?
  notes                 String?
  sideEffectsReported   Boolean @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  medication            Medication @relation(fields: [medicationId], references: [id])
  patient               Patient @relation(fields: [patientId], references: [id])
  sideEffects           SideEffectReport[]
  
  @@map("medication_logs")
  @@index([patientId, scheduledTime])
  @@index([medicationId, status])
}

enum MedicationLogStatus {
  PENDING
  TAKEN
  SKIPPED
  LATE
  MISSED
}

model SideEffectReport {
  id              String   @id @default(uuid())
  medicationLogId String
  patientId       String
  symptom         String
  severity        SideEffectSeverity
  description     String?
  reportedAt      DateTime @default(now())
  reviewedAt      DateTime?
  reviewedBy      String?
  
  medicationLog   MedicationLog @relation(fields: [medicationLogId], references: [id])
  patient         Patient @relation(fields: [patientId], references: [id])
  
  @@map("side_effect_reports")
}

enum SideEffectSeverity {
  MILD
  MODERATE
  SEVERE
}

model RefillRequest {
  id              String   @id @default(uuid())
  medicationId    String
  patientId       String
  requestedAt     DateTime @default(now())
  status          RefillStatus @default(PENDING)
  processedAt     DateTime?
  processedBy     String?
  notes           String?
  pharmacyId      String?
  
  medication      Medication @relation(fields: [medicationId], references: [id])
  patient         Patient @relation(fields: [patientId], references: [id])
  
  @@map("refill_requests")
}

enum RefillStatus {
  PENDING
  APPROVED
  DENIED
  DISPENSED
}

// ==============================================================
// DIET & NUTRITION TRACKING
// ==============================================================

model DietPlan {
  id              String   @id @default(uuid())
  patientId       String
  carePlanId      String?
  name            String
  description     String?
  targetCalories  Int?
  targetProtein   Int?     // grams
  targetCarbs     Int?     // grams
  targetFat       Int?     // grams
  targetFiber     Int?     // grams
  targetWater     Int?     // ml
  restrictions    String[] // e.g., ["gluten-free", "low-sodium"]
  startDate       DateTime
  endDate         DateTime?
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  patient         Patient @relation(fields: [patientId], references: [id])
  carePlan        CarePlan? @relation(fields: [carePlanId], references: [id])
  meals           MealPlan[]
  mealLogs        MealLog[]
  
  @@map("diet_plans")
}

model MealPlan {
  id              String   @id @default(uuid())
  dietPlanId      String
  mealType        MealType
  scheduledTime   String   // e.g., "08:00"
  name            String
  description     String?
  targetCalories  Int?
  foods           Json?    // Recommended foods
  
  dietPlan        DietPlan @relation(fields: [dietPlanId], references: [id])
  
  @@map("meal_plans")
}

enum MealType {
  BREAKFAST
  MORNING_SNACK
  LUNCH
  AFTERNOON_SNACK
  DINNER
  EVENING_SNACK
}

model MealLog {
  id              String   @id @default(uuid())
  patientId       String
  dietPlanId      String?
  mealType        MealType
  loggedAt        DateTime @default(now())
  foods           FoodLogItem[]
  totalCalories   Int?
  totalProtein    Float?
  totalCarbs      Float?
  totalFat        Float?
  totalFiber      Float?
  notes           String?
  moodBefore      Int?     // 1-5 scale
  moodAfter       Int?     // 1-5 scale
  photoUrl        String?
  
  patient         Patient @relation(fields: [patientId], references: [id])
  dietPlan        DietPlan? @relation(fields: [dietPlanId], references: [id])
  
  @@map("meal_logs")
}

model FoodLogItem {
  id              String   @id @default(uuid())
  mealLogId       String
  foodName        String
  quantity        Float
  unit            String   // e.g., "serving", "grams", "cups"
  calories        Int?
  protein         Float?
  carbs           Float?
  fat             Float?
  fiber           Float?
  
  mealLog         MealLog @relation(fields: [mealLogId], references: [id])
  
  @@map("food_log_items")
}

model WaterIntakeLog {
  id              String   @id @default(uuid())
  patientId       String
  amount          Int      // ml
  loggedAt        DateTime @default(now())
  
  patient         Patient @relation(fields: [patientId], references: [id])
  
  @@map("water_intake_logs")
  @@index([patientId, loggedAt])
}

// ==============================================================
// EXERCISE & ACTIVITY TRACKING
// ==============================================================

model ExercisePlan {
  id              String   @id @default(uuid())
  patientId       String
  carePlanId      String?
  name            String
  description     String?
  weeklyGoalMinutes Int?
  weeklyGoalSessions Int?
  restrictions    String[] // e.g., ["no high impact", "avoid lifting > 10kg"]
  startDate       DateTime
  endDate         DateTime?
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  patient         Patient @relation(fields: [patientId], references: [id])
  carePlan        CarePlan? @relation(fields: [carePlanId], references: [id])
  scheduledWorkouts ScheduledWorkout[]
  exerciseLogs    ExerciseLog[]
  
  @@map("exercise_plans")
}

model ScheduledWorkout {
  id              String   @id @default(uuid())
  exercisePlanId  String
  dayOfWeek       Int      // 0-6 (Sunday-Saturday)
  name            String
  description     String?
  targetDuration  Int      // minutes
  exercises       Json     // Array of exercise objects
  
  exercisePlan    ExercisePlan @relation(fields: [exercisePlanId], references: [id])
  
  @@map("scheduled_workouts")
}

model ExerciseLog {
  id              String   @id @default(uuid())
  patientId       String
  exercisePlanId  String?
  activityType    String
  name            String
  duration        Int      // minutes
  caloriesBurned  Int?
  distance        Float?   // km
  steps           Int?
  heartRateAvg    Int?
  heartRateMax    Int?
  intensity       ExerciseIntensity
  notes           String?
  loggedAt        DateTime @default(now())
  
  patient         Patient @relation(fields: [patientId], references: [id])
  exercisePlan    ExercisePlan? @relation(fields: [exercisePlanId], references: [id])
  
  @@map("exercise_logs")
  @@index([patientId, loggedAt])
}

enum ExerciseIntensity {
  LOW
  MODERATE
  HIGH
  VERY_HIGH
}

model DailyActivitySummary {
  id              String   @id @default(uuid())
  patientId       String
  date            DateTime @db.Date
  totalSteps      Int      @default(0)
  totalDistance   Float    @default(0) // km
  totalCaloriesBurned Int  @default(0)
  activeMinutes   Int      @default(0)
  sedentaryMinutes Int?
  flightsClimbed  Int?
  restingHeartRate Int?
  
  patient         Patient @relation(fields: [patientId], references: [id])
  
  @@unique([patientId, date])
  @@map("daily_activity_summaries")
}

// ==============================================================
// HEALTH GOALS
// ==============================================================

model HealthGoal {
  id              String   @id @default(uuid())
  patientId       String
  category        GoalCategory
  title           String
  description     String?
  targetValue     Float?
  currentValue    Float?
  unit            String?
  startDate       DateTime
  targetDate      DateTime?
  completedAt     DateTime?
  status          GoalStatus @default(IN_PROGRESS)
  isPatientCreated Boolean @default(false)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  patient         Patient @relation(fields: [patientId], references: [id])
  milestones      GoalMilestone[]
  progressLogs    GoalProgressLog[]
  
  @@map("health_goals")
}

enum GoalCategory {
  WEIGHT
  BLOOD_PRESSURE
  BLOOD_SUGAR
  EXERCISE
  NUTRITION
  MEDICATION_ADHERENCE
  SLEEP
  STRESS
  CUSTOM
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  ACHIEVED
  MISSED
  CANCELLED
}

model GoalMilestone {
  id              String   @id @default(uuid())
  goalId          String
  title           String
  targetValue     Float?
  achievedAt      DateTime?
  sortOrder       Int      @default(0)
  
  goal            HealthGoal @relation(fields: [goalId], references: [id])
  
  @@map("goal_milestones")
}

model GoalProgressLog {
  id              String   @id @default(uuid())
  goalId          String
  value           Float
  notes           String?
  loggedAt        DateTime @default(now())
  
  goal            HealthGoal @relation(fields: [goalId], references: [id])
  
  @@map("goal_progress_logs")
}

// ==============================================================
// FAMILY/CAREGIVER ACCESS
// ==============================================================

model CaregiverAccess {
  id              String   @id @default(uuid())
  patientId       String
  caregiverId     String
  relationship    String   // e.g., "spouse", "parent", "child", "caregiver"
  accessLevel     CaregiverAccessLevel @default(VIEW_ONLY)
  permissions     Json     // Granular permissions
  invitedAt       DateTime @default(now())
  acceptedAt      DateTime?
  expiresAt       DateTime?
  status          CaregiverAccessStatus @default(PENDING)
  inviteToken     String?  @unique
  
  patient         Patient @relation(fields: [patientId], references: [id])
  caregiver       User @relation(fields: [caregiverId], references: [id])
  
  @@unique([patientId, caregiverId])
  @@map("caregiver_access")
}

enum CaregiverAccessLevel {
  VIEW_ONLY
  VIEW_AND_LOG
  FULL_ACCESS
}

enum CaregiverAccessStatus {
  PENDING
  ACTIVE
  REVOKED
  EXPIRED
}

model EmergencyContact {
  id              String   @id @default(uuid())
  patientId       String
  name            String
  relationship    String
  phone           String
  email           String?
  isPrimary       Boolean  @default(false)
  notifyOnEmergency Boolean @default(true)
  notifyOnMissedMeds Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  patient         Patient @relation(fields: [patientId], references: [id])
  
  @@map("emergency_contacts")
}

// ==============================================================
// NOTIFICATIONS & REMINDERS
// ==============================================================

model PatientNotificationPreference {
  id                      String   @id @default(uuid())
  patientId               String   @unique
  
  // Channel preferences
  pushEnabled             Boolean @default(true)
  emailEnabled            Boolean @default(true)
  smsEnabled              Boolean @default(false)
  
  // Notification type preferences
  medicationReminders     Boolean @default(true)
  appointmentReminders    Boolean @default(true)
  vitalReminders          Boolean @default(true)
  exerciseReminders       Boolean @default(true)
  labResultAlerts         Boolean @default(true)
  achievementAlerts       Boolean @default(true)
  careTeamMessages        Boolean @default(true)
  
  // Timing preferences
  reminderLeadTime        Int     @default(15) // minutes before
  quietHoursStart         String? // e.g., "22:00"
  quietHoursEnd           String? // e.g., "07:00"
  timezone                String  @default("UTC")
  
  patient                 Patient @relation(fields: [patientId], references: [id])
  
  @@map("patient_notification_preferences")
}

model PatientReminder {
  id              String   @id @default(uuid())
  patientId       String
  type            ReminderType
  title           String
  message         String?
  scheduledFor    DateTime
  sentAt          DateTime?
  acknowledgedAt  DateTime?
  status          ReminderStatus @default(SCHEDULED)
  relatedId       String?  // ID of related medication, appointment, etc.
  relatedType     String?  // "medication", "appointment", "vital", etc.
  
  patient         Patient @relation(fields: [patientId], references: [id])
  
  @@map("patient_reminders")
  @@index([patientId, scheduledFor])
  @@index([status, scheduledFor])
}

enum ReminderType {
  MEDICATION
  APPOINTMENT
  VITAL_RECORDING
  EXERCISE
  MEAL
  WATER_INTAKE
  CUSTOM
}

enum ReminderStatus {
  SCHEDULED
  SENT
  ACKNOWLEDGED
  SNOOZED
  EXPIRED
}

// ==============================================================
// EDUCATIONAL CONTENT
// ==============================================================

model EducationalContent {
  id              String   @id @default(uuid())
  title           String
  slug            String   @unique
  contentType     ContentType
  category        String
  tags            String[]
  summary         String?
  content         String   // Rich text / markdown
  mediaUrl        String?
  thumbnailUrl    String?
  duration        Int?     // For videos, in seconds
  difficulty      ContentDifficulty @default(BEGINNER)
  relatedConditions String[]
  isPublished     Boolean  @default(false)
  viewCount       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  patientViews    PatientContentView[]
  
  @@map("educational_content")
}

enum ContentType {
  ARTICLE
  VIDEO
  INFOGRAPHIC
  FAQ
  GUIDE
}

enum ContentDifficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model PatientContentView {
  id              String   @id @default(uuid())
  patientId       String
  contentId       String
  viewedAt        DateTime @default(now())
  completedAt     DateTime?
  rating          Int?     // 1-5
  feedback        String?
  
  patient         Patient @relation(fields: [patientId], references: [id])
  content         EducationalContent @relation(fields: [contentId], references: [id])
  
  @@unique([patientId, contentId])
  @@map("patient_content_views")
}

// ==============================================================
// SECURE MESSAGING
// ==============================================================

model PatientMessage {
  id              String   @id @default(uuid())
  conversationId  String
  senderId        String
  senderType      MessageSenderType
  content         String
  attachments     Json?    // Array of attachment objects
  isRead          Boolean  @default(false)
  readAt          DateTime?
  createdAt       DateTime @default(now())
  
  conversation    MessageConversation @relation(fields: [conversationId], references: [id])
  
  @@map("patient_messages")
  @@index([conversationId, createdAt])
}

enum MessageSenderType {
  PATIENT
  DOCTOR
  HSP
  SYSTEM
}

model MessageConversation {
  id              String   @id @default(uuid())
  patientId       String
  providerId      String   // Doctor or HSP
  providerType    String   // "doctor" or "hsp"
  subject         String?
  status          ConversationStatus @default(OPEN)
  lastMessageAt   DateTime @default(now())
  createdAt       DateTime @default(now())
  
  patient         Patient @relation(fields: [patientId], references: [id])
  messages        PatientMessage[]
  
  @@map("message_conversations")
  @@index([patientId, lastMessageAt])
}

enum ConversationStatus {
  OPEN
  CLOSED
  ARCHIVED
}

// ==============================================================
// PATIENT PREFERENCES & SETTINGS
// ==============================================================

model PatientSettings {
  id                      String   @id @default(uuid())
  patientId               String   @unique
  
  // Display preferences
  theme                   String   @default("light")
  language                String   @default("en")
  dateFormat              String   @default("MM/DD/YYYY")
  timeFormat              String   @default("12h")
  measurementSystem       String   @default("imperial") // imperial or metric
  
  // Privacy settings
  shareDataWithCareTeam   Boolean  @default(true)
  allowAnonymousAnalytics Boolean  @default(true)
  showOnLeaderboard       Boolean  @default(false)
  
  // Accessibility
  fontSize                String   @default("medium")
  highContrast            Boolean  @default(false)
  reduceMotion            Boolean  @default(false)
  
  patient                 Patient @relation(fields: [patientId], references: [id])
  
  @@map("patient_settings")
}
```

### 5.2 Updates to Existing Models

```prisma
// Add to existing Patient model
model Patient {
  // ... existing fields ...
  
  // Add new relations
  medicationLogs          MedicationLog[]
  sideEffectReports       SideEffectReport[]
  refillRequests          RefillRequest[]
  dietPlans               DietPlan[]
  mealLogs                MealLog[]
  waterIntakeLogs         WaterIntakeLog[]
  exercisePlans           ExercisePlan[]
  exerciseLogs            ExerciseLog[]
  dailyActivitySummaries  DailyActivitySummary[]
  healthGoals             HealthGoal[]
  caregiverAccess         CaregiverAccess[]
  emergencyContacts       EmergencyContact[]
  notificationPreference  PatientNotificationPreference?
  reminders               PatientReminder[]
  contentViews            PatientContentView[]
  conversations           MessageConversation[]
  settings                PatientSettings?
}

// Add to existing User model (for caregiver relation)
model User {
  // ... existing fields ...
  caregiverAccessTo       CaregiverAccess[]
}

// Add to existing CarePlan model
model CarePlan {
  // ... existing fields ...
  dietPlans               DietPlan[]
  exercisePlans           ExercisePlan[]
}

// Add to existing Medication model
model Medication {
  // ... existing fields ...
  logs                    MedicationLog[]
  refillRequests          RefillRequest[]
}
```

---

## 6. API Implementation Requirements

### 6.1 Medication Adherence APIs

```typescript
// ==============================================================
// FILE: app/api/patient/medications/route.ts
// ==============================================================

/**
 * GET /api/patient/medications
 * Get patient's medications with today's schedule
 */
export async function GET(request: NextRequest) {
  // Query params: date (optional, defaults to today)
  // Returns: medications with schedules and adherence status
}

/**
 * POST /api/patient/medications/log
 * Log medication taken/skipped
 */
export async function POST(request: NextRequest) {
  // Body: { medicationId, status, actualTime?, skipReason?, notes? }
  // Returns: created medication log
}

// ==============================================================
// FILE: app/api/patient/medications/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/medications/[id]
 * Get single medication details
 */

// ==============================================================
// FILE: app/api/patient/medications/[id]/history/route.ts
// ==============================================================

/**
 * GET /api/patient/medications/[id]/history
 * Get medication adherence history
 */

// ==============================================================
// FILE: app/api/patient/medications/refill/route.ts
// ==============================================================

/**
 * POST /api/patient/medications/refill
 * Request medication refill
 */

// ==============================================================
// FILE: app/api/patient/medications/side-effects/route.ts
// ==============================================================

/**
 * POST /api/patient/medications/side-effects
 * Report medication side effects
 */
```

### 6.2 Diet & Nutrition APIs

```typescript
// ==============================================================
// FILE: app/api/patient/diet/plan/route.ts
// ==============================================================

/**
 * GET /api/patient/diet/plan
 * Get patient's active diet plan
 */

// ==============================================================
// FILE: app/api/patient/diet/meals/route.ts
// ==============================================================

/**
 * GET /api/patient/diet/meals
 * Get meal logs for date range
 */

/**
 * POST /api/patient/diet/meals
 * Log a meal
 */

// ==============================================================
// FILE: app/api/patient/diet/meals/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/diet/meals/[id]
 * Get single meal log
 */

/**
 * PUT /api/patient/diet/meals/[id]
 * Update meal log
 */

/**
 * DELETE /api/patient/diet/meals/[id]
 * Delete meal log
 */

// ==============================================================
// FILE: app/api/patient/diet/water/route.ts
// ==============================================================

/**
 * GET /api/patient/diet/water
 * Get water intake for date
 */

/**
 * POST /api/patient/diet/water
 * Log water intake
 */

// ==============================================================
// FILE: app/api/patient/diet/nutrition-summary/route.ts
// ==============================================================

/**
 * GET /api/patient/diet/nutrition-summary
 * Get daily nutrition summary
 */
```

### 6.3 Exercise & Activity APIs

```typescript
// ==============================================================
// FILE: app/api/patient/exercise/plan/route.ts
// ==============================================================

/**
 * GET /api/patient/exercise/plan
 * Get patient's active exercise plan
 */

// ==============================================================
// FILE: app/api/patient/exercise/logs/route.ts
// ==============================================================

/**
 * GET /api/patient/exercise/logs
 * Get exercise logs for date range
 */

/**
 * POST /api/patient/exercise/logs
 * Log an exercise/workout
 */

// ==============================================================
// FILE: app/api/patient/exercise/activity/route.ts
// ==============================================================

/**
 * GET /api/patient/exercise/activity
 * Get daily activity summary
 */

/**
 * POST /api/patient/exercise/activity
 * Update daily activity (steps, distance, etc.)
 */
```

### 6.4 Vitals APIs

```typescript
// ==============================================================
// FILE: app/api/patient/vitals/route.ts
// ==============================================================

/**
 * GET /api/patient/vitals
 * Get vital readings with optional filters
 * Query: vitalType, startDate, endDate
 */

/**
 * POST /api/patient/vitals
 * Record vital reading
 */

// ==============================================================
// FILE: app/api/patient/vitals/trends/route.ts
// ==============================================================

/**
 * GET /api/patient/vitals/trends
 * Get vital trends for charts
 * Query: vitalType, period (week/month/year)
 */

// ==============================================================
// FILE: app/api/patient/vitals/alerts/route.ts
// ==============================================================

/**
 * GET /api/patient/vitals/alerts
 * Get vitals that are out of normal range
 */
```

### 6.5 Appointments APIs

```typescript
// ==============================================================
// FILE: app/api/patient/appointments/route.ts
// ==============================================================

/**
 * GET /api/patient/appointments
 * Get patient's appointments
 * Query: status, startDate, endDate
 */

// ==============================================================
// FILE: app/api/patient/appointments/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/appointments/[id]
 * Get single appointment details
 */

// ==============================================================
// FILE: app/api/patient/appointments/upcoming/route.ts
// ==============================================================

/**
 * GET /api/patient/appointments/upcoming
 * Get next N upcoming appointments
 */

// ==============================================================
// FILE: app/api/patient/appointments/[id]/reschedule/route.ts
// ==============================================================

/**
 * POST /api/patient/appointments/[id]/reschedule
 * Request appointment reschedule
 */
```

### 6.6 Care Plans APIs

```typescript
// ==============================================================
// FILE: app/api/patient/care-plans/route.ts
// ==============================================================

/**
 * GET /api/patient/care-plans
 * Get patient's care plans
 * Query: status (active/completed/all)
 */

// ==============================================================
// FILE: app/api/patient/care-plans/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/care-plans/[id]
 * Get full care plan details
 */

// ==============================================================
// FILE: app/api/patient/care-plans/[id]/progress/route.ts
// ==============================================================

/**
 * GET /api/patient/care-plans/[id]/progress
 * Get care plan progress metrics
 */
```

### 6.7 Gamification APIs

```typescript
// ==============================================================
// FILE: app/api/patient/gamification/profile/route.ts
// ==============================================================

/**
 * GET /api/patient/gamification/profile
 * Get patient's gamification profile (points, level, streaks)
 */

// ==============================================================
// FILE: app/api/patient/gamification/badges/route.ts
// ==============================================================

/**
 * GET /api/patient/gamification/badges
 * Get patient's earned badges
 */

// ==============================================================
// FILE: app/api/patient/gamification/challenges/route.ts
// ==============================================================

/**
 * GET /api/patient/gamification/challenges
 * Get active challenges
 */

/**
 * POST /api/patient/gamification/challenges/[id]/join
 * Join a challenge
 */

// ==============================================================
// FILE: app/api/patient/gamification/leaderboard/route.ts
// ==============================================================

/**
 * GET /api/patient/gamification/leaderboard
 * Get leaderboard (if patient opts in)
 */
```

### 6.8 Video Consultation APIs

```typescript
// ==============================================================
// FILE: app/api/patient/consultations/route.ts
// ==============================================================

/**
 * GET /api/patient/consultations
 * Get patient's video consultations
 */

// ==============================================================
// FILE: app/api/patient/consultations/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/consultations/[id]
 * Get consultation details with join info
 */

// ==============================================================
// FILE: app/api/patient/consultations/[id]/join/route.ts
// ==============================================================

/**
 * POST /api/patient/consultations/[id]/join
 * Get token to join consultation
 */

// ==============================================================
// FILE: app/api/patient/consultations/[id]/rate/route.ts
// ==============================================================

/**
 * POST /api/patient/consultations/[id]/rate
 * Rate completed consultation
 */
```

### 6.9 Lab Results APIs

```typescript
// ==============================================================
// FILE: app/api/patient/lab-results/route.ts
// ==============================================================

/**
 * GET /api/patient/lab-results
 * Get patient's lab results
 */

// ==============================================================
// FILE: app/api/patient/lab-results/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/lab-results/[id]
 * Get single lab result detail
 */

// ==============================================================
// FILE: app/api/patient/lab-results/trends/route.ts
// ==============================================================

/**
 * GET /api/patient/lab-results/trends
 * Get lab result trends
 * Query: testCode
 */
```

### 6.10 Health Goals APIs

```typescript
// ==============================================================
// FILE: app/api/patient/goals/route.ts
// ==============================================================

/**
 * GET /api/patient/goals
 * Get patient's health goals
 */

/**
 * POST /api/patient/goals
 * Create new health goal (patient-created)
 */

// ==============================================================
// FILE: app/api/patient/goals/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/goals/[id]
 * Get goal details
 */

/**
 * PUT /api/patient/goals/[id]
 * Update goal
 */

// ==============================================================
// FILE: app/api/patient/goals/[id]/progress/route.ts
// ==============================================================

/**
 * POST /api/patient/goals/[id]/progress
 * Log goal progress
 */
```

### 6.11 Family/Caregiver APIs

```typescript
// ==============================================================
// FILE: app/api/patient/caregivers/route.ts
// ==============================================================

/**
 * GET /api/patient/caregivers
 * Get patient's caregivers
 */

/**
 * POST /api/patient/caregivers
 * Invite a caregiver
 */

// ==============================================================
// FILE: app/api/patient/caregivers/[id]/route.ts
// ==============================================================

/**
 * PUT /api/patient/caregivers/[id]
 * Update caregiver permissions
 */

/**
 * DELETE /api/patient/caregivers/[id]
 * Revoke caregiver access
 */

// ==============================================================
// FILE: app/api/patient/emergency-contacts/route.ts
// ==============================================================

/**
 * GET /api/patient/emergency-contacts
 * Get emergency contacts
 */

/**
 * POST /api/patient/emergency-contacts
 * Add emergency contact
 */

/**
 * PUT /api/patient/emergency-contacts/[id]
 * Update emergency contact
 */

/**
 * DELETE /api/patient/emergency-contacts/[id]
 * Remove emergency contact
 */
```

### 6.12 Notifications APIs

```typescript
// ==============================================================
// FILE: app/api/patient/notifications/route.ts
// ==============================================================

/**
 * GET /api/patient/notifications
 * Get patient's notifications
 */

/**
 * PUT /api/patient/notifications/[id]/read
 * Mark notification as read
 */

// ==============================================================
// FILE: app/api/patient/notifications/preferences/route.ts
// ==============================================================

/**
 * GET /api/patient/notifications/preferences
 * Get notification preferences
 */

/**
 * PUT /api/patient/notifications/preferences
 * Update notification preferences
 */

// ==============================================================
// FILE: app/api/patient/reminders/route.ts
// ==============================================================

/**
 * GET /api/patient/reminders
 * Get patient's reminders
 */

/**
 * POST /api/patient/reminders/[id]/acknowledge
 * Acknowledge a reminder
 */

/**
 * POST /api/patient/reminders/[id]/snooze
 * Snooze a reminder
 */
```

### 6.13 Messaging APIs

```typescript
// ==============================================================
// FILE: app/api/patient/messages/route.ts
// ==============================================================

/**
 * GET /api/patient/messages
 * Get patient's conversations
 */

/**
 * POST /api/patient/messages
 * Start new conversation or send message
 */

// ==============================================================
// FILE: app/api/patient/messages/[conversationId]/route.ts
// ==============================================================

/**
 * GET /api/patient/messages/[conversationId]
 * Get conversation messages
 */

/**
 * POST /api/patient/messages/[conversationId]
 * Send message in conversation
 */
```

### 6.14 Education APIs

```typescript
// ==============================================================
// FILE: app/api/patient/education/route.ts
// ==============================================================

/**
 * GET /api/patient/education
 * Get educational content
 * Query: category, contentType, relatedCondition
 */

// ==============================================================
// FILE: app/api/patient/education/[id]/route.ts
// ==============================================================

/**
 * GET /api/patient/education/[id]
 * Get single content item
 */

/**
 * POST /api/patient/education/[id]/view
 * Mark content as viewed
 */

/**
 * POST /api/patient/education/[id]/rate
 * Rate content
 */

// ==============================================================
// FILE: app/api/patient/education/recommended/route.ts
// ==============================================================

/**
 * GET /api/patient/education/recommended
 * Get personalized content recommendations
 */
```

### 6.15 Settings APIs

```typescript
// ==============================================================
// FILE: app/api/patient/settings/route.ts
// ==============================================================

/**
 * GET /api/patient/settings
 * Get patient settings
 */

/**
 * PUT /api/patient/settings
 * Update patient settings
 */

// ==============================================================
// FILE: app/api/patient/profile/route.ts
// ==============================================================

/**
 * GET /api/patient/profile
 * Get patient profile
 */

/**
 * PUT /api/patient/profile
 * Update patient profile
 */
```

### 6.16 Dashboard APIs

```typescript
// ==============================================================
// FILE: app/api/patient/dashboard/route.ts
// ==============================================================

/**
 * GET /api/patient/dashboard
 * Get comprehensive dashboard data
 * Returns:
 * - todaysTasks (medications, appointments, vitals due)
 * - adherenceScore (weekly)
 * - upcomingAppointments
 * - recentActivity
 * - healthScore
 * - activeAlerts
 * - gamificationSummary (points, level, streak)
 */

// ==============================================================
// FILE: app/api/patient/dashboard/tasks/route.ts
// ==============================================================

/**
 * GET /api/patient/dashboard/tasks
 * Get today's tasks only
 */

// ==============================================================
// FILE: app/api/patient/dashboard/adherence/route.ts
// ==============================================================

/**
 * GET /api/patient/dashboard/adherence
 * Get adherence summary
 * Query: period (day/week/month)
 */
```

---

## 7. Frontend Component Requirements

### 7.1 Complete Component Structure

```
components/patient/
├── dashboard/
│   ├── PatientDashboard.tsx        # Main dashboard container
│   ├── TodaysTasks.tsx             # Today's task list
│   ├── AdherenceScoreCard.tsx      # Adherence metrics
│   ├── HealthScoreCard.tsx         # Overall health score
│   ├── QuickActions.tsx            # Quick action buttons
│   ├── RecentActivity.tsx          # Activity feed
│   └── UpcomingAppointments.tsx    # Appointment preview
│
├── medications/
│   ├── MedicationSchedule.tsx      # Daily schedule view
│   ├── MedicationCard.tsx          # Single medication display
│   ├── MedicationCheckIn.tsx       # Mark taken/skipped modal
│   ├── MedicationDetails.tsx       # Full medication info
│   ├── MedicationHistory.tsx       # Adherence history
│   ├── AdherenceChart.tsx          # Visual adherence stats
│   ├── RefillRequestForm.tsx       # Request refill
│   └── SideEffectReporter.tsx      # Report side effects
│
├── vitals/
│   ├── VitalRecorder.tsx           # Record vitals form
│   ├── VitalTrendChart.tsx         # Trend visualization
│   ├── VitalCard.tsx               # Single vital display
│   ├── VitalAlertBanner.tsx        # Out-of-range alert
│   ├── VitalHistory.tsx            # Historical table
│   ├── BloodPressureInput.tsx      # BP-specific input
│   └── BloodSugarInput.tsx         # Blood sugar input
│
├── diet/
│   ├── DietPlanView.tsx            # View diet plan
│   ├── MealLogger.tsx              # Log meal form
│   ├── FoodSearchInput.tsx         # Food search
│   ├── NutritionSummary.tsx        # Daily summary
│   ├── WaterIntakeTracker.tsx      # Water tracking
│   ├── CalorieProgressBar.tsx      # Calorie progress
│   ├── MacroChart.tsx              # Macros breakdown
│   └── DietComparisonView.tsx      # Prescribed vs actual
│
├── exercise/
│   ├── WorkoutPlanView.tsx         # View exercise plan
│   ├── ExerciseLogger.tsx          # Log workout
│   ├── ExerciseCard.tsx            # Single exercise
│   ├── ActivitySummary.tsx         # Daily activity
│   ├── StepCounter.tsx             # Steps widget
│   ├── ExerciseLibrary.tsx         # Exercise database
│   └── WorkoutCalendar.tsx         # Calendar view
│
├── appointments/
│   ├── AppointmentList.tsx         # All appointments
│   ├── AppointmentCard.tsx         # Single appointment
│   ├── AppointmentCalendar.tsx     # Calendar view
│   ├── AppointmentReminder.tsx     # Reminder display
│   ├── PreAppointmentChecklist.tsx # Preparation list
│   ├── JoinVideoButton.tsx         # Video call button
│   └── RescheduleRequestForm.tsx   # Request change
│
├── video-consultation/
│   ├── ConsultationList.tsx        # All consultations
│   ├── ConsultationWaitingRoom.tsx # Pre-call waiting
│   ├── PatientVideoRoom.tsx        # Video call UI
│   ├── ConsultationChat.tsx        # In-call chat
│   ├── ConsultationSummary.tsx     # Post-call summary
│   └── ConsultationRating.tsx      # Rate experience
│
├── lab-results/
│   ├── LabResultsList.tsx          # All results
│   ├── LabResultDetail.tsx         # Single result
│   ├── LabResultChart.tsx          # Trend chart
│   ├── NormalRangeIndicator.tsx    # Range display
│   └── LabResultExport.tsx         # Export results
│
├── gamification/
│   ├── GamificationDashboard.tsx   # Main achievements page
│   ├── PointsDisplay.tsx           # Points/level widget
│   ├── BadgeGallery.tsx            # All badges
│   ├── BadgeCard.tsx               # Single badge
│   ├── ChallengeList.tsx           # Active challenges
│   ├── ChallengeCard.tsx           # Single challenge
│   ├── StreakCounter.tsx           # Streak display
│   ├── RewardsShop.tsx             # Redeem points
│   ├── LeaderboardView.tsx         # Leaderboard
│   └── ProgressTimeline.tsx        # Journey timeline
│
├── care-plans/
│   ├── CarePlanList.tsx            # All care plans
│   ├── CarePlanDetail.tsx          # Full plan view
│   ├── CarePlanProgress.tsx        # Progress tracking
│   ├── CarePlanTimeline.tsx        # Milestones
│   ├── TreatmentSection.tsx        # Treatment items
│   └── DoctorNotesView.tsx         # Doctor notes
│
├── symptoms/
│   ├── SymptomReporter.tsx         # Report symptoms (ENHANCE)
│   ├── BodyDiagram.tsx             # Interactive body (EXISTS)
│   ├── SymptomHistory.tsx          # Past symptoms
│   ├── SymptomSeveritySlider.tsx   # Severity input
│   ├── SymptomTimeline.tsx         # Timeline view
│   └── SymptomPatternAlert.tsx     # Pattern alerts
│
├── notifications/
│   ├── NotificationCenter.tsx      # All notifications
│   ├── NotificationCard.tsx        # Single notification
│   ├── ReminderSettings.tsx        # Configure reminders
│   ├── QuietHoursSettings.tsx      # DND settings
│   └── NotificationPreferences.tsx # Channel preferences
│
├── family/
│   ├── FamilyMemberList.tsx        # Manage caregivers
│   ├── InviteCaregiverForm.tsx     # Send invitation
│   ├── PermissionSettings.tsx      # Access permissions
│   ├── EmergencyContacts.tsx       # Emergency contacts
│   └── SharedDataView.tsx          # What's shared
│
├── goals/
│   ├── GoalsDashboard.tsx          # All goals
│   ├── GoalCard.tsx                # Single goal
│   ├── GoalProgressBar.tsx         # Progress visual
│   ├── SetGoalForm.tsx             # Create goal
│   ├── GoalMilestones.tsx          # Milestones
│   └── GoalCelebration.tsx         # Achievement animation
│
├── education/
│   ├── EducationLibrary.tsx        # Browse content
│   ├── ArticleCard.tsx             # Article preview
│   ├── VideoPlayer.tsx             # Video player
│   ├── ConditionGuide.tsx          # Condition info
│   ├── MedicationInfo.tsx          # Drug info
│   └── FAQSection.tsx              # FAQs
│
├── messaging/
│   ├── MessageInbox.tsx            # Conversations
│   ├── ConversationView.tsx        # Single conversation
│   ├── MessageComposer.tsx         # Write message
│   ├── AttachmentUpload.tsx        # Add files
│   └── MessageCard.tsx             # Single message
│
├── profile/
│   ├── PatientProfile.tsx          # Profile view
│   ├── ProfileEditor.tsx           # Edit profile
│   ├── MedicalHistoryView.tsx      # Medical history
│   └── InsuranceInfo.tsx           # Insurance details
│
└── settings/
    ├── PatientSettings.tsx         # Settings page
    ├── DisplaySettings.tsx         # Display prefs
    ├── PrivacySettings.tsx         # Privacy options
    └── AccessibilitySettings.tsx   # Accessibility
```

---

## 8. Implementation Priority Matrix

### Phase 1: Core Adherence Features (Weeks 1-2)
**Priority: CRITICAL**

| Feature | Effort | Dependencies | Business Value |
|---------|--------|--------------|----------------|
| Medication Adherence Logging | 3 days | Schema update | ★★★★★ |
| Enhanced Patient Dashboard | 2 days | Medication logging | ★★★★★ |
| Vital Signs Recording | 2 days | None | ★★★★☆ |
| Medication History & Analytics | 2 days | Medication logging | ★★★★☆ |

### Phase 2: Care Tracking Features (Weeks 3-4)
**Priority: HIGH**

| Feature | Effort | Dependencies | Business Value |
|---------|--------|--------------|----------------|
| Diet Plan Viewing & Logging | 4 days | Schema update | ★★★★☆ |
| Exercise Plan & Tracking | 3 days | Schema update | ★★★★☆ |
| Appointment Management | 2 days | None | ★★★★☆ |
| Care Plan Viewing | 2 days | None | ★★★★☆ |

### Phase 3: Engagement Features (Weeks 5-6)
**Priority: HIGH**

| Feature | Effort | Dependencies | Business Value |
|---------|--------|--------------|----------------|
| Gamification UI | 4 days | Schema exists | ★★★★★ |
| Health Goals | 3 days | Schema update | ★★★★☆ |
| Notifications & Reminders | 3 days | Schema update | ★★★★★ |
| Symptom Enhancement | 2 days | Schema exists | ★★★☆☆ |

### Phase 4: Communication Features (Weeks 7-8)
**Priority: MEDIUM**

| Feature | Effort | Dependencies | Business Value |
|---------|--------|--------------|----------------|
| Video Consultation (Patient) | 3 days | Video system exists | ★★★★☆ |
| Lab Results Viewer | 2 days | Lab system exists | ★★★☆☆ |
| Secure Messaging | 3 days | Schema update | ★★★★☆ |
| Educational Content | 3 days | Schema update | ★★★☆☆ |

### Phase 5: Advanced Features (Weeks 9-10)
**Priority: MEDIUM-LOW**

| Feature | Effort | Dependencies | Business Value |
|---------|--------|--------------|----------------|
| Family/Caregiver Access | 4 days | Schema update | ★★★★☆ |
| Patient Settings | 2 days | Schema update | ★★☆☆☆ |
| Profile Management | 1 day | None | ★★☆☆☆ |

---

## Summary

### Total New API Endpoints Required: ~65
### Total New Components Required: ~85
### Total New Prisma Models Required: ~25
### Estimated Total Effort: 8-10 weeks

### Key Implementation Notes for AI Agent:

1. **Always follow Auth.js v5 patterns** for authentication
2. **Use Prisma client with camelCase** (e.g., `prisma.patient`, not `prisma.Patient`)
3. **Follow existing response format**: `{ status, statusCode, payload: { data, message } }`
4. **Implement role-based access control** - Patient can only access own data
5. **Add proper null safety** per CODING_RULES.md
6. **Mobile-first responsive design** for all components
7. **Include loading and error states** for all API calls
8. **Follow TypeScript strict mode** requirements

---

*Document generated for AI Agent implementation guidance*
