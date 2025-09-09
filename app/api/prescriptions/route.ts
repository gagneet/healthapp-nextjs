import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addDays, addYears } from 'date-fns';

const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  medicationName: z.string().min(1),
  genericName: z.string().optional(),
  strength: z.string(),
  dosageForm: z.enum(['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'patch', 'inhaler', 'drops', 'suppository', 'powder', 'gel']),
  routeOfAdministration: z.enum(['oral', 'topical', 'injection', 'intravenous', 'intramuscular', 'subcutaneous', 'inhalation', 'rectal', 'vaginal', 'ophthalmic', 'otic', 'nasal', 'sublingual']),
  doseAmount: z.number().positive(),
  doseUnit: z.string(),
  frequency: z.string(),
  frequencyPerDay: z.number().int().positive().optional(),
  sigInstructions: z.string().min(10),
  patientInstructions: z.string().optional(),
  foodInstructions: z.enum(['with_food', 'without_food', 'empty_stomach', 'no_restriction']).optional(),
  quantityPrescribed: z.number().int().positive(),
  quantityUnit: z.string(),
  daysSupply: z.number().int().positive().optional(),
  refillsAllowed: z.number().int().min(0).max(11).default(0),
  indication: z.string().optional(),
  diagnosisCodes: z.array(z.string()).default([]),
  isControlledSubstance: z.boolean().default(false),
  deaSchedule: z.enum(['CI', 'CII', 'CIII', 'CIV', 'CV']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  pharmacyName: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  requiresMonitoring: z.boolean().default(false),
  monitoringParameters: z.array(z.string()).default([]),
});

const getPrescriptionsSchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending', 'active', 'filled', 'discontinued', 'expired', 'cancelled']).optional(),
  includeExpired: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors and HSPs with prescribe capability can create prescriptions
    if (session.user.role !== 'DOCTOR') {
      // Check if HSP has prescribe capability
      if (session.user.role === 'HSP') {
        const hsp = await prisma.hspProfile.findUnique({
          where: { userId: session.user.id },
        });
        
        if (!hsp || !hsp.capabilities.includes('prescribe_medications')) {
          return NextResponse.json({ 
            error: 'Only doctors or HSPs with prescribe capability can create prescriptions' 
          }, { status: 403 });
        }
      } else {
        return NextResponse.json({ 
          error: 'Only doctors can create prescriptions' 
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = createPrescriptionSchema.parse(body);

    // Get prescriber information
    const prescriber = session.user.role === 'DOCTOR' 
      ? await prisma.doctor.findUnique({
          where: { userId: session.user.id },
          include: { organization: true, user: true },
        })
      : await prisma.hspProfile.findUnique({
          where: { userId: session.user.id },
          include: { organization: true, user: true },
        });

    if (!prescriber) {
      return NextResponse.json({ error: 'Prescriber profile not found' }, { status: 404 });
    }

    // Verify patient exists and prescriber has access
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      include: { user: true },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check prescriber-patient relationship
    if (session.user.role === 'DOCTOR') {
      const hasAccess = patient.primaryCareDoctorId === prescriber.id ||
        await prisma.patientDoctorAssignment.findFirst({
          where: {
            patientId: patient.id,
            doctorId: prescriber.id,
            isActive: true,
            patientConsentStatus: 'GRANTED',
            permissions: {
              path: ['canPrescribe'],
              equals: true,
            },
          },
        });

      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'You do not have prescribing access to this patient' 
        }, { status: 403 });
      }
    }

    // Validate controlled substance requirements
    if (validatedData.isControlledSubstance && !validatedData.deaSchedule) {
      return NextResponse.json({ 
        error: 'DEA schedule is required for controlled substances' 
      }, { status: 400 });
    }

    // Generate prescription number
    const prescriptionNumber = `RX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate expiration date
    const expirationDate = calculateExpirationDate(validatedData.isControlledSubstance, validatedData.deaSchedule);

    // Calculate days supply if not provided
    const daysSupply = validatedData.daysSupply || 
      (validatedData.frequencyPerDay 
        ? Math.ceil(validatedData.quantityPrescribed / validatedData.frequencyPerDay)
        : null);

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        patientId: validatedData.patientId,
        prescribingDoctorId: session.user.role === 'DOCTOR' ? prescriber.id : null,
        prescribingHspId: session.user.role === 'HSP' ? prescriber.id : null,
        organizationId: prescriber.organizationId,
        prescriptionNumber,
        medicationName: validatedData.medicationName,
        genericName: validatedData.genericName,
        strength: validatedData.strength,
        dosageForm: validatedData.dosageForm,
        routeOfAdministration: validatedData.routeOfAdministration,
        doseAmount: validatedData.doseAmount,
        doseUnit: validatedData.doseUnit,
        frequency: validatedData.frequency,
        frequencyPerDay: validatedData.frequencyPerDay,
        sigInstructions: validatedData.sigInstructions,
        patientInstructions: validatedData.patientInstructions,
        foodInstructions: validatedData.foodInstructions,
        quantityPrescribed: validatedData.quantityPrescribed,
        quantityUnit: validatedData.quantityUnit,
        daysSupply,
        refillsAllowed: validatedData.refillsAllowed,
        indication: validatedData.indication,
        diagnosisCodes: validatedData.diagnosisCodes,
        isControlledSubstance: validatedData.isControlledSubstance,
        deaSchedule: validatedData.deaSchedule,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        expirationDate,
        pharmacyName: validatedData.pharmacyName,
        pharmacyPhone: validatedData.pharmacyPhone,
        requiresMonitoring: validatedData.requiresMonitoring,
        monitoringParameters: validatedData.monitoringParameters,
        prescriberNpi: (prescriber as any).npiNumber || null,
        status: 'active',
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        prescribingDoctor: { include: { user: { select: { name: true, email: true } } } },
        prescribingHsp: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    return NextResponse.json({
      message: 'Prescription created successfully',
      prescription: {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        patient: {
          id: prescription.patientId,
          name: prescription.patient.user.name,
          email: prescription.patient.user.email,
        },
        prescriber: {
          id: session.user.role === 'DOCTOR' ? prescription.prescribingDoctorId : prescription.prescribingHspId,
          name: session.user.role === 'DOCTOR' 
            ? prescription.prescribingDoctor?.user.name 
            : prescription.prescribingHsp?.user.name,
          type: session.user.role,
        },
        medication: {
          name: prescription.medicationName,
          genericName: prescription.genericName,
          strength: prescription.strength,
          dosageForm: prescription.dosageForm,
          route: prescription.routeOfAdministration,
        },
        dosing: {
          doseAmount: prescription.doseAmount,
          doseUnit: prescription.doseUnit,
          frequency: prescription.frequency,
          frequencyPerDay: prescription.frequencyPerDay,
          sigInstructions: prescription.sigInstructions,
          foodInstructions: prescription.foodInstructions,
        },
        quantity: {
          prescribed: prescription.quantityPrescribed,
          unit: prescription.quantityUnit,
          daysSupply: prescription.daysSupply,
          refillsAllowed: prescription.refillsAllowed,
        },
        status: prescription.status,
        prescribedDate: prescription.prescribedDate,
        expirationDate: prescription.expirationDate,
        isControlledSubstance: prescription.isControlledSubstance,
        requiresMonitoring: prescription.requiresMonitoring,
      },
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryData = getPrescriptionsSchema.parse({
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') || undefined,
      includeExpired: searchParams.get('includeExpired') === 'true',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    // Build where clause based on user role and permissions
    const whereClause: any = {};

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
      }
      whereClause.prescribingDoctorId = doctor.id;
    } else if (session.user.role === 'HSP') {
      const hsp = await prisma.hspProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!hsp) {
        return NextResponse.json({ error: 'HSP profile not found' }, { status: 404 });
      }
      whereClause.prescribingHspId = hsp.id;
    } else if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id },
      });
      if (!patient) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }
      whereClause.patientId = patient.id;
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to view prescriptions' }, { status: 403 });
    }

    // Apply additional filters
    if (queryData.patientId) {
      whereClause.patientId = queryData.patientId;
    }

    if (queryData.status) {
      whereClause.status = queryData.status;
    }

    if (!queryData.includeExpired) {
      whereClause.expirationDate = {
        gt: new Date(),
      };
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        prescribingDoctor: { include: { user: { select: { name: true, email: true } } } },
        prescribingHsp: { include: { user: { select: { name: true, email: true } } } },
        organization: { select: { name: true } },
      },
      orderBy: { prescribedDate: 'desc' },
      take: queryData.limit,
      skip: queryData.offset,
    });

    const totalCount = await prisma.prescription.count({ where: whereClause });

    const formattedPrescriptions = prescriptions.map(prescription => ({
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      patient: {
        id: prescription.patientId,
        name: prescription.patient.user.name,
        email: prescription.patient.user.email,
      },
      prescriber: {
        id: prescription.prescribingDoctorId || prescription.prescribingHspId,
        name: prescription.prescribingDoctor?.user.name || prescription.prescribingHsp?.user.name,
        type: prescription.prescribingDoctorId ? 'DOCTOR' : 'HSP',
      },
      organization: prescription.organization?.name,
      medication: {
        name: prescription.medicationName,
        genericName: prescription.genericName,
        strength: prescription.strength,
        dosageForm: prescription.dosageForm,
        route: prescription.routeOfAdministration,
      },
      dosing: {
        doseAmount: prescription.doseAmount,
        doseUnit: prescription.doseUnit,
        frequency: prescription.frequency,
        frequencyPerDay: prescription.frequencyPerDay,
        sigInstructions: prescription.sigInstructions,
        patientInstructions: prescription.patientInstructions,
        foodInstructions: prescription.foodInstructions,
      },
      quantity: {
        prescribed: prescription.quantityPrescribed,
        unit: prescription.quantityUnit,
        daysSupply: prescription.daysSupply,
        refillsAllowed: prescription.refillsAllowed,
        refillsUsed: prescription.refillsUsed,
      },
      status: prescription.status,
      prescribedDate: prescription.prescribedDate,
      startDate: prescription.startDate,
      endDate: prescription.endDate,
      expirationDate: prescription.expirationDate,
      isControlledSubstance: prescription.isControlledSubstance,
      deaSchedule: prescription.deaSchedule,
      requiresMonitoring: prescription.requiresMonitoring,
      monitoringParameters: prescription.monitoringParameters,
      indication: prescription.indication,
      diagnosisCodes: prescription.diagnosisCodes,
    }));

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
      totalCount,
      limit: queryData.limit,
      offset: queryData.offset,
      hasMore: queryData.offset + queryData.limit < totalCount,
    });

  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

function calculateExpirationDate(isControlledSubstance: boolean, deaSchedule?: string): Date {
  const now = new Date();

  if (isControlledSubstance) {
    switch (deaSchedule) {
      case 'CII':
        return addDays(now, 90);
      case 'CIII':
      case 'CIV':
      case 'CV':
        return addDays(now, 180);
      default:
        // This case should ideally not be reached if validation is correct
        // but as a safeguard, we throw an error.
        throw new Error(`Invalid or missing DEA schedule for controlled substance: ${deaSchedule}`);
    }
  } else {
    return addYears(now, 1);
  }
}