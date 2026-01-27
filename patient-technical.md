# Patient Module Technical Implementation Specification
## For AI Agent Implementation

**Document Type**: Technical Specification
**Format**: AI Agent Executable Instructions

---

## IMPLEMENTATION INSTRUCTIONS

### How to Use This Document

This document contains complete specifications for implementing patient features. Each section includes:
1. **Schema Definition** - Prisma model code to add
2. **API Route Code** - Complete API endpoint implementations
3. **Component Specifications** - React component requirements
4. **Test Cases** - Verification tests

Execute implementations in the order specified by the Priority Matrix.

---

## SESSION STATUS UPDATE (2026-01-27)

### Implemented
- Patient dashboard actions + API wiring for scheduled events complete/missed.
- Medication tracker uses real API data and adherence logging endpoint.
- Patient reminders, diet, and exercise pages + APIs (diet/log, exercise/log).
- Schema additions from `patient-schema.md` applied to Prisma schema; Prisma client generated.

### Pending (Top)
- Medication schedule, adherence history, and adherence analytics endpoints + UI.
- Diet/exercise plan endpoints, nutrition/activity summary endpoints + UI.
- Patient vitals list, trends, and alerts endpoints + UI charts.
- Patient appointments list/detail/reschedule endpoints + UI.
- Patient care plan list/detail endpoints + UI.
- Messaging, lab results, video consults, goals, gamification, caregiver access, education content.

## PHASE 1: MEDICATION ADHERENCE SYSTEM

### Task 1.1: Add Medication Logging Schema

**File**: `prisma/schema.prisma`

**Action**: Add the following models to the schema file:

```prisma
// ============================================================
// MEDICATION ADHERENCE TRACKING
// Add these models to prisma/schema.prisma
// ============================================================

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
  
  medication            Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
  patient               Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  sideEffects           SideEffectReport[]
  
  @@map("medication_logs")
  @@index([patientId, scheduledTime])
  @@index([medicationId, status])
  @@index([patientId, status, scheduledTime])
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
  
  medicationLog   MedicationLog @relation(fields: [medicationLogId], references: [id], onDelete: Cascade)
  patient         Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
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
  quantity        Int?
  
  medication      Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
  patient         Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  @@map("refill_requests")
}

enum RefillStatus {
  PENDING
  APPROVED
  DENIED
  DISPENSED
}
```

**Action**: Update the Patient model to add relations:

```prisma
// Add these relations to the existing Patient model
model Patient {
  // ... existing fields ...
  
  medicationLogs          MedicationLog[]
  sideEffectReports       SideEffectReport[]
  refillRequests          RefillRequest[]
}
```

**Action**: Update the Medication model to add relations:

```prisma
// Add these relations to the existing Medication model
model Medication {
  // ... existing fields ...
  
  logs                    MedicationLog[]
  refillRequests          RefillRequest[]
}
```

**Execution**: After adding schema changes, run:
```bash
npx prisma migrate dev --name add_medication_adherence_tracking
npx prisma generate
```

---

### Task 1.2: Create Medication Logging API

**File**: `app/api/patient/medications/route.ts`

