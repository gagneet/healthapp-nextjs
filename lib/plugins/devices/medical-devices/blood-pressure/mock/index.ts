/**
 * Mock Blood Pressure Device Plugin
 * 
 * Simulates blood pressure monitoring devices for development and testing
 */

import { 
  DevicePlugin,
  PluginConfig,
  PluginMetadata,
  DeviceConnection,
  DeviceConnectionConfig,
  VitalData,
  ValidationResult,
  ReadDataOptions,
  HistoricalDataOptions,
  SyncResult,
  BulkSyncResult,
  ConfigValidationResult,
  PluginError,
  ApiRoute,
  DeviceCapability
} from '../../../core/DevicePlugin.interface';

import { DataTransformer, validateVitalData } from '../../../core/DataTransformer';

interface MockDeviceState {
  deviceId: string;
  isConnected: boolean;
  batteryLevel: number;
  lastReading?: VitalData;
  readingHistory: VitalData[];
  errorSimulation?: boolean;
}

export default class MockBloodPressurePlugin implements DevicePlugin {
  public metadata: PluginMetadata = {
    id: 'mock-bp',
    name: 'Mock Blood Pressure Monitor',
    version: '1.0.0',
    description: 'Mock plugin for simulating blood pressure monitoring devices',
    author: 'Healthcare Platform Development Team',
    homepage: 'https://healthapp.local/plugins/mock-bp',
    repository: 'https://github.com/healthapp/plugins-mock-bp',
    supportedDevices: ['BLOOD_PRESSURE'],
    supportedRegions: ['global'],
    capabilities: {
      readingTypes: ['blood_pressure'],
      supportsRealtime: true,
      supportsHistorical: true,
      supportsBulkSync: true,
      maxHistoryDays: 30,
      minSyncInterval: 5000, // 5 seconds for testing
    },
    dependencies: [],
    minPlatformVersion: '1.0.0',
  };

  private config?: PluginConfig;
  private devices: Map<string, MockDeviceState> = new Map();
  private isInitialized = false;

  /**
   * Initialize the plugin
   */
  async initialize(config: PluginConfig): Promise<void> {
    console.log('Initializing Mock Blood Pressure Plugin...');
    
    this.config = config;
    this.isInitialized = true;
    
    // Initialize some mock devices for testing
    if (config.features?.mockData) {
      await this.initializeMockDevices();
    }
    
    console.log('Mock Blood Pressure Plugin initialized successfully');
  }

  /**
   * Cleanup plugin resources
   */
  async destroy(): Promise<void> {
    console.log('Destroying Mock Blood Pressure Plugin...');
    
    this.devices.clear();
    this.isInitialized = false;
    
    console.log('Mock Blood Pressure Plugin destroyed');
  }

  /**
   * Discover available devices
   */
  async discoverDevices(): Promise<DeviceConnection[]> {
    if (!this.isInitialized) {
      throw new Error('Plugin not initialized');
    }

    // Simulate device discovery
    const mockDevices: DeviceConnection[] = [
      {
        deviceId: 'mock-bp-001',
        isConnected: false,
        lastSync: null,
        batteryLevel: 85,
        signalStrength: 95,
        firmwareVersion: '1.2.3',
        status: 'disconnected',
      },
      {
        deviceId: 'mock-bp-002',
        isConnected: false,
        lastSync: null,
        batteryLevel: 62,
        signalStrength: 88,
        firmwareVersion: '1.2.1',
        status: 'disconnected',
      },
    ];

    return mockDevices;
  }

