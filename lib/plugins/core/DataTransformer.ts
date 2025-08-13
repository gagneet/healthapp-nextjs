/**
 * Device Data Transformer
 * 
 * Provides standardized data transformation and validation utilities
 * for converting raw device data to medical standard formats
 */

import { VitalData, ValidationResult } from './DevicePlugin.interface';

export interface MedicalRange {
  min: number;
  max: number;
  criticalMin?: number;
  criticalMax?: number;
  unit: string;
  ageGroup?: 'pediatric' | 'adult' | 'geriatric';
  gender?: 'male' | 'female';
}

export interface TransformationRule {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  validate?: (value: any) => boolean;
  unit?: string;
  required?: boolean;
}

export class DataTransformer {
  private static medicalRanges: Record<string, MedicalRange[]> = {
    'blood_pressure_systolic': [
      { min: 90, max: 140, criticalMin: 70, criticalMax: 180, unit: 'mmHg', ageGroup: 'adult' },
      { min: 95, max: 130, criticalMin: 75, criticalMax: 170, unit: 'mmHg', ageGroup: 'geriatric' },
      { min: 80, max: 120, criticalMin: 60, criticalMax: 160, unit: 'mmHg', ageGroup: 'pediatric' },
    ],
    'blood_pressure_diastolic': [
      { min: 60, max: 90, criticalMin: 40, criticalMax: 110, unit: 'mmHg', ageGroup: 'adult' },
      { min: 55, max: 85, criticalMin: 45, criticalMax: 105, unit: 'mmHg', ageGroup: 'geriatric' },
      { min: 50, max: 80, criticalMin: 35, criticalMax: 100, unit: 'mmHg', ageGroup: 'pediatric' },
    ],
    'heart_rate': [
      { min: 60, max: 100, criticalMin: 40, criticalMax: 150, unit: 'bpm', ageGroup: 'adult' },
      { min: 65, max: 100, criticalMin: 45, criticalMax: 140, unit: 'bpm', ageGroup: 'geriatric' },
      { min: 70, max: 120, criticalMin: 50, criticalMax: 180, unit: 'bpm', ageGroup: 'pediatric' },
    ],
    'oxygen_saturation': [
      { min: 95, max: 100, criticalMin: 90, criticalMax: 100, unit: '%', ageGroup: 'adult' },
      { min: 94, max: 100, criticalMin: 88, criticalMax: 100, unit: '%', ageGroup: 'geriatric' },
      { min: 95, max: 100, criticalMin: 92, criticalMax: 100, unit: '%', ageGroup: 'pediatric' },
    ],
    'body_temperature': [
      { min: 36.1, max: 37.2, criticalMin: 35.0, criticalMax: 40.0, unit: '°C', ageGroup: 'adult' },
      { min: 36.0, max: 37.1, criticalMin: 35.0, criticalMax: 39.5, unit: '°C', ageGroup: 'geriatric' },
      { min: 36.5, max: 37.5, criticalMin: 35.5, criticalMax: 40.5, unit: '°C', ageGroup: 'pediatric' },
    ],
    'blood_glucose': [
      { min: 70, max: 140, criticalMin: 54, criticalMax: 250, unit: 'mg/dL', ageGroup: 'adult' },
    ],
    'weight': [
      { min: 40, max: 200, criticalMin: 30, criticalMax: 300, unit: 'kg', ageGroup: 'adult' },
    ],
  };

  /**
   * Transform raw device data to standardized VitalData format
   */
  static transformToVitalData(
    rawData: any,
    deviceType: string,
    transformationRules: TransformationRule[]
  ): VitalData {
    const timestamp = this.extractTimestamp(rawData);
    const readingType = this.inferReadingType(rawData, deviceType);
    
    // Apply transformation rules
    const transformedData: any = {};
    const errors: string[] = [];
    
    for (const rule of transformationRules) {
      try {
        let value = this.getNestedProperty(rawData, rule.sourceField);
        
        // Apply transformation if provided
        if (rule.transform && value !== undefined) {
          value = rule.transform(value);
        }
        
        // Validate if validator provided
        if (rule.validate && !rule.validate(value)) {
          errors.push(`Validation failed for ${rule.sourceField}`);
          continue;
        }
        
        // Required field check
        if (rule.required && (value === undefined || value === null)) {
          errors.push(`Required field ${rule.sourceField} is missing`);
          continue;
        }
        
        if (value !== undefined) {
          transformedData[rule.targetField] = value;
        }
        
      } catch (error) {
        errors.push(`Error transforming ${rule.sourceField}: ${error.message}`);
      }
    }

    const primaryValue = transformedData.primaryValue || transformedData.value || 0;
    const secondaryValue = transformedData.secondaryValue;
    const unit = transformedData.unit || this.inferUnit(readingType);

    return {
      readingType,
      primaryValue,
      secondaryValue,
      unit,
      timestamp,
      context: {
        patientCondition: transformedData.patientCondition,
        medicationTaken: transformedData.medicationTaken,
        symptoms: transformedData.symptoms || [],
        location: transformedData.location,
      },
      quality: {
        score: this.calculateQualityScore(transformedData, errors),
        issues: errors.length > 0 ? errors : undefined,
      },
      rawData,
    };
  }