```typescript
// ==============================================================
// GET /api/patient/medications
// Get patient's medications with today's schedule and adherence
// ==============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/utils/responseFormatter';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        formatErrorResponse('Unauthorized', 401),
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    
    // Get patient's ID
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        formatErrorResponse('Patient profile not found', 404),
        { status: 404 }
      );
    }

    // Get active medications with their care plans
    const medications = await prisma.medication.findMany({
      where: {
        carePlan: {
          patientId: patient.id,
          status: 'ACTIVE'
        },
        status: 'ACTIVE'
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            manufacturer: true,
            dosageForm: true,
            strength: true,
            instructions: true
          }
        },
        carePlan: {
          select: {
            id: true,
            name: true
          }
        },
        logs: {
          where: {
            scheduledTime: {
              gte: startOfDay(targetDate),
              lte: endOfDay(targetDate)
            }
          },
          orderBy: {
            scheduledTime: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Generate schedule for today based on frequency
    const medicationsWithSchedule = medications.map(med => {
      const schedule = generateMedicationSchedule(med, targetDate);
      const todaysLogs = med.logs || [];
      
      return {
        id: med.id,
        medicine: med.medicine,
        dosage: med.dosage,
        frequency: med.frequency,
        instructions: med.instructions,
        startDate: med.startDate,
        endDate: med.endDate,
        carePlan: med.carePlan,
        schedule: schedule.map(scheduledTime => {
          const existingLog = todaysLogs.find(
            log => new Date(log.scheduledTime).getTime() === scheduledTime.getTime()
          );
          return {
            scheduledTime,
            status: existingLog?.status || 'PENDING',
            actualTime: existingLog?.actualTime || null,
            logId: existingLog?.id || null
          };
        }),
        adherenceToday: calculateDayAdherence(todaysLogs, schedule.length)
      };
    });

    // Calculate overall adherence for the week
    const weekStart = new Date(targetDate);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weeklyLogs = await prisma.medicationLog.findMany({
      where: {
        patientId: patient.id,
        scheduledTime: {
          gte: weekStart,
          lte: endOfDay(targetDate)
        }
      }
    });

    const weeklyAdherence = calculateWeeklyAdherence(weeklyLogs);

    return NextResponse.json(
      formatSuccessResponse({
        medications: medicationsWithSchedule,
        date: targetDate.toISOString(),
        adherence: {
          today: calculateOverallDayAdherence(medicationsWithSchedule),
          weekly: weeklyAdherence
        }
      }, 'Medications retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching medications:', error);
    return NextResponse.json(
      formatErrorResponse('Failed to fetch medications', 500),
      { status: 500 }
    );
  }
}

// Helper function to generate medication schedule based on frequency
function generateMedicationSchedule(medication: any, date: Date): Date[] {
  const schedule: Date[] = [];
  const frequency = medication.frequency?.toLowerCase() || 'once_daily';
  const baseDate = startOfDay(date);

  const scheduleMap: Record<string, number[]> = {
    'once_daily': [9], // 9 AM
    'twice_daily': [9, 21], // 9 AM, 9 PM
    'three_times_daily': [8, 14, 20], // 8 AM, 2 PM, 8 PM
    'four_times_daily': [8, 12, 18, 22], // 8 AM, 12 PM, 6 PM, 10 PM
    'every_6_hours': [6, 12, 18, 24],
    'every_8_hours': [8, 16, 24],
    'every_12_hours': [9, 21],
    'as_needed': [], // PRN medications
    'weekly': [9], // Only on specific day
    'bedtime': [22], // 10 PM
    'morning': [8], // 8 AM
  };

  const hours = scheduleMap[frequency] || scheduleMap['once_daily'];
  
  hours.forEach(hour => {
    const scheduledTime = new Date(baseDate);
    if (hour === 24) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(0, 0, 0, 0);
    } else {
      scheduledTime.setHours(hour, 0, 0, 0);
    }
    schedule.push(scheduledTime);
  });

  return schedule;
}

function calculateDayAdherence(logs: any[], expectedCount: number): number {
  if (expectedCount === 0) return 100;
  const takenCount = logs.filter(log => log.status === 'TAKEN' || log.status === 'LATE').length;
  return Math.round((takenCount / expectedCount) * 100);
}

function calculateOverallDayAdherence(medications: any[]): number {
  if (medications.length === 0) return 100;
  const totalScheduled = medications.reduce((sum, med) => sum + med.schedule.length, 0);
  const totalTaken = medications.reduce((sum, med) => 
    sum + med.schedule.filter((s: any) => s.status === 'TAKEN' || s.status === 'LATE').length, 0
  );
  return totalScheduled === 0 ? 100 : Math.round((totalTaken / totalScheduled) * 100);
}

function calculateWeeklyAdherence(logs: any[]): number {
  if (logs.length === 0) return 100;
  const taken = logs.filter(log => log.status === 'TAKEN' || log.status === 'LATE').length;
  return Math.round((taken / logs.length) * 100);
}
```

---

**File**: `app/api/patient/medications/log/route.ts`

