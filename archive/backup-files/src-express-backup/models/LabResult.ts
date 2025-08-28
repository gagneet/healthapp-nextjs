// src/models/LabResult.js - Laboratory Results and Diagnostic Tests
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const LabResult = sequelize.define('LabResult', {
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
    
    ordering_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    
    ordering_hsp_id: {
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
    
    // Test Identification
    order_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Laboratory order number'
    },
    
    accession_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Lab accession number'
    },
    
    external_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External lab system ID'
    },
    
    // Test Information
    test_category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'chemistry', 'hematology', 'immunology', 'microbiology',
          'molecular', 'pathology', 'radiology', 'cardiology',
          'endocrinology', 'toxicology', 'coagulation', 'urinalysis'
        ]]
      }
    },
    
    test_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the test or panel'
    },
    
    test_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'LOINC or CPT code for the test'
    },
    
    test_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['lab', 'imaging', 'diagnostic', 'genetic', 'pathology']]
      }
    },
    
    // Specimen Information
    specimen_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [[
          'blood', 'urine', 'stool', 'saliva', 'tissue', 'swab',
          'csf', 'sputum', 'wound', 'other'
        ]]
      }
    },
    
    specimen_source: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Anatomical source of specimen'
    },
    
    collection_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'How specimen was collected'
    },
    
    collection_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When specimen was collected'
    },
    
    // Results Data
    individual_results: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of individual test results within panel'
    },
    
    overall_result: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Overall result summary or narrative'
    },
    
    // Status and Timing
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ordered',
      validate: {
        isIn: [['ordered', 'collected', 'in_progress', 'completed', 'cancelled', 'amended']]
      }
    },
    
    ordered_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    resulted_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When results became available'
    },
    
    reviewed_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When results were reviewed by provider'
    },
    
    reviewed_by_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    
    reviewed_by_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      }
    },
    
    // Clinical Context
    indication: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinical indication for test'
    },
    
    diagnosis_codes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'ICD-10 codes for indication'
    },
    
    clinical_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional clinical information'
    },
    
    // Critical Values and Alerts
    has_critical_values: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether any results are in critical range'
    },
    
    critical_values: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'List of critical values requiring immediate attention'
    },
    
    abnormal_flags: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Abnormal result flags (high, low, etc.)'
    },
    
    // Laboratory Information
    performing_lab: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Name of laboratory that performed test'
    },
    
    lab_director: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Laboratory director name'
    },
    
    lab_contact: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Laboratory contact information'
    },
    
    // Quality and Validation
    quality_control: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Quality control information'
    },
    
    reference_ranges: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Reference ranges for results'
    },
    
    methodology: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Testing methodology used'
    },
    
    // Provider Actions
    provider_comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Provider interpretation and comments'
    },
    
    follow_up_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether follow-up is needed'
    },
    
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Instructions for follow-up'
    },
    
    // Patient Communication
    patient_notified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient has been notified of results'
    },
    
    patient_notification_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    patient_notification_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['phone', 'email', 'portal', 'mail', 'in_person']]
      }
    },
    
    // Document Management
    result_document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL to full result document (PDF, etc.)'
    },
    
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Associated images (for radiology, pathology)'
    },
    
    // Integration and Interoperability
    hl7_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Original HL7 message if received electronically'
    },
    
    fhir_resource: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'FHIR DiagnosticReport resource'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional test-specific metadata'
    },
    
    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
    
  }, {
    tableName: 'lab_results',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['ordering_doctor_id']
      },
      {
        fields: ['ordering_hsp_id']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['order_number'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['test_category']
      },
      {
        fields: ['test_type']
      },
      {
        fields: ['ordered_datetime']
      },
      {
        fields: ['resulted_datetime']
      },
      {
        fields: ['has_critical_values']
      },
      {
        fields: ['patient_notified']
      },
      {
        // Composite index for patient results
        fields: ['patientId', 'status', 'ordered_datetime']
      },
      {
        // Index for critical value alerts
        fields: ['has_critical_values', 'patient_notified', 'resulted_datetime']
      }
    ],
    
    validate: {
      mustHaveOrderingProvider() {
        if (!(this as any).ordering_doctor_id && !(this as any).ordering_hsp_id) {
          throw new Error('Lab result must have an ordering provider (doctor or HSP)');
        }
      }
    },
    
    hooks: {
      beforeCreate: (labResult: any, options: any) => {
        // Generate order number if not provided
        if (!labResult.order_number) {
          const timestamp = Date.now().toString();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          labResult.order_number = `LAB-${timestamp}-${random}`;
        }
      },
      
      beforeUpdate: (labResult: any, options: any) => {
        // Auto-set resulted_datetime when status changes to completed
        if (labResult.changed('status') && labResult.status === 'completed' && !labResult.resulted_datetime) {
          labResult.resulted_datetime = new Date();
        }
        
        // Check for critical values
        if (labResult.changed('individual_results')) {
          labResult.checkForCriticalValues();
        }
      }
    }
  });
  
  // Class methods
  LabResult.findPendingResults = async function(organizationId = null) {
    const where = {
      status: ['ordered', 'collected', 'in_progress']
    };
    
    if (organizationId) {
      (where as any).organization_id = organizationId;
    }
    
    return await this.findAll({
      where,
      order: [['ordered_datetime', 'ASC']]
    });
  };
  
  LabResult.findCriticalResults = async function(organizationId = null, notificationPending = true) {
    const where = {
      has_critical_values: true,
      status: 'completed'
    };
    
    if (notificationPending) {
      (where as any).patient_notified = false;
    }
    
    if (organizationId) {
      (where as any).organization_id = organizationId;
    }
    
    return await this.findAll({
      where,
      order: [['resulted_datetime', 'ASC']],
      include: [
        {
          model: sequelize.models.Patient,
          as: 'patient',
          attributes: ['id', 'userId']
        }
      ]
    });
  };
  
  LabResult.findPatientResults = async function(patientId: any, testCategory = null, limit = 50) {
    const where = {
      patientId: patientId,
      status: 'completed'
    };
    
    if (testCategory) {
      (where as any).test_category = testCategory;
    }
    
    return await this.findAll({
      where,
      order: [['resulted_datetime', 'DESC']],
      limit
    });
  };
  
  LabResult.generateLabSummary = async function(patientId: any, startDate: any, endDate: any) {
    const results = await this.findAll({
      where: {
        patientId: patientId,
        status: 'completed',
        resulted_datetime: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['resulted_datetime', 'DESC']]
    });
    
    const summary = {
      total_tests: results.length,
      by_category: {} as Record<string, number>,
      critical_values: 0,
      abnormal_results: 0,
      latest_results: [] as Array<{
        test_name: any;
        resulted_date: any;
        status: string;
      }>
    };
    
    results.forEach((result: any) => {
      // Count by category
      (summary as any).by_category[result.test_category] = ((summary as any).by_category[result.test_category] || 0) + 1;
      
      // Count critical and abnormal
      if (result.has_critical_values) summary.critical_values++;
      if (result.abnormal_flags.length > 0) summary.abnormal_results++;
      
      // Add to latest results (up to 10)
      if (summary.latest_results.length < 10) {
        summary.latest_results.push({
          test_name: result.test_name,
          resulted_date: result.resulted_datetime,
          status: result.has_critical_values ? 'critical' : 
                 result.abnormal_flags.length > 0 ? 'abnormal' : 'normal'
        });
      }
    });
    
    return summary;
  };
  
  // Instance methods
  LabResult.prototype.checkForCriticalValues = function() {
    if (!this.individual_results || !Array.isArray(this.individual_results)) {
      return false;
    }
    
    const criticalValues = [];
    
    this.individual_results.forEach((result: any) => {
      if (result.is_critical || result.flag === 'critical') {
        criticalValues.push({
          test_name: result.name,
          value: result.value,
          reference_range: result.reference_range,
          flag: result.flag
        });
      }
    });
    
    this.has_critical_values = criticalValues.length > 0;
    this.critical_values = criticalValues;
    
    return this.has_critical_values;
  };
  
  LabResult.prototype.markReviewed = function(reviewerId: any, reviewerType: any) {
    this.reviewed_datetime = new Date();
    
    if (reviewerType === 'doctor') {
      this.reviewed_by_doctor_id = reviewerId;
    } else if (reviewerType === 'hsp') {
      this.reviewed_by_hsp_id = reviewerId;
    }
    
    return this.save();
  };
  
  LabResult.prototype.notifyPatient = function(method: any) {
    this.patient_notified = true;
    this.patient_notification_date = new Date();
    this.patient_notification_method = method;
    
    return this.save();
  };
  
  LabResult.prototype.getAbnormalResults = function() {
    if (!this.individual_results) return [];
    
    return this.individual_results.filter((result: any) => 
      result.flag && result.flag !== 'normal' && result.flag !== 'within_range'
    );
  };
  
  LabResult.prototype.getOrderingProvider = async function() {
    if (this.ordering_doctor_id) {
      return await sequelize.models.Doctor.findByPk(this.ordering_doctor_id);
    } else if (this.ordering_hsp_id) {
      return await sequelize.models.HSP.findByPk(this.ordering_hsp_id);
    }
    return null;
  };
  
  LabResult.prototype.getReviewingProvider = async function() {
    if (this.reviewed_by_doctor_id) {
      return await sequelize.models.Doctor.findByPk(this.reviewed_by_doctor_id);
    } else if (this.reviewed_by_hsp_id) {
      return await sequelize.models.HSP.findByPk(this.reviewed_by_hsp_id);
    }
    return null;
  };
  
  LabResult.prototype.isOverdue = function(hours = 48) {
    if (this.status !== 'ordered' && this.status !== 'collected') return false;
    
    const overdueTime = new Date(this.ordered_datetime.getTime() + (hours * 60 * 60 * 1000));
    return new Date() > overdueTime;
  };
  
  return LabResult;
};