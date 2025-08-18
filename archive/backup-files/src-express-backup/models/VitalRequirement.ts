// src/models/VitalRequirement.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const VitalRequirement = sequelize.define('VitalRequirement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    care_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'care_plans',
        key: 'id'
      }
    },
    
    vital_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vital_types',
        key: 'id'
      }
    },
    
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false, // daily, twice_daily, weekly, etc.
      validate: {
        notEmpty: true,
        isIn: [['daily', 'twice_daily', 'weekly', 'monthly', 'as_needed', 'hourly', 'every_4_hours', 'every_6_hours', 'every_8_hours', 'every_12_hours']]
      }
    },
    
    preferred_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    
    is_critical: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    monitoring_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
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
      allowNull: true,
    }
    
  }, {
    tableName: 'vital_requirements',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['care_plan_id']
      },
      {
        fields: ['vital_type_id']
      },
      {
        fields: ['frequency']
      },
      {
        fields: ['is_critical']
      },
      {
        fields: ['care_plan_id', 'vital_type_id'],
        unique: true,
        where: { deleted_at: null }
      }
    ]
  });
  
  return VitalRequirement;
};