import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const patientCalendarSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  view: z.enum(['month', 'week', 'day']).default('month'),
  includeAppointments: z.boolean().default(true),
  includeCarePlans: z.boolean().default(true),
  includeMedications: z.boolean().default(false),
  includeVitalReminders: z.boolean().default(false),
  timezone: z.string().default('UTC')
});

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patientId } = params;
    const { searchParams } = new URL(request.url);
    
    const queryData = patientCalendarSchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      view: searchParams.get('view') || 'month',
      includeAppointments: searchParams.get('includeAppointments') !== 'false',
      includeCarePlans: searchParams.get('includeCarePlans') !== 'false',
      includeMedications: searchParams.get('includeMedications') === 'true',
      includeVitalReminders: searchParams.get('includeVitalReminders') === 'true',
      timezone: searchParams.get('timezone') || 'UTC'
    });

    // Verify patient exists and user has access
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { 
          select: { 
            id: true, name: true, email: true, 
            firstName: true, lastName: true 
          } 
        },
        primaryCareDoctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Permission check: Patient themselves, their doctors, or admins can view calendar
    let hasAccess = (
      session.user.id === patient.userId ||
      (patient.primaryCareDoctorId && session.user.id === patient.primaryCareDoctorId) ||
      session.user.role === 'SYSTEM_ADMIN' ||
      session.user.role === 'HOSPITAL_ADMIN'
    );

    // Additional check for secondary doctors
    if (!hasAccess && session.user.role === 'DOCTOR') {
      const doctorAccess = await prisma.patientDoctorAssignment.findFirst({
        where: {
          patientId: patient.id,
          doctorId: session.user.id,
          isActive: true
        }
      });
      if (doctorAccess) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate date range based on view
    const { startDate, endDate } = calculateDateRange(
      queryData.startDate,
      queryData.endDate,
      queryData.view
    );

    const calendarData: any = {
      patient: {
        id: patient.id,
        name: patient.user.name || `${patient.user.firstName} ${patient.user.lastName}`,
        email: patient.user.email,
        primaryCareDoctor: patient.primaryCareDoctor?.user ? {
          name: `${patient.primaryCareDoctor.user.firstName} ${patient.primaryCareDoctor.user.lastName}`
        } : null
      },
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        view: queryData.view,
        timezone: queryData.timezone
      },
      events: []
    };

    // Get appointments for the date range
    if (queryData.includeAppointments) {
      const appointments = await prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              organization: { select: { name: true, type: true } }
            }
          },
          carePlan: {
            select: { id: true, title: true }
          }
        },
        orderBy: { startTime: 'asc' }
      });

      calendarData.events.push(...appointments.map(appointment => ({
        id: appointment.id,
        type: 'appointment',
        title: `${appointment.description || 'Appointment'} with Dr. ${appointment.doctor?.user.firstName} ${appointment.doctor?.user.lastName}`,
        description: appointment.description,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        appointmentType: appointment.description,
        doctor: appointment.doctor?.user ? {
          name: `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          organization: appointment.doctor.organization?.name
        } : null,
        carePlan: appointment.carePlan ? {
          id: appointment.carePlan.id,
          name: appointment.carePlan.title
        } : null,
        location: appointment.doctor?.organization?.type === 'hospital' ? 'Hospital Visit' : 'Clinic Visit',
        metadata: {
          canReschedule: appointment.status === 'SCHEDULED' && appointment.startTime && appointment.startTime > new Date(Date.now() + 24 * 60 * 60 * 1000),
          canCancel: appointment.status === 'SCHEDULED' && appointment.startTime && appointment.startTime > new Date(Date.now() + 30 * 60 * 1000)
        }
      })));
    }

    // Get care plan activities if requested
    if (queryData.includeCarePlans) {
      const careplanActivities = await prisma.carePlan.findMany({
        where: {
          patientId: patient.id,
          status: 'ACTIVE',
          OR: [
            { startDate: { lte: endDate } },
            { endDate: { gte: startDate } }
          ]
        },
        include: {
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        }
      });

      calendarData.events.push(...careplanActivities.map(plan => ({
        id: `careplan-${plan.id}`,
        type: 'care_plan',
        title: `Care Plan: ${plan.title}`,
        description: plan.description,
        startTime: plan.startDate,
        endTime: plan.endDate || new Date(plan.startDate.getTime() + 60 * 60 * 1000), // 1 hour default
        status: plan.status,
        doctor: plan.doctor?.user ? {
          name: `Dr. ${plan.doctor.user.firstName} ${plan.doctor.user.lastName}`
        } : null,
        metadata: {
          carePlanId: plan.id
        }
      })));
    }

    // Get medication schedules if requested
    if (queryData.includeMedications) {
      const medications = await prisma.medication.findMany({
        where: {
          participantId: patient.id,
          // Only include medications that are "active" during the requested range
          AND: [
            { startDate: { lte: endDate } },
            {
              OR: [
                { endDate: null },
                { endDate: { gte: startDate } }
              ]
            }
          ]
        },
        include: {
          medicine: { select: { name: true, type: true, details: true } }
        }
      });

      // Generate medication reminder events
      medications.forEach(medication => {
        const medicationEvents = generateMedicationEvents(medication, startDate, endDate);
        calendarData.events.push(...medicationEvents);
      });
    }

    // Get vital reading reminders if requested
    if (queryData.includeVitalReminders) {
      const vitalTypes = await prisma.vitalType.findMany({
        where: {
          vitals: {
            some: {
              carePlan: {
                patientId: patient.id,
                status: 'ACTIVE',
              },
            },
          },
        },
      });

      // Generate vital reminder events (simplified - would need more complex logic for frequencies)
      vitalTypes.forEach(template => {
        const vitalEvents = generateDailyVitalReminders(template, startDate, endDate);
        calendarData.events.push(...vitalEvents);
      });
    }

    // Calculate patient statistics
    const appointmentStats = {
      upcomingAppointments: calendarData.events.filter((e: any) => 
        e.type === 'appointment' && 
        e.startTime && new Date(e.startTime) > new Date() &&
        e.status === 'SCHEDULED'
      ).length,
      completedAppointments: calendarData.events.filter((e: any) => 
        e.type === 'appointment' && e.status === 'COMPLETED'
      ).length,
      activeCareFlans: calendarData.events.filter((e: any) => e.type === 'care_plan').length,
      medicationReminders: calendarData.events.filter((e: any) => e.type === 'medication').length
    };

    calendarData.statistics = appointmentStats;

    // Sort all events by start time
    calendarData.events.sort((a: any, b: any) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json({
      message: 'Patient calendar retrieved successfully',
      calendar: calendarData
    });

  } catch (error) {
    console.error('Error fetching patient calendar:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch patient calendar' }, { status: 500 });
  }
}

function calculateDateRange(startDate?: string, endDate?: string, view: string = 'month') {
  const now = new Date();
  let calculatedStart: Date;
  let calculatedEnd: Date;

  if (startDate && endDate) {
    calculatedStart = new Date(startDate);
    calculatedEnd = new Date(endDate);
  } else {
    switch (view) {
      case 'day':
        calculatedStart = new Date(now);
        calculatedStart.setHours(0, 0, 0, 0);
        calculatedEnd = new Date(calculatedStart);
        calculatedEnd.setHours(23, 59, 59, 999);
        break;
      case 'week':
        calculatedStart = new Date(now);
        calculatedStart.setDate(now.getDate() - now.getDay());
        calculatedStart.setHours(0, 0, 0, 0);
        calculatedEnd = new Date(calculatedStart);
        calculatedEnd.setDate(calculatedStart.getDate() + 6);
        calculatedEnd.setHours(23, 59, 59, 999);
        break;
      case 'month':
      default:
        calculatedStart = new Date(now.getFullYear(), now.getMonth(), 1);
        calculatedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        calculatedEnd.setHours(23, 59, 59, 999);
        break;
    }
  }

  return { startDate: calculatedStart, endDate: calculatedEnd };
}

function generateMedicationEvents(medication: any, startDate: Date, endDate: Date) {
  const events: any[] = [];
  if (!medication.startDate) return events;
  const medicationStart = new Date(Math.max(medication.startDate.getTime(), startDate.getTime()));
  const medicationEnd = medication.endDate ? 
    new Date(Math.min(medication.endDate.getTime(), endDate.getTime())) : 
    endDate;

  // Simplified medication schedule generation
  if (medication.frequency === 'DAILY') {
    const currentDate = new Date(medicationStart);
    while (currentDate <= medicationEnd) {
      events.push({
        id: `medication-${medication.id}-${currentDate.getTime()}`,
        type: 'medication',
        title: `Take ${medication.medicine.name}`,
        description: `Dosage: ${medication.dosage} ${medication.dosageUnit}`,
        startTime: new Date(currentDate.getTime() + 9 * 60 * 60 * 1000), // 9 AM default
        endTime: new Date(currentDate.getTime() + 9 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 min duration
        medication: {
          id: medication.id,
          name: medication.medicine.name,
          dosage: medication.dosage,
          dosageUnit: medication.dosageUnit,
          dosageForm: (medication.medicine.details as any)?.dosage_form || null
        },
        metadata: {
          medicationId: medication.id,
          canLog: true
        }
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return events;
}

function generateDailyVitalReminders(template: any, startDate: Date, endDate: Date) {
  const events: any[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    events.push({
      id: `vital-${template.id}-${currentDate.getTime()}`,
      type: 'vital_reminder',
      title: `Record ${template.name}`,
      description: `Time to record your ${template.name} reading`,
      startTime: new Date(currentDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM default
      endTime: new Date(currentDate.getTime() + 8 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min window
      vitalType: {
        id: template.id,
        name: template.name,
        unit: template.unit,
        category: template.category
      },
      metadata: {
        vitalTypeId: template.id,
        canRecord: true
      }
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}