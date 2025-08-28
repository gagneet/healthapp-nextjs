// src/models/UserDevice.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const UserDevice = sequelize.define('UserDevice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Device information
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: false, // ios, android, web
      validate: {
        isIn: [['ios', 'android', 'web', 'mobile', 'desktop']]
      }
    },
    
    push_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Settings
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    
    notification_settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        medications: true,
        appointments: true,
        vitals: true,
        symptoms: true,
        reminders: true,
        emergency: true
      },
      validate: {
        isValidSettings(value: any) {
          if (value && typeof value !== 'object') {
            throw new Error('Notification settings must be a valid JSON object');
          }
        }
      }
    },
    
    // Timestamps
    last_used_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'user_devices',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['deviceType']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['push_token']
      },
      {
        fields: ['last_used_at']
      },
      {
        fields: ['userId', 'push_token'],
        unique: true
      }
    ],
    
    hooks: {
      beforeUpdate: (device: any) => {
        device.updatedAt = new Date();
      }
    }
  });
  
  return UserDevice;
};