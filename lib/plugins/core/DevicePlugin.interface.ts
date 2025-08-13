/**
 * Core Plugin Interface for Medical Device Integration
 * 
 * This interface defines the contract that all device plugins must implement
 * to integrate with the healthcare platform.
 */

export interface DeviceConnectionConfig {
  deviceId: string;
  connectionParams: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
}

export interface VitalData {
  readingType: string;
  primaryValue: number;
  secondaryValue?: number;
  unit: string;
  timestamp: Date;
  context?: {
    patientCondition?: string;
    medicationTaken?: boolean;
    symptoms?: string[];
    location?: string;
  };
  quality?: {
    score: number; // 0.0 - 1.0
    issues?: string[];
  };
  rawData: Record<string, any>;
}

export interface DeviceConnection {
  deviceId: string;
  isConnected: boolean;
  lastSync: Date | null;
  batteryLevel?: number;
  signalStrength?: number;
  firmwareVersion?: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string; // Function name or reference
  middleware?: string[];
  requiresAuth?: boolean;
  allowedRoles?: string[];
}

export interface PluginConfig {
  apiEndpoint?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  region?: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  rateLimits?: {
    requests: number;
    windowMs: number;
  };
  [key: string]: any;
}

export interface DeviceCapability {
  readingTypes: string[];
  supportsRealtime: boolean;
  supportsHistorical: boolean;
  supportsBulkSync: boolean;
  maxHistoryDays: number;
  minSyncInterval: number; // milliseconds
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  supportedDevices: string[];
  supportedRegions: string[];
  capabilities: DeviceCapability;
  dependencies?: string[];
  minPlatformVersion: string;
}

/**
 * Main Device Plugin Interface
 * 
 * All device plugins must implement this interface to be loaded by the system
 */
export interface DevicePlugin {
  // Plugin metadata
  metadata: PluginMetadata;
  
  // Lifecycle methods
  initialize(config: PluginConfig): Promise<void>;
  destroy(): Promise<void>;
  
  // Device management
  discoverDevices(): Promise<DeviceConnection[]>;
  connect(config: DeviceConnectionConfig): Promise<DeviceConnection>;
  disconnect(deviceId: string): Promise<void>;
  getConnectionStatus(deviceId: string): Promise<DeviceConnection>;
  
  // Data operations
  readData(deviceId: string, options?: ReadDataOptions): Promise<VitalData[]>;
  readHistoricalData(deviceId: string, options: HistoricalDataOptions): Promise<VitalData[]>;
  transformData(rawData: any, deviceType: string): VitalData;
  validateData(data: VitalData): ValidationResult;
  
  // Sync operations  
  syncDevice(deviceId: string): Promise<SyncResult>;
  bulkSync(deviceIds: string[]): Promise<BulkSyncResult>;
  
  // Configuration
  getDefaultConfig(): Partial<PluginConfig>;
  validateConfig(config: PluginConfig): ConfigValidationResult;
  
  // API routes (optional - for plugins that expose custom endpoints)
  registerRoutes?(): ApiRoute[];
  
  // Event handlers (optional)
  onDeviceConnected?(deviceId: string): Promise<void>;
  onDeviceDisconnected?(deviceId: string): Promise<void>;
  onDataReceived?(deviceId: string, data: VitalData): Promise<void>;
  onSyncComplete?(deviceId: string, result: SyncResult): Promise<void>;
  onError?(error: PluginError): Promise<void>;
}

// Supporting types
export interface ReadDataOptions {
  since?: Date;
  limit?: number;
  readingTypes?: string[];
  includeRaw?: boolean;
}

export interface HistoricalDataOptions {
  startDate: Date;
  endDate: Date;
  readingTypes?: string[];
  aggregation?: 'none' | 'hourly' | 'daily' | 'weekly';
  limit?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData?: VitalData;
}

export interface SyncResult {
  deviceId: string;
  success: boolean;
  recordsSynced: number;
  errors: string[];
  syncDuration: number;
  lastSyncTime: Date;
}

export interface BulkSyncResult {
  totalDevices: number;
  successCount: number;
  failedCount: number;
  results: SyncResult[];
  totalRecords: number;
  duration: number;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedConfig?: PluginConfig;
}

export interface PluginError extends Error {
  pluginId: string;
  deviceId?: string;
  errorCode: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  context?: Record<string, any>;
}

// Plugin status and health
export interface PluginHealth {
  pluginId: string;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  connectedDevices: number;
  lastSync: Date | null;
  errorCount: number;
  uptime: number;
  startTime: number; // Added for correct uptime calculation
  memoryUsage?: number;
  apiCallsToday: number;
  rateLimitStatus?: {
    remaining: number;
    resetTime: Date;
  };
}

// Event types for plugin system
export type PluginEventType = 
  | 'plugin:loaded'
  | 'plugin:unloaded' 
  | 'plugin:error'
  | 'device:connected'
  | 'device:disconnected'
  | 'device:data'
  | 'device:error'
  | 'sync:started'
  | 'sync:completed'
  | 'sync:failed';

export interface PluginEvent {
  type: PluginEventType;
  pluginId: string;
  deviceId?: string;
  timestamp: Date;
  data?: any;
  error?: PluginError;
}