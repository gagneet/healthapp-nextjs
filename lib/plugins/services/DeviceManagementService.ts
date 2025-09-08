/**
 * Device Management Service
 * 
 * Handles device registration, connection management, and data synchronization
 * Integrates with the plugin system and database
 */

import { EventEmitter } from 'events';
import { getPluginRegistry } from '@/lib/plugins/core/PluginRegistry';
import { 
  DevicePlugin, 
  DeviceConnection, 
  VitalData, 
  SyncResult,
  PluginError 
} from '@/lib/plugins/core/DevicePlugin.interface';
import { validateVitalData } from '@/lib/plugins/core/DataTransformer';
import { PrismaClient } from '@/prisma/generated/prisma';

export interface DeviceRegistration {
  id: string;
  patientId: string;
  pluginId: string;
  deviceName: string;
  deviceType: string;
  deviceIdentifier: string;
  connectionType: string;
  connectionConfig: Record<string, any>;
  isActive: boolean;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceDataSyncOptions {
  deviceId?: string;
  patientId?: string;
  pluginIds?: string[];
  includeHistorical?: boolean;
  historicalDays?: number;
  batchSize?: number;
}

export interface SyncReport {
  startTime: Date;
  endTime: Date;
  devicesSynced: number;
  recordsProcessed: number;
  errors: Array<{
    deviceId: string;
    pluginId: string;
    error: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  warnings: string[];
}

export class DeviceManagementService extends EventEmitter {
  private prisma: PrismaClient;
  private syncInProgress = new Set<string>();
  
  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.setupEventHandlers();
  }

