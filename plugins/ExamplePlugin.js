"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExamplePlugin {
    constructor() {
        this.name = 'example-plugin';
        this.description = 'Example plugin demonstrating the plugin system';
        this.version = '1.0.0';
    }
    async execute(context) {
        const { projectFolder, tagName, baseBranches, options } = context;
        console.log('🔧 Example Plugin Executed!');
        console.log('==========================');
        console.log(`Project Folder: ${projectFolder}`);
        console.log(`Tag Name: ${tagName}`);
        console.log(`Base Branches: ${baseBranches.develop} → ${baseBranches.production}`);
        console.log(`Repository Type: ${baseBranches.type}`);
        console.log(`Options:`, options);
        console.log('');
        console.log('This is an example plugin that demonstrates how to create custom plugins.');
        console.log('You can implement any workflow or automation logic here.');
        console.log('');
        console.log('✅ Example plugin completed successfully!');
    }
}
exports.default = ExamplePlugin;
//# sourceMappingURL=ExamplePlugin.js.map