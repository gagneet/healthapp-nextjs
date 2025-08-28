// src/models/Notification.js - Notification System for Healthcare Platform
import { DataTypes } from 'sequelize';
import { NOTIFICATION_CHANNEL, PRIORITY_LEVEL } from '../config/enums.js';

export default (sequelize: any) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Recipients
    patientId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    doctorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    
    hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      }
    },
    
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    
    // Notification Content
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'medication_reminder',
          'appointment_reminder',
          'lab_result_available',
          'vital_check_due',
          'care_plan_update',
          'treatment_plan_update',
          'emergency_alert',
          'system_notification',
          'educational_content',
          'adherence_report',
          'prescription_renewal',
          'follow_up_required'
        ]]
      }
    },
    
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Notification title/subject'
    },
    
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Notification content'
    },
    
    // Priority and Urgency
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'MEDIUM',
      validate: {
        isIn: [Object.values(PRIORITY_LEVEL)]
      }
    },
    
    is_urgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is an urgent notification'
    },
    
    // Delivery Channels
    channels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['PUSH'],
      validate: {
        isValidChannels(value: any) {
          const validChannels = Object.values(NOTIFICATION_CHANNEL);
          if (!Array.isArray(value) || !value.every(channel => validChannels.includes(channel))) {
            throw new Error('Invalid notification channels');
          }
        }
      }
    },
    
    // Scheduling
    scheduled_for: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to send the notification (null = send immediately)'
    },
    
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this notification expires and should not be sent'
    },
    
    // Delivery Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'sent', 'delivered', 'failed', 'expired', 'cancelled']]
      }
    },
    
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Delivery Details
    delivery_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    delivery_log: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Log of delivery attempts and results'
    },
    
    // User Interaction
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the notification was read'
    },
    
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the notification was acknowledged'
    },
    
    // Related Records
    related_appointment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id'
      }
    },
    
    related_medication_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'medications',
        key: 'id'
      }
    },
    
    related_care_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'care_plans',
        key: 'id'
      }
    },
    
    related_treatment_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'treatment_plans',
        key: 'id'
      }
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional notification-specific data'
    },
    
    // Action Required
    requires_action: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this notification requires user action'
    },
    
    action_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL for action if required'
    },
    
    action_taken: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    action_taken_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Templates and Personalization
    template_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Template used for this notification'
    },
    
    personalization_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Data used to personalize the notification'
    },
    
    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
    
  }, {
    tableName: 'notifications',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['doctorId']
      },
      {
        fields: ['hsp_id']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['scheduled_for']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['is_urgent']
      },
      {
        fields: ['requires_action', 'action_taken']
      },
      {
        // Composite index for delivery processing
        fields: ['status', 'scheduled_for', 'expires_at']
      },
      {
        // Index for user notifications
        fields: ['patientId', 'status', 'createdAt']
      }
    ],
    
    hooks: {
      beforeCreate: (notification: any, options: any) => {
        // Set default scheduled_for if not provided
        if (!notification.scheduled_for) {
          notification.scheduled_for = new Date();
        }
        
        // Set expiration for non-urgent notifications (7 days default)
        if (!notification.expires_at && !notification.is_urgent) {
          const expirationDate = new Date(notification.scheduled_for);
          expirationDate.setDate(expirationDate.getDate() + 7);
          notification.expires_at = expirationDate;
        }
      },
      
      beforeUpdate: (notification: any, options: any) => {
        // Mark as expired if past expiration date
        if (notification.expires_at && 
            new Date() > notification.expires_at && 
            notification.status === 'pending') {
          notification.status = 'expired';
        }
      }
    }
  });
  
  // Class methods
  Notification.findPendingNotifications = async function() {
    return await this.findAll({
      where: {
        status: 'pending',
        scheduled_for: {
          [sequelize.Sequelize.Op.lte]: new Date()
        },
        [sequelize.Sequelize.Op.or]: [
          { expires_at: null },
          { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      },
      order: [
        ['is_urgent', 'DESC'],
        ['priority', 'DESC'],
        ['scheduled_for', 'ASC']
      ]
    });
  };
  
  Notification.findUserNotifications = async function(userId: any, userType: any, limit = 20) {
    const whereCondition = {
      status: ['sent', 'delivered'],
      deleted_at: null
    };
    
    if (userType === 'patient') {
      (whereCondition as any).patientId = userId;
    } else if (userType === 'doctor') {
      (whereCondition as any).doctorId = userId;
    } else if (userType === 'hsp') {
      (whereCondition as any).hsp_id = userId;
    }
    
    return await this.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit
    });
  };
  
  Notification.createMedicationReminder = async function(patientId: any, medicationId: any, scheduledTime: any) {
    return await this.create({
      patientId: patientId,
      related_medication_id: medicationId,
      type: 'medication_reminder',
      title: 'Medication Reminder',
      message: 'It\'s time to take your medication',
      scheduled_for: scheduledTime,
      channels: ['PUSH', 'SMS'],
      requires_action: true
    });
  };
  
  Notification.createAppointmentReminder = async function(patientId: any, appointmentId: any, scheduledTime: any) {
    return await this.create({
      patientId: patientId,
      related_appointment_id: appointmentId,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: 'You have an upcoming appointment',
      scheduled_for: scheduledTime,
      channels: ['PUSH', 'EMAIL', 'SMS'],
      requires_action: false
    });
  };
  
  // Instance methods
  Notification.prototype.markAsRead = function() {
    this.read_at = new Date();
    return this.save();
  };
  
  Notification.prototype.acknowledge = function() {
    this.acknowledged_at = new Date();
    return this.save();
  };
  
  Notification.prototype.markActionTaken = function() {
    this.action_taken = true;
    this.action_taken_at = new Date();
    return this.save();
  };
  
  Notification.prototype.updateDeliveryStatus = function(status: any, channel: any, details = {}) {
    this.status = status;
    
    if (status === 'sent') {
      this.sent_at = new Date();
    } else if (status === 'delivered') {
      this.delivered_at = new Date();
    }
    
    // Update delivery log
    if (!this.delivery_log) this.delivery_log = [];
    this.delivery_log.push({
      timestamp: new Date(),
      channel,
      status,
      details,
      attempt: this.delivery_attempts + 1
    });
    
    this.delivery_attempts += 1;
    
    return this.save();
  };
  
  Notification.prototype.isExpired = function() {
    return this.expires_at && new Date() > this.expires_at;
  };
  
  Notification.prototype.canBeSent = function() {
    return this.status === 'pending' && 
           !this.isExpired() && 
           (!this.scheduled_for || new Date() >= this.scheduled_for);
  };
  
  return Notification;
};