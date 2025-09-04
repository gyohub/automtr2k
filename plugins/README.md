# AT2 Plugins

This directory contains all plugins for the AT2 automation CLI. Plugins are dynamically discovered and loaded at runtime.

## Plugin Structure

Each plugin should be in its own folder with the following structure:

```
plugins/
├── your-plugin-name/
│   ├── index.ts          # Main plugin file (required)
│   ├── package.json      # Plugin metadata and dependencies (optional)
│   └── README.md         # Plugin documentation (optional)
```

## Plugin Interface

Every plugin must implement the `Plugin` interface:

```typescript
export interface Plugin {
  name: string;                    // Unique plugin name
  description: string;             // Human-readable description
  version: string;                // Plugin version
  category: PluginCategory;       // Plugin category
  execute: (context: PluginContext) => Promise<void>;  // Main execution function
  getConfigMenu?: () => ConfigMenu;  // Optional configuration menu
}
```

## Plugin Categories

Plugins are categorized into the following types:

- **🔧 Git** (`PluginCategory.GIT`) - Git operations (clone, pull, push, etc.)
- **💬 Communication** (`PluginCategory.COMMUNICATION`) - Slack, email, notifications
- **🏗️ Build** (`PluginCategory.BUILD`) - Build operations (Java, Node.js, etc.)
- **🚀 Release** (`PluginCategory.RELEASE`) - Release and deployment operations
- **🛠️ Utility** (`PluginCategory.UTILITY`) - Utility and helper operations
- **🎯 Custom** (`PluginCategory.CUSTOM`) - Custom or specialized operations

## Example Plugin

Here's a complete example of a simple plugin:

```typescript
import { Plugin, PluginContext, PluginCategory } from '../../src/types';
import chalk from 'chalk';

export default class ExamplePlugin implements Plugin {
  name = 'example-plugin';
  description = 'An example plugin that demonstrates the plugin structure';
  version = '1.0.0';
  category = PluginCategory.UTILITY;

  async execute(context: PluginContext): Promise<void> {
    console.log(chalk.blue('🚀 Example Plugin Executing...'));
    console.log(chalk.gray(`Project folder: ${context.projectFolder}`));
    console.log(chalk.gray(`Parameters: ${JSON.stringify(context.parameters)}`));
    
    // Your plugin logic here
    console.log(chalk.green('✅ Example plugin completed successfully!'));
  }
}
```

## Plugin Configuration

Plugins can optionally provide a configuration menu by implementing `getConfigMenu()`:

```typescript
getConfigMenu() {
  return {
    title: 'Example Plugin Configuration',
    description: 'Configure the example plugin settings',
    options: [
      {
        key: 'setting1',
        label: 'Setting 1',
        description: 'Description of setting 1',
        type: 'input',
        default: 'default value'
      },
      {
        key: 'setting2',
        label: 'Setting 2',
        description: 'Description of setting 2',
        type: 'boolean',
        default: true
      }
    ]
  };
}
```

## Plugin Context

The `PluginContext` provides the following information to plugins:

```typescript
export interface PluginContext {
  projectFolder?: string;           // Current project directory
  options: Record<string, any>;     // Plugin-specific options
  repositories?: Repository[];      // Available repositories
  selectedRepository?: Repository;  // Currently selected repository
  environment?: string;            // Current environment
  target?: string;                 // Build target
  parameters?: Record<string, any>; // User-provided parameters
}
```

## Dynamic Discovery

Plugins are automatically discovered when the CLI starts:

1. The system scans the `plugins/` directory
2. Each subdirectory is checked for an `index.ts` or `index.js` file
3. The plugin is loaded and validated
4. If valid, it's registered and available for use

## Plugin Development

To create a new plugin:

1. Create a new folder in `plugins/` with your plugin name
2. Create an `index.ts` file implementing the `Plugin` interface
3. Optionally add a `package.json` for dependencies
4. Compile with `npx tsc`
5. The plugin will be automatically available in the CLI

## Available Plugins

The following plugins are currently available:

- **qima-legacy-release** (Deployment) - Legacy QIMA release process
- **qima-release** (Deployment) - Simple QIMA release process
- **git-clone** (Git) - Clone repositories
- **slack-notification** (Communication) - Send Slack messages
- **java-build** (Build) - Build Java applications
- **example-plugin** (Utility) - Example plugin template

## Best Practices

1. **Naming**: Use kebab-case for plugin names (e.g., `my-awesome-plugin`)
2. **Categories**: Choose the most appropriate category for your plugin
3. **Versioning**: Follow semantic versioning (e.g., `1.0.0`)
4. **Error Handling**: Always handle errors gracefully and provide meaningful messages
5. **Documentation**: Include a README.md in your plugin folder
6. **Configuration**: Use the `getConfigMenu()` method for user-configurable options
7. **Dependencies**: Keep dependencies minimal and document them in `package.json`

## Troubleshooting

If a plugin doesn't load:

1. Check that the plugin implements the `Plugin` interface correctly
2. Ensure the plugin exports a default class
3. Verify that all required properties are defined
4. Check the console for loading errors
5. Make sure the plugin compiles without TypeScript errors

## Plugin API Reference

For detailed API documentation, see the TypeScript interfaces in `src/types/index.ts`.

