/**
 * Plugin System Test Script
 * 
 * Tests the plugin registry and mock device plugins
 */

import { PluginRegistry, initializePluginRegistry } from '@/lib/plugins/core/PluginRegistry';

async function testPluginSystem() {
  console.log('🚀 Starting Plugin System Test...\n');
  
  try {
    // Initialize plugin registry with test configuration
    const registry = await initializePluginRegistry({
      environment: 'development',
      enabledPlugins: ['mock-bp', 'mock-glucose'],
      healthCheckInterval: 5000, // 5 seconds for testing
      enableHotReload: true,
      logLevel: 'debug',
    });

    console.log('✅ Plugin Registry initialized successfully\n');

    // Test plugin loading
    console.log('📋 Loaded Plugins:');
    const loadedPlugins = registry.getLoadedPlugins();
    loadedPlugins.forEach(plugin => {
      console.log(`  - ${plugin.metadata.name} (${plugin.metadata.id}) v${plugin.metadata.version}`);
      console.log(`    Supported Devices: ${plugin.metadata.supportedDevices.join(', ')}`);
      console.log(`    Capabilities: RT=${plugin.metadata.capabilities.supportsRealtime}, Hist=${plugin.metadata.capabilities.supportsHistorical}`);
    });

    console.log('\n📊 Plugin Health Status:');
    const healthStatuses = registry.getAllPluginHealth();
    healthStatuses.forEach(health => {
      console.log(`  - ${health.pluginId}: ${health.status} (${health.connectedDevices} devices, ${health.errorCount} errors)`);
    });

    // Test device discovery
    console.log('\n🔍 Testing Device Discovery...');
    for (const plugin of loadedPlugins) {
      try {
        const devices = await plugin.discoverDevices();
        console.log(`  ${plugin.metadata.name}: Found ${devices.length} devices`);
        devices.forEach(device => {
          console.log(`    - ${device.deviceId} (Battery: ${device.batteryLevel}%, Signal: ${device.signalStrength}%)`);
        });
      } catch (error) {
        console.error(`    Error discovering devices for ${plugin.metadata.name}:`, error.message);
      }
    }

    // Test device connection for blood pressure plugin
    console.log('\n🔗 Testing Device Connection...');
    const bpPlugin = registry.getPlugin('mock-bp');
    if (bpPlugin) {
      try {
        const connection = await bpPlugin.connect({
          deviceId: 'mock-bp-001',
          connectionParams: {},
          timeout: 5000,
        });
        console.log(`  ✅ Connected to ${connection.deviceId}: ${connection.status}`);
        
        // Test data reading
        console.log('\n📊 Testing Data Reading...');
        const readings = await bpPlugin.readData('mock-bp-001');
        console.log(`  Blood Pressure Reading: ${readings[0].primaryValue}/${readings[0].secondaryValue} ${readings[0].unit}`);
        console.log(`  Quality Score: ${readings[0].quality?.score.toFixed(2)}`);
        console.log(`  Context: ${readings[0].context?.patientCondition}`);
        
        // Test data validation
        const validation = bpPlugin.validateData(readings[0]);
        console.log(`  Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
        if (validation.warnings.length > 0) {
          console.log(`  Warnings: ${validation.warnings.join(', ')}`);
        }
        
        // Test device sync
        console.log('\n🔄 Testing Device Sync...');
        const syncResult = await bpPlugin.syncDevice('mock-bp-001');
        console.log(`  Sync Result: ${syncResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`  Records Synced: ${syncResult.recordsSynced}`);
        console.log(`  Duration: ${syncResult.syncDuration}ms`);
        
        // Test historical data
        console.log('\n📈 Testing Historical Data...');
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days
        const historicalData = await bpPlugin.readHistoricalData('mock-bp-001', {
          startDate,
          endDate,
          limit: 10,
        });
        console.log(`  Historical readings: ${historicalData.length} records`);
        
        // Disconnect
        await bpPlugin.disconnect('mock-bp-001');
        console.log(`  ✅ Disconnected from mock-bp-001`);
        
      } catch (error) {
        console.error(`  ❌ Blood pressure plugin test failed:`, error.message);
      }
    }

    // Test glucose plugin
    console.log('\n🩸 Testing Glucose Plugin...');
    const glucosePlugin = registry.getPlugin('mock-glucose');
    if (glucosePlugin) {
      try {
        const connection = await glucosePlugin.connect({
          deviceId: 'mock-glucose-001',
          connectionParams: {},
          timeout: 5000,
        });
        console.log(`  ✅ Connected to ${connection.deviceId}: ${connection.status}`);
        
        // Test glucose reading (this will take longer due to simulation)
        console.log('  📊 Testing Glucose Reading (this may take 8-15 seconds)...');
        const readings = await glucosePlugin.readData('mock-glucose-001');
        console.log(`  Glucose Reading: ${readings[0].primaryValue} ${readings[0].unit}`);
        console.log(`  Context: ${readings[0].context?.patientCondition}`);
        console.log(`  Medication Taken: ${readings[0].context?.medicationTaken ? 'Yes' : 'No'}`);
        
        // Test validation with glucose-specific rules
        const validation = glucosePlugin.validateData(readings[0]);
        console.log(`  Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
        if (validation.warnings.length > 0) {
          console.log(`  Warnings: ${validation.warnings.join(', ')}`);
        }
        
        await glucosePlugin.disconnect('mock-glucose-001');
        console.log(`  ✅ Disconnected from mock-glucose-001`);
        
      } catch (error) {
        console.error(`  ❌ Glucose plugin test failed:`, error.message);
      }
    }

    // Test bulk operations
    console.log('\n🔄 Testing Bulk Sync...');
    const bulkSyncResult = await bpPlugin?.bulkSync(['mock-bp-001', 'mock-bp-002']);
    if (bulkSyncResult) {
      console.log(`  Bulk Sync: ${bulkSyncResult.successCount}/${bulkSyncResult.totalDevices} devices successful`);
      console.log(`  Total Records: ${bulkSyncResult.totalRecords}`);
      console.log(`  Duration: ${bulkSyncResult.duration}ms`);
    }

    // Test plugin health monitoring
    console.log('\n🏥 Final Health Check...');
    const finalHealth = registry.getAllPluginHealth();
    finalHealth.forEach(health => {
      console.log(`  ${health.pluginId}: ${health.status} (uptime: ${Math.round(health.uptime / 1000)}s)`);
    });

    console.log('\n✅ All plugin tests completed successfully!');
    
    // Shutdown
    console.log('\n🔄 Shutting down plugin registry...');
    await registry.shutdown();
    console.log('✅ Plugin registry shut down successfully');
    
  } catch (error) {
    console.error('❌ Plugin system test failed:', error);
    throw error;
  }
}

// Run the test
// Check if this file is executed directly
const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMainModule) {
  testPluginSystem()
    .then(() => {
      console.log('\n🎉 Plugin System Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Plugin System Test failed:', error);
      process.exit(1);
    });
}

export { testPluginSystem };