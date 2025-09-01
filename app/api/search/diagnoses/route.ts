// app/api/search/diagnoses/route.ts - Medical diagnoses search API
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
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const ageGroup = searchParams.get('age_group');
    const gender = searchParams.get('gender');
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
        { diagnosis_name: { contains: query, mode: 'insensitive' } }
      ]
    };

    // Add category filter
    if (category) {
      whereClause.AND.push({
        category: { contains: category, mode: 'insensitive' }
      });
    }

    // Add age group filter
    if (ageGroup) {
      whereClause.AND.push({
        common_age_groups: { has: ageGroup }
      });
    }

    // Add gender filter
    if (gender && gender !== 'both') {
      whereClause.AND.push({
        OR: [
          { gender_specific: 'both' },
          { gender_specific: gender }
        ]
      });
    }

    const diagnoses = await prisma.symptoms_database.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        diagnosis_name: true,
        category: true,
        symptoms: true,
        severity_indicators: true,
        common_age_groups: true,
        gender_specific: true,
        risk_factors: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { diagnosis_name: 'asc' }
    });

    // Get related symptoms count
    const symptomsCount = diagnoses.reduce((acc, diagnosis) => {
      return acc + (Array.isArray(diagnosis.symptoms) ? diagnosis.symptoms.length : 0);
    }, 0);

    // Get categories distribution
    const categoriesDistribution = diagnoses.reduce((acc: any, diagnosis) => {
      const cat = diagnosis.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          diagnoses: diagnoses.map(diagnosis => ({
            id: diagnosis.id,
            name: diagnosis.diagnosis_name,
            category: diagnosis.category,
            symptoms: diagnosis.symptoms || [],
            symptom_count: Array.isArray(diagnosis.symptoms) ? diagnosis.symptoms.length : 0,
            severity_indicators: diagnosis.severity_indicators,
            common_age_groups: diagnosis.common_age_groups || [],
            gender_specific: diagnosis.gender_specific,
            risk_factors: diagnosis.risk_factors || [],
            last_updated: diagnosis.updatedAt
          })),
          metadata: {
            query,
            filters: {
              category,
              severity,
              age_group: ageGroup,
              gender
            },
            total_diagnoses: diagnoses.length,
            total_symptoms: symptomsCount,
            categories_distribution: categoriesDistribution,
            available_categories: Object.keys(categoriesDistribution)
          }
        },
        message: `Found ${diagnoses.length} diagnoses matching "${query}"`
      }
    });

  } catch (error) {
    console.error('Diagnoses search error:', error);
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
