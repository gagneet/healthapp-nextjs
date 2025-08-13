/**
 * Plugin System Configuration
 * 
 * Central configuration for all device plugins
 */

import { PluginRegistryConfig } from '@/lib/plugins/core/PluginRegistry';
import { PluginConfig } from '@/lib/plugins/core/DevicePlugin.interface';

/**
 * Environment-specific plugin configurations
 */
export const PLUGIN_CONFIGS: Record<string, Record<string, Partial<PluginConfig>>> = {
  development: {
    'mock-bp': {
      environment: 'development',
      features: {
        mockData: true,
        realTimeSync: false,
        simulateErrors: false,
        fastMode: true, // Reduced delays for development
      },
    },
    'mock-glucose': {
      environment: 'development',
      features: {
        mockData: true,
        realTimeSync: false,
        simulateErrors: false,
        ketonesSupport: true,
        fastMode: true, // Reduced delays for development
      },
    },
    'fitbit': {
      environment: 'development',
      features: {
        oauth: true,
        realTimeSync: false, // Disabled in dev to avoid API calls
        historicalData: true,
        mockMode: true, // Use mock data in development
      },
      rateLimits: {
        requests: 150,
        windowMs: 3600000, // 1 hour
      },
    },
  },
  
  staging: {
    'mock-bp': {
      environment: 'staging',
      features: {
        mockData: true,
        realTimeSync: true,
        simulateErrors: true, // Test error handling
        fastMode: false,
      },
    },
    'mock-glucose': {
      environment: 'staging',
      features: {
        mockData: true,
        realTimeSync: true,
        simulateErrors: true,
        ketonesSupport: true,
        fastMode: false,
      },
    },
    'fitbit': {
      environment: 'staging',
      apiEndpoint: 'https://api.fitbit.com/1',
      features: {
        oauth: true,
        realTimeSync: true,
        historicalData: true,
        mockMode: false,
      },
      rateLimits: {
        requests: 150,
        windowMs: 3600000,
      },
    },
    'omron-bp': {
      environment: 'staging',
      features: {
        bluetooth: true,
        realTimeSync: true,
        deviceDiscovery: true,
      },
    },
  },
  
  production: {
    'fitbit': {
      environment: 'production',
      apiEndpoint: 'https://api.fitbit.com/1',
      features: {
        oauth: true,
        realTimeSync: true,
        historicalData: true,
        mockMode: false,
      },
      rateLimits: {
        requests: 150,
        windowMs: 3600000,
      },
    },
    'omron-bp': {
      environment: 'production',
      features: {
        bluetooth: true,
        realTimeSync: true,
        deviceDiscovery: true,
        autoReconnect: true,
      },
    },
    'generic-bluetooth': {
      environment: 'production',
      features: {
        bluetooth: true,
        deviceDiscovery: true,
        autoReconnect: true,
        multiDevice: true,
      },
    },
  },
};

/**
 * Registry configurations for different environments
 */
export const REGISTRY_CONFIGS: Record<string, PluginRegistryConfig> = {
  development: {
    environment: 'development',
    enabledPlugins: ['mock-bp', 'mock-glucose'],
    pluginDirectory: '/lib/plugins/devices',
    maxRetries: 3,
    healthCheckInterval: 30000, // 30 seconds
    enableHotReload: true,
    logLevel: 'debug',
  },
  
  staging: {
    environment: 'staging',
    enabledPlugins: ['mock-bp', 'mock-glucose', 'fitbit'],
    pluginDirectory: '/lib/plugins/devices',
    maxRetries: 5,
    healthCheckInterval: 60000, // 1 minute
    enableHotReload: false,
    logLevel: 'info',
  },
  
  production: {
    environment: 'production',
    enabledPlugins: process.env.ENABLED_PLUGINS?.split(',') || ['fitbit', 'omron-bp', 'generic-bluetooth'],
    pluginDirectory: '/lib/plugins/devices',
    maxRetries: 5,
    healthCheckInterval: 300000, // 5 minutes
    enableHotReload: false,
    logLevel: 'error',
  },
};

