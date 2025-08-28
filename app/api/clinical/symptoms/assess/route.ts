import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Clinical symptom assessment schema
const symptomAssessmentSchema = z.object({
  patientId: z.string().uuid(),
  symptoms: z.array(z.object({
    symptomCode: z.string(), // ICD-10 or SNOMED CT code
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
    duration: z.string(), // e.g., "3 days", "2 weeks"
    onset: z.enum(['SUDDEN', 'GRADUAL', 'CHRONIC']),
    description: z.string().max(500),
    bodyLocation: z.string().optional(),
    aggravatingFactors: z.array(z.string()).optional(),
    relievingFactors: z.array(z.string()).optional()
  })),
  vitalSigns: z.object({
    temperature: z.number().optional(),
    bloodPressureSystolic: z.number().optional(),
    bloodPressureDiastolic: z.number().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional()
  }).optional(),
  patientHistory: z.object({
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    chronicConditions: z.array(z.string()).optional(),
    recentProcedures: z.array(z.string()).optional()
  }).optional(),
  riskFactors: z.object({
    age: z.number().int().positive(),
    smokingStatus: z.enum(['NEVER', 'FORMER', 'CURRENT']).optional(),
    alcoholUse: z.enum(['NONE', 'OCCASIONAL', 'MODERATE', 'HEAVY']).optional(),
    exerciseLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE']).optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors and HSPs can perform clinical assessments
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctor: true, hsp: true }
    });

    if (!user || (!user.doctor && !user.hsp)) {
      return NextResponse.json({ 
        error: 'Access denied. Only healthcare providers can perform clinical assessments.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = symptomAssessmentSchema.parse(body);

    // Verify patient access
    const patientAccess = await prisma.patientDoctorAssignment.findFirst({
      where: {
        patientId: validatedData.patientId,
        OR: [
          { doctorId: user.doctor?.id },
          { hspId: user.hsp?.id }
        ],
        status: 'ACTIVE'
      }
    });

    if (!patientAccess) {
      return NextResponse.json({ 
        error: 'Access denied. Patient not assigned to your care.' 
      }, { status: 403 });
    }

    // Create symptom assessment record
    const assessment = await prisma.symptomAssessment.create({
      data: {
        patientId: validatedData.patientId,
        assessorId: session.user.id,
        assessorType: user.doctor ? 'DOCTOR' : 'HSP',
        symptoms: validatedData.symptoms,
        vitalSigns: validatedData.vitalSigns || {},
        patientHistory: validatedData.patientHistory || {},
        riskFactors: validatedData.riskFactors || {},
        status: 'PENDING_ANALYSIS',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Generate clinical risk score
    const riskScore = calculateClinicalRiskScore(validatedData);

    // Check for red flag symptoms requiring immediate attention
    const redFlags = identifyRedFlagSymptoms(validatedData.symptoms);

    // Generate preliminary differential diagnosis suggestions
    const differentialDx = await generateDifferentialDiagnosis(validatedData);

    // Create clinical decision support recommendations
    const recommendations = await generateClinicalRecommendations(
      validatedData,
      riskScore,
      redFlags
    );

    // Update assessment with analysis results
    const updatedAssessment = await prisma.symptomAssessment.update({
      where: { id: assessment.id },
      data: {
        riskScore,
        redFlags,
        differentialDiagnosis: differentialDx,
        recommendations,
        status: 'ANALYZED',
        analysisCompletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SYMPTOM_ASSESSMENT_CREATED',
        resourceType: 'SymptomAssessment',
        resourceId: assessment.id,
        details: {
          patientId: validatedData.patientId,
          symptomCount: validatedData.symptoms.length,
          riskScore,
          hasRedFlags: redFlags.length > 0
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: updatedAssessment.id,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        redFlags,
        differentialDiagnosis: differentialDx,
        recommendations,
        urgency: determineUrgency(riskScore, redFlags),
        nextSteps: getNextSteps(riskScore, redFlags, differentialDx)
      }
    });

  } catch (error) {
    console.error('Clinical assessment error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to perform clinical assessment'
    }, { status: 500 });
  }
}

// Clinical risk scoring algorithm
function calculateClinicalRiskScore(data: z.infer<typeof symptomAssessmentSchema>): number {
  let score = 0;
  
  // Symptom severity scoring
  data.symptoms.forEach(symptom => {
    switch (symptom.severity) {
      case 'CRITICAL': score += 25; break;
      case 'SEVERE': score += 15; break;
      case 'MODERATE': score += 8; break;
      case 'MILD': score += 3; break;
    }
    
    // Onset factor
    if (symptom.onset === 'SUDDEN') score += 10;
  });
  
  // Vital signs risk factors
  if (data.vitalSigns) {
    const vitals = data.vitalSigns;
    
    // Temperature
    if (vitals.temperature && (vitals.temperature > 38.5 || vitals.temperature < 35.0)) {
      score += 15;
    }
    
    // Blood pressure
    if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
      if (vitals.bloodPressureSystolic > 180 || vitals.bloodPressureDiastolic > 120) {
        score += 20; // Hypertensive crisis
      } else if (vitals.bloodPressureSystolic < 90 || vitals.bloodPressureDiastolic < 60) {
        score += 15; // Hypotension
      }
    }
    
    // Heart rate
    if (vitals.heartRate) {
      if (vitals.heartRate > 120 || vitals.heartRate < 50) {
        score += 12;
      }
    }
    
    // Oxygen saturation
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 92) {
      score += 20;
    }
  }
  
  // Age risk factor
  if (data.riskFactors?.age) {
    if (data.riskFactors.age > 65) score += 5;
    if (data.riskFactors.age > 80) score += 10;
  }
  
  return Math.min(score, 100); // Cap at 100
}

// Red flag symptom identification
function identifyRedFlagSymptoms(symptoms: Array<any>): Array<string> {
  const redFlags: string[] = [];
  
  const redFlagSymptoms = [
    'chest pain with radiation',
    'sudden severe headache',
    'difficulty breathing at rest',
    'loss of consciousness',
    'severe abdominal pain',
    'signs of stroke',
    'severe allergic reaction',
    'uncontrolled bleeding',
    'signs of sepsis'
  ];
  
  symptoms.forEach(symptom => {
    if (symptom.severity === 'CRITICAL') {
      redFlags.push(`Critical severity: ${symptom.description}`);
    }
    
    if (symptom.onset === 'SUDDEN' && symptom.severity !== 'MILD') {
      redFlags.push(`Sudden onset: ${symptom.description}`);
    }
    
    // Check for specific red flag patterns
    redFlagSymptoms.forEach(redFlagPattern => {
      if (symptom.description.toLowerCase().includes(redFlagPattern.toLowerCase())) {
        redFlags.push(`Red flag symptom: ${redFlagPattern}`);
      }
    });
  });
  
  return [...new Set(redFlags)]; // Remove duplicates
}

// Generate differential diagnosis suggestions
async function generateDifferentialDiagnosis(
  data: z.infer<typeof symptomAssessmentSchema>
): Promise<Array<any>> {
  // This would integrate with medical knowledge bases in production
  const mockDifferentials = [
    {
      condition: 'Upper Respiratory Infection',
      probability: 0.65,
      reasoning: 'Common symptoms pattern matches',
      icd10Code: 'J06.9'
    },
    {
      condition: 'Viral Gastroenteritis',
      probability: 0.25,
      reasoning: 'GI symptoms with fever',
      icd10Code: 'K59.1'
    }
  ];
  
  return mockDifferentials;
}

// Generate clinical recommendations
async function generateClinicalRecommendations(
  data: z.infer<typeof symptomAssessmentSchema>,
  riskScore: number,
  redFlags: string[]
): Promise<Array<any>> {
  const recommendations = [];
  
  if (riskScore > 70 || redFlags.length > 0) {
    recommendations.push({
      type: 'IMMEDIATE_ACTION',
      priority: 'URGENT',
      recommendation: 'Consider immediate evaluation or emergency department referral',
      reasoning: 'High risk score or red flag symptoms present'
    });
  }
  
  if (riskScore > 40) {
    recommendations.push({
      type: 'DIAGNOSTIC',
      priority: 'HIGH',
      recommendation: 'Consider comprehensive diagnostic workup',
      reasoning: 'Moderate to high risk assessment'
    });
  }
  
  recommendations.push({
    type: 'MONITORING',
    priority: 'STANDARD',
    recommendation: 'Schedule follow-up within 24-48 hours',
    reasoning: 'Standard monitoring for symptom progression'
  });
  
  return recommendations;
}

// Utility functions
function getRiskLevel(score: number): string {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
}

function determineUrgency(riskScore: number, redFlags: string[]): string {
  if (redFlags.length > 0 || riskScore >= 70) return 'URGENT';
  if (riskScore >= 40) return 'MODERATE';
  return 'ROUTINE';
}

function getNextSteps(riskScore: number, redFlags: string[], differentials: Array<any>): Array<string> {
  const steps = [];
  
  if (redFlags.length > 0) {
    steps.push('Immediate clinical evaluation required');
  }
  
  if (riskScore >= 40) {
    steps.push('Consider diagnostic testing based on differential diagnosis');
    steps.push('Monitor vital signs closely');
  }
  
  steps.push('Document patient education provided');
  steps.push('Schedule appropriate follow-up');
  
  return steps;
}