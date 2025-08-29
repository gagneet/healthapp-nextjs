// src/models/Prescription.js - Electronic Prescription Management
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const Prescription = sequelize.define('Prescription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Core Relationships
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    prescribing_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    
    prescribing_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      }
    },
    
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    
    // Prescription Identification
    prescription_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Unique prescription identifier'
    },
    
    external_prescription_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External system prescription ID (pharmacy, EHR)'
    },
    
    // Medication Information
    medication_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the prescribed medication'
    },
    
    generic_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Generic name of the medication'
    },
    
    ndc_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'National Drug Code'
    },
    
    rxnorm_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'RxNorm terminology code'
    },
    
    // Dosage and Administration
    strength: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Medication strength (e.g., "5mg", "250mg/5ml")'
    },
    
    dosage_form: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment',
          'patch', 'inhaler', 'drops', 'suppository', 'powder', 'gel'
        ]]
      }
    },
    
    route_of_administration: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [[
          'oral', 'topical', 'injection', 'intravenous', 'intramuscular',
          'subcutaneous', 'inhalation', 'rectal', 'vaginal', 'ophthalmic',
          'otic', 'nasal', 'sublingual'
        ]]
      }
    },
    
    // Dosing Instructions
    dose_amount: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      comment: 'Amount per dose'
    },
    
    dose_unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Unit of dose (mg, ml, tablets, etc.)'
    },
    
    frequency: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'How often to take (e.g., "twice daily", "every 8 hours")'
    },
    
    frequency_per_day: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 24 },
      comment: 'Number of times per day'
    },
    
    dosing_schedule: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Specific times to take medication'
    },
    
    // Instructions
    sig_instructions: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Complete dosing instructions (Sig)'
    },
    
    patient_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional instructions for patient'
    },
    
    food_instructions: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isIn: [['with_food', 'without_food', 'empty_stomach', 'no_restriction']]
      }
    },
    
    // Quantity and Refills
    quantity_prescribed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
      comment: 'Total quantity prescribed'
    },
    
    quantity_unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Unit for quantity (tablets, ml, etc.)'
    },
    
    days_supply: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1 },
      comment: 'Number of days the prescription should last'
    },
    
    refills_allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 11 },
      comment: 'Number of refills allowed'
    },
    
    refills_used: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Clinical Information
    indication: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Medical condition being treated'
    },
    
    diagnosis_codes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'ICD-10 codes for indication'
    },
    
    // Controlled Substance Information
    is_controlled_substance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    dea_schedule: {
      type: DataTypes.STRING(5),
      allowNull: true,
      validate: {
        isIn: [['CI', 'CII', 'CIII', 'CIV', 'CV']]
      }
    },
    
    // Dates
    prescribed_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When patient should start taking medication'
    },
    
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to stop taking medication'
    },
    
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When prescription expires'
    },
    
    // Status
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['draft', 'pending', 'active', 'filled', 'discontinued', 'expired', 'cancelled']]
      }
    },
    
    discontinuation_reason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isIn: [[
          'completed_course', 'patient_request', 'side_effects', 'ineffective',
          'drug_interaction', 'cost_concerns', 'provider_decision', 'other'
        ]]
      }
    },
    
    // Pharmacy Information
    pharmacy_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Dispensing pharmacy'
    },
    
    pharmacy_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    pharmacy_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    // Electronic Prescribing
    e_prescribing_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'E-prescribing system ID'
    },
    
    transmitted_to_pharmacy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    transmission_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Cost and Insurance
    estimated_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    
    insurance_coverage: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Insurance coverage details'
    },
    
    // Safety and Interactions
    drug_interactions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Known drug interactions'
    },
    
    allergy_alerts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Allergy alerts for this prescription'
    },
    
    warnings: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Clinical warnings and precautions'
    },
    
    // Provider Information
    prescriber_npi: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Prescriber NPI number'
    },
    
    prescriber_dea: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Prescriber DEA number (for controlled substances)'
    },
    
    electronic_signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Digital signature for electronic prescriptions'
    },
    
    // Monitoring
    requires_monitoring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this medication requires special monitoring'
    },
    
    monitoring_parameters: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'What parameters to monitor (labs, vitals, etc.)'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional prescription-specific data'
    },
    
    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
    
  }, {
    tableName: 'prescriptions',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['prescribing_doctor_id']
      },
      {
        fields: ['prescribing_hsp_id']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['prescription_number'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['prescribed_date']
      },
      {
        fields: ['expiration_date']
      },
      {
        fields: ['is_controlled_substance']
      },
      {
        fields: ['medication_name']
      },
      {
        fields: ['ndc_number']
      },
      {
        // Composite index for active prescriptions
        fields: ['patientId', 'status', 'prescribed_date']
      },
      {
        // Index for pharmacy processing
        fields: ['pharmacy_id', 'transmitted_to_pharmacy']
      }
    ],
    
    validate: {
      mustHavePrescriber() {
        if (!(this as any).prescribing_doctor_id && !(this as any).prescribing_hsp_id) {
          throw new Error('Prescription must have either a prescribing doctor or HSP');
        }
      },
      
      controlledSubstanceValidation() {
        if ((this as any).is_controlled_substance && !(this as any).prescriber_dea) {
          throw new Error('DEA number required for controlled substances');
        }
      }
    },
    
    hooks: {
      beforeCreate: (prescription: any, options: any) => {
        // Generate prescription number if not provided
        if (!prescription.prescription_number) {
          const timestamp = Date.now().toString();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          prescription.prescription_number = `RX-${timestamp}-${random}`;
        }
        
        // Set expiration date (1 year from prescribed date for most prescriptions)
        if (!prescription.expiration_date) {
          const expirationDate = new Date(prescription.prescribed_date || new Date());
          
          // Controlled substances have shorter expiration periods
          if (prescription.is_controlled_substance) {
            if (prescription.dea_schedule === 'CII') {
              expirationDate.setDate(expirationDate.getDate() + 90); // 90 days for CII
            } else {
              expirationDate.setDate(expirationDate.getDate() + 180); // 6 months for CIII-CV
            }
          } else {
            expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year for non-controlled
          }
          
          prescription.expiration_date = expirationDate;
        }
        
        // Calculate days supply if not provided
        if (!prescription.days_supply && prescription.quantity_prescribed && prescription.frequency_per_day) {
          prescription.days_supply = Math.ceil(prescription.quantity_prescribed / prescription.frequency_per_day);
        }
      },
      
      beforeUpdate: (prescription: any, options: any) => {
        // Update status based on expiration
        if (prescription.expiration_date && 
            new Date() > prescription.expiration_date && 
            prescription.status === 'active') {
          prescription.status = 'expired';
        }
      }
    }
  });
  
  // Class methods
  Prescription.findActiveForPatient = async function(patientId: any) {
    return await this.findAll({
      where: {
        patientId: patientId,
        status: 'active',
        expiration_date: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['prescribed_date', 'DESC']]
    });
  };
  
  Prescription.findExpiringPrescriptions = async function(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await this.findAll({
      where: {
        status: 'active',
        expiration_date: {
          [sequelize.Sequelize.Op.between]: [new Date(), futureDate]
        }
      },
      order: [['expiration_date', 'ASC']]
    });
  };
  
  Prescription.findControlledSubstances = async function(providerId: any, providerType: any) {
    const where = {
      is_controlled_substance: true,
      status: 'active'
    };
    
    if (providerType === 'doctor') {
      (where as any).prescribing_doctor_id = providerId;
    } else if (providerType === 'hsp') {
      (where as any).prescribing_hsp_id = providerId;
    }
    
    return await this.findAll({
      where,
      order: [['prescribed_date', 'DESC']]
    });
  };
  
  // Instance methods
  Prescription.prototype.isExpired = function() {
    return this.expiration_date && new Date() > this.expiration_date;
  };
  
  Prescription.prototype.canBeRefilled = function() {
    return this.refills_used < this.refills_allowed && 
           !this.isExpired() && 
           this.status === 'active';
  };
  
  Prescription.prototype.getDaysUntilExpiration = function() {
    if (!this.expiration_date) return null;
    
    const now = new Date();
    const expiration = new Date(this.expiration_date);
    const diffTime = expiration.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  Prescription.prototype.processRefill = function() {
    if (!this.canBeRefilled()) {
      throw new Error('Prescription cannot be refilled');
    }
    
    this.refills_used += 1;
    return this.save();
  };
  
  Prescription.prototype.discontinue = function(reason: any) {
    this.status = 'discontinued';
    this.discontinuation_reason = reason;
    return this.save();
  };
  
  Prescription.prototype.getPrescriber = async function() {
    if (this.prescribing_doctor_id) {
      return await sequelize.models.Doctor.findByPk(this.prescribing_doctor_id);
    } else if (this.prescribing_hsp_id) {
      return await sequelize.models.HSP.findByPk(this.prescribing_hsp_id);
    }
    return null;
  };
  
  return Prescription;
};