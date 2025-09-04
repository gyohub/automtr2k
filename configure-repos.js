const { ConfigManager } = require('./dist/src/core/ConfigManager');

async function configureRepositories() {
  console.log('Configuring QIMA repositories for AT2 CLI...\n');
  
  const configManager = new ConfigManager();
  
  try {
    // Load existing configuration
    await configManager.loadConfig();
    
    const basePath = 'C:\\Users\\Gyowanny Queiroz\\IdeaProjects';
    const organization = 'asiainspection';
    
    const repositories = [
      'aca',
      'commons',
      'file-service-cloud',
      'food-certification-app',
      'food-certification-service-cloud',
      'irp-service',
      'irp-service-cloud',
      'Oracle_Master',
      'parameter-service-cloud',
      'parameter-service-legacy-cloud',
      'parameter-web-cloud',
      'psi',
      'psi-web-cloud',
      'Public-API'
    ];
    
    console.log(`📁 Adding ${repositories.length} repositories from ${basePath}...\n`);
    
    repositories.forEach((repoName, index) => {
      const repoPath = `${basePath}\\${repoName}`;
      const repoUrl = `https://github.com/${organization}/${repoName}.git`;
      
      const repository = {
        name: repoName,
        path: repoPath,
        type: 'git',
        url: repoUrl,
        lastUsed: new Date()
      };
      
      configManager.addRepository(repository);
      console.log(`✅ ${index + 1}. ${repoName}`);
      console.log(`   Path: ${repoPath}`);
      console.log(`   URL: ${repoUrl}`);
      console.log('');
    });
    
    // Save the configuration
    await configManager.saveConfig();
    
    console.log('🎉 All repositories configured successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Total repositories: ${repositories.length}`);
    console.log(`- Base path: ${basePath}`);
    console.log(`- Organization: ${organization}`);
    console.log('\n🚀 You can now use: node dist/src/index.js run');
    console.log('   Select any deployment operation and choose from your configured repositories!');
    
  } catch (error) {
    console.error('❌ Failed to configure repositories:', error);
  }
}

configureRepositories();
