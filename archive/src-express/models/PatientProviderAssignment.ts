// src/models/PatientProviderAssignment.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const PatientProviderAssignment = sequelize.define('PatientProviderAssignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'healthcare_providers',
        key: 'id'
      }
    },
    
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'primary', // primary, secondary, consultant
      validate: {
        isIn: [['primary', 'secondary', 'consultant', 'specialist']]
      }
    },
    
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
  }, {
    tableName: 'patient_provider_assignments',
    underscored: true,
    timestamps: false,
    
    indexes: [
      {
        fields: ['patientId'],
        where: { ended_at: null }
      },
      {
        fields: ['provider_id'],
        where: { ended_at: null }
      },
      {
        fields: ['patientId', 'provider_id'],
        where: { ended_at: null }
      },
      {
        name: 'patient_provider_role_unique',
        fields: ['patientId', 'provider_id', 'role', 'ended_at'],
        unique: true
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Check if assignment is active
      isActive() {
        return !(this as any).ended_at;
      },
      
      // End assignment
      async endAssignment() {
        (this as any).ended_at = new Date();
        await (this as any).save();
      }
    },
    
    // Class methods
    classMethods: {
      // Find active assignments for patient
      findActiveForPatient(patientId: any) {
        return (this as any).findAll({
          where: {
            patientId: patientId,
            ended_at: null
          }
        });
      },
      
      // Find active assignments for provider
      findActiveForProvider(providerId: any) {
        return (this as any).findAll({
          where: {
            provider_id: providerId,
            ended_at: null
          }
        });
      }
    }
  });
  
  return PatientProviderAssignment;
};