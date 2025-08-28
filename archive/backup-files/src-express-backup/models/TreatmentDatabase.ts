// src/models/TreatmentDatabase.js - Treatment options database
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const TreatmentDatabase = sequelize.define('TreatmentDatabase', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Treatment details
    treatment_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'Name of the treatment'
    },
    
    treatment_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['medication', 'therapy', 'surgery', 'lifestyle', 'monitoring', 'preventive', 'emergency']]
      },
      comment: 'Type of treatment'
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the treatment'
    },
    
    // Associated conditions
    applicable_conditions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of conditions this treatment applies to'
    },
    
    // Treatment specifics
    duration: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Expected duration of treatment'
    },
    
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'How often the treatment should be administered'
    },
    
    dosage_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Dosage information if applicable'
    },
    
    // Metadata
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Medical category (Cardiology, Neurology, etc.)'
    },
    
    severity_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['mild', 'moderate', 'severe', 'critical', 'all']]
      },
      comment: 'Appropriate severity level for this treatment'
    },
    
    age_restrictions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Age restrictions or recommendations'
    },
    
    contraindications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'When this treatment should not be used'
    },
    
    side_effects: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Potential side effects'
    },
    
    monitoring_required: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'What needs to be monitored during treatment'
    },
    
    // Status and control
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    requires_specialist: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this treatment requires a specialist'
    },
    
    prescription_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this treatment requires a prescription'
    },
    
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Doctor/HSP who added this treatment'
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
    tableName: 'treatment_database',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['treatment_name'],
        unique: true
      },
      {
        fields: ['treatment_type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['severity_level']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['applicable_conditions'],
        using: 'gin'
      }
    ]
  });

  // Instance methods
  TreatmentDatabase.prototype.isApplicableFor = function(condition: any) {
    return this.applicable_conditions.includes(condition);
  };

  TreatmentDatabase.prototype.addCondition = function(condition: any) {
    if (!this.applicable_conditions.includes(condition)) {
      this.applicable_conditions.push(condition);
      return this.save();
    }
    return Promise.resolve(this);
  };

  TreatmentDatabase.prototype.removeCondition = function(condition: any) {
    const index = this.applicable_conditions.indexOf(condition);
    if (index > -1) {
      this.applicable_conditions.splice(index, 1);
      return this.save();
    }
    return Promise.resolve(this);
  };

  // Class methods
  TreatmentDatabase.findByCondition = function(condition: any) {
    return this.findAll({
      where: {
        applicable_conditions: {
          [sequelize.Sequelize.Op.contains]: [condition]
        },
        isActive: true
      },
      order: [['treatment_name', 'ASC']]
    });
  };

  TreatmentDatabase.findByType = function(treatmentType: any) {
    return this.findAll({
      where: {
        treatment_type: treatmentType,
        isActive: true
      },
      order: [['treatment_name', 'ASC']]
    });
  };

  TreatmentDatabase.searchTreatments = function(query: any) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            treatment_name: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          {
            description: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          }
        ],
        isActive: true
      },
      order: [['treatment_name', 'ASC']]
    });
  };

  return TreatmentDatabase;
};

