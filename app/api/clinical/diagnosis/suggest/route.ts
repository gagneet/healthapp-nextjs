import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Clinical diagnosis suggestion schema
const diagnosisSuggestionSchema = z.object({
  assessmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  clinicalFindings: z.array(z.object({
    finding: z.string(),
    present: z.boolean(),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
    notes: z.string().optional()
  })),
  diagnosticTests: z.array(z.object({
    testType: z.string(),
    result: z.string(),
    normalRange: z.string().optional(),
    abnormal: z.boolean(),
    significance: z.enum(['LOW', 'MODERATE', 'HIGH']).optional()
  })).optional(),
  additionalSymptoms: z.array(z.string()).optional(),
  excludedConditions: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors can make diagnosis suggestions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctorProfile: true }
    });

    if (!user?.doctorProfile) {
      return NextResponse.json({ 
        error: 'Access denied. Only doctors can create diagnosis suggestions.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = diagnosisSuggestionSchema.parse(body);

    // Verify patient exists and doctor has access
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      include: { 
        user: true,
        patientDoctorAssignments: {
          where: {
            doctorId: user.doctorProfile.id,
            isActive: true
          }
        }
      }
    });

    if (!patient || patient.patientDoctorAssignments.length === 0) {
      return NextResponse.json({ 
        error: 'Patient not found or access denied.' 
      }, { status: 404 });
    }

    // Generate evidence-based diagnosis suggestions
    const diagnosisSuggestions = await generateDiagnosisSuggestions(
      patient,
      validatedData
    );

    // Calculate confidence scores for each suggestion
    const scoredSuggestions = await calculateDiagnosisConfidence(
      diagnosisSuggestions,
      validatedData
    );

    // Generate treatment recommendations for top diagnoses
    const treatmentRecommendations = await generateTreatmentRecommendations(
      scoredSuggestions.slice(0, 3), // Top 3 diagnoses
      patient.id
    );

    // Check for drug interactions if medications are involved
    const drugInteractions = await checkDrugInteractions(
      treatmentRecommendations,
      patient.id
    );

    // Create clinical diagnosis record
    const diagnosisRecord = await prisma.clinicalDiagnosis.create({
      data: {
        assessmentId: validatedData.assessmentId,
        patientId: validatedData.patientId,
        doctorId: user.doctorProfile.id,
        clinicalFindings: validatedData.clinicalFindings,
        diagnosticTests: validatedData.diagnosticTests || [],
        diagnosisSuggestions: scoredSuggestions,
        treatmentRecommendations,
        drugInteractions,
        confidenceScore: scoredSuggestions[0]?.confidence || 0,
        status: 'PENDING_REVIEW',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Generate clinical decision support alerts
    const alerts = await generateClinicalAlerts(
      scoredSuggestions,
      treatmentRecommendations,
      drugInteractions
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'ClinicalDiagnosis',
        entityId: diagnosisRecord.id,
        patientId: validatedData.patientId,
        phiAccessed: true,
        accessGranted: true,
        dataChanges: {
          patientId: validatedData.patientId,
          topDiagnosis: scoredSuggestions[0]?.diagnosis || 'Unknown',
          confidenceScore: scoredSuggestions[0]?.confidence || 0,
          alertCount: alerts.length
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        diagnosisId: diagnosisRecord.id,
        diagnosisSuggestions: scoredSuggestions,
        treatmentRecommendations,
        drugInteractions,
        clinicalAlerts: alerts,
        confidence: scoredSuggestions[0]?.confidence || 0,
        recommendedActions: generateRecommendedActions(scoredSuggestions, alerts),
        followUpGuidelines: generateFollowUpGuidelines(scoredSuggestions)
      }
    });

  } catch (error) {
    console.error('Diagnosis suggestion error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to generate diagnosis suggestions'
    }, { status: 500 });
  }
}

