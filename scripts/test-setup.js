#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing QIMA Release CLI Setup...\n');

// Check if required directories exist
const requiredDirs = ['src', 'plugins'];
const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));

if (missingDirs.length > 0) {
  console.log('❌ Missing required directories:', missingDirs.join(', '));
  process.exit(1);
}

// Check if required files exist
const requiredFiles = [
  'src/index.ts',
  'src/types/index.ts',
  'src/core/PluginManager.ts',
  'src/core/GitManager.ts',
  'src/core/ConfigManager.ts',
  'src/cli/ReleaseCLI.ts',
  'plugins/StandardReleasePlugin.ts',
  'plugins/QimacertReleasePlugin.ts',
  'package.json',
  'tsconfig.json'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.log('❌ Missing required files:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
  process.exit(1);
}

// Check package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'dev', 'start'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.log('❌ Missing required scripts in package.json:', missingScripts.join(', '));
    process.exit(1);
  }
  
  console.log('✅ package.json scripts verified');
} catch (error) {
  console.log('❌ Failed to parse package.json:', error.message);
  process.exit(1);
}

// Check TypeScript configuration
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  if (!tsConfig.compilerOptions || !tsConfig.compilerOptions.outDir) {
    console.log('❌ Invalid TypeScript configuration');
    process.exit(1);
  }
  
  console.log('✅ TypeScript configuration verified');
} catch (error) {
  console.log('❌ Failed to parse tsconfig.json:', error.message);
  process.exit(1);
}

console.log('\n🎉 All setup checks passed!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build');
console.log('3. Run: npm link (to make CLI globally available)');
console.log('4. Test with: qima-release --help');