```typescript
// ==============================================================
// POST /api/patient/medications/log
// Log medication as taken, skipped, etc.
// ==============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/utils/responseFormatter';
import { z } from 'zod';

const medicationLogSchema = z.object({
  medicationId: z.string().uuid(),
  scheduledTime: z.string().datetime(),
  status: z.enum(['TAKEN', 'SKIPPED', 'LATE']),
  actualTime: z.string().datetime().optional(),
  skipReason: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        formatErrorResponse('Unauthorized', 401),
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = medicationLogSchema.parse(body);

    // Get patient's ID
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        formatErrorResponse('Patient profile not found', 404),
        { status: 404 }
      );
    }

    // Verify medication belongs to patient
    const medication = await prisma.medication.findFirst({
      where: {
        id: validatedData.medicationId,
        carePlan: {
          patientId: patient.id
        }
      }
    });

    if (!medication) {
      return NextResponse.json(
        formatErrorResponse('Medication not found or access denied', 404),
        { status: 404 }
      );
    }

    // Check if log already exists for this scheduled time
    const existingLog = await prisma.medicationLog.findFirst({
      where: {
        medicationId: validatedData.medicationId,
        patientId: patient.id,
        scheduledTime: new Date(validatedData.scheduledTime)
      }
    });

    let medicationLog;

    if (existingLog) {
      // Update existing log
      medicationLog = await prisma.medicationLog.update({
        where: { id: existingLog.id },
        data: {
          status: validatedData.status,
          actualTime: validatedData.actualTime ? new Date(validatedData.actualTime) : 
                      validatedData.status === 'TAKEN' ? new Date() : null,
          skipReason: validatedData.skipReason,
          notes: validatedData.notes
        }
      });
    } else {
      // Create new log
      medicationLog = await prisma.medicationLog.create({
        data: {
          medicationId: validatedData.medicationId,
          patientId: patient.id,
          scheduledTime: new Date(validatedData.scheduledTime),
          status: validatedData.status,
          actualTime: validatedData.actualTime ? new Date(validatedData.actualTime) : 
                      validatedData.status === 'TAKEN' ? new Date() : null,
          skipReason: validatedData.skipReason,
          notes: validatedData.notes
        }
      });
    }

    // Award gamification points if applicable
    if (validatedData.status === 'TAKEN') {
      await awardMedicationPoints(patient.id, 'MEDICATION_TAKEN');
    }

    return NextResponse.json(
      formatSuccessResponse(medicationLog, 'Medication logged successfully'),
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse('Invalid request data', 400),
        { status: 400 }
      );
    }
    console.error('Error logging medication:', error);
    return NextResponse.json(
      formatErrorResponse('Failed to log medication', 500),
      { status: 500 }
    );
  }
}

async function awardMedicationPoints(patientId: string, action: string) {
  try {
    const pointsMap: Record<string, number> = {
      'MEDICATION_TAKEN': 10,
      'MEDICATION_STREAK_7': 50,
      'MEDICATION_STREAK_30': 200
    };

    const points = pointsMap[action] || 0;

    // Update patient game profile
    await prisma.patientGameProfile.upsert({
      where: { patientId },
      update: {
        totalPoints: { increment: points },
        medicationStreak: { increment: 1 }
      },
      create: {
        patientId,
        totalPoints: points,
        medicationStreak: 1,
        level: 1
      }
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    // Don't fail the main request if gamification fails
  }
}
```

---

**File**: `app/api/patient/medications/[id]/history/route.ts`

