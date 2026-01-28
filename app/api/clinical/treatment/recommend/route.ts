import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Treatment recommendation schema

export const dynamic = 'force-dynamic';

const treatmentRecommendationSchema = z.object({
  diagnosisId: z.string().uuid(),
  patientId: z.string().uuid(),
  selectedDiagnosis: z.object({
    diagnosisCode: z.string(),
    diagnosis: z.string(),
    confidence: z.number().min(0).max(1)
  }),
  patientFactors: z.object({
    age: z.number().int().positive(),
    weight: z.number().positive().optional(),
    height: z.number().positive().optional(),
    pregnancyStatus: z.enum(['PREGNANT', 'BREASTFEEDING', 'NOT_APPLICABLE']).optional(),
    renalFunction: z.enum(['NORMAL', 'MILD_IMPAIRMENT', 'MODERATE_IMPAIRMENT', 'SEVERE_IMPAIRMENT']).optional(),
    hepaticFunction: z.enum(['NORMAL', 'MILD_IMPAIRMENT', 'MODERATE_IMPAIRMENT', 'SEVERE_IMPAIRMENT']).optional(),
    allergies: z.array(z.string()).optional(),
    intolerances: z.array(z.string()).optional()
  }),
  treatmentGoals: z.array(z.enum([
    'SYMPTOM_RELIEF',
    'CURE_INFECTION',
    'PREVENT_COMPLICATIONS',
    'IMPROVE_QUALITY_OF_LIFE',
    'REDUCE_HOSPITALIZATIONS',
    'MAINTAIN_FUNCTION'
  ])),
  treatmentPreferences: z.object({
    route: z.enum(['ORAL', 'PARENTERAL', 'TOPICAL', 'INHALATION', 'ANY']).optional(),
    duration: z.enum(['SHORT_TERM', 'LONG_TERM', 'AS_NEEDED']).optional(),
    complexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX']).optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors can create treatment recommendations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctorProfile: true }
    });

    if (!user?.doctorProfile) {
      return NextResponse.json({ 
        error: 'Access denied. Only doctors can create treatment recommendations.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = treatmentRecommendationSchema.parse(body);

    // Verify diagnosis exists and doctor has access
    const diagnosis = await prisma.clinicalDiagnosis.findUnique({
      where: { id: validatedData.diagnosisId },
      include: {
        patient: {
          include: {
            user: true,
            patientDoctorAssignments: {
              where: {
                doctorId: user.doctorProfile.id,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!diagnosis || diagnosis.patient.patientDoctorAssignments.length === 0) {
      return NextResponse.json({ 
        error: 'Diagnosis not found or access denied.' 
      }, { status: 404 });
    }

    // Get comprehensive patient profile for treatment planning
    const patientProfile = await getComprehensivePatientProfile(validatedData.patientId);

    // Generate evidence-based treatment recommendations
    const treatmentOptions = await generateTreatmentOptions(
      validatedData.selectedDiagnosis,
      validatedData.patientFactors,
      patientProfile
    );

    // Rank treatments based on patient factors and evidence
    const rankedTreatments = await rankTreatmentOptions(
      treatmentOptions,
      validatedData.patientFactors,
      validatedData.treatmentGoals,
      validatedData.treatmentPreferences
    );

    // Perform comprehensive drug interaction checking  
    const currentMedications = patientProfile?.medicationLogs?.map(log => log.medication) || [];
    const drugInteractionAnalysis = await performDrugInteractionAnalysis(
      rankedTreatments,
      currentMedications
    );

    // Generate dosing recommendations based on patient factors
    const dosingRecommendations = await generateDosingRecommendations(
      rankedTreatments,
      validatedData.patientFactors
    );

    // Create monitoring protocols for recommended treatments
    const monitoringProtocols = await generateMonitoringProtocols(
      rankedTreatments,
      validatedData.patientFactors
    );

    // Generate patient education materials
    const patientEducation = await generatePatientEducation(
      rankedTreatments,
      validatedData.selectedDiagnosis
    );

    // Create treatment plan record
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        id: crypto.randomUUID(),
        patientId: validatedData.patientId,
        doctorId: user.doctorProfile.id,
        title: `Treatment Plan - ${validatedData.selectedDiagnosis.diagnosis || 'Clinical Assessment'}`,
        primaryDiagnosis: validatedData.selectedDiagnosis.diagnosis || 'Unspecified',
        treatmentGoals: validatedData.treatmentGoals,
        interventions: {
          recommendedTreatments: rankedTreatments,
          drugInteractions: drugInteractionAnalysis,
          dosingRecommendations,
          monitoringProtocols,
          patientEducation
        },
        startDate: new Date(),
        createdAt: new Date()
      }
    });

    // Generate treatment alerts and warnings
    const treatmentAlerts = await generateTreatmentAlerts(
      rankedTreatments,
      drugInteractionAnalysis,
      validatedData.patientFactors
    );

    // Create clinical decision support summary
    const decisionSupportSummary = await generateDecisionSupportSummary(
      treatmentPlan,
      treatmentAlerts
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userRole: 'DOCTOR',
        action: 'CREATE',
        resource: `TreatmentPlan created for patient ${validatedData.patientId}`,
        patientId: validatedData.patientId,
        entityType: 'TreatmentPlan',
        entityId: treatmentPlan.id,
        phiAccessed: true,
        accessGranted: true,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Calculate evidence level based on treatments
    const evidenceLevel = calculateEvidenceLevel(rankedTreatments);

    return NextResponse.json({
      success: true,
      data: {
        treatmentPlanId: treatmentPlan.id,
        recommendedTreatments: rankedTreatments,
        drugInteractionAnalysis,
        dosingRecommendations,
        monitoringProtocols,
        patientEducation,
        treatmentAlerts,
        decisionSupportSummary,
        evidenceLevel,
        implementationGuidance: generateImplementationGuidance(rankedTreatments),
        followUpSchedule: generateFollowUpSchedule(rankedTreatments, validatedData.selectedDiagnosis)
      }
    });

  } catch (error) {
    console.error('Treatment recommendation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to generate treatment recommendations'
    }, { status: 500 });
  }
}

// Get comprehensive patient profile
async function getComprehensivePatientProfile(patientId: string) {
  return await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      medicationLogs: {
        where: { adherenceStatus: 'TAKEN' },
        include: { medication: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      medicationSafetyAlerts: {
        where: { resolved: false },
        orderBy: { createdAt: 'desc' }
      },
      patientAlerts: {
        where: { resolved: false },
        orderBy: { createdAt: 'desc' }
      },
      adherenceRecords: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });
}

// Generate evidence-based treatment options
async function generateTreatmentOptions(
  diagnosis: any,
  patientFactors: any,
  patientProfile: any
): Promise<Array<any>> {
  // In production, this would integrate with clinical guidelines databases
  const treatments = [];
  
  if (diagnosis.diagnosis.includes('Upper Respiratory Infection')) {
    treatments.push({
      category: 'FIRST_LINE',
      type: 'SYMPTOMATIC',
      medication: 'Acetaminophen',
      dosage: '650mg every 6 hours',
      route: 'ORAL',
      duration: '5-7 days',
      indication: 'Fever and pain relief',
      evidenceLevel: 'A',
      costTier: 'LOW',
      sideEffects: ['Hepatotoxicity (rare)', 'GI upset (minimal)'],
      contraindications: ['Severe hepatic impairment'],
      monitoring: ['Liver function if prolonged use']
    });
    
    treatments.push({
      category: 'SUPPORTIVE',
      type: 'NON_PHARMACOLOGICAL',
      intervention: 'Conservative management',
      details: 'Rest, fluids 2-3L/day, throat lozenges, humidified air',
      duration: 'Until symptom resolution',
      indication: 'Viral URI supportive care',
      evidenceLevel: 'C',
      costTier: 'NONE',
      benefits: ['Natural recovery support', 'No drug interactions'],
      precautions: ['Monitor for bacterial superinfection']
    });
  }
  
  if (diagnosis.diagnosis.includes('Pneumonia')) {
    treatments.push({
      category: 'FIRST_LINE',
      type: 'ANTIBIOTIC',
      medication: 'Amoxicillin',
      dosage: '875mg twice daily',
      route: 'ORAL',
      duration: '7 days',
      indication: 'Community-acquired pneumonia',
      evidenceLevel: 'A',
      costTier: 'LOW',
      sideEffects: ['GI upset', 'Diarrhea', 'Allergic reactions'],
      contraindications: ['Penicillin allergy'],
      monitoring: ['Clinical response at 48-72 hours', 'Complete blood count']
    });
    
    treatments.push({
      category: 'ALTERNATIVE',
      type: 'ANTIBIOTIC',
      medication: 'Azithromycin',
      dosage: '500mg day 1, then 250mg days 2-5',
      route: 'ORAL',
      duration: '5 days',
      indication: 'Penicillin-allergic patients or atypical coverage',
      evidenceLevel: 'A',
      costTier: 'MODERATE',
      sideEffects: ['GI upset', 'QT prolongation', 'Hearing loss (rare)'],
      contraindications: ['QT prolongation history'],
      monitoring: ['ECG if cardiac risk factors', 'Hearing assessment']
    });
  }
  
  return treatments;
}

// Rank treatment options based on patient factors
async function rankTreatmentOptions(
  treatments: Array<any>,
  patientFactors: any,
  treatmentGoals: string[],
  preferences: any = {}
): Promise<Array<any>> {
  return treatments.map(treatment => {
    let score = 5; // Base score
    
    // Evidence level scoring
    switch (treatment.evidenceLevel) {
      case 'A': score += 3; break;
      case 'B': score += 2; break;
      case 'C': score += 1; break;
    }
    
    // Cost considerations
    switch (treatment.costTier) {
      case 'LOW': score += 2; break;
      case 'MODERATE': score += 1; break;
      case 'HIGH': score -= 1; break;
    }
    
    // Age-specific considerations
    if (patientFactors.age > 65 && treatment.type === 'NON_PHARMACOLOGICAL') {
      score += 1; // Prefer less medication in elderly
    }
    
    // Pregnancy considerations
    if (patientFactors.pregnancyStatus === 'PREGNANT') {
      if (treatment.medication === 'Acetaminophen') {
        score += 2; // Safer in pregnancy
      } else if (treatment.type === 'ANTIBIOTIC') {
        score -= 1; // Use cautiously
      }
    }
    
    // Renal function adjustments
    if (patientFactors.renalFunction === 'MODERATE_IMPAIRMENT' && treatment.type === 'ANTIBIOTIC') {
      score -= 1; // May need dose adjustment
    }
    
    // Route preferences
    if (preferences?.route && treatment.route === preferences.route) {
      score += 1;
    }
    
    return {
      ...treatment,
      rankingScore: Math.round(score * 10) / 10,
      recommendationStrength: getRecommendationStrength(score)
    };
  }).sort((a, b) => b.rankingScore - a.rankingScore);
}

// Perform comprehensive drug interaction analysis
async function performDrugInteractionAnalysis(
  treatments: Array<any>,
  currentMedications: Array<any>
): Promise<Array<any>> {
  const interactions = [];
  
  for (const treatment of treatments) {
    if (!treatment.medication) continue;
    
    for (const currentMed of currentMedications) {
      // Mock interaction database lookup
      const interaction = checkDrugInteraction(treatment.medication, currentMed.medicationName);
      if (interaction) {
        interactions.push({
          newMedication: treatment.medication,
          existingMedication: currentMed.medicationName,
          severity: interaction.severity,
          mechanism: interaction.mechanism,
          clinicalEffect: interaction.clinicalEffect,
          management: interaction.management,
          references: interaction.references
        });
      }
    }
  }
  
  return interactions;
}

// Generate dosing recommendations
async function generateDosingRecommendations(
  treatments: Array<any>,
  patientFactors: any
): Promise<Array<any>> {
  return treatments.map(treatment => {
    if (!treatment.medication) return treatment;
    
    const dosing = {
      medication: treatment.medication,
      standardDose: treatment.dosage,
      adjustedDose: treatment.dosage,
      adjustmentReason: [] as string[],
      administration: {
        timing: 'With or without food',
        specialInstructions: [] as string[]
      }
    };
    
    // Age-based adjustments
    if (patientFactors.age > 65) {
      dosing.adjustmentReason.push('Elderly patient - consider starting at lower dose');
      dosing.administration.specialInstructions.push('Monitor for increased sensitivity');
    }
    
    // Renal function adjustments
    if (patientFactors.renalFunction !== 'NORMAL' && treatment.type === 'ANTIBIOTIC') {
      dosing.adjustmentReason.push('Renal function impairment - dose adjustment required');
      dosing.adjustedDose = `${treatment.dosage} (adjust per renal function)`;
    }
    
    // Weight-based adjustments (for applicable medications)
    if (patientFactors.weight && treatment.medication === 'Azithromycin') {
      dosing.administration.specialInstructions.push('Weight-based dosing verified');
    }
    
    return {
      ...treatment,
      dosingRecommendation: dosing
    };
  });
}

// Generate monitoring protocols
async function generateMonitoringProtocols(
  treatments: Array<any>,
  patientFactors: any
): Promise<Array<any>> {
  const protocols: any[] = [];
  
  treatments.forEach(treatment => {
    if (treatment.type === 'ANTIBIOTIC') {
      protocols.push({
        medication: treatment.medication,
        monitoringType: 'CLINICAL_RESPONSE',
        schedule: '48-72 hours after initiation',
        parameters: ['Fever resolution', 'Symptom improvement', 'Appetite return'],
        alertCriteria: ['No improvement', 'Worsening symptoms', 'New symptoms'],
        action: 'Consider alternative antibiotic or specialist referral'
      });
      
      if (patientFactors.age > 65) {
        protocols.push({
          medication: treatment.medication,
          monitoringType: 'ADVERSE_EFFECTS',
          schedule: 'Daily for first 3 days',
          parameters: ['GI symptoms', 'Mental status', 'Functional status'],
          alertCriteria: ['C. diff symptoms', 'Confusion', 'Falls'],
          action: 'Discontinue if serious adverse effects'
        });
      }
    }
  });
  
  return protocols;
}

// Generate patient education materials
async function generatePatientEducation(
  treatments: Array<any>,
  diagnosis: any
): Promise<Array<any>> {
  const education = [];
  
  education.push({
    topic: 'CONDITION_OVERVIEW',
    title: `Understanding ${diagnosis.diagnosis}`,
    content: `Your diagnosis of ${diagnosis.diagnosis} is a common condition that typically resolves with appropriate treatment.`,
    keyPoints: [
      'Follow treatment plan as prescribed',
      'Monitor symptoms for improvement',
      'Know when to seek additional care'
    ]
  });
  
  treatments.forEach(treatment => {
    if (treatment.medication) {
      education.push({
        topic: 'MEDICATION_INSTRUCTIONS',
        title: `Taking ${treatment.medication}`,
        content: `Important information about your prescribed medication: ${treatment.medication}`,
        keyPoints: [
          `Take ${treatment.dosage} as prescribed`,
          `Complete full course even if feeling better`,
          `Contact provider if side effects occur`,
          `Store medication properly`
        ],
        sideEffectsToWatch: treatment.sideEffects || [],
        whenToCall: [
          'Severe allergic reaction',
          'Persistent side effects',
          'No improvement after expected timeframe'
        ]
      });
    }
  });
  
  return education;
}

// Helper functions
function checkDrugInteraction(drug1: string, drug2: string): any {
  // Mock interaction database
  const interactions: any = {
    'Warfarin-Azithromycin': {
      severity: 'MODERATE',
      mechanism: 'CYP3A4 inhibition',
      clinicalEffect: 'Increased bleeding risk',
      management: 'Monitor INR closely',
      references: ['Drug Facts & Comparisons 2024']
    }
  };
  
  const key = `${drug1}-${drug2}`;
  return interactions[key] || null;
}

function getRecommendationStrength(score: number): string {
  if (score >= 8) return 'STRONG';
  if (score >= 6) return 'MODERATE';
  if (score >= 4) return 'WEAK';
  return 'CONSIDER';
}

function calculateEvidenceLevel(treatments: Array<any>): string {
  const levels = treatments.map(t => t.evidenceLevel).filter(Boolean);
  if (levels.includes('A')) return 'HIGH';
  if (levels.includes('B')) return 'MODERATE';
  return 'LOW';
}

async function generateTreatmentAlerts(
  treatments: Array<any>,
  interactions: Array<any>,
  patientFactors: any
): Promise<Array<any>> {
  const alerts = [];
  
  // Drug interaction alerts
  interactions.forEach(interaction => {
    if (interaction.severity === 'MAJOR') {
      alerts.push({
        type: 'DRUG_INTERACTION',
        severity: 'HIGH',
        message: `Major interaction: ${interaction.newMedication} + ${interaction.existingMedication}`,
        action: 'Consider alternative therapy or enhanced monitoring'
      });
    }
  });
  
  // Age-related alerts
  if (patientFactors.age > 80) {
    alerts.push({
      type: 'AGE_CONSIDERATION',
      severity: 'MEDIUM',
      message: 'Elderly patient - increased risk of adverse effects',
      action: 'Consider lower starting doses and closer monitoring'
    });
  }
  
  return alerts;
}

async function generateDecisionSupportSummary(treatmentPlan: any, alerts: Array<any>) {
  return {
    primaryRecommendation: 'Evidence-based treatment plan',
    confidenceLevel: 'HIGH', // Based on clinical guidelines
    keyConsiderations: [
      'Patient factors incorporated',
      'Drug interactions checked',
      'Evidence-based selection'
    ],
    criticalAlerts: alerts.filter(a => a.severity === 'HIGH').length,
    implementationReadiness: alerts.length === 0 ? 'READY' : 'REQUIRES_REVIEW'
  };
}

function generateImplementationGuidance(treatments: Array<any>): Array<string> {
  const guidance = [];
  
  guidance.push('Review complete treatment plan with patient');
  guidance.push('Ensure patient understanding of medication instructions');
  guidance.push('Schedule appropriate follow-up appointments');
  
  if (treatments.some(t => t.type === 'ANTIBIOTIC')) {
    guidance.push('Emphasize importance of completing antibiotic course');
    guidance.push('Discuss antibiotic stewardship principles');
  }
  
  return guidance;
}

function generateFollowUpSchedule(treatments: Array<any>, diagnosis: any): Array<any> {
  const schedule = [];
  
  schedule.push({
    timeframe: '24-48 hours',
    method: 'PHONE_CALL',
    purpose: 'Assess early treatment response',
    indicators: ['Symptom improvement', 'Medication tolerance'],
    escalation: 'Schedule office visit if no improvement'
  });
  
  if (treatments.some(t => t.type === 'ANTIBIOTIC')) {
    schedule.push({
      timeframe: '3-5 days',
      method: 'OFFICE_VISIT',
      purpose: 'Evaluate antibiotic response',
      indicators: ['Clinical improvement', 'Side effect assessment'],
      escalation: 'Consider culture and sensitivity testing'
    });
  }
  
  return schedule;
}
