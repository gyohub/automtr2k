# Automator2000

A powerful Node.js CLI tool for automating QIMA project releases with plugin support. This tool streamlines the release process by automating Git operations while maintaining the critical manual conflict resolution step.

## Features

- 🚀 **Plugin Architecture**: Extensible plugin system for different release workflows
- 🔄 **Multiple Repository Types**: Support for both standard (develop → master) and QIMACert (develop-qimacert → develop) workflows
- 📁 **Repository Management**: Easy configuration and management of multiple repositories
- ⚠️ **Conflict Resolution**: Intelligent handling of merge conflicts with user intervention
- 🎯 **Interactive CLI**: User-friendly interface with guided workflows
- 📦 **NPM Ready**: Designed to be published as an npm package

## Installation

### From Source

```bash
# Clone the repository
git clone <your-repo-url>
cd automator2000

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### As NPM Package (when published)

```bash
npm install -g automator2000
```

## Quick Start

1. **Initialize Configuration**
   ```bash
   automator2000 init
   ```

2. **Start Release Process**
   ```bash
   automator2000 release
   ```

3. **Manage Configuration**
   ```bash
   automator2000 config
   ```

4. **List Available Plugins**
   ```bash
   automator2000 plugins
   ```

## Configuration

The CLI uses a YAML configuration file (`qima-release-config.yml`) to store repository information and settings.

### Sample Configuration

```yaml
repositories:
  - name: qimacert
    path: ./qimacert
    baseBranches:
      develop: develop-qimacert
      production: develop
      type: qimacert
  - name: standard-project
    path: ./standard-project
    baseBranches:
      develop: develop
      production: master
      type: standard
defaultTag: "1.0.0"
defaultBaseBranches:
  develop: develop
  production: master
  type: standard
```

## Repository Types

### Standard Workflow
- **Develop Branch**: `develop`
- **Production Branch**: `master`
- **Flow**: `develop` → `master`

### QIMACert Workflow
- **Develop Branch**: `develop-qimacert`
- **Production Branch**: `develop`
- **Flow**: `develop-qimacert` → `develop`

## Plugin System

The CLI uses a plugin architecture that allows you to extend functionality beyond the built-in release processes.

### Built-in Plugins

1. **Standard Release Plugin** (`standard-release`)
   - Handles repositories with develop and master branches
   - Creates rollback tags and release branches
   - Manages merge conflicts

2. **QIMACert Release Plugin** (`qimacert-release`)
   - Handles repositories with develop-qimacert and develop branches
   - Follows the QIMACert-specific workflow
   - Creates appropriate tags and branches

### Creating Custom Plugins

To create a custom plugin, implement the `Plugin` interface:

```typescript
import { Plugin, PluginContext } from '../src/types';

export default class CustomPlugin implements Plugin {
  name = 'custom-plugin';
  description = 'Description of your custom plugin';
  version = '1.0.0';

  async execute(context: PluginContext): Promise<void> {
    // Your custom logic here
    const { projectFolder, tagName, baseBranches, options } = context;
    
    // Implement your workflow
  }
}
```

Place your plugin in the `plugins/` directory and it will be automatically loaded.

## Release Process

The CLI automates the following steps:

1. **Fetch and Update**: Get latest changes from remote
2. **Checkout Base Branch**: Switch to the appropriate development branch
3. **Create Rollback Tag**: Tag current state for potential rollback
4. **Create Release Branch**: New branch for the release
5. **Merge Production**: Merge production branch into release branch
6. **Conflict Resolution**: Wait for user to resolve any conflicts
7. **Create Version Tag**: Tag the release version
8. **Push Changes**: Push all branches and tags to remote

## Conflict Resolution

When merge conflicts occur, the CLI:

1. Detects conflicts automatically
2. Displays conflict information
3. Waits for manual resolution
4. Verifies resolution before continuing
5. Provides clear instructions for conflict resolution

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Scripts

```bash
# Development
npm run dev          # Run with ts-node
npm run build        # Build TypeScript
npm run start        # Run built version
npm run clean        # Clean build artifacts

# Quality
npm run lint         # Run ESLint
npm run test         # Run tests

# Package
npm run build        # Build for distribution
```

### Project Structure

```
src/
├── cli/             # CLI interface
├── core/            # Core functionality
│   ├── ConfigManager.ts
│   ├── GitManager.ts
│   └── PluginManager.ts
└── types/           # TypeScript interfaces
plugins/             # Plugin implementations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the configuration examples

## Roadmap

- [ ] GitHub API integration for repository discovery
- [ ] Batch release processing
- [ ] Release notes generation
- [ ] Integration with CI/CD pipelines
- [ ] More plugin examples
- [ ] Configuration validation
- [ ] Rollback functionality
