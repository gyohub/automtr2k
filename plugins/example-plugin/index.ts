import { Plugin, PluginContext, PluginCategory } from '../../src/types';

export default class ExamplePlugin implements Plugin {
  name = 'example-plugin';
  description = 'Example plugin demonstrating the plugin system';
  version = '1.0.0';
  category = PluginCategory.UTILITY;

  async execute(context: PluginContext): Promise<void> {
    const { projectFolder, tagName, baseBranches, options } = context;
    
    console.log('🔧 Example Plugin Executed!');
    console.log('==========================');
    console.log(`Project Folder: ${projectFolder}`);
    console.log(`Tag Name: ${tagName}`);
    if (baseBranches) {
      console.log(`Base Branches: ${baseBranches.develop} → ${baseBranches.production}`);
      console.log(`Repository Type: ${baseBranches.type}`);
    }
    console.log(`Options:`, options);
    console.log('');
    console.log('This is an example plugin that demonstrates how to create custom plugins.');
    console.log('You can implement any workflow or automation logic here.');
    console.log('');
    console.log('✅ Example plugin completed successfully!');
  }
}
