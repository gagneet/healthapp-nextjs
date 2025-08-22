// app/api/search/route.ts - Comprehensive healthcare search API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import type { HealthcareRole } from '@/types/auth';

interface SearchFilters {
  value?: string;
  limit?: number;
  type?: 'all' | 'patients' | 'doctors' | 'medicines' | 'specialities' | 'symptoms' | 'diagnoses' | 'treatments';
  category?: string;
  role?: HealthcareRole;
}

interface SearchResult {
  patients?: any[];
  doctors?: any[];
  medicines?: any[];
  specialities?: any[];
  symptoms?: any[];
  diagnoses?: any[];
  treatments?: any[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 401,
          payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {
      value: searchParams.get('value') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      type: (searchParams.get('type') as SearchFilters['type']) || 'all',
      category: searchParams.get('category') || undefined,
      role: session.user.role
    };

    if (!filters.value) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          payload: { error: { status: 'validation_error', message: 'Search value is required' } }
        },
        { status: 400 }
      );
    }

    // Minimum search length for performance
    if (filters.value.length < 2) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          payload: { error: { status: 'validation_error', message: 'Search value must be at least 2 characters' } }
        },
        { status: 400 }
      );
    }

    const searchValue = `%${filters.value.toLowerCase()}%`;
    const results: SearchResult = {};

    // Search based on type and user permissions
    if (filters.type === 'all' || filters.type === 'patients') {
      if (['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(filters.role)) {
        results.patients = await searchPatients(searchValue, filters, session.user.role);
      }
    }

    if (filters.type === 'all' || filters.type === 'doctors') {
      if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PATIENT'].includes(filters.role)) {
        results.doctors = await searchDoctors(searchValue, filters);
      }
    }

    if (filters.type === 'all' || filters.type === 'medicines') {
      results.medicines = await searchMedicines(searchValue, filters);
    }

    if (filters.type === 'all' || filters.type === 'specialities') {
      results.specialities = await searchSpecialities(searchValue, filters);
    }

    if (filters.type === 'all' || filters.type === 'symptoms') {
      results.symptoms = await searchSymptoms(searchValue, filters);
    }

    if (filters.type === 'all' || filters.type === 'diagnoses') {
      results.diagnoses = await searchDiagnoses(searchValue, filters);
    }

    if (filters.type === 'all' || filters.type === 'treatments') {
      results.treatments = await searchTreatments(searchValue, filters);
    }

    // Calculate total results for metadata
    const totalResults = Object.values(results).reduce((sum, items) => sum + (items?.length || 0), 0);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          results,
          metadata: {
            query: filters.value,
            type: filters.type,
            totalResults,
            resultTypes: Object.keys(results).filter(key => results[key as keyof SearchResult]?.length > 0)
          }
        },
        message: `Found ${totalResults} results for "${filters.value}"`
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: { error: { status: 'error', message: 'Internal server error' } }
      },
      { status: 500 }
    );
  }
}

// Search functions for different entity types
async function searchPatients(searchValue: string, filters: SearchFilters, userRole: HealthcareRole) {
  let whereClause: any = {
    OR: [
      { user: { first_name: { contains: searchValue, mode: 'insensitive' } } },
      { user: { last_name: { contains: searchValue, mode: 'insensitive' } } },
      { user: { email: { contains: searchValue, mode: 'insensitive' } } },
      { patient_id: { contains: searchValue, mode: 'insensitive' } },
      { medical_record_number: { contains: searchValue, mode: 'insensitive' } }
    ]
  };

  // Role-based filtering for patient search
  if (userRole === 'DOCTOR') {
    // Doctors can only search their assigned patients
    const doctor = await prisma.doctor.findFirst({
      where: { user_id: (await auth())?.user?.id }
    });
    if (doctor) {
      whereClause.primary_care_doctor_id = doctor.id;
    }
  }

  return await prisma.patient.findMany({
    where: whereClause,
    take: filters.limit,
    select: {
      id: true,
      patient_id: true,
      medical_record_number: true,
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          date_of_birth: true,
          gender: true
        }
      },
      organization: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { user: { first_name: 'asc' } },
      { user: { last_name: 'asc' } }
    ]
  });
}

