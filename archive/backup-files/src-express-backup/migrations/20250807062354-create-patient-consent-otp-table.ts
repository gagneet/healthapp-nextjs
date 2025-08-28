'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface: any, Sequelize: any) {
    // Check if patient_consent_otp table already exists
    const tableExists = await queryInterface.tableExists('patient_consent_otp');
    if (tableExists) {
      console.log('ℹ️ Table "patient_consent_otp" already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('patient_consent_otp', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      
      // Core relationships - linking to secondary assignment
      secondary_assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'secondary_doctor_assignments',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Secondary doctor assignment this OTP is for'
      },
      
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Patient giving consent'
      },
      
      primary_doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Primary doctor who assigned secondary doctor'
      },
      
      secondary_doctor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Secondary doctor requesting access'
      },
      
      secondary_hsp_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'hsps',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Secondary HSP requesting access'
      },
      
      // OTP details
      otp_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: '6-digit OTP code sent to patient'
      },
      
      otp_method: {
        type: Sequelize.ENUM('sms', 'email', 'both'),
        defaultValue: 'both',
        comment: 'Method used to send OTP'
      },
      
      // Patient contact info at time of OTP generation
      patient_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Patient phone number OTP was sent to'
      },
      
      patient_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Patient email OTP was sent to'
      },
      
      // OTP lifecycle
      generated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When OTP was generated'
      },
      
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When OTP expires (default 30 minutes)'
      },
      
      attempts_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of verification attempts'
      },
      
      max_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        comment: 'Maximum allowed verification attempts'
      },
      
      // Verification status
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether OTP has been successfully verified'
      },
      
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When OTP was successfully verified'
      },
      
      is_expired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether OTP has expired'
      },
      
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether OTP is blocked due to max attempts'
      },
      
      blocked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When OTP was blocked'
      },
      
      // Request context
      requested_by_userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User who triggered the OTP request'
      },
      
      request_ip_address: {
        type: Sequelize.INET,
        allowNull: true,
        comment: 'IP address of the request'
      },
      
      request_user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User agent of the request'
      },
      
      // SMS/Email delivery tracking
      sms_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether SMS was successfully sent'
      },
      
      sms_sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When SMS was sent'
      },
      
      sms_error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'SMS sending error if any'
      },
      
      email_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether email was successfully sent'
      },
      
      email_sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email was sent'
      },
      
      email_error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Email sending error if any'
      },
      
      // Audit fields
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance and security
    const indexes = [
      { fields: ['secondary_assignment_id'], name: 'idx_patient_consent_otp_secondary_assignment_id' },
      { fields: ['patientId'], name: 'idx_patient_consent_otp_patient_id' },
      { fields: ['otp_code'], name: 'idx_patient_consent_otp_otp_code' },
      { fields: ['expires_at'], name: 'idx_patient_consent_otp_expires_at' },
      { fields: ['is_verified'], name: 'idx_patient_consent_otp_is_verified' },
      { fields: ['is_expired'], name: 'idx_patient_consent_otp_is_expired' },
      { fields: ['is_blocked'], name: 'idx_patient_consent_otp_is_blocked' },
      { fields: ['generated_at'], name: 'idx_patient_consent_otp_generated_at' },
      { fields: ['requested_by_userId'], name: 'idx_patient_consent_otp_requested_by_userId' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('patient_consent_otp', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) throw (error as any);
      }
    }
    
    // Add unique constraint to prevent multiple active OTPs for same assignment
    try {
      await queryInterface.addIndex('patient_consent_otp', {
        fields: ['secondary_assignment_id'],
        unique: true,
        where: {
          is_verified: false,
          is_expired: false,
          is_blocked: false
        },
        name: 'unique_active_otp_per_assignment'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Add check constraints
    try {
      await queryInterface.addConstraint('patient_consent_otp', {
        fields: ['otp_method'],
        type: 'check',
        where: {
          otp_method: {
            [Sequelize.Op.in]: ['sms', 'email', 'both']
          }
        },
        name: 'valid_otp_method'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Ensure either secondary_doctor_id or secondary_hsp_id is provided
    try {
      await queryInterface.addConstraint('patient_consent_otp', {
        type: 'check',
        fields: ['secondary_doctor_id', 'secondary_hsp_id'],
        where: Sequelize.literal('(secondary_doctor_id IS NOT NULL) OR (secondary_hsp_id IS NOT NULL)'),
        name: 'otp_has_secondary_doctor_or_hsp'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Ensure OTP code is 6 digits
    try {
      await queryInterface.addConstraint('patient_consent_otp', {
        type: 'check',
        fields: ['otp_code'],
        where: Sequelize.literal("otp_code ~ '^[0-9]{6}$'"),
        name: 'otp_code_format'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Ensure max attempts is reasonable
    try {
      await queryInterface.addConstraint('patient_consent_otp', {
        fields: ['max_attempts'],
        type: 'check',
        where: {
          max_attempts: {
            [Sequelize.Op.between]: [1, 10]
          }
        },
        name: 'reasonable_max_attempts'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
  },

  async down (queryInterface: any, Sequelize: any) {
    await queryInterface.dropTable('patient_consent_otp');
  }
};
