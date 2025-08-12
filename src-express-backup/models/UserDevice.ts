// src/models/UserDevice.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const UserDevice = sequelize.define('UserDevice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Device information
    device_type: {
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
    is_active: {
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
    
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'user_devices',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['device_type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['push_token']
      },
      {
        fields: ['last_used_at']
      },
      {
        fields: ['user_id', 'push_token'],
        unique: true
      }
    ],
    
    hooks: {
      beforeUpdate: (device: any) => {
        device.updated_at = new Date();
      }
    }
  });
  
  return UserDevice;
};