async function searchDoctors(searchValue: string, filters: SearchFilters) {
  return await prisma.doctor.findMany({
    where: {
      OR: [
        { users_doctors_user_idTousers: { first_name: { contains: searchValue, mode: 'insensitive' } } },
        { users_doctors_user_idTousers: { last_name: { contains: searchValue, mode: 'insensitive' } } },
        { medical_license_number: { contains: searchValue, mode: 'insensitive' } },
        { doctor_id: { contains: searchValue, mode: 'insensitive' } }
      ]
    },
    take: filters.limit,
    select: {
      id: true,
      doctor_id: true,
      medical_license_number: true,
      years_of_experience: true,
      consultation_fee: true,
      users_doctors_user_idTousers: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true
        }
      },
      specialities: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    },
    orderBy: [
      { users_doctors_user_idTousers: { first_name: 'asc' } },
      { users_doctors_user_idTousers: { last_name: 'asc' } }
    ]
  });
}

async function searchMedicines(searchValue: string, filters: SearchFilters) {
  return await prisma.medicine.findMany({
    where: {
      AND: [
        { public_medicine: true },
        {
          OR: [
            { name: { contains: searchValue, mode: 'insensitive' } },
            { description: { contains: searchValue, mode: 'insensitive' } }
          ]
        }
      ]
    },
    take: filters.limit,
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      details: true,
      public_medicine: true
    },
    orderBy: { name: 'asc' }
  });
}

async function searchSpecialities(searchValue: string, filters: SearchFilters) {
  return await prisma.speciality.findMany({
    where: {
      OR: [
        { name: { contains: searchValue, mode: 'insensitive' } },
        { description: { contains: searchValue, mode: 'insensitive' } }
      ]
    },
    take: filters.limit,
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          doctors_doctors_speciality_idTospecialiy: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

async function searchSymptoms(searchValue: string, filters: SearchFilters) {
  // For symptoms, we'll search in the symptoms_database table
  return await prisma.symptoms_database.findMany({
    where: {
      AND: [
        { is_active: true },
        {
          OR: [
            { diagnosis_name: { contains: searchValue, mode: 'insensitive' } },
            { symptoms: { has: searchValue } }, // Search within symptoms array
            { category: { contains: searchValue, mode: 'insensitive' } }
          ]
        },
        ...(filters.category ? [{ category: { contains: filters.category, mode: 'insensitive' } }] : [])
      ]
    },
    take: filters.limit,
    select: {
      id: true,
      diagnosis_name: true,
      symptoms: true,
      category: true,
      severity_indicators: true,
      common_age_groups: true,
      gender_specific: true
    },
    orderBy: { diagnosis_name: 'asc' }
  });
}

async function searchDiagnoses(searchValue: string, filters: SearchFilters) {
  return await prisma.symptoms_database.findMany({
    where: {
      AND: [
        { is_active: true },
        { diagnosis_name: { contains: searchValue, mode: 'insensitive' } },
        ...(filters.category ? [{ category: { contains: filters.category, mode: 'insensitive' } }] : [])
      ]
    },
    take: filters.limit,
    select: {
      id: true,
      diagnosis_name: true,
      category: true,
      symptoms: true,
      severity_indicators: true,
      risk_factors: true
    },
    orderBy: { diagnosis_name: 'asc' }
  });
}

async function searchTreatments(searchValue: string, filters: SearchFilters) {
  return await prisma.treatment_database.findMany({
    where: {
      AND: [
        { is_active: true },
        {
          OR: [
            { treatment_name: { contains: searchValue, mode: 'insensitive' } },
            { description: { contains: searchValue, mode: 'insensitive' } },
            { applicable_conditions: { has: searchValue } }
          ]
        },
        ...(filters.category ? [{ category: { contains: filters.category, mode: 'insensitive' } }] : [])
      ]
    },
    take: filters.limit,
    select: {
      id: true,
      treatment_name: true,
      treatment_type: true,
      description: true,
      applicable_conditions: true,
      category: true,
      effectiveness_rating: true
    },
    orderBy: { treatment_name: 'asc' }
  });
}
