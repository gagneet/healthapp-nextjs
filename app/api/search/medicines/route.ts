// app/api/search/medicines/route.ts - Medicine search API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

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
    const value = searchParams.get('value');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!value) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          payload: { error: { status: 'validation_error', message: 'Search value is required' } }
        },
        { status: 400 }
      );
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        AND: [
          { public_medicine: true },
          {
            OR: [
              { name: { contains: value, mode: 'insensitive' } },
              { description: { contains: value, mode: 'insensitive' } }
            ]
          }
        ]
      },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        details: true,
        public_medicine: true,
        created_at: true
      },
      orderBy: { name: 'asc' }
    });

    // Transform medicines data to match Express response format
    const responseData = {
      medicines: medicines.reduce((acc: any, medicine: any) => {
        acc[medicine.id] = {
          basic_info: {
            id: medicine.id.toString(),
            name: medicine.name,
            type: medicine.type,
            strength: medicine.details?.strength || medicine.details?.common_dosages?.[0] || '',
            generic_name: medicine.details?.generic_name || '',
            description: medicine.description,
            brand_names: medicine.details?.brand_names || [],
            drug_class: medicine.details?.drug_class || '',
            side_effects: medicine.details?.side_effects || [],
            contraindications: medicine.details?.contraindications || [],
            interactions: medicine.details?.interactions || []
          }
        };
        return acc;
      }, {})
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: responseData,
        message: `Found ${medicines.length} medicines`
      }
    });

  } catch (error) {
    console.error('Medicine search error:', error);
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
