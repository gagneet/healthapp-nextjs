// src/controllers/symptomsDiagnosisController.js - Symptoms and Diagnosis management
import { SymptomsDatabase, TreatmentDatabase } from '../models/index.js';
import { Op } from 'sequelize';
import ResponseFormatter from '../utils/responseFormatter.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

class SymptomsDiagnosisController {
  /**
   * Get all symptoms from the database
   */
  async getAllSymptoms(req, res, next) {
    try {
      const symptoms = await SymptomsDatabase.getAllSymptoms();

      res.status(200).json(ResponseFormatter.success(
        { symptoms },
        'Symptoms retrieved successfully'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Search symptoms by query
   */
  async searchSymptoms(req, res, next) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json(ResponseFormatter.error(
          'Search query is required',
          400
        ));
      }

      const symptoms = await SymptomsDatabase.getAllSymptoms();
      const filteredSymptoms = symptoms.filter(symptom =>
        symptom.toLowerCase().includes(query.toLowerCase())
      );

      res.status(200).json(ResponseFormatter.success(
        { symptoms: filteredSymptoms },
        'Symptoms search completed'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all diagnoses
   */
  async getAllDiagnoses(req, res, next) {
    try {
      const diagnoses = await SymptomsDatabase.findAll({
        where: { is_active: true },
        attributes: ['id', 'diagnosis_name', 'category', 'symptoms'],
        order: [['diagnosis_name', 'ASC']]
      });

      const formattedDiagnoses = diagnoses.map(diagnosis => ({
        id: diagnosis.id,
        name: diagnosis.diagnosis_name,
        category: diagnosis.category,
        symptoms: diagnosis.getSymptomList()
      }));

      res.status(200).json(ResponseFormatter.success(
        { diagnoses: formattedDiagnoses },
        'Diagnoses retrieved successfully'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Search diagnoses by query
   */
  async searchDiagnoses(req, res, next) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json(ResponseFormatter.error(
          'Search query is required',
          400
        ));
      }

      const diagnoses = await SymptomsDatabase.searchDiagnosis(query);

      const formattedDiagnoses = diagnoses.map(diagnosis => ({
        id: diagnosis.id,
        name: diagnosis.diagnosis_name,
        category: diagnosis.category,
        symptoms: diagnosis.getSymptomList()
      }));

      res.status(200).json(ResponseFormatter.success(
        { diagnoses: formattedDiagnoses },
        'Diagnoses search completed'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Find diagnoses based on symptoms
   */
  async findDiagnosesBySymptoms(req, res, next) {
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
        if (!diagnosisScores[diagnosis.id]) {
          diagnosisScores[diagnosis.id] = {
            diagnosis,
            matchedSymptoms: 0,
            matchedSymptomsNames: []
          };
        }
        
        symptoms.forEach(symptom => {
          if (diagnosis.hasSymptom(symptom)) {
            diagnosisScores[diagnosis.id].matchedSymptoms++;
            if (!diagnosisScores[diagnosis.id].matchedSymptomsNames.includes(symptom)) {
              diagnosisScores[diagnosis.id].matchedSymptomsNames.push(symptom);
            }
          }
        });
      });

      // Sort by best match (most symptoms matched)
      const sortedDiagnoses = Object.values(diagnosisScores)
        .sort((a, b) => b.matchedSymptoms - a.matchedSymptoms)
        .map(item => ({
          id: item.diagnosis.id,
          name: item.diagnosis.diagnosis_name,
          category: item.diagnosis.category,
          matchedSymptoms: item.matchedSymptoms,
          matchedSymptomsNames: item.matchedSymptomsNames,
          totalSymptoms: item.diagnosis.getSymptomList().length,
          matchScore: item.matchedSymptoms / item.diagnosis.getSymptomList().length
        }));

      res.status(200).json(ResponseFormatter.success(
        { 
          diagnoses: sortedDiagnoses,
          inputSymptoms: symptoms
        },
        'Diagnosis suggestions retrieved successfully'
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all treatments
   */
  async getAllTreatments(req, res, next) {
    try {
      const { condition, category, severity } = req.query;
      const whereClause = { is_active: true };

      if (condition) {
        whereClause.applicable_conditions = {
          [Op.contains]: [condition]
        };
      }

      if (category) {
        whereClause.category = category;
      }

      if (severity) {
        whereClause[Op.or] = [
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * Search treatments by query
   */
  async searchTreatments(req, res, next) {
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * Find treatments for specific conditions/diagnoses
   */
  async getTreatmentsForConditions(req, res, next) {
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
        if (!unique.find(t => t.id === treatment.id)) {
          unique.push(treatment);
        }
        return unique;
      }, []);

      // Filter by severity if provided
      let filteredTreatments = uniqueTreatments;
      if (severity) {
        filteredTreatments = uniqueTreatments.filter(treatment =>
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * Add custom symptom to database
   */
  async addCustomSymptom(req, res, next) {
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
          created_by: req.user.id,
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

    } catch (error) {
      next(error);
    }
  }

  /**
   * Add custom diagnosis
   */
  async addCustomDiagnosis(req, res, next) {
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
          symptomsObj[symptom] = true;
        });
      }

      const diagnosis = await SymptomsDatabase.create({
        diagnosis_name: diagnosisName,
        category: category || 'General',
        symptoms: symptomsObj,
        created_by: req.user.id,
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

    } catch (error) {
      next(error);
    }
  }
}

export default new SymptomsDiagnosisController();