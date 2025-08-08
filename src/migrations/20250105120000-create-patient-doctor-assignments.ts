// Migration: Create patient_doctor_assignments table
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if patient_doctor_assignments table already exists
    const tableExists = await queryInterface.tableExists('patient_doctor_assignments');
    if (tableExists) {
      console.log('ℹ️ Table "patient_doctor_assignments" already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('patient_doctor_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      // Assignment type determines permissions and responsibilities
      assignment_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Primary: Original doctor, Specialist: For specific care plans, Substitute: Same provider coverage, Transferred: Full transfer with consent'
      },
      
      // Permissions based on assignment type
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {
          can_view_patient: true,
          can_create_care_plans: false,
          can_modify_care_plans: false,
          can_prescribe: false,
          can_order_tests: false,
          can_access_full_history: false
        },
        comment: 'Granular permissions for this doctor-patient relationship'
      },
      
      // For specialist assignments - specific to care plans or conditions
      specialty_focus: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        comment: 'Specific specialties/conditions this assignment covers'
      },
      
      care_plan_ids: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
        comment: 'Specific care plans this doctor is responsible for'
      },
      
      // Assignment metadata
      assigned_by_doctor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        comment: 'Doctor who made this assignment'
      },
      
      assigned_by_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Provider admin who made this assignment'
      },
      
      // For transfers - consent tracking
      patient_consent_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether patient consent is required for this assignment'
      },
      
      patient_consent_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'not_required'
      },
      
      consent_method: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      
      consent_otp: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'OTP for consent verification'
      },
      
      consent_otp_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      consent_granted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Assignment validity
      assignment_start_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      
      assignment_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional end date for temporary assignments'
      },
      
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      
      // Notes and reason for assignment
      assignment_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for this doctor assignment'
      },
      
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // Provider/Organization context
      requires_same_organization: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this assignment requires doctors to be in same organization'
      },
      
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes (with idempotent checks)
    const indexes = [
      { fields: ['patient_id'], name: 'idx_patient_doctor_assignments_patient_id' },
      { fields: ['doctor_id'], name: 'idx_patient_doctor_assignments_doctor_id' },
      { fields: ['assignment_type'], name: 'idx_patient_doctor_assignments_assignment_type' },
      { fields: ['is_active'], name: 'idx_patient_doctor_assignments_is_active' },
      { fields: ['patient_consent_status'], name: 'idx_patient_doctor_assignments_consent_status' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('patient_doctor_assignments', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) throw (error as any);
      }
    }
    
    // Add unique constraint for primary doctor per patient (with idempotent check)
    try {
      await queryInterface.addIndex('patient_doctor_assignments', {
        fields: ['patient_id', 'assignment_type'],
        unique: true,
        where: {
          assignment_type: 'primary',
          is_active: true
        },
        name: 'unique_primary_doctor_per_patient'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Add check constraints (with idempotent checks)
    try {
      await queryInterface.addConstraint('patient_doctor_assignments', {
        fields: ['assignment_type'],
        type: 'check',
        where: {
          assignment_type: {
            [Sequelize.Op.in]: ['primary', 'specialist', 'substitute', 'transferred']
          }
        },
        name: 'valid_assignment_type'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    try {
      await queryInterface.addConstraint('patient_doctor_assignments', {
        fields: ['patient_consent_status'],
        type: 'check',
        where: {
          patient_consent_status: {
            [Sequelize.Op.in]: ['not_required', 'pending', 'granted', 'denied', 'expired']
          }
        },
        name: 'valid_consent_status'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    try {
      await queryInterface.addConstraint('patient_doctor_assignments', {
        fields: ['consent_method'],
        type: 'check',
        where: {
          [Sequelize.Op.or]: [
            { consent_method: null },
            {
              consent_method: {
                [Sequelize.Op.in]: ['sms_otp', 'email_otp', 'in_person', 'phone_call']
              }
            }
          ]
        },
        name: 'valid_consent_method'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('patient_doctor_assignments');
  }
};