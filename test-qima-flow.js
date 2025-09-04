const { AutomationCLI } = require('./dist/src/cli/ReleaseCLI');

async function testQimaLegacyRelease() {
  console.log('Testing QIMA Legacy Release plugin flow...\n');
  
  const cli = new AutomationCLI();
  
  try {
    // Load configuration
    await cli['configManager'].loadConfig();
    await cli['pluginManager'].loadPlugins();
    
    console.log('✅ Configuration and plugins loaded successfully');
    console.log('✅ You can now run: node dist/src/index.js run');
    console.log('   Then select:');
    console.log('   1. 🚀 Deployment Operations');
    console.log('   2. qima-legacy-release');
    console.log('   3. Select a repository');
    console.log('   4. Enter version (e.g., v2.02)');
    console.log('');
    console.log('The plugin will now skip environment selection and only ask for version!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQimaLegacyRelease();