```typescript
// ==============================================================
// GET /api/patient/medications/[id]/history
// Get medication adherence history
// ==============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/utils/responseFormatter';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        formatErrorResponse('Unauthorized', 401),
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Get patient's ID
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        formatErrorResponse('Patient profile not found', 404),
        { status: 404 }
      );
    }

    // Verify medication belongs to patient
    const medication = await prisma.medication.findFirst({
      where: {
        id: params.id,
        carePlan: {
          patientId: patient.id
        }
      },
      include: {
        medicine: true
      }
    });

    if (!medication) {
      return NextResponse.json(
        formatErrorResponse('Medication not found', 404),
        { status: 404 }
      );
    }

    // Get adherence logs
    const logs = await prisma.medicationLog.findMany({
      where: {
        medicationId: params.id,
        patientId: patient.id,
        scheduledTime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        scheduledTime: 'desc'
      },
      include: {
        sideEffects: true
      }
    });

    // Calculate statistics
    const stats = {
      totalScheduled: logs.length,
      taken: logs.filter(l => l.status === 'TAKEN').length,
      late: logs.filter(l => l.status === 'LATE').length,
      skipped: logs.filter(l => l.status === 'SKIPPED').length,
      missed: logs.filter(l => l.status === 'MISSED').length,
      pending: logs.filter(l => l.status === 'PENDING').length,
      adherenceRate: 0,
      sideEffectsReported: logs.filter(l => l.sideEffectsReported).length
    };

    const completed = stats.taken + stats.late;
    stats.adherenceRate = stats.totalScheduled > 0 
      ? Math.round((completed / stats.totalScheduled) * 100) 
      : 100;

    // Group logs by date for chart data
    const dailyData: Record<string, { date: string; taken: number; missed: number; total: number }> = {};
    
    logs.forEach(log => {
      const dateKey = new Date(log.scheduledTime).toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, taken: 0, missed: 0, total: 0 };
      }
      dailyData[dateKey].total++;
      if (log.status === 'TAKEN' || log.status === 'LATE') {
        dailyData[dateKey].taken++;
      } else if (log.status === 'MISSED' || log.status === 'SKIPPED') {
        dailyData[dateKey].missed++;
      }
    });

    return NextResponse.json(
      formatSuccessResponse({
        medication: {
          id: medication.id,
          name: medication.medicine?.name,
          dosage: medication.dosage,
          frequency: medication.frequency
        },
        logs,
        statistics: stats,
        chartData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }, 'Medication history retrieved'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching medication history:', error);
    return NextResponse.json(
      formatErrorResponse('Failed to fetch medication history', 500),
      { status: 500 }
    );
  }
}
```

---

### Task 1.3: Create Medication UI Components

**File**: `components/patient/medications/MedicationSchedule.tsx`

