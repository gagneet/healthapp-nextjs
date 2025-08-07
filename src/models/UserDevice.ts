// src/models/UserDevice.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
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
        isValidSettings(value) {
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
    
    // Instance methods
    instanceMethods: {
      // Update last used time
      async updateLastUsed() {
        this.last_used_at = new Date();
        await this.save();
      },
      
      // Deactivate device
      async deactivate() {
        this.is_active = false;
        await this.save();
      },
      
      // Check if device supports notification type
      supportsNotification(type) {
        return this.notification_settings && this.notification_settings[type] === true;
      },
      
      // Update notification settings
      async updateNotificationSettings(settings) {
        this.notification_settings = {
          ...this.notification_settings,
          ...settings
        };
        await this.save();
      }
    },
    
    // Class methods
    classMethods: {
      // Find active devices for user
      findActiveForUser(userId) {
        return this.findAll({
          where: {
            user_id: userId,
            is_active: true
          },
          order: [['last_used_at', 'DESC']]
        });
      },
      
      // Find by push token
      findByPushToken(pushToken) {
        return this.findOne({
          where: {
            push_token: pushToken,
            is_active: true
          }
        });
      },
      
      // Clean up inactive devices
      async cleanupInactive(daysInactive = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
        
        return this.update(
          { is_active: false },
          {
            where: {
              last_used_at: {
                [sequelize.Sequelize.Op.lt]: cutoffDate
              },
              is_active: true
            }
          }
        );
      },
      
      // Get devices by type
      findByType(deviceType) {
        return this.findAll({
          where: {
            device_type: deviceType,
            is_active: true
          }
        });
      }
    }
  });
  
  return UserDevice;
};