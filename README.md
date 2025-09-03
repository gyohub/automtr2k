# AT2

A powerful Node.js CLI tool for general automation with plugin support. This tool streamlines various development operations including Git operations, build processes, deployments, and communications while maintaining extensibility through a robust plugin architecture.

## Features

- 🚀 **Plugin Architecture**: Extensible plugin system for any type of automation
- 🔧 **Git Operations**: Clone, pull, push, merge, branch, and tag management
- 💬 **Communication**: Slack notifications, email, webhooks, and more
- 🏗️ **Build Automation**: Java (Maven/Gradle), Node.js, Python, Docker builds
- 🚀 **Deployment**: Multi-environment deployment with rollback support
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

2. **Run Automation Tasks**
   ```bash
   at2 run
   ```

3. **Git Operations**
   ```bash
   at2 git
   ```

4. **Build Operations**
   ```bash
   at2 build
   ```

5. **Deployment Operations**
   ```bash
   at2 deploy
   ```

6. **Send Notifications**
   ```bash
   at2 notify
   ```

7. **Manage Configuration**
   ```bash
   at2 config
   ```

8. **List Available Plugins**
   ```bash
   at2 plugins
   ```

9. **Legacy Release Process**
   ```bash
   at2 release
   ```

## Configuration

The CLI uses a YAML configuration file (`automation-config.yml`) to store repository information, plugin settings, environments, and integrations.

### Sample Configuration

```yaml
repositories:
  - name: custom-project
    path: ./custom-project
    type: git
    url: https://github.com/example/custom-project.git
    baseBranches:
      develop: develop-custom
      production: develop
      type: custom
  - name: standard-project
    path: ./standard-project
    type: git
    url: https://github.com/example/standard-project.git
    baseBranches:
      develop: develop
      production: master
      type: standard

plugins:
  - name: git-clone
    enabled: true
    settings: { defaultBranch: 'main' }
  - name: slack-notification
    enabled: true
    settings: { defaultChannel: '#general' }
  - name: java-build
    enabled: true
    settings: { mavenCommand: 'mvn clean install' }

environments:
  - name: development
    type: development
    variables: { NODE_ENV: 'development' }
    repositories: ['custom-project']
  - name: staging
    type: staging
    variables: { NODE_ENV: 'staging' }
    repositories: ['standard-project']
  - name: production
    type: production
    variables: { NODE_ENV: 'production' }
    repositories: ['standard-project']

integrations:
  slack:
    enabled: false
    channels: ['#general']
    defaultChannel: '#general'
  github:
    enabled: false
  jira:
    enabled: false

defaultTag: "1.0.0"
defaultBaseBranches:
  develop: develop
  production: master
  type: standard
```

## Plugin Categories

The CLI supports various categories of plugins to handle different types of automation:

### 🔧 Git Operations
- **Clone Repository**: Clone repositories with specific branches
- **Pull Changes**: Update local repositories with remote changes
- **Push Changes**: Push local changes to remote repositories
- **Create Branch**: Create new branches for development
- **Create Pull Request**: Automate pull request creation
- **Merge Branch**: Merge branches with conflict resolution
- **Create Tag**: Create and push version tags

### 💬 Communication
- **Slack Notifications**: Send messages to Slack channels
- **Email Notifications**: Send email notifications
- **Webhook Calls**: Trigger webhooks with custom payloads
- **Jira Integration**: Create and update Jira tickets

### 🏗️ Build Operations
- **Java (Maven)**: Build Java applications with Maven
- **Java (Gradle)**: Build Java applications with Gradle
- **Node.js**: Build Node.js applications
- **Python**: Build Python applications
- **Docker**: Build Docker containers
- **Custom Builds**: Execute custom build scripts

### 🚀 Deployment Operations
- **Standard Release**: Release process for develop → master workflow
- **Custom Release**: Release process for custom branch workflows
- **Environment Deployment**: Deploy to specific environments
- **Rollback**: Rollback deployments to previous versions

### 🛠️ Utility Operations
- **File Operations**: Copy, move, and manage files
- **Database Operations**: Database migrations and backups
- **System Commands**: Execute system commands
- **Custom Scripts**: Run custom automation scripts

### 🎯 Custom Operations
- **Custom Plugins**: Implement any custom automation logic
- **Integration Plugins**: Connect with external systems
- **Workflow Plugins**: Orchestrate complex workflows

## Plugin System

The CLI uses a plugin architecture that allows you to extend functionality for any type of automation. Plugins are organized by categories and can be easily created and managed.

### Built-in Plugins

#### 🔧 Git Operations
1. **Git Clone Plugin** (`git-clone`)
   - Clone repositories with specific branches
   - Supports custom target paths and branch selection

#### 💬 Communication
1. **Slack Notification Plugin** (`slack-notification`)
   - Send messages to Slack channels
   - Supports webhook URLs and custom channels

#### 🏗️ Build Operations
1. **Java Build Plugin** (`java-build`)
   - Build Java applications with Maven or Gradle
   - Supports custom build targets and project paths

#### 🚀 Deployment Operations
1. **Standard Release Plugin** (`standard-release`)
   - Handles repositories with develop and master branches
   - Creates rollback tags and release branches
   - Manages merge conflicts

2. **Custom Release Plugin** (`custom-release`)
   - Handles repositories with develop-custom and develop branches
   - Follows the custom-specific workflow
   - Creates appropriate tags and branches

#### 🛠️ Utility Operations
1. **Example Plugin** (`example-plugin`)
   - Demonstrates plugin system capabilities
   - Shows how to create custom plugins

### Creating Custom Plugins

To create a custom plugin, implement the `Plugin` interface:

```typescript
import { Plugin, PluginContext, PluginCategory } from '../src/types';

export default class CustomPlugin implements Plugin {
  name = 'custom-plugin';
  description = 'Description of your custom plugin';
  version = '1.0.0';
  category = PluginCategory.CUSTOM; // Choose appropriate category

  async execute(context: PluginContext): Promise<void> {
    // Your custom logic here
    const { projectFolder, parameters, options } = context;
    
    // Access parameters passed from CLI
    const { customParam1, customParam2 } = parameters || {};
    
    // Implement your workflow
    console.log('Executing custom plugin...');
    
    // Example: Execute a system command
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout } = await execAsync('your-command-here');
      console.log('Command output:', stdout);
    } catch (error) {
      throw new Error(`Custom plugin failed: ${error}`);
    }
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
