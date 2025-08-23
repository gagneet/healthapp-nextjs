// app/api/search/symptoms/route.ts - Symptoms search API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // Search in symptoms database for diagnoses that contain the symptom
    const symptomsFromDb = await prisma.symptoms_database.findMany({
      where: {
        AND: [
          { is_active: true },
          {
            OR: [
              { diagnosis_name: { contains: query, mode: 'insensitive' } },
              { symptoms: { has: query } }, // Search within symptoms array
              { category: { contains: query, mode: 'insensitive' } }
            ]
          },
          ...(category ? [{ category: { contains: category, mode: 'insensitive' } }] : [])
        ]
      },
      take: limit,
      select: {
        id: true,
        diagnosis_name: true,
        symptoms: true,
        category: true,
        severity_indicators: true,
        common_age_groups: true,
        gender_specific: true,
        risk_factors: true
      },
      orderBy: { diagnosis_name: 'asc' }
    });

    // Extract all unique symptoms from the database entries
    const allSymptoms = new Set<string>();
    symptomsFromDb.forEach(diagnosis => {
      if (Array.isArray(diagnosis.symptoms)) {
        diagnosis.symptoms.forEach((symptom: string) => {
          if (symptom.toLowerCase().includes(query.toLowerCase())) {
            allSymptoms.add(symptom);
          }
        });
      }
    });

    // Convert to array and filter based on query
    const filteredSymptoms = Array.from(allSymptoms)
      .filter(symptom => 
        symptom.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .sort();

    // Also search in actual patient symptoms
    const patientSymptoms = await prisma.symptoms.findMany({
      where: {
        OR: [
          { symptom_name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        symptom_name: true,
        description: true,
        severity: true,
        body_location: true,
        triggers: true,
        relieving_factors: true
      },
      distinct: ['symptom_name']
    });

    // Combine results
    const combinedSymptoms = [
      ...filteredSymptoms.map(symptom => ({
        name: symptom,
        type: 'database',
        category: symptomsFromDb.find(d => 
          Array.isArray(d.symptoms) && d.symptoms.includes(symptom)
        )?.category || 'Unknown'
      })),
      ...patientSymptoms.map(ps => ({
        name: ps.symptom_name,
        description: ps.description,
        type: 'patient_reported',
        severity_range: `1-${ps.severity}`,
        body_location: ps.body_location,
        triggers: ps.triggers,
        relieving_factors: ps.relieving_factors
      }))
    ];

    // Remove duplicates by name
    const uniqueSymptoms = combinedSymptoms.filter((symptom, index, self) =>
      index === self.findIndex(s => s.name.toLowerCase() === symptom.name.toLowerCase())
    );

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          symptoms: uniqueSymptoms,
          related_diagnoses: symptomsFromDb.map(diagnosis => ({
            id: diagnosis.id,
            name: diagnosis.diagnosis_name,
            category: diagnosis.category,
            symptoms: diagnosis.symptoms,
            severity_indicators: diagnosis.severity_indicators,
            risk_factors: diagnosis.risk_factors
          })),
          metadata: {
            query,
            category,
            total_symptoms: uniqueSymptoms.length,
            related_diagnoses_count: symptomsFromDb.length
          }
        },
        message: `Found ${uniqueSymptoms.length} symptoms matching "${query}"`
      }
    });

  } catch (error) {
    console.error('Symptoms search error:', error);
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
