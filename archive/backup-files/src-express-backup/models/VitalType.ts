// src/models/VitalType.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const VitalType = sequelize.define('VitalType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    
    normal_range_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    
    normal_range_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    validation_rules: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidRules(value: any) {
          if (value && typeof value !== 'object') {
            throw new Error('Validation rules must be a valid JSON object');
          }
        }
      }
    },
    
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'vital_types',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['name'],
        unique: true
      },
      {
        fields: ['unit']
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Check if value is within normal range
      isNormalValue(value: any) {
        if (!(this as any).normal_range_min && !(this as any).normal_range_max) {
          return true; // No range defined
        }
        
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return false;
        
        if ((this as any).normal_range_min && numValue < (this as any).normal_range_min) {
          return false;
        }
        
        if ((this as any).normal_range_max && numValue > (this as any).normal_range_max) {
          return false;
        }
        
        return true;
      },
      
      // Get display name with unit
      getDisplayName() {
        return (this as any).unit ? `${(this as any).name} (${(this as any).unit})` : (this as any).name;
      }
    },
    
    // Class methods
    classMethods: {
      // Find by name
      findByName(name: any) {
        return (this as any).findOne({
          where: {
            name: name
          }
        });
      },
      
      // Get common vital types
      getCommonTypes() {
        const commonTypes = [
          'Blood Pressure Systolic',
          'Blood Pressure Diastolic', 
          'Heart Rate',
          'Body Temperature',
          'Weight',
          'Blood Glucose',
          'Oxygen Saturation'
        ];
        
        return (this as any).findAll({
          where: {
            name: {
              [sequelize.Sequelize.Op.in]: commonTypes
            }
          }
        });
      }
    }
  });
  
  return VitalType;
};