// Generate evidence-based diagnosis suggestions
async function generateDiagnosisSuggestions(
  assessment: any,
  data: z.infer<typeof diagnosisSuggestionSchema>
): Promise<Array<any>> {
  // In production, this would integrate with medical knowledge bases
  // like UpToDate, BMJ Best Practice, or clinical decision support systems
  
  const mockDiagnoses = [
    {
      diagnosis: 'Acute Upper Respiratory Infection',
      icd10Code: 'J06.9',
      description: 'Viral or bacterial infection of upper respiratory tract',
      supportingEvidence: [
        'Fever and respiratory symptoms',
        'Seasonal pattern consistent',
        'Physical examination findings'
      ],
      differentiatingFactors: [
        'Duration of symptoms',
        'Response to treatment',
        'Associated complications'
      ]
    },
    {
      diagnosis: 'Acute Bronchitis',
      icd10Code: 'J20.9',
      description: 'Inflammation of bronchial tubes',
      supportingEvidence: [
        'Productive cough',
        'Chest examination findings',
        'Symptom progression pattern'
      ],
      differentiatingFactors: [
        'Chest X-ray findings',
        'Sputum characteristics',
        'Response to bronchodilators'
      ]
    },
    {
      diagnosis: 'Pneumonia',
      icd10Code: 'J15.9',
      description: 'Infection of lung parenchyma',
      supportingEvidence: [
        'Fever with respiratory symptoms',
        'Chest pain',
        'Physical examination findings'
      ],
      differentiatingFactors: [
        'Chest imaging required',
        'White blood cell count',
        'Oxygen saturation levels'
      ]
    }
  ];
  
  return mockDiagnoses;
}

// Calculate diagnosis confidence scores
async function calculateDiagnosisConfidence(
  diagnoses: Array<any>,
  data: z.infer<typeof diagnosisSuggestionSchema>
): Promise<Array<any>> {
  return diagnoses.map(diagnosis => {
    let confidence = 0.5; // Base confidence
    
    // Adjust based on clinical findings
    data.clinicalFindings.forEach(finding => {
      if (finding.present) {
        confidence += 0.1;
        if (finding.severity === 'SEVERE') confidence += 0.05;
      }
    });
    
    // Adjust based on diagnostic tests
    if (data.diagnosticTests) {
      data.diagnosticTests.forEach(test => {
        if (test.abnormal) {
          confidence += 0.15;
          if (test.significance === 'HIGH') confidence += 0.1;
        }
      });
    }
    
    // Cap confidence at 0.95 (always leave room for clinical judgment)
    confidence = Math.min(confidence, 0.95);
    
    return {
      ...diagnosis,
      confidence: Math.round(confidence * 100) / 100
    };
  }).sort((a, b) => b.confidence - a.confidence);
}

// Generate treatment recommendations
async function generateTreatmentRecommendations(
  topDiagnoses: Array<any>,
  patientId: string
): Promise<Array<any>> {
  // Get patient allergies and current medications
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: true,
      patientAllergies: true
    }
  });
  
  const recommendations = [];
  
  for (const diagnosis of topDiagnoses) {
    if (diagnosis.diagnosis.includes('Upper Respiratory Infection')) {
      recommendations.push({
        diagnosisCode: diagnosis.icd10Code,
        category: 'MEDICATION',
        recommendation: 'Supportive care with analgesics',
        details: 'Acetaminophen 650mg every 6 hours PRN fever/pain',
        evidence: 'First-line treatment for viral URI',
        contraindications: checkContraindications('acetaminophen', patient),
        duration: '5-7 days',
        followUp: '48-72 hours if symptoms worsen'
      });
      
      recommendations.push({
        diagnosisCode: diagnosis.icd10Code,
        category: 'NON_PHARMACOLOGICAL',
        recommendation: 'Conservative management',
        details: 'Rest, fluids, throat lozenges, humidified air',
        evidence: 'Standard supportive care recommendations',
        contraindications: [],
        duration: 'Until symptoms resolve',
        followUp: 'Return if no improvement in 7-10 days'
      });
    }
    
    if (diagnosis.diagnosis.includes('Pneumonia')) {
      recommendations.push({
        diagnosisCode: diagnosis.icd10Code,
        category: 'MEDICATION',
        recommendation: 'Antibiotic therapy',
        details: 'Amoxicillin 875mg BID x 7 days (if no penicillin allergy)',
        evidence: 'First-line antibiotic for community-acquired pneumonia',
        contraindications: checkContraindications('amoxicillin', patient),
        duration: '7 days',
        followUp: '48-72 hours to assess response'
      });
      
      recommendations.push({
        diagnosisCode: diagnosis.icd10Code,
        category: 'DIAGNOSTIC',
        recommendation: 'Chest X-ray',
        details: 'PA and lateral chest X-ray to confirm diagnosis',
        evidence: 'Standard diagnostic imaging for pneumonia',
        contraindications: [],
        duration: 'Immediate',
        followUp: 'Repeat if no clinical improvement'
      });
    }
  }
  
  return recommendations;
}

