/**
 * Device Plugin Registry and Loader
 * 
 * Manages loading, registration, and lifecycle of all device plugins
 */

import { EventEmitter } from 'events';
import { 
  DevicePlugin, 
  PluginConfig, 
  PluginHealth, 
  PluginEvent, 
  PluginError,
  DeviceConnection 
} from './DevicePlugin.interface';

export interface PluginRegistryConfig {
  environment: 'development' | 'staging' | 'production';
  enabledPlugins: string[];
  pluginDirectory: string;
  maxRetries: number;
  healthCheckInterval: number;
  enableHotReload: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class PluginRegistry extends EventEmitter {
  private plugins: Map<string, DevicePlugin> = new Map();
  private pluginConfigs: Map<string, PluginConfig> = new Map();
  private pluginHealth: Map<string, PluginHealth> = new Map();
  private loadedPlugins: Set<string> = new Set();
  private config: PluginRegistryConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: PluginRegistryConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
  }

  /**
   * Initialize the plugin registry and load all enabled plugins
   */
  async initialize(): Promise<void> {
    console.log(`Initializing Plugin Registry with ${this.config.enabledPlugins.length} plugins`);
    
    try {
      // Load plugin configurations
      await this.loadPluginConfigurations();
      
      // Load and initialize enabled plugins
      for (const pluginId of this.config.enabledPlugins) {
        await this.loadPlugin(pluginId);
      }
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log(`Plugin Registry initialized successfully. Loaded ${this.loadedPlugins.size} plugins.`);
      this.emit('registry:ready', { loadedPlugins: Array.from(this.loadedPlugins) });
      
    } catch (error) {
      console.error('Failed to initialize Plugin Registry:', error);
      throw error;
    }
  }

