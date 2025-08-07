// src/models/VitalRequirement.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
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
    ],
    
    // Instance methods
    instanceMethods: {
      // Check if critical
      isCritical() {
        return this.is_critical;
      },
      
      // Get next due date based on frequency
      getNextDueDate(lastReading = null) {
        const now = new Date();
        const baseDate = lastReading ? new Date(lastReading) : now;
        
        switch (this.frequency) {
          case 'hourly':
            return new Date(baseDate.getTime() + 60 * 60 * 1000);
          case 'every_4_hours':
            return new Date(baseDate.getTime() + 4 * 60 * 60 * 1000);
          case 'every_6_hours':
            return new Date(baseDate.getTime() + 6 * 60 * 60 * 1000);
          case 'every_8_hours':
            return new Date(baseDate.getTime() + 8 * 60 * 60 * 1000);
          case 'every_12_hours':
            return new Date(baseDate.getTime() + 12 * 60 * 60 * 1000);
          case 'daily':
            return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
          case 'twice_daily':
            return new Date(baseDate.getTime() + 12 * 60 * 60 * 1000);
          case 'weekly':
            return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          case 'monthly':
            const nextMonth = new Date(baseDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return nextMonth;
          default:
            return null; // as_needed
        }
      }
    },
    
    // Class methods
    classMethods: {
      // Find by care plan
      findByCarePlan(carePlanId) {
        return this.findAll({
          where: {
            care_plan_id: carePlanId,
            deleted_at: null
          },
          include: ['VitalType']
        });
      },
      
      // Find critical requirements
      findCritical() {
        return this.findAll({
          where: {
            is_critical: true,
            deleted_at: null
          }
        });
      }
    }
  });
  
  return VitalRequirement;
};