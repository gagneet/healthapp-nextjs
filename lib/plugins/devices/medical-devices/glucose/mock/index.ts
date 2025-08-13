/**
 * Mock Glucose Meter Device Plugin
 * 
 * Simulates glucose monitoring devices for development and testing
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

interface MockGlucoseState {
  deviceId: string;
  isConnected: boolean;
  batteryLevel: number;
  testStripCount: number;
  lastReading?: VitalData;
  readingHistory: VitalData[];
  patientProfile: {
    isType1Diabetic: boolean;
    isType2Diabetic: boolean;
    targetRange: { min: number; max: number };
  };
}

export default class MockGlucoseMeterPlugin implements DevicePlugin {
  public metadata: PluginMetadata = {
    id: 'mock-glucose',
    name: 'Mock Glucose Meter',
    version: '1.0.0',
    description: 'Mock plugin for simulating glucose monitoring devices',
    author: 'Healthcare Platform Development Team',
    homepage: 'https://healthapp.local/plugins/mock-glucose',
    repository: 'https://github.com/healthapp/plugins-mock-glucose',
    supportedDevices: ['GLUCOSE_METER'],
    supportedRegions: ['global'],
    capabilities: {
      readingTypes: ['blood_glucose'],
      supportsRealtime: true,
      supportsHistorical: true,
      supportsBulkSync: true,
      maxHistoryDays: 90, // Glucose meters typically store more data
      minSyncInterval: 10000, // 10 seconds for testing
    },
    dependencies: [],
    minPlatformVersion: '1.0.0',
  };

  private config?: PluginConfig;
  private devices: Map<string, MockGlucoseState> = new Map();
  private isInitialized = false;

  /**
   * Initialize the plugin
   */
  async initialize(config: PluginConfig): Promise<void> {
    console.log('Initializing Mock Glucose Meter Plugin...');
    
    this.config = config;
    this.isInitialized = true;
    
    // Initialize some mock devices for testing
    if (config.features?.mockData) {
      await this.initializeMockDevices();
    }
    
    console.log('Mock Glucose Meter Plugin initialized successfully');
  }

  /**
   * Cleanup plugin resources
   */
  async destroy(): Promise<void> {
    console.log('Destroying Mock Glucose Meter Plugin...');
    
    this.devices.clear();
    this.isInitialized = false;
    
    console.log('Mock Glucose Meter Plugin destroyed');
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
        deviceId: 'mock-glucose-001',
        isConnected: false,
        lastSync: null,
        batteryLevel: 78,
        signalStrength: 92,
        firmwareVersion: '2.1.0',
        status: 'disconnected',
      },
      {
        deviceId: 'mock-glucose-002',
        isConnected: false,
        lastSync: null,
        batteryLevel: 45,
        signalStrength: 85,
        firmwareVersion: '2.0.3',
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
    await this.simulateDelay(1500, 4000);
    
    // Check for simulated connection errors
    if (connectionParams.simulateError) {
      throw new Error(`Failed to connect to glucose meter ${deviceId}: Simulated connection error`);
    }

    const deviceState: MockGlucoseState = {
      deviceId,
      isConnected: true,
      batteryLevel: Math.floor(Math.random() * 40) + 50, // 50-90%
      testStripCount: Math.floor(Math.random() * 40) + 10, // 10-50 strips
      readingHistory: [],
      patientProfile: {
        isType1Diabetic: Math.random() > 0.7,
        isType2Diabetic: Math.random() > 0.5,
        targetRange: { min: 80, max: 180 }, // mg/dL
      },
    };

    this.devices.set(deviceId, deviceState);

    const connection: DeviceConnection = {
      deviceId,
      isConnected: true,
      lastSync: new Date(),
      batteryLevel: deviceState.batteryLevel,
      signalStrength: Math.floor(Math.random() * 15) + 85, // 85-100%
      firmwareVersion: '2.1.0',
      status: 'connected',
    };

    console.log(`Connected to mock glucose meter: ${deviceId}`);
    return connection;
  }

  /**
   * Disconnect from a device
   */
  async disconnect(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      console.log(`Disconnected from mock glucose meter: ${deviceId}`);
    }
  }

  /**
   * Get device connection status
   */
  async getConnectionStatus(deviceId: string): Promise<DeviceConnection> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Glucose meter ${deviceId} not found`);
    }

    return {
      deviceId,
      isConnected: device.isConnected,
      lastSync: device.lastReading ? device.lastReading.timestamp : null,
      batteryLevel: device.batteryLevel,
      signalStrength: Math.floor(Math.random() * 15) + 85,
      firmwareVersion: '2.1.0',
      status: device.isConnected ? 'connected' : 'disconnected',
    };
  }

  /**
   * Read current data from device
   */
  async readData(deviceId: string, options?: ReadDataOptions): Promise<VitalData[]> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      throw new Error(`Glucose meter ${deviceId} not connected`);
    }

    // Check test strip availability
    if (device.testStripCount <= 0) {
      throw new Error(`No test strips available in device ${deviceId}`);
    }

    // Simulate reading delay (glucose meters take time to process)
    await this.simulateDelay(8000, 15000); // 8-15 seconds like real devices

    // Generate mock glucose reading
    const reading = this.generateMockReading(deviceId);
    
    // Consume a test strip
    device.testStripCount--;
    
    // Store in device history
    device.readingHistory.push(reading);
    device.lastReading = reading;
    
    // Keep only last 200 readings (glucose meters typically store more)
    if (device.readingHistory.length > 200) {
      device.readingHistory = device.readingHistory.slice(-200);
    }

    return [reading];
  }

  /**
   * Read historical data from device
   */
  async readHistoricalData(deviceId: string, options: HistoricalDataOptions): Promise<VitalData[]> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Glucose meter ${deviceId} not found`);
    }

    const { startDate, endDate, limit = 200 } = options;
    
    // Generate mock historical data with realistic patterns
    const readings: VitalData[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const readingsPerDay = Math.min(6, Math.floor(limit / daysDiff) || 1); // Typically 4-6 readings per day
    
    for (let day = 0; day < daysDiff && readings.length < limit; day++) {
      // Generate readings at typical times: before meals and bedtime
      const readingTimes = [
        { hour: 7, minute: 0, context: 'fasting' },     // Fasting morning
        { hour: 11, minute: 30, context: 'pre_meal' },  // Before lunch
        { hour: 14, minute: 0, context: 'post_meal' },  // After lunch
        { hour: 18, minute: 30, context: 'pre_meal' },  // Before dinner
        { hour: 21, minute: 0, context: 'post_meal' },  // After dinner
        { hour: 22, minute: 30, context: 'bedtime' },   // Bedtime
      ].slice(0, readingsPerDay);

      for (const timeConfig of readingTimes) {
        if (readings.length >= limit) break;
        
        const timestamp = new Date(startDate);
        timestamp.setDate(timestamp.getDate() + day);
        timestamp.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
        
        const mockReading = this.generateMockReading(deviceId, timestamp, timeConfig.context);
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
      { 
        sourceField: 'glucose', 
        targetField: 'primaryValue', 
        required: true,
        transform: (value: number) => Math.round(value * 10) / 10, // Round to 1 decimal
      },
      { sourceField: 'timestamp', targetField: 'timestamp' },
      { 
        sourceField: 'unit', 
        targetField: 'unit',
        transform: (unit: string) => unit || 'mg/dL',
      },
      { sourceField: 'context', targetField: 'context' },
      { sourceField: 'ketones', targetField: 'ketones' },
      { sourceField: 'testStripLot', targetField: 'testStripLot' },
    ];

    return DataTransformer.transformToVitalData(rawData, deviceType, transformationRules);
  }

  /**
   * Validate vital data
   */
  validateData(data: VitalData): ValidationResult {
    const result = validateVitalData(data, 'adult');
    
    // Additional glucose-specific validation
    if (data.primaryValue < 20 || data.primaryValue > 600) {
      result.errors.push('Glucose reading outside measurable range (20-600 mg/dL)');
      result.isValid = false;
    }
    
    if (data.primaryValue < 70) {
      result.warnings.push('Hypoglycemia detected - glucose below 70 mg/dL');
    } else if (data.primaryValue > 250) {
      result.warnings.push('Severe hyperglycemia detected - glucose above 250 mg/dL');
    }

    return result;
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
        errors: [`Glucose meter ${deviceId} not connected`],
        syncDuration: Date.now() - startTime,
        lastSyncTime: new Date(),
      };
    }

    try {
      // Simulate sync process (glucose meters are slower to sync)
      await this.simulateDelay(2000, 5000);
      
      // Generate some readings during sync
      const syncedReadings = Math.floor(Math.random() * 3) + 1; // 1-3 readings
      for (let i = 0; i < syncedReadings && device.testStripCount > 0; i++) {
        const reading = this.generateMockReading(deviceId);
        device.readingHistory.push(reading);
        device.testStripCount--;
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
        ketonesSupport: true,
        alternativeSitesTesting: false,
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
        path: '/mock-glucose/devices',
        handler: 'getDevices',
        requiresAuth: true,
        allowedRoles: ['DOCTOR', 'HSP', 'PATIENT'],
      },
      {
        method: 'POST',
        path: '/mock-glucose/simulate-reading',
        handler: 'simulateReading',
        requiresAuth: true,
        allowedRoles: ['DOCTOR', 'HSP'],
      },
      {
        method: 'GET',
        path: '/mock-glucose/strip-count/:deviceId',
        handler: 'getStripCount',
        requiresAuth: true,
        allowedRoles: ['DOCTOR', 'HSP', 'PATIENT'],
      },
    ];
  }

  // Private helper methods

  private async initializeMockDevices(): Promise<void> {
    const mockDevices = ['mock-glucose-001', 'mock-glucose-002'];
    
    for (const deviceId of mockDevices) {
      const deviceState: MockGlucoseState = {
        deviceId,
        isConnected: false,
        batteryLevel: Math.floor(Math.random() * 40) + 50,
        testStripCount: Math.floor(Math.random() * 40) + 10,
        readingHistory: [],
        patientProfile: {
          isType1Diabetic: Math.random() > 0.7,
          isType2Diabetic: Math.random() > 0.5,
          targetRange: { min: 80, max: 180 },
        },
      };
      
      this.devices.set(deviceId, deviceState);
    }
  }

  private generateMockReading(deviceId: string, timestamp?: Date, context?: string): VitalData {
    const now = timestamp || new Date();
    const device = this.devices.get(deviceId)!;
    
    // Generate realistic glucose values based on context and patient profile
    let baseGlucose: number;
    let glucoseContext: string;
    let medicationTaken = false;
    const symptoms: string[] = [];

    // Determine context and base glucose level
    if (context) {
      glucoseContext = context;
    } else {
      const hour = now.getHours();
      if (hour >= 6 && hour <= 8) {
        glucoseContext = 'fasting';
      } else if (hour >= 11 && hour <= 13) {
        glucoseContext = 'pre_meal';
      } else if (hour >= 13 && hour <= 15) {
        glucoseContext = 'post_meal';
      } else if (hour >= 17 && hour <= 19) {
        glucoseContext = 'pre_meal';
      } else if (hour >= 19 && hour <= 21) {
        glucoseContext = 'post_meal';
      } else {
        glucoseContext = 'random';
      }
    }

    // Set base glucose based on context
    switch (glucoseContext) {
      case 'fasting':
        baseGlucose = device.patientProfile.isType1Diabetic ? 
          120 + (Math.random() - 0.5) * 60 : // 90-150
          100 + (Math.random() - 0.5) * 40;  // 80-120
        break;
      case 'pre_meal':
        baseGlucose = device.patientProfile.isType1Diabetic ?
          140 + (Math.random() - 0.5) * 80 : // 100-180
          110 + (Math.random() - 0.5) * 50;  // 85-135
        break;
      case 'post_meal':
        baseGlucose = device.patientProfile.isType1Diabetic ?
          200 + (Math.random() - 0.5) * 120 : // 140-260
          150 + (Math.random() - 0.5) * 80;   // 110-190
        break;
      case 'bedtime':
        baseGlucose = device.patientProfile.isType1Diabetic ?
          130 + (Math.random() - 0.5) * 70 : // 95-165
          105 + (Math.random() - 0.5) * 40;  // 85-125
        break;
      default:
        baseGlucose = 120 + (Math.random() - 0.5) * 80; // 80-160
    }

    // Add diabetes-related variations
    if (device.patientProfile.isType1Diabetic || device.patientProfile.isType2Diabetic) {
      medicationTaken = Math.random() > 0.3; // 70% chance medication taken
      
      if (!medicationTaken) {
        baseGlucose += 20 + Math.random() * 40; // Higher without medication
      }
      
      // Add symptoms for extreme values
      if (baseGlucose < 70) {
        symptoms.push('sweating', 'shaking', 'hunger');
      } else if (baseGlucose > 250) {
        symptoms.push('thirst', 'frequent_urination', 'fatigue');
      }
    }

    const glucose = Math.max(40, Math.min(500, Math.round(baseGlucose * 10) / 10));

    const rawData = {
      deviceId,
      glucose,
      timestamp: now,
      unit: 'mg/dL',
      context: {
        patientCondition: glucoseContext,
        medicationTaken,
        symptoms,
        location: 'fingertip',
      },
      batteryLevel: device.batteryLevel,
      testStripLot: `LOT${Math.floor(Math.random() * 9000) + 1000}`,
      deviceModel: 'Mock Glucose Meter Pro',
      testStripCount: device.testStripCount,
    };

    return this.transformData(rawData, 'GLUCOSE_METER');
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}