// Check for drug interactions
async function checkDrugInteractions(
  treatments: Array<any>,
  patientId: string
): Promise<Array<any>> {
  const interactions: any[] = [];
  
  // Get current medications
  const currentMeds = await prisma.medication.findMany({
    where: {
      participantId: patientId
    }
  });
  
  // Mock interaction checking (in production, integrate with drug interaction APIs)
  treatments.forEach(treatment => {
    if (treatment.category === 'MEDICATION') {
      currentMeds.forEach(med => {
        // Example interaction check
        if (treatment.details && treatment.details.includes('Warfarin') && med.description?.includes('Aspirin')) {
          interactions.push({
            severity: 'MAJOR',
            drug1: 'Warfarin',
            drug2: 'Aspirin',
            interaction: 'Increased bleeding risk',
            recommendation: 'Monitor INR closely, consider dose adjustment',
            evidence: 'Well-documented interaction'
          });
        }
      });
    }
  });
  
  return interactions;
}

// Generate clinical alerts
async function generateClinicalAlerts(
  diagnoses: Array<any>,
  treatments: Array<any>,
  interactions: Array<any>
): Promise<Array<any>> {
  const alerts = [];
  
  // Drug interaction alerts
  interactions.forEach(interaction => {
    if (interaction.severity === 'MAJOR') {
      alerts.push({
        type: 'DRUG_INTERACTION',
        severity: 'HIGH',
        message: `Major drug interaction: ${interaction.drug1} + ${interaction.drug2}`,
        recommendation: interaction.recommendation,
        requiresAction: true
      });
    }
  });
  
  // Low confidence diagnosis alert
  if (diagnoses[0]?.confidence < 0.6) {
    alerts.push({
      type: 'LOW_CONFIDENCE',
      severity: 'MEDIUM',
      message: 'Diagnosis confidence below 60% - consider additional testing',
      recommendation: 'Obtain more clinical data or specialist consultation',
      requiresAction: false
    });
  }
  
  // Critical diagnosis alert
  if (diagnoses.some(d => d.diagnosis.includes('Pneumonia'))) {
    alerts.push({
      type: 'CRITICAL_DIAGNOSIS',
      severity: 'HIGH',
      message: 'Pneumonia suspected - requires immediate attention',
      recommendation: 'Consider chest imaging and antibiotic therapy',
      requiresAction: true
    });
  }
  
  return alerts;
}

// Helper functions
function checkContraindications(medication: string, patient: any): Array<string> {
  const contraindications: string[] = [];
  
  if (patient?.allergies) {
    patient.allergies.forEach((allergy: any) => {
      if (allergy.allergen.toLowerCase().includes(medication.toLowerCase())) {
        contraindications.push(`Allergy to ${allergy.allergen}`);
      }
    });
  }
  
  return contraindications;
}

function generateRecommendedActions(diagnoses: Array<any>, alerts: Array<any>): Array<string> {
  const actions = [];
  
  if (alerts.some(a => a.severity === 'HIGH')) {
    actions.push('Address high-priority alerts immediately');
  }
  
  if (diagnoses[0]?.confidence > 0.8) {
    actions.push('Initiate evidence-based treatment plan');
  } else {
    actions.push('Consider additional diagnostic testing');
  }
  
  actions.push('Document clinical decision-making process');
  actions.push('Schedule appropriate follow-up');
  
  return actions;
}

function generateFollowUpGuidelines(diagnoses: Array<any>): Array<any> {
  return [
    {
      timeframe: '24-48 hours',
      purpose: 'Assess treatment response',
      indicators: 'Worsening symptoms, fever persistence',
      action: 'Clinical re-evaluation'
    },
    {
      timeframe: '7-10 days',
      purpose: 'Complete treatment assessment',
      indicators: 'Resolution of symptoms',
      action: 'Treatment completion evaluation'
    },
    {
      timeframe: '2-4 weeks',
      purpose: 'Ensure full recovery',
      indicators: 'Return to baseline function',
      action: 'Final outcome assessment'
    }
  ];
}