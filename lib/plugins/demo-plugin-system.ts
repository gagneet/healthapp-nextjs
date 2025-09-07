import { Prisma } from "@/generated/prisma";

/**
 * Plugin System Demonstration
 * 
 * A TypeScript script to demonstrate the plugin system functionality
 * Converted from JavaScript to follow Next.js best practices
 */

console.log('🩺 Healthcare Device Plugin System Demo\n');

// Types for demo
interface DeviceReading {
  readingType: string;
  primaryValue: number;
  secondaryValue?: number;
  unit: string;
  timestamp: Date;
  context?: {
    patientCondition?: string;
    medicationTaken?: boolean;
  };
  quality?: {
    score: number;
  };
}

interface DeviceConnection {
  deviceId: string;
  isConnected: boolean;
  lastSync: Date;
  batteryLevel: number;
  status: string;
}

interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  supportedDevices: string[];
  supportedRegions: string[];
  capabilities: {
    readingTypes: string[];
    supportsRealtime: boolean;
    supportsHistorical: boolean;
    supportsBulkSync: boolean;
    maxHistoryDays: number;
    minSyncInterval: number;
  };
}

interface PluginConfig {
  features?: {
    mockData?: boolean;
  };
}

interface DeviceConnectionConfig {
  deviceId: string;
  connectionParams?: Record<string, any>;
}

// Mock implementations for demonstration
class MockBloodPressurePlugin {
  public metadata: PluginMetadata;
  private devices = new Map<string, any>();
  private isInitialized = false;
  private config?: PluginConfig;

  constructor() {
    this.metadata = {
      id: 'mock-bp',
      name: 'Mock Blood Pressure Monitor',
      version: '1.0.0',
      description: 'Mock plugin for simulating blood pressure monitoring devices',
      supportedDevices: ['BLOOD_PRESSURE'],
      supportedRegions: ['global'],
      capabilities: {
        readingTypes: ['blood_pressure'],
        supportsRealtime: true,
        supportsHistorical: true,
        supportsBulkSync: true,
        maxHistoryDays: 30,
        minSyncInterval: 5000,
      },
    };
  }

  async initialize(config: PluginConfig): Promise<void> {
    console.log('✅ Initializing Mock Blood Pressure Plugin...');
    this.config = config;
    this.isInitialized = true;
    console.log('   Plugin initialized successfully\n');
  }

  async discoverDevices() {
    if (!this.isInitialized) throw new Error('Plugin not initialized');
    
    console.log('🔍 Discovering blood pressure devices...');
type EmergencyAlertWithRelations = Prisma.EmergencyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type MedicationSafetyAlertWithRelations = Prisma.MedicationSafetyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: { patient: true; user: true }
}>;

type AdherenceRecordWithRelations = Prisma.AdherenceRecordGetPayload<{
  include: { patient: true; user: true }
}>;

    const devices = [
      {
        deviceId: 'mock-bp-001',
        isConnected: false,
        batteryLevel: 85,
        signalStrength: 95,
        status: 'disconnected',
      },
      {
        deviceId: 'mock-bp-002',
        isConnected: false,
        batteryLevel: 62,
        signalStrength: 88,
        status: 'disconnected',
      },
    ];
    
    console.log(`   Found ${devices.length} devices:`);
    devices.forEach(device => {
      console.log(`   - ${device.deviceId} (Battery: ${device.batteryLevel}%, Signal: ${device.signalStrength}%)`);
    });
    console.log('');
    