  /**
   * Load and register a specific plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    try {
      console.log(`Loading plugin: ${pluginId}`);
      
      // Prevent duplicate loading
      if (this.loadedPlugins.has(pluginId)) {
        console.warn(`Plugin ${pluginId} is already loaded`);
        return;
      }

      // Import plugin module
      const pluginModule = await this.importPlugin(pluginId);
      const plugin: DevicePlugin = new pluginModule.default();
      
      // Validate plugin implementation
      this.validatePlugin(plugin);
      
      // Get plugin configuration
      const config = this.pluginConfigs.get(pluginId) || plugin.getDefaultConfig();
      
      // Initialize plugin
      await plugin.initialize(config as PluginConfig);
      
      // Register plugin
      this.plugins.set(pluginId, plugin);
      this.loadedPlugins.add(pluginId);
      
      // Initialize health tracking
      this.pluginHealth.set(pluginId, {
        pluginId,
        status: 'healthy',
        connectedDevices: 0,
        lastSync: null,
        errorCount: 0,
        uptime: Date.now(),
        apiCallsToday: 0,
      });
      
      // Register plugin routes if any
      if (plugin.registerRoutes) {
        const routes = plugin.registerRoutes();
        // TODO: Register routes with Next.js API system
        console.log(`Plugin ${pluginId} registered ${routes.length} API routes`);
      }
      
      console.log(`Plugin ${pluginId} loaded successfully`);
      this.emit('plugin:loaded', { pluginId, metadata: plugin.metadata });
      
    } catch (error) {
      console.error(`Failed to load plugin ${pluginId}:`, error);
      this.emit('plugin:error', { pluginId, error: error as PluginError });
      throw error;
    }
  }

  /**
   * Unload a plugin and clean up resources
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} is not loaded`);
      }

      console.log(`Unloading plugin: ${pluginId}`);
      
      // Cleanup plugin resources
      await plugin.destroy();
      
      // Remove from registry
      this.plugins.delete(pluginId);
      this.loadedPlugins.delete(pluginId);
      this.pluginHealth.delete(pluginId);
      
      console.log(`Plugin ${pluginId} unloaded successfully`);
      this.emit('plugin:unloaded', { pluginId });
      
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get a loaded plugin by ID
   */
  getPlugin(pluginId: string): DevicePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): DevicePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin health status
   */
  getPluginHealth(pluginId: string): PluginHealth | undefined {
    return this.pluginHealth.get(pluginId);
  }

  /**
   * Get health status for all plugins
   */
  getAllPluginHealth(): PluginHealth[] {
    return Array.from(this.pluginHealth.values());
  }

  /**
   * Reload a plugin (useful for development)
   */
  async reloadPlugin(pluginId: string): Promise<void> {
    if (this.loadedPlugins.has(pluginId)) {
      await this.unloadPlugin(pluginId);
    }
    await this.loadPlugin(pluginId);
  }

  /**
   * Find plugins that support a specific device type
   */
  getPluginsForDeviceType(deviceType: string): DevicePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin =>
      plugin.metadata.supportedDevices.includes(deviceType) ||
      plugin.metadata.supportedDevices.includes('*')
    );
  }

  /**
   * Find plugins that support a specific region
   */
  getPluginsForRegion(region: string): DevicePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin =>
      plugin.metadata.supportedRegions.includes(region) ||
      plugin.metadata.supportedRegions.includes('global') ||
      plugin.metadata.supportedRegions.length === 0
    );
  }

  /**
   * Shutdown the plugin registry
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Plugin Registry...');
    
    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Unload all plugins
    const pluginIds = Array.from(this.loadedPlugins);
    for (const pluginId of pluginIds) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        console.error(`Error unloading plugin ${pluginId} during shutdown:`, error);
      }
    }
    
    // Clear all data
    this.plugins.clear();
    this.pluginConfigs.clear();
    this.pluginHealth.clear();
    this.loadedPlugins.clear();
    
    console.log('Plugin Registry shutdown complete');
  }

  // Private methods

  private async importPlugin(pluginId: string): Promise<any> {
    try {
      // Dynamic import based on plugin ID
      const pluginPath = this.getPluginPath(pluginId);
      return await import(pluginPath);
    } catch (error) {
      throw new Error(`Failed to import plugin ${pluginId}: ${error.message}`);
    }
  }

  private getPluginPath(pluginId: string): string {
    // Map plugin ID to file path
    const pluginMappings: Record<string, string> = {
      'mock-bp': '../devices/medical-devices/blood-pressure/mock/index.js',
      'mock-glucose': '../devices/medical-devices/glucose/mock/index.js',
      'fitbit': '../devices/wearables/fitbit/index.js',
      'omron-bp': '../devices/medical-devices/blood-pressure/omron/index.js',
      'generic-bluetooth': '../devices/medical-devices/generic-bluetooth/index.js',
    };

    const path = pluginMappings[pluginId];
    if (!path) {
      throw new Error(`Unknown plugin ID: ${pluginId}`);
    }

    return path;
  }

  private validatePlugin(plugin: DevicePlugin): void {
    // Validate required methods
    const requiredMethods = [
      'initialize', 'destroy', 'connect', 'disconnect', 
      'readData', 'transformData', 'getDefaultConfig'
    ];

    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        throw new Error(`Plugin missing required method: ${method}`);
      }
    }

    // Validate metadata
    if (!plugin.metadata || !plugin.metadata.id || !plugin.metadata.name) {
      throw new Error('Plugin missing required metadata (id, name)');
    }
  }

  private async loadPluginConfigurations(): Promise<void> {
    try {
      // Load plugin configurations from config file or database
      // For now, use environment-based configuration
      const configs = this.getEnvironmentConfigs();
      
      for (const [pluginId, config] of Object.entries(configs)) {
        this.pluginConfigs.set(pluginId, config as PluginConfig);
      }
      
    } catch (error) {
      console.error('Failed to load plugin configurations:', error);
    }
  }

  private getEnvironmentConfigs(): Record<string, Partial<PluginConfig>> {
    const baseConfig = {
      environment: this.config.environment,
      features: {},
    };

    return {
      'mock-bp': {
        ...baseConfig,
        features: { mockData: true, realTimeSync: false },
      },
      'mock-glucose': {
        ...baseConfig,
        features: { mockData: true, realTimeSync: false },
      },
      'fitbit': {
        ...baseConfig,
        features: { oauth: true, realTimeSync: true, historicalData: true },
        rateLimits: { requests: 150, windowMs: 3600000 }, // 150 requests per hour
      },
      'omron-bp': {
        ...baseConfig,
        features: { bluetooth: true, realTimeSync: true },
      },
      'generic-bluetooth': {
        ...baseConfig,
        features: { bluetooth: true, deviceDiscovery: true },
      },
    };
  }

  private setupEventHandlers(): void {
    // Handle plugin events and update health status
    this.on('plugin:loaded', (event) => {
      console.log(`Plugin event: ${event.pluginId} loaded`);
    });

    this.on('plugin:error', (event) => {
      console.error(`Plugin error: ${event.pluginId}`, event.error);
      const health = this.pluginHealth.get(event.pluginId);
      if (health) {
        health.status = 'error';
        health.errorCount++;
      }
    });
  }

  private startHealthMonitoring(): void {
    if (this.config.healthCheckInterval > 0) {
      this.healthCheckTimer = setInterval(async () => {
        await this.performHealthCheck();
      }, this.config.healthCheckInterval);
    }
  }

  private async performHealthCheck(): Promise<void> {
    const pluginEntries = Array.from(this.plugins.entries());
    for (const [pluginId, plugin] of pluginEntries) {
      try {
        const health = this.pluginHealth.get(pluginId);
        if (!health) continue;

        // Update uptime
        health.uptime = Date.now() - health.uptime;

        // Plugin-specific health checks could be implemented here
        // For now, just verify the plugin is still responsive
        
        if (health.status === 'error' && health.errorCount > 5) {
          health.status = 'maintenance';
          console.warn(`Plugin ${pluginId} moved to maintenance mode due to excessive errors`);
        }

      } catch (error) {
        console.error(`Health check failed for plugin ${pluginId}:`, error);
      }
    }
  }
}

// Singleton instance
let registryInstance: PluginRegistry | null = null;

/**
 * Get or create the global plugin registry instance
 */
export function getPluginRegistry(config?: PluginRegistryConfig): PluginRegistry {
  if (!registryInstance && config) {
    registryInstance = new PluginRegistry(config);
  } else if (!registryInstance) {
    throw new Error('Plugin Registry not initialized. Provide config on first call.');
  }
  
  return registryInstance;
}

/**
 * Initialize the plugin registry with default configuration
 */
export async function initializePluginRegistry(overrides: Partial<PluginRegistryConfig> = {}): Promise<PluginRegistry> {
  const defaultConfig: PluginRegistryConfig = {
    environment: (process.env.NODE_ENV as any) || 'development',
    enabledPlugins: process.env.ENABLED_PLUGINS?.split(',') || ['mock-bp', 'mock-glucose'],
    pluginDirectory: '/lib/plugins/devices',
    maxRetries: 3,
    healthCheckInterval: 30000, // 30 seconds
    enableHotReload: process.env.NODE_ENV === 'development',
    logLevel: 'info',
  };

  const config = { ...defaultConfig, ...overrides };
  const registry = getPluginRegistry(config);
  
  await registry.initialize();
  return registry;
}