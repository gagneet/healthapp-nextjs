/**
 * Smart Business ID Generation Service
 * 
 * Generates human-readable business IDs for healthcare entities:
 * - DOC-2025-001, DOC-2025-002, etc. for doctors
 * - HSP-2025-001, HSP-2025-002, etc. for HSPs
 * - PAT-2025-001, PAT-2025-002, etc. for patients
 * 
 * Uses existing database records to determine next sequence number
 * Avoids collisions and provides predictable, sortable IDs
 */

import { prisma } from "@/lib/prisma"

export interface BusinessIdConfig {
  prefix: string;
  year?: number;
  minSequence?: number;
}

export interface GeneratedId {
  businessId: string;
  sequence: number;
  year: number;
}

/**
 * Generate next business ID for doctors
 * Format: DOC-YYYY-XXX (e.g., DOC-2025-001)
 */
export async function generateDoctorId(): Promise<GeneratedId> {
  return generateBusinessId({
    prefix: 'DOC',
    tableName: 'doctors',
    fieldName: 'doctorId'
  });
}

/**
 * Generate next business ID for HSPs
 * Format: HSP-YYYY-XXX (e.g., HSP-2025-001)
 */
export async function generateHspId(): Promise<GeneratedId> {
  return generateBusinessId({
    prefix: 'HSP',
    tableName: 'hsps',
    fieldName: 'hsp_id'
  });
}

/**
 * Generate next business ID for patients
 * Format: PAT-YYYY-XXX (e.g., PAT-2025-001)
 */
export async function generatePatientId(): Promise<GeneratedId> {
  return generateBusinessId({
    prefix: 'PAT',
    tableName: 'patients',
    fieldName: 'patientId'
  });
}

/**
 * Core business ID generation logic
 * Queries existing records to find the next sequence number
 */
async function generateBusinessId(config: {
  prefix: string;
  tableName: 'doctors' | 'hsps' | 'patients';
  fieldName: string;
}): Promise<GeneratedId> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${config.prefix}-${currentYear}-`;
  
  try {
    // Get existing records for this year and prefix
    let existingIds: string[] = [];
    
    switch (config.tableName) {
      case 'doctors':
        const doctors = await prisma.doctor.findMany({
          where: {
            doctorId: {
              startsWith: yearPrefix
            }
          },
          select: {
            doctorId: true
          }
        });
        existingIds = doctors.map(d => d.doctorId);
        break;
        
      case 'hsps':
        const hsps = await prisma.hspProfile.findMany({
          where: {
            hsp_id: {
              startsWith: yearPrefix
            }
          },
          select: {
            hsp_id: true
          }
        });
        existingIds = hsps.map(h => h.hsp_id);
        break;
        
      case 'patients':
        const patients = await prisma.patient.findMany({
          where: {
            patientId: {
              startsWith: yearPrefix
            }
          },
          select: {
            patientId: true
          }
        });
        existingIds = patients.map(p => p.patientId!).filter(Boolean);
        break;
    }
    
    // Extract sequence numbers from existing IDs
    const existingSequences = existingIds
      .map(id => {
        const parts = id.split('-');
        if (parts.length === 3) {
          const sequence = parseInt(parts[2], 10);
          return isNaN(sequence) ? 0 : sequence;
        }
        return 0;
      })
      .filter(seq => seq > 0);
    
    // Find next sequence number
    const maxSequence = existingSequences.length > 0 ? Math.max(...existingSequences) : 0;
    const nextSequence = maxSequence + 1;
    
    // Format sequence with leading zeros (001, 002, etc.)
    const formattedSequence = nextSequence.toString().padStart(3, '0');
    const businessId = `${config.prefix}-${currentYear}-${formattedSequence}`;
    
    return {
      businessId,
      sequence: nextSequence,
      year: currentYear
    };
    
  } catch (error) {
    console.error(`Error generating business ID for ${config.prefix}:`, error);
    throw new Error(`Failed to generate ${config.prefix} business ID`);
  }
}

/**
 * Validate business ID format
 */
export function validateBusinessId(id: string, expectedPrefix: 'DOC' | 'HSP' | 'PAT'): boolean {
  const pattern = new RegExp(`^${expectedPrefix}-\\d{4}-\\d{3}$`);
  return pattern.test(id);
}

/**
 * Parse business ID components
 */
export function parseBusinessId(id: string): { prefix: string; year: number; sequence: number } | null {
  const parts = id.split('-');
  if (parts.length !== 3) return null;
  
  const [prefix, yearStr, sequenceStr] = parts;
  const year = parseInt(yearStr, 10);
  const sequence = parseInt(sequenceStr, 10);
  
  if (isNaN(year) || isNaN(sequence)) return null;
  
  return { prefix, year, sequence };
}

/**
 * Generate bulk business IDs (useful for migrations or bulk operations)
 */
export async function generateBulkIds(
  count: number,
  type: 'doctor' | 'hsp' | 'patient'
): Promise<GeneratedId[]> {
  const results: GeneratedId[] = [];
  
  for (let i = 0; i < count; i++) {
    let generated: GeneratedId;
    
    switch (type) {
      case 'doctor':
        generated = await generateDoctorId();
        break;
      case 'hsp':
        generated = await generateHspId();
        break;
      case 'patient':
        generated = await generatePatientId();
        break;
    }
    
    results.push(generated);
  }
  
  return results;
}

export default {
  generateDoctorId,
  generateHspId,
  generatePatientId,
  validateBusinessId,
  parseBusinessId,
  generateBulkIds
};
