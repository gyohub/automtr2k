# AT2 Plugins

This directory contains all plugins for the AT2 automation CLI. Each plugin is organized in its own folder with a standardized structure.

## Plugin Structure

Each plugin follows this directory structure:

```
plugins/
├── plugin-name/
│   ├── index.ts          # Main plugin implementation
│   ├── package.json      # Plugin metadata and dependencies
│   ├── README.md         # Plugin documentation (optional)
│   └── assets/           # Plugin assets (optional)
```

## Plugin Categories

Plugins are organized by categories:

- **🔧 Git Operations** (`PluginCategory.GIT`)
- **💬 Communication** (`PluginCategory.COMMUNICATION`)
- **🏗️ Build Operations** (`PluginCategory.BUILD`)
- **🚀 Deployment Operations** (`PluginCategory.DEPLOYMENT`)
- **🛠️ Utility Operations** (`PluginCategory.UTILITY`)
- **🎯 Custom Operations** (`PluginCategory.CUSTOM`)

## Available Plugins

### 🔧 Git Operations
- **git-clone**: Clone repositories with specific branches

### 💬 Communication
- **slack-notification**: Send notifications to Slack channels

### 🏗️ Build Operations
- **java-build**: Build Java applications using Maven or Gradle

### 🚀 Deployment Operations
- **standard-release**: Standard release process for develop → master workflow
- **custom-release**: Custom release process for develop-custom → develop workflow

### 🛠️ Utility Operations
- **example-plugin**: Example plugin demonstrating the plugin system

## Creating a New Plugin

1. Create a new folder in the `plugins/` directory with your plugin name
2. Create an `index.ts` file with your plugin implementation
3. Create a `package.json` file with plugin metadata
4. Implement the `Plugin` interface

### Example Plugin Structure

```typescript
// plugins/my-plugin/index.ts
import { Plugin, PluginContext, PluginCategory } from '../../src/types';

export default class MyPlugin implements Plugin {
  name = 'my-plugin';
  description = 'Description of my plugin';
  version = '1.0.0';
  category = PluginCategory.CUSTOM;

  async execute(context: PluginContext): Promise<void> {
    // Your plugin logic here
    const { parameters } = context;
    
    console.log('Executing my plugin...');
    // Implement your automation logic
  }
}
```

```json
// plugins/my-plugin/package.json
{
  "name": "at2-my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin for AT2",
  "main": "index.js",
  "keywords": ["at2", "plugin", "custom"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "chalk": "^5.3.0"
  }
}
```

## Plugin Loading

The PluginManager automatically:
1. Scans the plugins directory for subdirectories
2. Looks for `index.js` or `index.ts` files in each plugin folder
3. Loads and validates each plugin
4. Organizes plugins by category for easy access

## Plugin Context

Each plugin receives a `PluginContext` object containing:

- `projectFolder`: Path to the project directory
- `parameters`: Custom parameters passed from CLI
- `options`: Plugin-specific options
- `selectedRepository`: Selected repository (if applicable)
- `environment`: Target environment (if applicable)

## Best Practices

1. **Use descriptive names**: Plugin names should clearly indicate their purpose
2. **Include proper documentation**: Add README.md files for complex plugins
3. **Handle errors gracefully**: Always provide meaningful error messages
4. **Use appropriate categories**: Choose the right category for your plugin
5. **Keep dependencies minimal**: Only include necessary dependencies
6. **Follow naming conventions**: Use kebab-case for plugin names and folders

## Testing Plugins

To test your plugin:

1. Build the project: `npm run build`
2. Run the CLI: `node dist/src/index.js plugins`
3. Test your plugin: `node dist/src/index.js run`

## Contributing

When contributing plugins:

1. Follow the established structure
2. Include proper error handling
3. Add appropriate logging
4. Test thoroughly before submitting
5. Update this README if adding new categories or significant features

