// app/api/search/specialities/route.ts - Medical specialities search API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause: any = {};

    // If search value provided, filter by name/description
    if (value) {
      whereClause.OR = [
        { name: { contains: value, mode: 'insensitive' } },
        { description: { contains: value, mode: 'insensitive' } }
      ];
    }

    const specialities = await prisma.speciality.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        _count: {
          select: {
            doctors_doctors_speciality_idTospecialiy: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform specialities data to match Express response format
    const responseData = {
      specialities: specialities.reduce((acc: any, speciality: any) => {
        acc[speciality.id] = {
          basic_info: {
            id: speciality.id.toString(),
            name: speciality.name,
            description: speciality.description,
            doctor_count: speciality._count.doctors_doctors_speciality_idTospecialiy
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
        message: 'Specialities retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Specialities search error:', error);
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