const { ConfigManager } = require('./dist/src/core/ConfigManager');

async function testRepositories() {
  console.log('Testing repository listing...\n');
  
  const configManager = new ConfigManager();
  
  try {
    // Load existing configuration
    await configManager.loadConfig();
    
    // Test listing repositories
    configManager.listRepositories();
    
    console.log('\n✅ Repository listing test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRepositories();