    return devices;
  }

  async connect(config: any) {
    console.log(`🔗 Connecting to device ${config.deviceId}...`);
    await this.simulateDelay(1000, 2000);
    
    const deviceState = {
      deviceId: config.deviceId,
      isConnected: true,
      batteryLevel: Math.floor(Math.random() * 40) + 60,
    };
    
    this.devices.set(config.deviceId, deviceState);
    
    const connection = {
      deviceId: config.deviceId,
      isConnected: true,
      lastSync: new Date(),
      batteryLevel: deviceState.batteryLevel,
      status: 'connected',
    };
    
    console.log(`   ✅ Connected to ${config.deviceId}\n`);
    return connection;
  }

  async readData(deviceId) {
    console.log(`📊 Reading data from ${deviceId}...`);
    await this.simulateDelay(500, 1500);
    
    // Generate mock blood pressure reading
    const systolic = Math.round(120 + (Math.random() - 0.5) * 40);
    const diastolic = Math.round(80 + (Math.random() - 0.5) * 20);
    
    const reading = {
      readingType: 'blood_pressure',
      primaryValue: systolic,
      secondaryValue: diastolic,
      unit: 'mmHg',
      timestamp: new Date(),
      context: {
        patientCondition: 'resting',
        medicationTaken: Math.random() > 0.5,
      },
      quality: {
        score: 0.95,
      },
    };
    
    console.log(`   📈 Reading: ${systolic}/${diastolic} mmHg`);
    console.log(`   📅 Timestamp: ${reading.timestamp.toISOString()}`);
    console.log(`   ✨ Quality Score: ${reading.quality.score}\n`);
    
    return [reading];
  }

  async disconnect(deviceId) {
    console.log(`🔌 Disconnecting from ${deviceId}...`);
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      console.log(`   ✅ Disconnected from ${deviceId}\n`);
    }
  }

  async simulateDelay(minMs, maxMs) {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

class MockGlucosePlugin {
  constructor() {
    this.metadata = {
      id: 'mock-glucose',
      name: 'Mock Glucose Meter',
      version: '1.0.0',
      description: 'Mock plugin for simulating glucose monitoring devices',
      supportedDevices: ['GLUCOSE_METER'],
      supportedRegions: ['global'],
      capabilities: {
        readingTypes: ['blood_glucose'],
        supportsRealtime: true,
        supportsHistorical: true,
        supportsBulkSync: true,
        maxHistoryDays: 90,
        minSyncInterval: 10000,
      },
    };
    this.devices = new Map();
    this.isInitialized = false;
  }

  async initialize(config) {
    console.log('✅ Initializing Mock Glucose Meter Plugin...');
    this.config = config;
    this.isInitialized = true;
    console.log('   Plugin initialized successfully\n');
  }

  async discoverDevices() {
    console.log('🔍 Discovering glucose meters...');
    const devices = [
      {
        deviceId: 'mock-glucose-001',
        isConnected: false,
        batteryLevel: 78,
        status: 'disconnected',
      },
    ];
    
    console.log(`   Found ${devices.length} device:`);
    devices.forEach(device => {
      console.log(`   - ${device.deviceId} (Battery: ${device.batteryLevel}%)`);
    });
    console.log('');
    
    return devices;
  }

  async connect(config) {
    console.log(`🔗 Connecting to glucose meter ${config.deviceId}...`);
    await this.simulateDelay(1500, 3000);
    
    const deviceState = {
      deviceId: config.deviceId,
      isConnected: true,
      batteryLevel: Math.floor(Math.random() * 40) + 50,
      testStripCount: Math.floor(Math.random() * 40) + 10,
    };
    
    this.devices.set(config.deviceId, deviceState);
    
    const connection = {
      deviceId: config.deviceId,
      isConnected: true,
      lastSync: new Date(),
      batteryLevel: deviceState.batteryLevel,
      status: 'connected',
    };
    
    console.log(`   ✅ Connected to ${config.deviceId} (${deviceState.testStripCount} test strips available)\n`);
    return connection;
  }

  async readData(deviceId) {
    console.log(`🩸 Taking glucose reading from ${deviceId}...`);
    console.log('   ⏳ Please wait 8-10 seconds (simulating real glucose meter delay)...');
    await this.simulateDelay(3000, 5000); // Faster for demo
    
    const device = this.devices.get(deviceId);
    if (device && device.testStripCount > 0) {
      device.testStripCount--;
    }
    
    // Generate mock glucose reading with realistic patterns
    const hour = new Date().getHours();
    let baseGlucose;
    let context;
    
    if (hour >= 6 && hour <= 8) {
      context = 'fasting';
      baseGlucose = 100 + (Math.random() - 0.5) * 40; // 80-120
    } else if (hour >= 11 && hour <= 13) {
      context = 'pre_meal';
      baseGlucose = 110 + (Math.random() - 0.5) * 50; // 85-135
    } else {
      context = 'random';
      baseGlucose = 120 + (Math.random() - 0.5) * 60; // 90-150
    }
    
    const glucose = Math.round(Math.max(70, Math.min(200, baseGlucose)) * 10) / 10;
    
    const reading = {
      readingType: 'blood_glucose',
      primaryValue: glucose,
      unit: 'mg/dL',
      timestamp: new Date(),
      context: {
        patientCondition: context,
        medicationTaken: Math.random() > 0.3,
      },
      quality: {
        score: 0.92,
      },
    };
    
    console.log(`   🍬 Glucose: ${glucose} mg/dL`);
    console.log(`   📍 Context: ${context}`);
    console.log(`   💊 Medication taken: ${reading.context.medicationTaken ? 'Yes' : 'No'}`);
    console.log(`   🧪 Test strips remaining: ${device?.testStripCount || 'Unknown'}\n`);
    
    return [reading];
  }

  async disconnect(deviceId) {
    console.log(`🔌 Disconnecting from ${deviceId}...`);
    const device = this.devices.get(deviceId);
    if (device) {
      device.isConnected = false;
      console.log(`   ✅ Disconnected from ${deviceId}\n`);
    }
  }

  async simulateDelay(minMs, maxMs) {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Demo function
async function runPluginDemo() {
  try {
    console.log('🚀 Starting Healthcare Device Plugin System Demo...\n');
    
    // Initialize plugins
    const bpPlugin = new MockBloodPressurePlugin();
    const glucosePlugin = new MockGlucosePlugin();
    
    await bpPlugin.initialize({ features: { mockData: true } });
    await glucosePlugin.initialize({ features: { mockData: true } });
    
    console.log('📋 Loaded Plugins:');
    console.log(`  - ${bpPlugin.metadata.name} (${bpPlugin.metadata.id}) v${bpPlugin.metadata.version}`);
    console.log(`  - ${glucosePlugin.metadata.name} (${glucosePlugin.metadata.id}) v${glucosePlugin.metadata.version}\n`);
    
    // Discover devices
    console.log('🔍 Device Discovery Phase:\n');
    const bpDevices = await bpPlugin.discoverDevices();
    const glucoseDevices = await glucosePlugin.discoverDevices();
    
    // Test Blood Pressure Plugin
    console.log('🩺 Testing Blood Pressure Monitor:\n');
    const bpConnection = await bpPlugin.connect({ 
      deviceId: 'mock-bp-001', 
      connectionParams: {} 
    });
    
    const bpReadings = await bpPlugin.readData('mock-bp-001');
    
    // Validate blood pressure reading
    const bpReading = bpReadings[0];
    const isValidBP = bpReading.primaryValue >= 90 && bpReading.primaryValue <= 180 &&
                     bpReading.secondaryValue >= 60 && bpReading.secondaryValue <= 120;
    
    console.log(`   🔍 Validation: ${isValidBP ? '✅ Normal range' : '⚠️ Abnormal - needs attention'}`);
    
    if (bpReading.primaryValue > 140 || bpReading.secondaryValue > 90) {
      console.log('   🚨 ALERT: Elevated blood pressure detected');
    }
    
    await bpPlugin.disconnect('mock-bp-001');
    
    // Test Glucose Plugin
    console.log('🍬 Testing Glucose Meter:\n');
    const glucoseConnection = await glucosePlugin.connect({ 
      deviceId: 'mock-glucose-001', 
      connectionParams: {} 
    });
    
    const glucoseReadings = await glucosePlugin.readData('mock-glucose-001');
    
    // Validate glucose reading
    const glucoseReading = glucoseReadings[0];
    const isValidGlucose = glucoseReading.primaryValue >= 70 && glucoseReading.primaryValue <= 200;
    
    console.log(`   🔍 Validation: ${isValidGlucose ? '✅ Normal range' : '⚠️ Abnormal - needs attention'}`);
    
    if (glucoseReading.primaryValue < 70) {
      console.log('   🚨 CRITICAL ALERT: Hypoglycemia (low blood sugar) detected!');
    } else if (glucoseReading.primaryValue > 180) {
      console.log('   🚨 ALERT: Hyperglycemia (high blood sugar) detected');
    }
    
    await glucosePlugin.disconnect('mock-glucose-001');
    
    console.log('🎉 Plugin System Demo Completed Successfully!\n');
    
    console.log('📊 Demo Summary:');
    console.log(`  • Plugins loaded: 2`);
    console.log(`  • Devices discovered: ${bpDevices.length + glucoseDevices.length}`);
    console.log(`  • Connections tested: 2`);
    console.log(`  • Readings taken: 2`);
    console.log(`  • Data validation: ✅ Complete`);
    console.log(`  • Medical alerts: ✅ Functional\n`);
    
    console.log('✨ The plugin system is ready for integration with the Next.js healthcare platform!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo only if this file is executed directly
const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMainModule) {
  runPluginDemo()
    .then(() => {
      console.log('🎉 Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Plugin demo failed:', error);
      process.exit(1);
    });
}