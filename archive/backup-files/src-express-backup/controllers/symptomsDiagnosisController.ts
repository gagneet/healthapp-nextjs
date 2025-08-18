// src/controllers/symptomsDiagnosisController.ts - Symptoms and Diagnosis management
import { Request, Response, NextFunction } from 'express';
import '../types/express.js';
import { SymptomsDatabase, TreatmentDatabase, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import ResponseFormatter from '../utils/responseFormatter.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

class SymptomsDiagnosisController {
  /**
   * Get all symptoms from the database
   */
  async getAllSymptoms(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const symptoms = await SymptomsDatabase.getAllSymptoms();

      res.status(200).json(ResponseFormatter.success(
        { symptoms },
        'Symptoms retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Search symptoms by query
   */
  async searchSymptoms(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json(ResponseFormatter.error(
          'Search query is required',
          400
        ));
      }

      const symptoms = await SymptomsDatabase.getAllSymptoms();
      const filteredSymptoms = symptoms.filter((symptom: any) =>
        (symptom as any).toLowerCase().includes((query as any).toLowerCase())
      );

      res.status(200).json(ResponseFormatter.success(
        { symptoms: filteredSymptoms },
        'Symptoms search completed'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get all diagnoses
   */
  async getAllDiagnoses(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const diagnoses = await SymptomsDatabase.findAll({
        where: { is_active: true },
        attributes: ['id', 'diagnosis_name', 'category', 'symptoms'],
        order: [['diagnosis_name', 'ASC']]
      });

      const formattedDiagnoses = diagnoses.map((diagnosis: any) => ({
        id: diagnosis.id,
        name: diagnosis.diagnosis_name,
        category: diagnosis.category,
        symptoms: diagnosis.getSymptomList()
      }));

      res.status(200).json(ResponseFormatter.success(
        { diagnoses: formattedDiagnoses },
        'Diagnoses retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Search diagnoses by query
   */
  async searchDiagnoses(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json(ResponseFormatter.error(
          'Search query is required',
          400
        ));
      }

      const diagnoses = await SymptomsDatabase.searchDiagnosis(query);

      const formattedDiagnoses = diagnoses.map((diagnosis: any) => ({
        id: diagnosis.id,
        name: diagnosis.diagnosis_name,
        category: diagnosis.category,
        symptoms: diagnosis.getSymptomList()
      }));

      res.status(200).json(ResponseFormatter.success(
        { diagnoses: formattedDiagnoses },
        'Diagnoses search completed'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Find diagnoses based on symptoms
   */
  async findDiagnosesBySymptoms(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { symptoms } = req.body;

      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json(ResponseFormatter.error(
          'Symptoms array is required',
          400
        ));
      }

      const matchingDiagnoses = [];

      for (const symptom of symptoms) {
        const diagnoses = await SymptomsDatabase.findBySymptom(symptom);
        matchingDiagnoses.push(...diagnoses);
      }

      // Remove duplicates and score by symptom match count
      const diagnosisScores = {};
      matchingDiagnoses.forEach(diagnosis => {
        if (!(diagnosisScores as any)[diagnosis.id]) {
          (diagnosisScores as any)[diagnosis.id] = {
            diagnosis,
            matchedSymptoms: 0,
            matchedSymptomsNames: []
          };
        }
        
        symptoms.forEach(symptom => {
          if (diagnosis.hasSymptom(symptom)) {
            (diagnosisScores as any)[diagnosis.id].matchedSymptoms++;
            if (!(diagnosisScores as any)[diagnosis.id].matchedSymptomsNames.includes(symptom)) {
              (diagnosisScores as any)[diagnosis.id].matchedSymptomsNames.push(symptom);
            }
          }
        });
      });

      // Sort by best match (most symptoms matched)
      const sortedDiagnoses = Object.values(diagnosisScores)
        .sort((a, b) => (b as any).matchedSymptoms - (a as any).matchedSymptoms)
        .map(item => ({
          id: (item as any).diagnosis.id,
          name: (item as any).diagnosis.diagnosis_name,
          category: (item as any).diagnosis.category,
          matchedSymptoms: (item as any).matchedSymptoms,
          matchedSymptomsNames: (item as any).matchedSymptomsNames,
          totalSymptoms: (item as any).diagnosis.getSymptomList().length,
          matchScore: (item as any).matchedSymptoms / (item as any).diagnosis.getSymptomList().length
        }));

      res.status(200).json(ResponseFormatter.success(
        { 
          diagnoses: sortedDiagnoses,
          inputSymptoms: symptoms
        },
        'Diagnosis suggestions retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get all treatments
   */
  async getAllTreatments(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { condition, category, severity } = req.query;
      const whereClause = { is_active: true };

      if (condition) {
        (whereClause as any).applicable_conditions = {
          [Op.contains]: [condition]
        };
      }

      if (category) {
        (whereClause as any).category = category;
      }

      if (severity) {
        (whereClause as any)[Op.or] = [
          { severity_level: severity },
          { severity_level: 'all' }
        ];
      }

      const treatments = await TreatmentDatabase.findAll({
        where: whereClause,
        attributes: [
          'id', 'treatment_name', 'treatment_type', 'description',
          'applicable_conditions', 'category', 'severity_level',
          'duration', 'frequency', 'requires_specialist', 'prescription_required'
        ],
        order: [['treatment_name', 'ASC']]
      });

      res.status(200).json(ResponseFormatter.success(
        { treatments },
        'Treatments retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Search treatments by query
   */
  async searchTreatments(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json(ResponseFormatter.error(
          'Search query is required',
          400
        ));
      }

      const treatments = await TreatmentDatabase.searchTreatments(query);

      res.status(200).json(ResponseFormatter.success(
        { treatments },
        'Treatments search completed'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Find treatments for specific conditions/diagnoses
   */
  async getTreatmentsForConditions(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { conditions, severity } = req.body;

      if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
        return res.status(400).json(ResponseFormatter.error(
          'Conditions array is required',
          400
        ));
      }

      const allTreatments = [];

      for (const condition of conditions) {
        const treatments = await TreatmentDatabase.findByCondition(condition);
        allTreatments.push(...treatments);
      }

      // Remove duplicates
      const uniqueTreatments = allTreatments.reduce((unique, treatment) => {
        if (!unique.find((t: any) => t.id === treatment.id)) {
          unique.push(treatment);
        }
        return unique;
      }, []);

      // Filter by severity if provided
      let filteredTreatments = uniqueTreatments;
      if (severity) {
        filteredTreatments = uniqueTreatments.filter((treatment: any) =>
          treatment.severity_level === severity || treatment.severity_level === 'all'
        );
      }

      res.status(200).json(ResponseFormatter.success(
        { 
          treatments: filteredTreatments,
          inputConditions: conditions,
          severity: severity || 'all'
        },
        'Treatments for conditions retrieved successfully'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Add custom symptom to database
   */
  async addCustomSymptom(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { symptomName, diagnosisName, category } = req.body;

      if (!symptomName || !diagnosisName) {
        return res.status(400).json(ResponseFormatter.error(
          'Symptom name and diagnosis name are required',
          400
        ));
      }

      // Find or create diagnosis
      const [diagnosis, created] = await SymptomsDatabase.findOrCreate({
        where: { diagnosis_name: diagnosisName },
        defaults: {
          diagnosis_name: diagnosisName,
          category: category || 'General',
          symptoms: { [symptomName]: true },
          created_by: req.user!.id,
          is_active: true
        }
      });

      if (!created) {
        // Add symptom to existing diagnosis
        await diagnosis.addSymptom(symptomName);
      }

      res.status(200).json(ResponseFormatter.success(
        { 
          diagnosis: {
            id: diagnosis.id,
            name: diagnosis.diagnosis_name,
            symptoms: diagnosis.getSymptomList()
          }
        },
        created ? 'New diagnosis created with symptom' : 'Symptom added to existing diagnosis'
      ));

    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Add custom diagnosis
   */
  async addCustomDiagnosis(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { diagnosisName, symptoms, category } = req.body;

      if (!diagnosisName) {
        return res.status(400).json(ResponseFormatter.error(
          'Diagnosis name is required',
          400
        ));
      }

      // Check if diagnosis already exists
      const existingDiagnosis = await SymptomsDatabase.findOne({
        where: { diagnosis_name: diagnosisName }
      });

      if (existingDiagnosis) {
        return res.status(409).json(ResponseFormatter.error(
          'Diagnosis already exists',
          409
        ));
      }

      // Create symptoms object
      const symptomsObj = {};
      if (symptoms && Array.isArray(symptoms)) {
        symptoms.forEach(symptom => {
          (symptomsObj as any)[symptom] = true;
        });
      }

      const diagnosis = await SymptomsDatabase.create({
        diagnosis_name: diagnosisName,
        category: category || 'General',
        symptoms: symptomsObj,
        created_by: req.user!.id,
        is_active: true
      });

      res.status(201).json(ResponseFormatter.success(
        {
          diagnosis: {
            id: diagnosis.id,
            name: diagnosis.diagnosis_name,
            category: diagnosis.category,
            symptoms: diagnosis.getSymptomList()
          }
        },
        'Custom diagnosis created successfully',
        201
      ));

    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new SymptomsDiagnosisController();