  /**
   * Validate vital data against medical ranges
   */
  static validateVitalData(data: VitalData, ageGroup: string = 'adult', gender?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Get medical ranges for this vital type
      const ranges = this.medicalRanges[data.readingType];
      if (!ranges) {
        warnings.push(`No medical ranges defined for ${data.readingType}`);
        return { isValid: true, errors, warnings };
      }
      
      // Find appropriate range
      const range = ranges.find(r => 
        (!r.ageGroup || r.ageGroup === ageGroup) &&
        (!r.gender || r.gender === gender)
      ) || ranges[0]; // Fallback to first range
      
      if (!range) {
        warnings.push(`No matching medical range found for ${data.readingType}`);
        return { isValid: true, errors, warnings };
      }
      
      // Validate primary value
      if (data.primaryValue !== undefined) {
        if (range.criticalMin && data.primaryValue < range.criticalMin) {
          errors.push(`Critical low ${data.readingType}: ${data.primaryValue} < ${range.criticalMin} ${range.unit}`);
        } else if (range.criticalMax && data.primaryValue > range.criticalMax) {
          errors.push(`Critical high ${data.readingType}: ${data.primaryValue} > ${range.criticalMax} ${range.unit}`);
        } else if (data.primaryValue < range.min) {
          warnings.push(`Low ${data.readingType}: ${data.primaryValue} < ${range.min} ${range.unit}`);
        } else if (data.primaryValue > range.max) {
          warnings.push(`High ${data.readingType}: ${data.primaryValue} > ${range.max} ${range.unit}`);
        }
      }
      
      // Validate secondary value if applicable (e.g., diastolic BP)
      if (data.secondaryValue !== undefined && data.readingType === 'blood_pressure') {
        const diastolicRanges = this.medicalRanges['blood_pressure_diastolic'];
        const diastolicRange = diastolicRanges?.find(r => 
          (!r.ageGroup || r.ageGroup === ageGroup) &&
          (!r.gender || r.gender === gender)
        ) || diastolicRanges?.[0];
        
        if (diastolicRange) {
          if (diastolicRange.criticalMin && data.secondaryValue < diastolicRange.criticalMin) {
            errors.push(`Critical low diastolic BP: ${data.secondaryValue} < ${diastolicRange.criticalMin} ${diastolicRange.unit}`);
          } else if (diastolicRange.criticalMax && data.secondaryValue > diastolicRange.criticalMax) {
            errors.push(`Critical high diastolic BP: ${data.secondaryValue} > ${diastolicRange.criticalMax} ${diastolicRange.unit}`);
          } else if (data.secondaryValue < diastolicRange.min) {
            warnings.push(`Low diastolic BP: ${data.secondaryValue} < ${diastolicRange.min} ${diastolicRange.unit}`);
          } else if (data.secondaryValue > diastolicRange.max) {
            warnings.push(`High diastolic BP: ${data.secondaryValue} > ${diastolicRange.max} ${diastolicRange.unit}`);
          }
        }
      }
      
      // Additional validation rules
      this.validateDataConsistency(data, errors, warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        normalizedData: this.normalizeData(data),
      };
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Normalize and clean vital data
   */
  static normalizeData(data: VitalData): VitalData {
    const normalized = { ...data };
    
    // Round numeric values to appropriate precision
    if (typeof normalized.primaryValue === 'number') {
      normalized.primaryValue = Math.round(normalized.primaryValue * 100) / 100;
    }
    if (typeof normalized.secondaryValue === 'number') {
      normalized.secondaryValue = Math.round(normalized.secondaryValue * 100) / 100;
    }
    
    // Ensure timestamp is valid
    if (!normalized.timestamp || isNaN(normalized.timestamp.getTime())) {
      normalized.timestamp = new Date();
    }
    
    // Clean and validate context
    if (normalized.context) {
      if (normalized.context.symptoms) {
        normalized.context.symptoms = normalized.context.symptoms.filter(s => typeof s === 'string' && s.length > 0);
      }
    }
    
    return normalized;
  }

  /**
   * Convert between different unit systems
   */
  static convertUnits(value: number, fromUnit: string, toUnit: string): number {
    const conversions: Record<string, Record<string, (val: number) => number>> = {
      'temperature': {
        'C_to_F': (c) => (c * 9/5) + 32,
        'F_to_C': (f) => (f - 32) * 5/9,
        'K_to_C': (k) => k - 273.15,
        'C_to_K': (c) => c + 273.15,
      },
      'weight': {
        'kg_to_lb': (kg) => kg * 2.20462,
        'lb_to_kg': (lb) => lb / 2.20462,
      },
      'glucose': {
        'mgdl_to_mmol': (mgdl) => mgdl / 18.018,
        'mmol_to_mgdl': (mmol) => mmol * 18.018,
      },
    };

    const conversionKey = `${fromUnit}_to_${toUnit}`;
    
    for (const [category, categoryConversions] of Object.entries(conversions)) {
      if (categoryConversions[conversionKey]) {
        return categoryConversions[conversionKey](value);
      }
    }
    
    throw new Error(`No conversion available from ${fromUnit} to ${toUnit}`);
  }

  // Private helper methods

  private static extractTimestamp(rawData: any): Date {
    // Try common timestamp fields
    const timestampFields = ['timestamp', 'time', 'date', 'measured_at', 'created_at'];
    
    for (const field of timestampFields) {
      const value = this.getNestedProperty(rawData, field);
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Fallback to current time
    return new Date();
  }

  private static inferReadingType(rawData: any, deviceType: string): string {
    // Device type to reading type mapping
    const deviceTypeMapping: Record<string, string> = {
      'BLOOD_PRESSURE': 'blood_pressure',
      'GLUCOSE_METER': 'blood_glucose',
      'PULSE_OXIMETER': 'oxygen_saturation',
      'THERMOMETER': 'body_temperature',
      'SCALE': 'weight',
      'ECG_MONITOR': 'heart_rate',
    };

    // Check if explicitly provided
    if (rawData.readingType || rawData.type) {
      return rawData.readingType || rawData.type;
    }

    // Infer from device type
    if (deviceTypeMapping[deviceType]) {
      return deviceTypeMapping[deviceType];
    }

    // Infer from data fields
    if (rawData.systolic || rawData.diastolic) return 'blood_pressure';
    if (rawData.glucose || rawData.sugar) return 'blood_glucose';
    if (rawData.spo2 || rawData.oxygen) return 'oxygen_saturation';
    if (rawData.temperature || rawData.temp) return 'body_temperature';
    if (rawData.weight || rawData.mass) return 'weight';
    if (rawData.heartRate || rawData.pulse) return 'heart_rate';

    return 'unknown';
  }

  private static inferUnit(readingType: string): string {
    const unitMapping: Record<string, string> = {
      'blood_pressure': 'mmHg',
      'blood_glucose': 'mg/dL',
      'oxygen_saturation': '%',
      'body_temperature': '°C',
      'weight': 'kg',
      'heart_rate': 'bpm',
    };

    return unitMapping[readingType] || '';
  }

  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static calculateQualityScore(data: any, errors: string[]): number {
    let score = 1.0;
    
    // Reduce score for errors
    score -= errors.length * 0.1;
    
    // Reduce score for missing optional fields
    if (!data.context) score -= 0.05;
    if (!data.unit) score -= 0.1;
    
    // Bonus for additional context
    if (data.context?.patientCondition) score += 0.05;
    if (data.context?.symptoms?.length > 0) score += 0.05;
    
    return Math.max(0, Math.min(1, score));
  }

  private static validateDataConsistency(data: VitalData, errors: string[], warnings: string[]): void {
    // Blood pressure specific validation
    if (data.readingType === 'blood_pressure' && data.primaryValue && data.secondaryValue) {
      if (data.primaryValue <= data.secondaryValue) {
        errors.push('Systolic pressure must be higher than diastolic pressure');
      }
      
      const pulsePressure = data.primaryValue - data.secondaryValue;
      if (pulsePressure < 20) {
        warnings.push('Low pulse pressure detected');
      } else if (pulsePressure > 80) {
        warnings.push('High pulse pressure detected');
      }
    }
    
    // Temperature unit consistency
    if (data.readingType === 'body_temperature' && data.unit === '°C') {
      if (data.primaryValue > 50) {
        warnings.push('Temperature seems too high for Celsius, check unit');
      } else if (data.primaryValue < 30) {
        warnings.push('Temperature seems too low for Celsius, check unit');
      }
    }
    
    // Future timestamp validation
    if (data.timestamp && data.timestamp > new Date()) {
      warnings.push('Reading timestamp is in the future');
    }
    
    // Very old reading validation
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (data.timestamp && data.timestamp < oneYearAgo) {
      warnings.push('Reading timestamp is more than one year old');
    }
  }
}

// Export utility functions
export const MedicalRanges = DataTransformer['medicalRanges'];
export const validateVitalData = DataTransformer.validateVitalData.bind(DataTransformer);
export const transformToVitalData = DataTransformer.transformToVitalData.bind(DataTransformer);
export const normalizeData = DataTransformer.normalizeData.bind(DataTransformer);
export const convertUnits = DataTransformer.convertUnits.bind(DataTransformer);