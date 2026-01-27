// app/api/search/treatments/route.ts - Medical treatments search API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';

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

    // Only healthcare providers can search treatments
    if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Only healthcare providers can search treatments' } }
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const treatmentType = searchParams.get('treatment_type');
    const condition = searchParams.get('condition');
    const severityLevel = searchParams.get('severity_level');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          payload: { error: { status: 'validation_error', message: 'Search query is required' } }
        },
        { status: 400 }
      );
    }

    const whereClause: any = {
      AND: [
        { isActive: true },
        {
          OR: [
            { treatment_name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    };

    // Add category filter
    if (category) {
      whereClause.AND.push({
        category: { contains: category, mode: 'insensitive' }
      });
    }

    // Add treatment type filter
    if (treatmentType) {
      whereClause.AND.push({
        treatment_type: { contains: treatmentType, mode: 'insensitive' }
      });
    }

    // Add condition filter (search within applicable_conditions array)
    if (condition) {
      whereClause.AND.push({
        applicable_conditions: { has: condition }
      });
    }

    // Add severity level filter
    if (severityLevel) {
      whereClause.AND.push({
        severity_level: severityLevel
      });
    }

    const treatments = await prisma.treatment_database.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        treatment_name: true,
        treatment_type: true,
        category: true,
        description: true,
        applicable_conditions: true,
        severity_level: true,
        effectiveness_rating: true,
        side_effects: true,
        contraindications: true,
        duration_weeks: true,
        cost_range: true,
        success_rate: true,
        recovery_time: true,
        prerequisites: true,
        follow_up_required: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { effectiveness_rating: 'desc' },
        { treatment_name: 'asc' }
      ]
    });

    // Get category distribution
    const categoryDistribution = treatments.reduce((acc: any, treatment) => {
      const cat = treatment.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    // Get treatment type distribution
    const typeDistribution = treatments.reduce((acc: any, treatment) => {
      const type = treatment.treatment_type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate average effectiveness
    const avgEffectiveness = treatments.length > 0 
      ? treatments.reduce((sum, t) => sum + (t.effectiveness_rating || 0), 0) / treatments.length
      : 0;

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          treatments: treatments.map(treatment => ({
            id: treatment.id,
            name: treatment.treatment_name,
            type: treatment.treatment_type,
            category: treatment.category,
            description: treatment.description,
            applicable_conditions: treatment.applicable_conditions || [],
            severity_level: treatment.severity_level,
            effectiveness_rating: treatment.effectiveness_rating,
            success_rate: treatment.success_rate,
            side_effects: treatment.side_effects || [],
            contraindications: treatment.contraindications || [],
            duration_weeks: treatment.duration_weeks,
            cost_range: treatment.cost_range,
            recovery_time: treatment.recovery_time,
            prerequisites: treatment.prerequisites || [],
            follow_up_required: treatment.follow_up_required || false,
            last_updated: treatment.updatedAt
          })),
          metadata: {
            query,
            filters: {
              category,
              treatment_type: treatmentType,
              condition,
              severity_level: severityLevel
            },
            total_treatments: treatments.length,
            average_effectiveness: Math.round(avgEffectiveness * 100) / 100,
            category_distribution: categoryDistribution,
            type_distribution: typeDistribution,
            available_categories: Object.keys(categoryDistribution),
            available_types: Object.keys(typeDistribution)
          }
        },
        message: `Found ${treatments.length} treatments matching "${query}"`
      }
    });

  } catch (error) {
    console.error('Treatments search error:', error);
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
