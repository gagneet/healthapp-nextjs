'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface: any, Sequelize: any) {
    // Check if secondary_doctor_assignments table already exists
    const tableExists = await queryInterface.tableExists('secondary_doctor_assignments');
    if (tableExists) {
      console.log('ℹ️ Table "secondary_doctor_assignments" already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('secondary_doctor_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      
      // Core assignment relationships
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Patient being assigned to secondary doctor'
      },
      
      primary_doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Primary doctor who made this assignment'
      },
      
      secondary_doctor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Secondary doctor being assigned'
      },
      
      secondary_hsp_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'hsps',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Secondary HSP being assigned'
      },
      
      // Assignment metadata
      assignment_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for assigning secondary doctor (specialist referral, etc.)'
      },
      
      specialty_focus: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        comment: 'Specific conditions or specialties this assignment covers'
      },
      
      care_plan_ids: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
        comment: 'Specific care plans this secondary doctor manages'
      },
      
      // Provider context for access control
      primary_doctor_provider_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Provider organization of primary doctor'
      },
      
      secondary_doctor_provider_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Provider organization of secondary doctor'
      },
      
      // Consent and access status
      consent_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether patient consent is required (false for same provider)'
      },
      
      consent_status: {
        type: Sequelize.ENUM('pending', 'requested', 'granted', 'denied', 'expired'),
        defaultValue: 'pending',
        comment: 'Current consent status'
      },
      
      access_granted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether secondary doctor can access patient details'
      },
      
      first_access_attempt_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When secondary doctor first tried to access patient'
      },
      
      access_granted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When access was granted (consent given or automatic)'
      },
      
      // Consent expiry (configurable per assignment)
      consent_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When consent expires (default 6 months, configurable)'
      },
      
      consent_duration_months: {
        type: Sequelize.INTEGER,
        defaultValue: 6,
        comment: 'Consent validity duration in months (configurable per doctor)'
      },
      
      // Assignment status
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this assignment is currently active'
      },
      
      assignment_start_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When assignment was created'
      },
      
      assignment_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional end date for temporary assignments'
      },
      
      // Audit fields
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    const indexes = [
      { fields: ['patient_id'], name: 'idx_secondary_doctor_assignments_patient_id' },
      { fields: ['primary_doctor_id'], name: 'idx_secondary_doctor_assignments_primary_doctor_id' },
      { fields: ['secondary_doctor_id'], name: 'idx_secondary_doctor_assignments_secondary_doctor_id' },
      { fields: ['secondary_hsp_id'], name: 'idx_secondary_doctor_assignments_secondary_hsp_id' },
      { fields: ['consent_status'], name: 'idx_secondary_doctor_assignments_consent_status' },
      { fields: ['access_granted'], name: 'idx_secondary_doctor_assignments_access_granted' },
      { fields: ['is_active'], name: 'idx_secondary_doctor_assignments_is_active' },
      { fields: ['consent_expires_at'], name: 'idx_secondary_doctor_assignments_consent_expires_at' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('secondary_doctor_assignments', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) throw (error as any);
      }
    }
    
    // Add unique constraint to prevent duplicate assignments
    try {
      await queryInterface.addIndex('secondary_doctor_assignments', {
        fields: ['patient_id', 'secondary_doctor_id', 'secondary_hsp_id'],
        unique: true,
        where: {
          is_active: true
        },
        name: 'unique_active_secondary_assignment'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Add check constraints
    try {
      await queryInterface.addConstraint('secondary_doctor_assignments', {
        fields: ['consent_status'],
        type: 'check',
        where: {
          consent_status: {
            [Sequelize.Op.in]: ['pending', 'requested', 'granted', 'denied', 'expired']
          }
        },
        name: 'valid_secondary_consent_status'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Ensure either secondary_doctor_id or secondary_hsp_id is provided
    try {
      await queryInterface.addConstraint('secondary_doctor_assignments', {
        type: 'check',
        fields: ['secondary_doctor_id', 'secondary_hsp_id'],
        where: Sequelize.literal('(secondary_doctor_id IS NOT NULL) OR (secondary_hsp_id IS NOT NULL)'),
        name: 'secondary_assignment_has_doctor_or_hsp'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
  },

  async down (queryInterface: any, Sequelize: any) {
    await queryInterface.dropTable('secondary_doctor_assignments');
  }
};