```typescript
// ==============================================================
// MedicationSchedule Component
// Displays today's medication schedule with check-off functionality
// ==============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface ScheduleItem {
  scheduledTime: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'LATE' | 'MISSED';
  actualTime: string | null;
  logId: string | null;
}

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  dosageForm?: string;
  strength?: string;
  instructions?: string;
}

interface MedicationWithSchedule {
  id: string;
  medicine: Medicine;
  dosage: string;
  frequency: string;
  instructions?: string;
  schedule: ScheduleItem[];
  adherenceToday: number;
}

interface MedicationScheduleProps {
  medications: MedicationWithSchedule[];
  date: Date;
  onLogMedication: (medicationId: string, scheduledTime: string, status: 'TAKEN' | 'SKIPPED') => Promise<void>;
  onViewDetails: (medicationId: string) => void;
}

export function MedicationSchedule({ 
  medications, 
  date, 
  onLogMedication,
  onViewDetails 
}: MedicationScheduleProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusIcon = (status: string, scheduledTime: string) => {
    const scheduled = parseISO(scheduledTime);
    const now = new Date();
    
    switch (status) {
      case 'TAKEN':
        return <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />;
      case 'LATE':
        return <CheckCircleIcon className="h-6 w-6 text-yellow-500" />;
      case 'SKIPPED':
        return <XCircleIcon className="h-6 w-6 text-gray-400" />;
      case 'MISSED':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'PENDING':
        if (isAfter(now, scheduled)) {
          return <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />;
        }
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const handleLogMedication = async (
    medicationId: string, 
    scheduledTime: string, 
    status: 'TAKEN' | 'SKIPPED'
  ) => {
    const loadingKey = `${medicationId}-${scheduledTime}`;
    setLoading(loadingKey);
    try {
      await onLogMedication(medicationId, scheduledTime, status);
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      TAKEN: { bg: 'bg-green-100', text: 'text-green-800', label: 'Taken' },
      LATE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Taken Late' },
      SKIPPED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Skipped' },
      MISSED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Missed' },
      PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending' }
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (medications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Medications Scheduled</h3>
        <p className="text-gray-500 mt-2">
          You don't have any medications scheduled for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Medications for {format(date, 'EEEE, MMMM d')}
        </h2>
      </div>

      {medications.map((medication) => (
        <div 
          key={medication.id} 
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          {/* Medication Header */}
          <div 
            className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedId(expandedId === medication.id ? null : medication.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">
                  {medication.medicine?.name || 'Unknown Medication'}
                </h3>
                <p className="text-sm text-gray-500">
                  {medication.dosage} • {medication.frequency?.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {medication.adherenceToday}%
                  </span>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(medication.id);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  aria-label={`View details for ${medication.medicine?.name}`}
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Items */}
          <div className="divide-y divide-gray-100">
            {medication.schedule.map((item, index) => {
              const isLoading = loading === `${medication.id}-${item.scheduledTime}`;
              const scheduledTime = parseISO(item.scheduledTime);
              const isPast = isAfter(new Date(), scheduledTime);
              const canTake = item.status === 'PENDING' && isPast;
              
              return (
                <div 
                  key={index}
                  className={`p-4 flex items-center justify-between ${
                    item.status === 'PENDING' && isPast ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status, item.scheduledTime)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(scheduledTime, 'h:mm a')}
                      </p>
                      {item.actualTime && (
                        <p className="text-xs text-gray-500">
                          Taken at {format(parseISO(item.actualTime), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleLogMedication(
                            medication.id, 
                            item.scheduledTime, 
                            'TAKEN'
                          )}
                          disabled={isLoading}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                            canTake 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50`}
                          aria-label={`Mark ${medication.medicine?.name} as taken`}
                        >
                          {isLoading ? 'Saving...' : 'Take'}
                        </button>
                        <button
                          onClick={() => handleLogMedication(
                            medication.id, 
                            item.scheduledTime, 
                            'SKIPPED'
                          )}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                          aria-label={`Skip ${medication.medicine?.name}`}
                        >
                          Skip
                        </button>
                      </>
                    ) : (
                      getStatusBadge(item.status)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Details */}
          {expandedId === medication.id && medication.instructions && (
            <div className="p-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> {medication.instructions}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MedicationSchedule;
```

---

### Task 1.4: Create Patient Dashboard Enhancement

**File**: `app/dashboard/patient/page.tsx`

```typescript
// ==============================================================
// Enhanced Patient Dashboard
// ==============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ClipboardDocumentCheckIcon,
  HeartIcon,
  CalendarDaysIcon,
  TrophyIcon,
  BellIcon,
  ChartBarIcon,
  PlusCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import MedicationSchedule from '@/components/patient/medications/MedicationSchedule';
import toast from 'react-hot-toast';

interface DashboardData {
  medications: any[];
  adherence: {
    today: number;
    weekly: number;
  };
  upcomingAppointments: any[];
  recentActivity: any[];
  gamification: {
    level: number;
    totalPoints: number;
    medicationStreak: number;
  };
  vitals: {
    lastRecorded: string | null;
    alertCount: number;
  };
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patient/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (result.status && result.payload?.data) {
        setDashboardData(result.payload.data);
      } else {
        throw new Error(result.payload?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMedications = useCallback(async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/patient/medications?date=${dateStr}`);
      
      if (!response.ok) throw new Error('Failed to fetch medications');
      
      const result = await response.json();
      
      if (result.status && result.payload?.data) {
        setDashboardData(prev => prev ? {
          ...prev,
          medications: result.payload.data.medications,
          adherence: result.payload.data.adherence
        } : null);
      }
    } catch (err) {
      console.error('Medications fetch error:', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, fetchDashboardData]);

  useEffect(() => {
    if (dashboardData) {
      fetchMedications();
    }
  }, [selectedDate, fetchMedications]);

  const handleLogMedication = async (
    medicationId: string, 
    scheduledTime: string, 
    logStatus: 'TAKEN' | 'SKIPPED'
  ) => {
    try {
      const response = await fetch('/api/patient/medications/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId,
          scheduledTime,
          status: logStatus,
          actualTime: logStatus === 'TAKEN' ? new Date().toISOString() : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to log medication');

      toast.success(logStatus === 'TAKEN' ? 'Medication marked as taken!' : 'Medication skipped');
      
      // Refresh medications
      await fetchMedications();
    } catch (err) {
      toast.error('Failed to log medication');
    }
  };

  const handleViewMedicationDetails = (medicationId: string) => {
    router.push(`/dashboard/patient/medications/${medicationId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login?role=patient');
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Patient'}!
          </h1>
          <p className="text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => router.push('/dashboard/patient/vitals/record')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Record Vitals
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${
              (dashboardData?.adherence?.weekly || 0) >= 80 
                ? 'bg-green-100' 
                : 'bg-yellow-100'
            }`}>
              <ClipboardDocumentCheckIcon className={`h-6 w-6 ${
                (dashboardData?.adherence?.weekly || 0) >= 80 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Weekly Adherence</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData?.adherence?.weekly || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Health Score / Streak */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <TrophyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Medication Streak</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData?.gamification?.medicationStreak || 0} days
              </p>
            </div>
          </div>
        </div>

        {/* Points */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Points</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData?.gamification?.totalPoints || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData?.upcomingAppointments?.length || 0} appointments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medications - Takes 2 columns */}
        <div className="lg:col-span-2">
          <MedicationSchedule
            medications={dashboardData?.medications || []}
            date={selectedDate}
            onLogMedication={handleLogMedication}
            onViewDetails={handleViewMedicationDetails}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/patient/symptoms/report')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-50"
              >
                <HeartIcon className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Log Symptom</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/patient/vitals/record')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-50"
              >
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Record Vitals</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/patient/messages')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-50"
              >
                <BellIcon className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-sm font-medium text-gray-700">Message Care Team</span>
              </button>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
              <button
                onClick={() => router.push('/dashboard/patient/appointments')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            {dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.upcomingAppointments.slice(0, 3).map((apt: any) => (
                  <div key={apt.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <CalendarDaysIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(apt.scheduledAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming appointments
              </p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 2: DIET & EXERCISE TRACKING

*(Continue with similar detailed specifications...)*

---

## VERIFICATION TESTS

### Test 1: Medication Logging API

```typescript
// tests/patient/medication-logging.test.ts

describe('Patient Medication Logging', () => {
  it('should log medication as taken', async () => {
    const response = await fetch('/api/patient/medications/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        medicationId: 'test-medication-id',
        scheduledTime: '2025-01-28T09:00:00Z',
        status: 'TAKEN'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.status).toBe(true);
    expect(data.payload.data.status).toBe('TAKEN');
  });

  it('should reject unauthorized access', async () => {
    const response = await fetch('/api/patient/medications/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicationId: 'test-medication-id',
        scheduledTime: '2025-01-28T09:00:00Z',
        status: 'TAKEN'
      })
    });

    expect(response.status).toBe(401);
  });

  it('should reject access to other patient medications', async () => {
    const response = await fetch('/api/patient/medications/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        medicationId: 'other-patient-medication-id',
        scheduledTime: '2025-01-28T09:00:00Z',
        status: 'TAKEN'
      })
    });

    expect(response.status).toBe(404);
  });
});
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1 Checklist
- [ ] Add MedicationLog schema to Prisma
- [ ] Add SideEffectReport schema to Prisma
- [ ] Add RefillRequest schema to Prisma
- [ ] Run Prisma migration
- [ ] Create GET /api/patient/medications route
- [ ] Create POST /api/patient/medications/log route
- [ ] Create GET /api/patient/medications/[id]/history route
- [ ] Create MedicationSchedule component
- [ ] Create MedicationCard component
- [ ] Create MedicationCheckIn component
- [ ] Update Patient Dashboard with medications
- [ ] Add medication adherence statistics
- [ ] Test all medication APIs
- [ ] Test all medication UI components

### Phase 2 Checklist
- [ ] Add DietPlan schema
- [ ] Add MealLog schema
- [ ] Add FoodLogItem schema
- [ ] Add WaterIntakeLog schema
- [ ] Add ExercisePlan schema
- [ ] Add ExerciseLog schema
- [ ] Create diet tracking APIs
- [ ] Create exercise tracking APIs
- [ ] Create diet UI components
- [ ] Create exercise UI components

*(Continue with remaining phases...)*

---

## NOTES FOR AI AGENT

1. **Always validate user is PATIENT role** before processing requests
2. **Use formatSuccessResponse and formatErrorResponse** from existing utils
3. **Follow Prisma camelCase conventions** for client calls
4. **Add proper error handling** with try-catch blocks
5. **Include loading states** in all components
6. **Make components mobile-responsive** using Tailwind classes
7. **Add aria-labels** for accessibility
8. **Use existing auth patterns** from Auth.js v5

---

*End of Technical Specification Document*
