import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/auth-helpers";
import { getMedications, createMedication, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/medications
 * Search and retrieve medications
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    }

    const { searchParams } = new URL(request.url);
    const searchParameters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const medications = await getMedications(searchParameters);
    
    return NextResponse.json(formatApiSuccess(medications, 'Medications retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * POST /api/medications
 * Create a new medication (admin/doctor only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with admin/doctor permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    }

    const user = session.user;
    const medicationData = await request.json();

    // Add created by information
    medicationData.createdBy = user.id || user.userId;

    const newMedication = await createMedication(medicationData);
    
    return NextResponse.json(formatApiSuccess(newMedication, 'Medication created successfully'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}