// app/api/search/patients/phone/route.ts - Patient phone search API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// Phone number format helper function
function getPhoneSearchFormats(phoneNumber: string): string[] {
  // Remove all non-digits
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  const formats: string[] = [];
  
  if (digitsOnly.length >= 10) {
    // Last 10 digits for US numbers
    const last10 = digitsOnly.slice(-10);
    
    // Various formats
    formats.push(
      digitsOnly, // Original digits only
      `+1${last10}`, // +1 prefix
      `1${last10}`, // 1 prefix
      last10, // 10 digits
      `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}`, // XXX-XXX-XXXX
      `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`, // (XXX) XXX-XXXX
      `${last10.slice(0, 3)}.${last10.slice(3, 6)}.${last10.slice(6)}`, // XXX.XXX.XXXX
      `${last10.slice(0, 3)} ${last10.slice(3, 6)} ${last10.slice(6)}` // XXX XXX XXXX
    );
    
    // International format if starts with country code
    if (digitsOnly.length > 10) {
      const countryCode = digitsOnly.slice(0, -10);
      formats.push(`+${countryCode}${last10}`);
      formats.push(`+${countryCode} ${last10}`);
    }
  }
  
  return [...new Set(formats)]; // Remove duplicates
}

export async function POST(request: NextRequest) {
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

    // Only allow healthcare providers to search patients by phone
    if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phoneNumber, countryCode = 'US' } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          payload: { error: { status: 'validation_error', message: 'Phone number is required' } }
        },
        { status: 400 }
      );
    }

    // Generate multiple phone formats for search
    const searchFormats = getPhoneSearchFormats(phoneNumber);
    
    if (searchFormats.length === 0) {
      return NextResponse.json({
        status: true,
        statusCode: 200,
        payload: {
          data: {
            exists: false,
            patient: null,
            searchedPhone: phoneNumber,
            formats: []
          },
          message: 'Invalid phone number format'
        }
      });
    }

    // Search for patient with any of these phone number formats
    const patient = await prisma.patient.findFirst({
      where: {
        user: {
          phone: {
            in: searchFormats
          }
        }
      },
      select: {
        id: true,
        patient_id: true,
        medical_record_number: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            date_of_birth: true,
            gender: true,
            accountStatus: true
          }
        },
        organization: {
          select: {
            name: true
          }
        },
        primaryCareDoctorId: true,
        height_cm: true,
        weight_kg: true,
        blood_type: true,
        allergies: true,
        medical_history: true,
        emergency_contacts: true
      }
    });

    const result = {
      exists: !!patient,
      patient: patient || null,
      searchedPhone: phoneNumber,
      formats: searchFormats,
      match: patient ? {
        id: patient.id,
        patient_id: patient.patient_id,
        name: `${patient.user.first_name} ${patient.user.last_name}`.trim(),
        phone: patient.user.phone,
        email: patient.user.email,
        medical_record_number: patient.medical_record_number
      } : null
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: result,
        message: result.exists ? 'Patient found' : 'No patient found with this phone number'
      }
    });

  } catch (error) {
    console.error('Patient phone search error:', error);
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
