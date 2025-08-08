'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface: any, Sequelize: any) {
    // Add provider linkage fields to patients table
    await queryInterface.addColumn('patients', 'linked_provider_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'Current provider organization linked to this patient'
    });

    await queryInterface.addColumn('patients', 'provider_linked_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the patient was linked to the current provider'
    });

    await queryInterface.addColumn('patients', 'provider_consent_given', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient gave consent for current provider linkage'
    });

    await queryInterface.addColumn('patients', 'provider_consent_given_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When consent was given for current provider linkage'
    });

    await queryInterface.addColumn('patients', 'provider_consent_method', {
      type: Sequelize.ENUM('sms', 'email', 'in_person', 'phone', 'automatic'),
      allowNull: true,
      comment: 'Method used to obtain consent for provider linkage'
    });

    // Create provider consent history table
    await queryInterface.createTable('patient_provider_consent_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      previous_provider_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Previous provider organization'
      },
      new_provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'New provider organization'
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Doctor who moved providers (if applicable)'
      },
      hsp_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'hsps',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'HSP who moved providers (if applicable)'
      },
      consent_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether consent was required for this transition'
      },
      consent_requested: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether consent was requested from patient'
      },
      consent_requested_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When consent was requested'
      },
      consent_given: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether patient gave consent'
      },
      consent_given_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When consent was given'
      },
      consent_method: {
        type: Sequelize.ENUM('sms', 'email', 'in_person', 'phone', 'automatic'),
        allowNull: true,
        comment: 'Method used to obtain consent'
      },
      consent_token: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'OTP token used for consent verification'
      },
      consent_token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the consent token expires'
      },
      consent_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether consent was successfully verified'
      },
      consent_denied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether patient denied consent'
      },
      consent_denied_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When consent was denied'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for provider change'
      },
      initiated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID who initiated the provider change'
      },
      status: {
        type: Sequelize.ENUM('pending', 'consent_requested', 'approved', 'denied', 'expired', 'completed'),
        defaultValue: 'pending',
        comment: 'Status of the provider change request'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Additional metadata for the consent process'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create doctor/HSP provider history table to track provider changes
    await queryInterface.createTable('provider_change_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      practitioner_type: {
        type: Sequelize.ENUM('doctor', 'hsp'),
        allowNull: false,
        comment: 'Type of healthcare practitioner'
      },
      practitioner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the doctor or HSP'
      },
      previous_provider_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Previous provider organization'
      },
      new_provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'New provider organization'
      },
      change_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When the provider change occurred'
      },
      affected_patients_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of patients affected by this change'
      },
      consent_required_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of patients requiring consent'
      },
      consent_obtained_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of patients who gave consent'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for the provider change'
      },
      status: {
        type: Sequelize.ENUM('active', 'processing', 'completed'),
        defaultValue: 'active',
        comment: 'Status of the provider change'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('patients', ['linked_provider_id']);
    await queryInterface.addIndex('patients', ['provider_consent_given']);
    await queryInterface.addIndex('patients', ['provider_linked_at']);

    await queryInterface.addIndex('patient_provider_consent_history', ['patient_id', 'status']);
    await queryInterface.addIndex('patient_provider_consent_history', ['new_provider_id']);
    await queryInterface.addIndex('patient_provider_consent_history', ['consent_requested_at']);
    await queryInterface.addIndex('patient_provider_consent_history', ['doctor_id']);
    await queryInterface.addIndex('patient_provider_consent_history', ['hsp_id']);

    await queryInterface.addIndex('provider_change_history', ['practitioner_type', 'practitioner_id']);
    await queryInterface.addIndex('provider_change_history', ['new_provider_id']);
    await queryInterface.addIndex('provider_change_history', ['change_date']);
    await queryInterface.addIndex('provider_change_history', ['status']);
  },

  async down (queryInterface: any, Sequelize: any) {
    // Drop tables
    await queryInterface.dropTable('provider_change_history');
    await queryInterface.dropTable('patient_provider_consent_history');

    // Remove columns from patients table
    await queryInterface.removeColumn('patients', 'provider_consent_method');
    await queryInterface.removeColumn('patients', 'provider_consent_given_at');
    await queryInterface.removeColumn('patients', 'provider_consent_given');
    await queryInterface.removeColumn('patients', 'provider_linked_at');
    await queryInterface.removeColumn('patients', 'linked_provider_id');

    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patient_provider_consent_history_consent_method" CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patient_provider_consent_history_status" CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_provider_change_history_practitioner_type" CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_provider_change_history_status" CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patients_provider_consent_method" CASCADE;');
  }
};
