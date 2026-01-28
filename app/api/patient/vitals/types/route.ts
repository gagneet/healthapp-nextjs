/**
 * GET /api/patient/vitals/types
 * Fetch all available vital types for patient recording
 */

import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        handleApiError({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Fetch all vital types
    const vitalTypes = await prisma.vitalType.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        unit: true,
        normalRangeMin: true,
        normalRangeMax: true,
        description: true,
        validationRules: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format for frontend use
    const formattedTypes = vitalTypes.map(vt => ({
      id: vt.id,
      name: vt.name,
      unit: vt.unit,
      normalRangeMin: vt.normalRangeMin ? Number(vt.normalRangeMin) : null,
      normalRangeMax: vt.normalRangeMax ? Number(vt.normalRangeMax) : null,
      description: vt.description,
      validationRules: vt.validationRules as any,
      // Determine if this vital type requires compound values (like BP)
      isCompound: vt.name === 'Blood Pressure' ||
                  (vt.validationRules as any)?.type === 'compound'
    }));

    return NextResponse.json(
      formatApiSuccess({
        data: formattedTypes,
        message: 'Vital types retrieved successfully'
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching vital types:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to fetch vital types' }),
      { status: 500 }
    );
  }
}
