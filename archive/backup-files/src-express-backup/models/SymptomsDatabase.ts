// src/models/SymptomsDatabase.js - Symptoms and Diagnosis relationship database
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const SymptomsDatabase = sequelize.define('SymptomsDatabase', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Primary diagnosis name
    diagnosis_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'Primary diagnosis name'
    },
    
    // All symptoms as JSONB for flexible querying
    symptoms: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Object with symptom names as keys and boolean values',
      validate: {
        isValidSymptoms(value: any) {
          if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Symptoms must be a valid object');
          }
        }
      }
    },
    
    // Metadata
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Medical category (Cardiology, Neurology, etc.)'
    },
    
    severity_indicators: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Symptoms that indicate severity levels'
    },
    
    common_age_groups: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Age groups commonly affected'
    },
    
    gender_specific: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['male', 'female', 'both', null]]
      },
      comment: 'Gender specificity if applicable'
    },
    
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Doctor/HSP who added this diagnosis'
    },
    
    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'symptoms_database',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['diagnosis_name'],
        unique: true
      },
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['symptoms'],
        using: 'gin'
      }
    ]
  });

  // Instance methods
  SymptomsDatabase.prototype.getSymptomList = function() {
    return Object.keys(this.symptoms).filter(symptom => this.symptoms[symptom] === true);
  };

  SymptomsDatabase.prototype.hasSymptom = function(symptomName: any) {
    return this.symptoms[symptomName] === true;
  };

  SymptomsDatabase.prototype.addSymptom = function(symptomName: any) {
    this.symptoms[symptomName] = true;
    return this.save();
  };

  SymptomsDatabase.prototype.removeSymptom = function(symptomName: any) {
    delete this.symptoms[symptomName];
    return this.save();
  };

  // Class methods
  SymptomsDatabase.findBySymptom = function(symptomName: any) {
    return this.findAll({
      where: {
        [`symptoms.${symptomName}`]: true,
        isActive: true
      }
    });
  };

  SymptomsDatabase.searchDiagnosis = function(query: any) {
    return this.findAll({
      where: {
        diagnosis_name: {
          [sequelize.Sequelize.Op.iLike]: `%${query}%`
        },
        isActive: true
      },
      order: [['diagnosis_name', 'ASC']]
    });
  };

  SymptomsDatabase.getAllSymptoms = async function() {
    const diagnoses = await this.findAll({
      where: { isActive: true },
      attributes: ['symptoms']
    });

    const allSymptoms = new Set();
    
    diagnoses.forEach((diagnosis: any) => {
      Object.keys(diagnosis.symptoms).forEach(symptom => {
        if (diagnosis.symptoms[symptom] === true) {
          allSymptoms.add(symptom);
        }
      });
    });

    return Array.from(allSymptoms).sort();
  };

  return SymptomsDatabase;
};

// Seed data based on your MongoDB format
export const SYMPTOMS_SEED_DATA = [
  {
    diagnosis_name: 'Congenital Heart Disease',
    category: 'Cardiology',
    symptoms: {
      'Bluish Discoloration': true,
      'Breathing Difficulty': true,
      'Feeding Difficulty': true,
      'Frequent Pneumonia': true,
      'Poor Weight Gain': true
    },
    severity_indicators: {
      'Bluish Discoloration': 'high',
      'Breathing Difficulty': 'high'
    },
    common_age_groups: ['infant', 'child']
  },
  {
    diagnosis_name: 'Congestive Heart Failure',
    category: 'Cardiology',
    symptoms: {
      'Feeding Difficulty': true,
      'Breathing Too Fast': true,
      'Facial Puffiness': true,
      'Irritability': true,
      'Pedal Edema': true,
      'Restlessness': true,
      'Spine Stiffness': true
    },
    severity_indicators: {
      'Breathing Too Fast': 'high',
      'Pedal Edema': 'medium'
    },
    common_age_groups: ['adult', 'elderly']
  },
  {
    diagnosis_name: 'Acute Rheumatic Fever',
    category: 'Cardiology',
    symptoms: {
      'Fever': true,
      'Sore Throat': true
    },
    severity_indicators: {
      'Fever': 'medium'
    },
    common_age_groups: ['child', 'adolescent']
  },
  {
    diagnosis_name: 'Anemia',
    category: 'Hematology',
    symptoms: {
      'Easy Fatigability': true,
      'Cold intolerance': true,
      'Dizziness': true,
      'Exercise Intolerance': true,
      'Lack Of Immunization': true,
      'Pale': true
    },
    severity_indicators: {
      'Easy Fatigability': 'medium',
      'Dizziness': 'medium'
    },
    common_age_groups: ['all']
  },
  {
    diagnosis_name: 'Hypertension',
    category: 'Cardiology',
    symptoms: {
      'Chest Discomfort': true,
      'Palpitations': true,
      'Syncope': true,
      'Headache': true,
      'Dizziness': true
    },
    severity_indicators: {
      'Chest Discomfort': 'high',
      'Syncope': 'high'
    },
    common_age_groups: ['adult', 'elderly']
  },
  {
    diagnosis_name: 'Developmental Disorders',
    category: 'Neurology',
    symptoms: {
      'Abnormal Behaviour': true,
      'Learning Difficulty': true,
      'No Eye Contact': true,
      'Abnormal Posture': true,
      'Blindness': true,
      'Deafness': true,
      'Developmental Delay': true,
      'Difficulty In Speech Language': true,
      'Gait': true,
      'Microcephaly': true,
      'Squint': true,
      'Tone Abnormality': true
    },
    severity_indicators: {
      'Developmental Delay': 'high',
      'Learning Difficulty': 'medium'
    },
    common_age_groups: ['infant', 'child']
  },
  {
    diagnosis_name: 'Neurological Disorders',
    category: 'Neurology',
    symptoms: {
      'Headache': true,
      'Lack Of Consciousness': true,
      'Seizure': true,
      'Abnormal Body Movement': true,
      'Fever>38C': true,
      'Large Head': true
    },
    severity_indicators: {
      'Seizure': 'critical',
      'Lack Of Consciousness': 'critical'
    },
    common_age_groups: ['all']
  },
  {
    diagnosis_name: 'Blood Disorders',
    category: 'Hematology',
    symptoms: {
      'Bruises': true,
      'Mucosal Bleed': true,
      'Petechiae': true,
      'Prolonged Bleed': true,
      'Purpura': true
    },
    severity_indicators: {
      'Prolonged Bleed': 'high',
      'Mucosal Bleed': 'high'
    },
    common_age_groups: ['all']
  },
  {
    diagnosis_name: 'Meningitis',
    category: 'Neurology',
    symptoms: {
      'Photophobia': true,
      'Severe Headache': true,
      'Shrill Cry': true,
      'Vomiting': true,
      'Fever>38C': true
    },
    severity_indicators: {
      'Severe Headache': 'critical',
      'Photophobia': 'high'
    },
    common_age_groups: ['all']
  },
  {
    diagnosis_name: 'Musculoskeletal Disorders',
    category: 'Orthopedics',
    symptoms: {
      'Difficulty In Movement': true,
      'Muscle Weakness': true,
      'Swelling In Muscle': true,
      'Pain': true
    },
    severity_indicators: {
      'Muscle Weakness': 'medium',
      'Pain': 'medium'
    },
    common_age_groups: ['adult', 'elderly']
  }
];