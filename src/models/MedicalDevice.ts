// src/models/MedicalDevice.js - Medical Devices and Remote Monitoring Integration
import { DataTypes } from 'sequelize';
import { createLogger } from '../middleware/logger.js';

const logger = createLogger(import.meta.url);

export default (sequelize: any) => {
  const MedicalDevice = sequelize.define('MedicalDevice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Device Identification
    device_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the medical device'
    },
    
    device_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'blood_pressure_monitor', 'glucose_monitor', 'weight_scale',
          'pulse_oximeter', 'thermometer', 'ecg_monitor', 'spirometer',
          'peak_flow_meter', 'medication_dispenser', 'fitness_tracker',
          'smartwatch', 'sleep_monitor', 'continuous_glucose_monitor',
          'insulin_pump', 'nebulizer', 'cpap_machine', 'other'
        ]]
      }
    },
    
    manufacturer: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    
    model_number: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Device serial number'
    },
    
    firmware_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // FDA and Regulatory
    fda_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'FDA device number'
    },
    
    is_fda_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    device_class: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['Class I', 'Class II', 'Class III']]
      },
      comment: 'FDA device classification'
    },
    
    // Patient Assignment
    patient_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    
    assigned_by_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    
    assigned_by_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      }
    },
    
    // Device Status
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'maintenance', 'retired', 'lost', 'damaged']]
      }
    },
    
    is_connected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether device is currently connected'
    },
    
    last_sync: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time device synced data'
    },
    
    battery_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 100 },
      comment: 'Current battery level percentage'
    },
    
    // Connectivity Information
    connection_type: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        isIn: [['bluetooth', 'wifi', 'cellular', 'usb', 'nfc', 'manual']]
      }
    },
    
    mac_address: {
      type: DataTypes.STRING(17),
      allowNull: true,
      comment: 'Device MAC address for Bluetooth/WiFi'
    },
    
    device_identifier: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Unique device identifier (UUID, etc.)'
    },
    
    // Measurement Capabilities
    measurement_types: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Types of measurements this device can take'
    },
    
    measurement_units: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Units for each measurement type'
    },
    
    measurement_ranges: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Valid ranges for measurements'
    },
    
    // Configuration
    device_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Device-specific configuration settings'
    },
    
    measurement_frequency: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'How often measurements should be taken'
    },
    
    reminder_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Reminder configuration for measurements'
    },
    
    // Data Integration
    api_endpoint: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'API endpoint for device data retrieval'
    },
    
    api_credentials: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Encrypted API credentials'
    },
    
    data_format: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['json', 'xml', 'hl7', 'csv', 'proprietary']]
      }
    },
    
    // Maintenance and Calibration
    last_maintenance: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last maintenance date'
    },
    
    next_maintenance: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Next scheduled maintenance'
    },
    
    last_calibration: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last calibration date'
    },
    
    next_calibration: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Next required calibration'
    },
    
    maintenance_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Warranty and Support
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    warranty_expiration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    support_contact: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Support contact information'
    },
    
    // Usage Statistics
    total_measurements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    last_measurement_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    usage_statistics: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Device usage analytics'
    },
    
    // Alerts and Notifications
    alert_thresholds: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Alert thresholds for measurements'
    },
    
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        low_battery: true,
        sync_failure: true,
        measurement_reminder: true,
        maintenance_due: true
      }
    },
    
    // Location and Environment
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Physical location of device'
    },
    
    environment_conditions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Environmental requirements (temperature, humidity)'
    },
    
    // Security
    encryption_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    access_permissions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Who can access device data'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional device-specific metadata'
    },
    
    // Timestamps
    assigned_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When device was assigned to patient'
    },
    
    activation_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When device was activated'
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
      allowNull: true
    }
    
  }, {
    tableName: 'medical_devices',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['device_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['manufacturer']
      },
      {
        fields: ['serial_number']
      },
      {
        fields: ['is_connected']
      },
      {
        fields: ['last_sync']
      },
      {
        fields: ['next_maintenance']
      },
      {
        fields: ['next_calibration']
      },
      {
        // Composite index for patient devices
        fields: ['patient_id', 'status', 'device_type']
      },
      {
        // Index for maintenance scheduling
        fields: ['status', 'next_maintenance']
      }
    ],
    
    hooks: {
      beforeCreate: (device: any, options: any) => {
        // Set activation date if device is active
        if (device.status === 'active' && !device.activation_date) {
          device.activation_date = new Date();
        }
        
        // Set default maintenance schedule
        if (!device.next_maintenance && device.status === 'active') {
          const nextMaintenance = new Date();
          nextMaintenance.setMonth(nextMaintenance.getMonth() + 6); // 6 months default
          device.next_maintenance = nextMaintenance;
        }
      },
      
      beforeUpdate: (device: any, options: any) => {
        // Update last sync when connection status changes
        if (device.changed('is_connected') && device.is_connected) {
          device.last_sync = new Date();
        }
        
        // Set assigned date when patient is assigned
        if (device.changed('patient_id') && device.patient_id && !device.assigned_date) {
          device.assigned_date = new Date();
        }
      }
    }
  });
  
  // Class methods
  MedicalDevice.findByPatient = async function(patientId: any, deviceType = null) {
    const where = {
      patient_id: patientId,
      status: 'active'
    };
    
    if (deviceType) {
      (where as any).device_type = deviceType;
    }
    
    return await this.findAll({
      where,
      order: [['assigned_date', 'DESC']]
    });
  };
  
  MedicalDevice.findConnectedDevices = async function(organizationId = null) {
    const where = {
      is_connected: true,
      status: 'active'
    };
    
    if (organizationId) {
      (where as any).organization_id = organizationId;
    }
    
    return await this.findAll({
      where,
      order: [['last_sync', 'DESC']]
    });
  };
  
  MedicalDevice.findMaintenanceDue = async function(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await this.findAll({
      where: {
        status: 'active',
        next_maintenance: {
          [sequelize.Sequelize.Op.lte]: futureDate
        }
      },
      order: [['next_maintenance', 'ASC']]
    });
  };
  
  MedicalDevice.findLowBatteryDevices = async function(threshold = 20) {
    return await this.findAll({
      where: {
        status: 'active',
        battery_level: {
          [sequelize.Sequelize.Op.lte]: threshold,
          [sequelize.Sequelize.Op.ne]: null
        }
      },
      order: [['battery_level', 'ASC']]
    });
  };
  
  MedicalDevice.getDeviceStatistics = async function(organizationId = null) {
    const where = organizationId ? { organization_id: organizationId } : {};
    
    const [total, active, connected, maintenanceDue] = await Promise.all([
      this.count({ where }),
      this.count({ where: { ...where, status: 'active' } }),
      this.count({ where: { ...where, is_connected: true } }),
      this.count({
        where: {
          ...where,
          status: 'active',
          next_maintenance: {
            [sequelize.Sequelize.Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    return {
      total_devices: total,
      active_devices: active,
      connected_devices: connected,
      maintenance_due: maintenanceDue,
      connection_rate: active > 0 ? Math.round((connected / active) * 100) : 0
    };
  };
  
  // Instance methods
  MedicalDevice.prototype.syncData = async function() {
    this.last_sync = new Date();
    this.is_connected = true;
    
    // Increment total measurements (would be updated with actual sync logic)
    this.total_measurements += 1;
    this.last_measurement_date = new Date();
    
    return this.save();
  };
  
  MedicalDevice.prototype.updateBatteryLevel = function(level: any) {
    this.battery_level = Math.max(0, Math.min(100, level));
    
    // Create alert if battery is low
    if (this.battery_level <= 20 && this.notification_preferences.low_battery) {
      // Trigger low battery notification
      logger.warn(`Low battery alert for device ${this.device_name}: ${this.battery_level}%`);
    }
    
    return this.save();
  };
  
  MedicalDevice.prototype.scheduleMaintenance = function(date: any, notes: any) {
    this.next_maintenance = date;
    if (notes) {
      this.maintenance_notes = notes;
    }
    
    return this.save();
  };
  
  MedicalDevice.prototype.completeMaintenance = function(notes: any) {
    this.last_maintenance = new Date();
    
    // Schedule next maintenance (6 months default)
    const nextMaintenance = new Date();
    nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
    this.next_maintenance = nextMaintenance;
    
    if (notes) {
      this.maintenance_notes = notes;
    }
    
    return this.save();
  };
  
  MedicalDevice.prototype.assignToPatient = function(patientId: any, assignedBy: any, assignerType: any) {
    this.patient_id = patientId;
    this.assigned_date = new Date();
    
    if (assignerType === 'doctor') {
      this.assigned_by_doctor_id = assignedBy;
    } else if (assignerType === 'hsp') {
      this.assigned_by_hsp_id = assignedBy;
    }
    
    return this.save();
  };
  
  MedicalDevice.prototype.unassignFromPatient = function() {
    this.patient_id = null;
    this.assigned_date = null;
    this.status = 'inactive';
    
    return this.save();
  };
  
  MedicalDevice.prototype.isMaintenanceDue = function(days = 0) {
    if (!this.next_maintenance) return false;
    
    const dueDate = new Date(this.next_maintenance.getTime() - (days * 24 * 60 * 60 * 1000));
    return new Date() >= dueDate;
  };
  
  MedicalDevice.prototype.getDaysUntilMaintenance = function() {
    if (!this.next_maintenance) return null;
    
    const now = new Date();
    const maintenance = new Date(this.next_maintenance);
    const diffTime = maintenance.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  MedicalDevice.prototype.getAssignedBy = async function() {
    if (this.assigned_by_doctor_id) {
      return await sequelize.models.Doctor.findByPk(this.assigned_by_doctor_id);
    } else if (this.assigned_by_hsp_id) {
      return await sequelize.models.HSP.findByPk(this.assigned_by_hsp_id);
    }
    return null;
  };
  
  return MedicalDevice;
};