/**
 * Device type to plugin mapping
 */
export const DEVICE_TYPE_PLUGINS: Record<string, string[]> = {
  'BLOOD_PRESSURE': ['mock-bp', 'omron-bp', 'generic-bluetooth'],
  'GLUCOSE_METER': ['mock-glucose', 'generic-bluetooth'],
  'WEARABLE': ['fitbit'],
  'PULSE_OXIMETER': ['generic-bluetooth'],
  'THERMOMETER': ['generic-bluetooth'],
  'ECG_MONITOR': ['generic-bluetooth'],
  'SCALE': ['fitbit', 'generic-bluetooth'],
  'SPIROMETER': ['generic-bluetooth'],
};

/**
 * Regional plugin availability
 */
export const REGIONAL_PLUGINS: Record<string, string[]> = {
  'US': ['fitbit', 'omron-bp', 'mock-bp', 'mock-glucose', 'generic-bluetooth'],
  'EU': ['omron-bp', 'mock-bp', 'mock-glucose', 'generic-bluetooth'],
  'IN': ['mock-bp', 'mock-glucose', 'generic-bluetooth'], // Indian market
  'global': ['mock-bp', 'mock-glucose', 'generic-bluetooth'],
};

/**
 * Medical standards and compliance configurations
 */
export const COMPLIANCE_CONFIGS = {
  FDA: {
    requiredValidations: ['data_integrity', 'device_authentication', 'encryption'],
    auditLogging: true,
    dataRetentionDays: 2555, // 7 years
  },
  CE: {
    requiredValidations: ['gdpr_compliance', 'device_certification'],
    auditLogging: true,
    dataRetentionDays: 1825, // 5 years
  },
  HIPAA: {
    requiredValidations: ['phi_encryption', 'access_controls', 'audit_trails'],
    auditLogging: true,
    dataRetentionDays: 2190, // 6 years
  },
};

/**
 * Get plugin configuration for current environment
 */
export function getPluginConfig(pluginId: string, environment?: string): Partial<PluginConfig> {
  const env = environment || process.env.NODE_ENV || 'development';
  return PLUGIN_CONFIGS[env]?.[pluginId] || {};
}

/**
 * Get registry configuration for current environment
 */
export function getRegistryConfig(environment?: string): PluginRegistryConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  return REGISTRY_CONFIGS[env] || REGISTRY_CONFIGS.development;
}

/**
 * Get available plugins for a device type
 */
export function getPluginsForDeviceType(deviceType: string): string[] {
  return DEVICE_TYPE_PLUGINS[deviceType] || [];
}

/**
 * Get available plugins for a region
 */
export function getPluginsForRegion(region: string): string[] {
  return REGIONAL_PLUGINS[region] || REGIONAL_PLUGINS.global;
}

/**
 * Check if plugin is enabled for current environment
 */
export function isPluginEnabled(pluginId: string, environment?: string): boolean {
  const config = getRegistryConfig(environment);
  return config.enabledPlugins.includes(pluginId);
}

/**
 * Validate plugin compatibility
 */
export function validatePluginCompatibility(
  pluginId: string, 
  deviceType: string, 
  region: string
): { compatible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check device type support
  const supportedPlugins = getPluginsForDeviceType(deviceType);
  if (!supportedPlugins.includes(pluginId)) {
    reasons.push(`Plugin ${pluginId} does not support device type ${deviceType}`);
  }
  
  // Check regional availability
  const regionalPlugins = getPluginsForRegion(region);
  if (!regionalPlugins.includes(pluginId)) {
    reasons.push(`Plugin ${pluginId} is not available in region ${region}`);
  }
  
  // Check if enabled in current environment
  if (!isPluginEnabled(pluginId)) {
    reasons.push(`Plugin ${pluginId} is not enabled in current environment`);
  }
  
  return {
    compatible: reasons.length === 0,
    reasons,
  };
}