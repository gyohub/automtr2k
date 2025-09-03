# AT2

A powerful Node.js CLI tool for automating project releases with plugin support. This tool streamlines the release process by automating Git operations while maintaining the critical manual conflict resolution step.

## Features

- 🚀 **Plugin Architecture**: Extensible plugin system for different release workflows
- 🔄 **Multiple Repository Types**: Support for both standard (develop → master) and custom (develop-custom → develop) workflows
- 📁 **Repository Management**: Easy configuration and management of multiple repositories
- ⚠️ **Conflict Resolution**: Intelligent handling of merge conflicts with user intervention
- 🎯 **Interactive CLI**: User-friendly interface with guided workflows
- 📦 **NPM Ready**: Designed to be published as an npm package

## Installation

### From Source

```bash
# Clone the repository
git clone <your-repo-url>
cd at2

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### As NPM Package (when published)

```bash
npm install -g at2
```

### Windows PowerShell Setup

If you encounter execution policy errors on Windows PowerShell, you have several options:

#### Option 1: Enable Script Execution (Recommended)
Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Type "Y" when prompted. This allows signed scripts to run, which is required for npm packages.

#### Option 2: Use Command Prompt
Use Command Prompt (cmd.exe) instead of PowerShell:
```cmd
npm install -g at2
at2 init
```

#### Option 3: Use npx (No Installation Required)
Run the CLI directly without global installation:
```bash
npx at2 init
npx at2 release
npx at2 config
npx at2 plugins
```

#### Option 4: Run Directly from Project
If you're in the project directory:
```bash
npm run build
node dist/src/index.js init
```

## Quick Start

1. **Initialize Configuration**
   ```bash
   at2 init
   ```

2. **Start Release Process**
   ```bash
   at2 release
   ```

3. **Manage Configuration**
   ```bash
   at2 config
   ```

4. **List Available Plugins**
   ```bash
   at2 plugins
   ```

## Configuration

The CLI uses a YAML configuration file (`release-config.yml`) to store repository information and settings.

### Sample Configuration

```yaml
repositories:
  - name: custom-project
    path: ./custom-project
    baseBranches:
      develop: develop-custom
      production: develop
      type: custom
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

### Custom Workflow
- **Develop Branch**: `develop-custom`
- **Production Branch**: `develop`
- **Flow**: `develop-custom` → `develop`

## Plugin System

The CLI uses a plugin architecture that allows you to extend functionality beyond the built-in release processes.

### Built-in Plugins

1. **Standard Release Plugin** (`standard-release`)
   - Handles repositories with develop and master branches
   - Creates rollback tags and release branches
   - Manages merge conflicts

2. **Custom Release Plugin** (`custom-release`)
   - Handles repositories with develop-custom and develop branches
   - Follows the custom-specific workflow
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