  /**
   * Connect to a device
   */
  async connect(config: DeviceConnectionConfig): Promise<DeviceConnection> {
    if (!this.isInitialized) {
      throw new Error('Plugin not initialized');
    }

    const { deviceId, connectionParams } = config;
    
    // Simulate connection process
    await this.simulateDelay(1000, 3000);
    
    // Check for simulated connection errors
    if (connectionParams.simulateError) {
      throw new Error(`Failed to connect to device ${deviceId}: Simulated connection error`);
    }

    const deviceState: MockDeviceState = {
      deviceId,
      isConnected: true,
      batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
      readingHistory: [],
    };

    this.devices.set(deviceId, deviceState);

    const connection: DeviceConnection = {
      deviceId,
      isConnected: true,
      lastSync: new Date(),
      batteryLevel: deviceState.batteryLevel,
      signalStrength: Math.floor(Math.random() * 20) + 80, // 80-100%
      firmwareVersion: '1.2.3',
      status: 'connected',
    };

    console.log(`Connected to mock device: ${deviceId}`);
    return connection;
  }

  /**
   * Disconnect from a device
   */
  async disconnect(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      console.log(`Disconnected from mock device: ${deviceId}`);
    }
  }

  /**
   * Get device connection status
   */
  async getConnectionStatus(deviceId: string): Promise<DeviceConnection> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    return {
      deviceId,
      isConnected: device.isConnected,
      lastSync: device.lastReading ? device.lastReading.timestamp : null,
      batteryLevel: device.batteryLevel,
      signalStrength: Math.floor(Math.random() * 20) + 80,
      firmwareVersion: '1.2.3',
      status: device.isConnected ? 'connected' : 'disconnected',
    };
  }

  /**
   * Read current data from device
   */
  async readData(deviceId: string, options?: ReadDataOptions): Promise<VitalData[]> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    // Simulate reading delay
    await this.simulateDelay(500, 2000);

    // Generate mock blood pressure reading
    const reading = this.generateMockReading(deviceId);
    
    // Store in device history
    device.readingHistory.push(reading);
    device.lastReading = reading;
    
    // Keep only last 100 readings
    if (device.readingHistory.length > 100) {
      device.readingHistory = device.readingHistory.slice(-100);
    }

    return [reading];
  }

  /**
   * Read historical data from device
   */
  async readHistoricalData(deviceId: string, options: HistoricalDataOptions): Promise<VitalData[]> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const { startDate, endDate, limit = 100 } = options;
    
    // Generate mock historical data
    const readings: VitalData[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const readingsPerDay = Math.min(3, Math.floor(limit / daysDiff) || 1);
    
    for (let day = 0; day < daysDiff && readings.length < limit; day++) {
      for (let reading = 0; reading < readingsPerDay && readings.length < limit; reading++) {
        const timestamp = new Date(startDate.getTime() + (day * 24 * 60 * 60 * 1000) + (reading * 8 * 60 * 60 * 1000));
        const mockReading = this.generateMockReading(deviceId, timestamp);
        readings.push(mockReading);
      }
    }

    return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Transform raw device data to standard format
   */
  transformData(rawData: any, deviceType: string): VitalData {
    const transformationRules = [
      { sourceField: 'systolic', targetField: 'primaryValue', required: true },
      { sourceField: 'diastolic', targetField: 'secondaryValue', required: true },
      { sourceField: 'pulse', targetField: 'heartRate' },
      { sourceField: 'timestamp', targetField: 'timestamp' },
      { sourceField: 'unit', targetField: 'unit' },
      { sourceField: 'context', targetField: 'context' },
    ];

    return DataTransformer.transformToVitalData(rawData, deviceType, transformationRules);
  }

  /**
   * Validate vital data
   */
  validateData(data: VitalData): ValidationResult {
    return validateVitalData(data, 'adult');
  }

  /**
   * Sync device data
   */
  async syncDevice(deviceId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const device = this.devices.get(deviceId);
    
    if (!device || !device.isConnected) {
      return {
        deviceId,
        success: false,
        recordsSynced: 0,
        errors: [`Device ${deviceId} not connected`],
        syncDuration: Date.now() - startTime,
        lastSyncTime: new Date(),
      };
    }

    try {
      // Simulate sync process
      await this.simulateDelay(1000, 3000);
      
      // Generate some readings during sync
      const syncedReadings = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < syncedReadings; i++) {
        const reading = this.generateMockReading(deviceId);
        device.readingHistory.push(reading);
      }

      return {
        deviceId,
        success: true,
        recordsSynced: syncedReadings,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTime: new Date(),
      };
    } catch (error) {
      return {
        deviceId,
        success: false,
        recordsSynced: 0,
        errors: [error.message],
        syncDuration: Date.now() - startTime,
        lastSyncTime: new Date(),
      };
    }
  }

  /**
   * Bulk sync multiple devices
   */
  async bulkSync(deviceIds: string[]): Promise<BulkSyncResult> {
    const startTime = Date.now();
    const results: SyncResult[] = [];
    
    for (const deviceId of deviceIds) {
      const result = await this.syncDevice(deviceId);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + r.recordsSynced, 0);

    return {
      totalDevices: deviceIds.length,
      successCount,
      failedCount: deviceIds.length - successCount,
      results,
      totalRecords,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Get default plugin configuration
   */
  getDefaultConfig(): Partial<PluginConfig> {
    return {
      environment: 'development',
      features: {
        mockData: true,
        realTimeSync: false,
        simulateErrors: false,
      },
    };
  }

  /**
   * Validate plugin configuration
   */
  validateConfig(config: PluginConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.environment) {
      errors.push('Environment is required');
    }

    if (!config.features) {
      warnings.push('No features specified, using defaults');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedConfig: config,
    };
  }

  /**
   * Register API routes
   */
  registerRoutes(): ApiRoute[] {
    return [
      {
        method: 'GET',
        path: '/mock-bp/devices',
        handler: 'getDevices',
        requiresAuth: true,
        allowedRoles: ['DOCTOR', 'HSP', 'PATIENT'],
      },
      {
        method: 'POST',
        path: '/mock-bp/simulate-reading',
        handler: 'simulateReading',
        requiresAuth: true,
        allowedRoles: ['DOCTOR', 'HSP'],
      },
    ];
  }

  // Private helper methods

  private async initializeMockDevices(): Promise<void> {
    const mockDevices = ['mock-bp-001', 'mock-bp-002'];
    
    for (const deviceId of mockDevices) {
      const deviceState: MockDeviceState = {
        deviceId,
        isConnected: false,
        batteryLevel: Math.floor(Math.random() * 40) + 60,
        readingHistory: [],
      };
      
      this.devices.set(deviceId, deviceState);
    }
  }

  private generateMockReading(deviceId: string, timestamp?: Date): VitalData {
    const now = timestamp || new Date();
    
    // Generate realistic blood pressure values
    const baseSystolic = 120 + (Math.random() - 0.5) * 40; // 100-140
    const baseDiastolic = 80 + (Math.random() - 0.5) * 20;  // 70-90
    
    // Add some variation to make it more realistic
    const systolic = Math.round(baseSystolic + (Math.random() - 0.5) * 10);
    const diastolic = Math.round(baseDiastolic + (Math.random() - 0.5) * 8);
    
    // Generate context randomly
    const contexts = [
      { patientCondition: 'resting', medicationTaken: false, symptoms: [] },
      { patientCondition: 'after_exercise', medicationTaken: false, symptoms: ['elevated_heart_rate'] },
      { patientCondition: 'morning', medicationTaken: true, symptoms: [] },
      { patientCondition: 'evening', medicationTaken: false, symptoms: ['stress'] },
    ];
    
    const randomContext = contexts[Math.floor(Math.random() * contexts.length)];

    const rawData = {
      deviceId,
      systolic,
      diastolic,
      pulse: Math.floor(Math.random() * 30) + 60, // 60-90 BPM
      timestamp: now,
      unit: 'mmHg',
      context: randomContext,
      batteryLevel: this.devices.get(deviceId)?.batteryLevel,
      deviceModel: 'Mock BP Monitor 3000',
    };

    return this.transformData(rawData, 'BLOOD_PRESSURE');
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}