  /**
   * Register a new device for a patient
   */
  async registerDevice(registration: Omit<DeviceRegistration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log(`Registering device ${registration.deviceName} for patient ${registration.patientId}`);
    
    try {
      // Validate plugin compatibility
      const registry = getPluginRegistry();
      const plugin = registry.getPlugin(registration.pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${registration.pluginId} not found or not loaded`);
      }

      // Validate device type support
      if (!plugin.metadata.supportedDevices.includes(registration.deviceType as any)) {
        throw new Error(`Plugin ${registration.pluginId} does not support device type ${registration.deviceType}`);
      }

      // Create device record in database
      const device = await this.prisma.connectedDevice.create({
        data: {
          device_id: registration.deviceIdentifier,
          patientId: registration.patientId,
          deviceType: registration.deviceType as any,
          device_name: registration.deviceName,
          manufacturer: 'Unknown',
          connection_type: registration.connectionType as any,
          deviceStatus: 'OFFLINE',
          isActive: registration.isActive,
          configuration: registration.connectionConfig,
        },
      });

      const deviceId = device.id;

      this.emit('device:registered', {
        deviceId,
        patientId: registration.patientId,
        pluginId: registration.pluginId,
        deviceType: registration.deviceType,
      });

      console.log(`Device ${registration.deviceName} registered with ID: ${deviceId}`);
      return deviceId;
      
    } catch (error) {
      console.error('Device registration failed:', error);
      this.emit('device:registration_failed', {
        patientId: registration.patientId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Connect to a registered device
   */
  async connectDevice(deviceId: string, connectionParams: Record<string, any> = {}): Promise<DeviceConnection> {
    console.log(`Connecting to device ${deviceId}`);
    
    try {
      // Get device info from database
      const deviceRecord = await this.prisma.connectedDevice.findUnique({
        where: { id: deviceId },
      });

      if (!deviceRecord) {
        throw new Error(`Device ${deviceId} not found`);
      }

      const pluginId = this.determinePluginId(deviceRecord.deviceType);
      const deviceInfo = {
        id: deviceRecord.id,
        pluginId,
        deviceIdentifier: deviceRecord.device_id,
        connectionConfig: deviceRecord.configuration as Record<string, any> || {},
      };

      const registry = getPluginRegistry();
      const plugin = registry.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not available`);
      }

      // Attempt connection
      const connection = await plugin.connect({
        deviceId: deviceInfo.deviceIdentifier,
        connectionParams: {
          ...deviceInfo.connectionConfig,
          ...connectionParams,
        },
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
      });

      // Update device status in database
      await this.prisma.connectedDevice.update({
        where: { id: deviceId },
        data: {
          deviceStatus: 'ONLINE',
          last_sync: new Date(),
        },
      });

      this.emit('device:connected', {
        deviceId,
        pluginId,
        connection,
      });

      console.log(`Successfully connected to device ${deviceId}`);
      return connection;
      
    } catch (error) {
      console.error(`Device connection failed for ${deviceId}:`, error);
      
      // Update error status in database
      /*
      await this.prisma.connectedDevice.update({
        where: { id: deviceId },
        data: {
          connectionStatus: 'ERROR',
          syncErrorCount: { increment: 1 },
        },
      });
      */

      this.emit('device:connection_failed', {
        deviceId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Disconnect from a device
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    console.log(`Disconnecting device ${deviceId}`);
    
    try {
      // TODO: Get device info from database
      const deviceRecord = { id: deviceId, pluginId: 'mock-bp', deviceIdentifier: `mock-device-${deviceId}` };

      if (!deviceRecord) {
        throw new Error(`Device ${deviceId} not found`);
      }

      const registry = getPluginRegistry();
      const plugin = registry.getPlugin(deviceRecord.pluginId);
      if (plugin) {
        await plugin.disconnect(deviceRecord.deviceIdentifier);
      }

      // Update device status in database
      /*
      await this.prisma.connectedDevice.update({
        where: { id: deviceId },
        data: {
          connectionStatus: 'DISCONNECTED',
        },
      });
      */

      this.emit('device:disconnected', { deviceId });
      console.log(`Device ${deviceId} disconnected successfully`);
      
    } catch (error) {
      console.error(`Device disconnection failed for ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Sync data from devices
   */
  async syncDevices(options: DeviceDataSyncOptions = {}): Promise<SyncReport> {
    const startTime = new Date();
    const report: SyncReport = {
      startTime,
      endTime: new Date(),
      devicesSynced: 0,
      recordsProcessed: 0,
      errors: [],
      warnings: [],
    };

    console.log('Starting device data synchronization...');

    try {
      // Get devices to sync
      const devicesToSync = await this.getDevicesForSync(options);
      console.log(`Found ${devicesToSync.length} devices to sync`);

      const registry = getPluginRegistry();

      // Sync each device
      for (const deviceRecord of devicesToSync) {
        if (this.syncInProgress.has(deviceRecord.id)) {
          report.warnings.push(`Sync already in progress for device ${deviceRecord.id}`);
          continue;
        }

        this.syncInProgress.add(deviceRecord.id);

        try {
          const plugin = registry.getPlugin(deviceRecord.pluginId);
          if (!plugin) {
            report.errors.push({
              deviceId: deviceRecord.id,
              pluginId: deviceRecord.pluginId,
              error: `Plugin ${deviceRecord.pluginId} not available`,
              severity: 'high',
            });
            continue;
          }

          // Perform sync
          const syncResult = await plugin.syncDevice(deviceRecord.deviceIdentifier);
          
          if (syncResult.success) {
            report.devicesSynced++;
            report.recordsProcessed += syncResult.recordsSynced;

            // Process and store readings
            if (options.includeHistorical) {
              await this.syncHistoricalData(deviceRecord, plugin, options.historicalDays || 7);
            }

            // Update sync status in database
            /*
            await this.prisma.connectedDevice.update({
              where: { id: deviceRecord.id },
              data: {
                lastSync: new Date(),
                syncErrorCount: 0,
              },
            });
            */

            this.emit('device:sync_success', {
              deviceId: deviceRecord.id,
              recordsSynced: syncResult.recordsSynced,
            });
          } else {
            report.errors.push({
              deviceId: deviceRecord.id,
              pluginId: deviceRecord.pluginId,
              error: syncResult.errors.join(', '),
              severity: 'medium',
            });

            this.emit('device:sync_failed', {
              deviceId: deviceRecord.id,
              errors: syncResult.errors,
            });
          }

        } catch (error) {
          report.errors.push({
            deviceId: deviceRecord.id,
            pluginId: deviceRecord.pluginId,
            error: error.message,
            severity: 'high',
          });

          console.error(`Sync failed for device ${deviceRecord.id}:`, error);
        } finally {
          this.syncInProgress.delete(deviceRecord.id);
        }
      }

      report.endTime = new Date();
      console.log(`Sync completed: ${report.devicesSynced}/${devicesToSync.length} devices, ${report.recordsProcessed} records processed`);

      this.emit('sync:completed', report);
      return report;

    } catch (error) {
      console.error('Device sync failed:', error);
      report.endTime = new Date();
      report.errors.push({
        deviceId: 'N/A',
        pluginId: 'N/A',
        error: `Sync process failed: ${error.message}`,
        severity: 'critical',
      });

      this.emit('sync:failed', report);
      return report;
    }
  }

  /**
   * Process and store vital data reading
   */
  async processVitalData(deviceId: string, pluginId: string, vitalData: VitalData): Promise<void> {
    try {
      // Validate the data
      const validation = validateVitalData(vitalData, 'adult');
      
      if (!validation.isValid && validation.errors.length > 0) {
        console.warn(`Invalid vital data for device ${deviceId}:`, validation.errors);
      }

      // TODO: Store in database using Prisma
      /*
      const deviceReading = await this.prisma.deviceReading.create({
        data: {
          deviceId,
          pluginId,
          readingType: vitalData.readingType,
          measurementTimestamp: vitalData.timestamp,
          rawData: vitalData.rawData,
          processedValues: {
            primary: vitalData.primaryValue,
            secondary: vitalData.secondaryValue,
            unit: vitalData.unit,
          },
          primaryValue: vitalData.primaryValue,
          secondaryValue: vitalData.secondaryValue,
          measurementUnit: vitalData.unit,
          dataQualityScore: vitalData.quality?.score,
          isValidated: validation.isValid,
          validationNotes: validation.errors.join('; '),
          readingContext: vitalData.context?.patientCondition,
          symptomsReported: vitalData.context?.symptoms || [],
          medicationTaken: vitalData.context?.medicationTaken,
        },
      });
      */

      // Check for alert conditions
      await this.checkAlertConditions(deviceId, vitalData);

      this.emit('vital_data:processed', {
        deviceId,
        pluginId,
        readingType: vitalData.readingType,
        value: vitalData.primaryValue,
        isValid: validation.isValid,
      });

    } catch (error) {
      console.error(`Failed to process vital data for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get device status and health
   */
  async getDeviceStatus(deviceId: string): Promise<any> {
    // TODO: Implement database query
    /*
    const device = await this.prisma.connectedDevice.findUnique({
      where: { id: deviceId },
      include: {
        readings: {
          orderBy: { measurementTimestamp: 'desc' },
          take: 1,
        },
      },
    });
    */

    // Mock response for now
    return {
      id: deviceId,
      connectionStatus: 'CONNECTED',
      lastSync: new Date(),
      batteryLevel: 85,
      signalStrength: 92,
    };
  }

  // Private helper methods

  private async getDevicesForSync(options: DeviceDataSyncOptions): Promise<any[]> {
    // TODO: Implement database query with filters
    /*
    return await this.prisma.connectedDevice.findMany({
      where: {
        ...(options.deviceId && { id: options.deviceId }),
        ...(options.patientId && { patientId: options.patientId }),
        ...(options.pluginIds && { pluginId: { in: options.pluginIds } }),
        isActive: true,
        autoSyncEnabled: true,
      },
    });
    */

    // Mock data for now
    return [
      {
        id: 'device-001',
        pluginId: 'mock-bp',
        deviceIdentifier: 'mock-bp-001',
        patientId: 'patient-001',
      },
      {
        id: 'device-002',
        pluginId: 'mock-glucose',
        deviceIdentifier: 'mock-glucose-001',
        patientId: 'patient-001',
      },
    ];
  }

  private async syncHistoricalData(deviceRecord: any, plugin: DevicePlugin, days: number): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const historicalData = await plugin.readHistoricalData(deviceRecord.deviceIdentifier, {
        startDate,
        endDate,
        limit: 500, // Reasonable batch size
      });

      for (const vitalData of historicalData) {
        await this.processVitalData(deviceRecord.id, deviceRecord.pluginId, vitalData);
      }

      console.log(`Synced ${historicalData.length} historical records for device ${deviceRecord.id}`);

    } catch (error) {
      console.error(`Historical sync failed for device ${deviceRecord.id}:`, error);
    }
  }

  private async checkAlertConditions(deviceId: string, vitalData: VitalData): Promise<void> {
    // TODO: Implement alert rule checking against database
    // This would check VitalAlertRule records and trigger alerts if conditions are met
    
    // For now, just check for critical values
    if (vitalData.readingType === 'blood_pressure') {
      if (vitalData.primaryValue > 180 || (vitalData.secondaryValue && vitalData.secondaryValue > 120)) {
        this.emit('vital_alert:critical', {
          deviceId,
          readingType: vitalData.readingType,
          values: { systolic: vitalData.primaryValue, diastolic: vitalData.secondaryValue },
          severity: 'CRITICAL',
          message: 'Hypertensive crisis detected',
        });
      }
    } else if (vitalData.readingType === 'blood_glucose') {
      if (vitalData.primaryValue < 70 || vitalData.primaryValue > 250) {
        this.emit('vital_alert:critical', {
          deviceId,
          readingType: vitalData.readingType,
          value: vitalData.primaryValue,
          severity: vitalData.primaryValue < 70 ? 'CRITICAL' : 'HIGH',
          message: vitalData.primaryValue < 70 ? 'Hypoglycemia detected' : 'Severe hyperglycemia detected',
        });
      }
    }
  }

  private setupEventHandlers(): void {
    this.on('vital_alert:critical', (alert) => {
      console.log(`🚨 CRITICAL ALERT: ${alert.message} for device ${alert.deviceId}`);
      // TODO: Integrate with emergency alert system
    });

    this.on('device:sync_failed', (event) => {
      console.warn(`⚠️ Sync failed for device ${event.deviceId}: ${event.errors.join(', ')}`);
    });
  }

  /**
   * Determine plugin ID based on device type
   */
  private determinePluginId(deviceType: string): string {
    const deviceTypeMap: Record<string, string> = {
      'BLOOD_PRESSURE_MONITOR': 'mock-bp',
      'GLUCOSE_METER': 'mock-glucose',
      'HEART_RATE_MONITOR': 'mock-hr',
      'PULSE_OXIMETER': 'mock-oximeter',
      'WEIGHT_SCALE': 'mock-weight',
      'THERMOMETER': 'mock-temp',
      'PEAK_FLOW_METER': 'mock-peak-flow',
      'ECG_MONITOR': 'mock-ecg',
    };
    
    return deviceTypeMap[deviceType] || 'mock-generic';
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Device Management Service...');
    await this.prisma.$disconnect();
    this.removeAllListeners();
  }
}