// Seed data for treatments
export const TREATMENT_SEED_DATA = [
  {
    treatment_name: 'ACE Inhibitors Therapy',
    treatment_type: 'medication',
    description: 'Angiotensin-converting enzyme inhibitors for heart conditions',
    applicable_conditions: ['Congestive Heart Failure', 'Hypertension'],
    category: 'Cardiology',
    severity_level: 'moderate',
    duration: 'Long-term',
    frequency: 'Daily',
    prescription_required: true,
    monitoring_required: ['Blood Pressure', 'Kidney Function', 'Potassium Levels']
  },
  {
    treatment_name: 'Beta Blockers',
    treatment_type: 'medication',
    description: 'Beta-adrenergic blocking agents for heart rate control',
    applicable_conditions: ['Hypertension', 'Congestive Heart Failure', 'Acute Rheumatic Fever'],
    category: 'Cardiology',
    severity_level: 'moderate',
    duration: 'Long-term',
    frequency: 'Daily',
    prescription_required: true,
    monitoring_required: ['Heart Rate', 'Blood Pressure']
  },
  {
    treatment_name: 'Iron Supplementation',
    treatment_type: 'medication',
    description: 'Iron supplements for anemia treatment',
    applicable_conditions: ['Anemia'],
    category: 'Hematology',
    severity_level: 'mild',
    duration: '3-6 months',
    frequency: 'Daily',
    prescription_required: false,
    monitoring_required: ['Hemoglobin Levels', 'Iron Studies']
  },
  {
    treatment_name: 'Physical Therapy',
    treatment_type: 'therapy',
    description: 'Rehabilitation therapy for movement and strength',
    applicable_conditions: ['Musculoskeletal Disorders', 'Developmental Disorders'],
    category: 'Rehabilitation',
    severity_level: 'all',
    duration: '6-12 weeks',
    frequency: '2-3 times per week',
    prescription_required: true,
    requires_specialist: true
  },
  {
    treatment_name: 'Dietary Modifications',
    treatment_type: 'lifestyle',
    description: 'Nutritional changes to support treatment',
    applicable_conditions: ['Anemia', 'Hypertension', 'Congestive Heart Failure'],
    category: 'Nutrition',
    severity_level: 'all',
    duration: 'Ongoing',
    frequency: 'Daily',
    prescription_required: false
  },
  {
    treatment_name: 'Anticonvulsants',
    treatment_type: 'medication',
    description: 'Medications to prevent and control seizures',
    applicable_conditions: ['Neurological Disorders'],
    category: 'Neurology',
    severity_level: 'severe',
    duration: 'Long-term',
    frequency: 'Daily',
    prescription_required: true,
    requires_specialist: true,
    monitoring_required: ['Seizure Frequency', 'Blood Levels', 'Liver Function']
  },
  {
    treatment_name: 'Blood Transfusion',
    treatment_type: 'emergency',
    description: 'Transfusion of blood products for severe anemia or bleeding',
    applicable_conditions: ['Blood Disorders', 'Anemia'],
    category: 'Hematology',
    severity_level: 'critical',
    duration: 'Immediate',
    frequency: 'As needed',
    prescription_required: true,
    requires_specialist: true
  },
  {
    treatment_name: 'Antibiotics - Penicillin',
    treatment_type: 'medication',
    description: 'Antibiotic treatment for bacterial infections',
    applicable_conditions: ['Acute Rheumatic Fever', 'Meningitis'],
    category: 'Infectious Disease',
    severity_level: 'moderate',
    duration: '10-14 days',
    frequency: 'Every 6-8 hours',
    prescription_required: true,
    monitoring_required: ['Infection Markers', 'Allergic Reactions']
  },
  {
    treatment_name: 'Cardiac Surgery',
    treatment_type: 'surgery',
    description: 'Surgical intervention for congenital heart defects',
    applicable_conditions: ['Congenital Heart Disease'],
    category: 'Cardiology',
    severity_level: 'critical',
    duration: 'Single procedure + recovery',
    frequency: 'As needed',
    prescription_required: true,
    requires_specialist: true,
    monitoring_required: ['Cardiac Function', 'Recovery Progress']
  },
  {
    treatment_name: 'Speech Therapy',
    treatment_type: 'therapy',
    description: 'Therapy for speech and language development',
    applicable_conditions: ['Developmental Disorders'],
    category: 'Rehabilitation',
    severity_level: 'moderate',
    duration: '6-12 months',
    frequency: '2-3 times per week',
    prescription_required: true,
    requires_specialist: true
  },
  {
    treatment_name: 'Regular Monitoring',
    treatment_type: 'monitoring',
    description: 'Regular check-ups and vital sign monitoring',
    applicable_conditions: ['Hypertension', 'Congestive Heart Failure', 'Anemia'],
    category: 'Preventive',
    severity_level: 'all',
    duration: 'Ongoing',
    frequency: 'Monthly/Quarterly',
    prescription_required: false
  },
  {
    treatment_name: 'Emergency Stabilization',
    treatment_type: 'emergency',
    description: 'Immediate stabilization for critical conditions',
    applicable_conditions: ['Meningitis', 'Neurological Disorders'],
    category: 'Emergency Medicine',
    severity_level: 'critical',
    duration: 'Immediate',
    frequency: 'As needed',
    prescription_required: true,
    requires_specialist: true
  }
];