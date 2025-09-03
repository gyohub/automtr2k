import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { PluginManager } from '../core/PluginManager';
import { ConfigManager } from '../core/ConfigManager';
import { Repository, BaseBranches, PluginContext, PluginCategory } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class AutomationCLI {
  private program: Command;
  private pluginManager: PluginManager;
  private configManager: ConfigManager;

  constructor() {
    this.program = new Command();
    this.pluginManager = new PluginManager();
    this.configManager = new ConfigManager();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('at2')
      .description('CLI tool for general automation with plugin support')
      .version('1.0.0');

    this.program
      .command('run')
      .description('Run automation tasks')
      .action(() => this.runAutomation());

    this.program
      .command('release')
      .description('Start a release process (legacy command)')
      .action(() => this.startReleaseProcess());

    this.program
      .command('config')
      .description('Manage configuration')
      .action(() => this.manageConfig());

    this.program
      .command('plugins')
      .description('List available plugins')
      .action(() => this.listPlugins());

    this.program
      .command('init')
      .description('Initialize configuration with sample data')
      .action(() => this.initializeConfig());

    this.program
      .command('git')
      .description('Git operations')
      .action(() => this.gitOperations());

    this.program
      .command('build')
      .description('Build operations')
      .action(() => this.buildOperations());

    this.program
      .command('deploy')
      .description('Deployment operations')
      .action(() => this.deployOperations());

    this.program
      .command('notify')
      .description('Send notifications')
      .action(() => this.notifyOperations());
  }

  async run(): Promise<void> {
    try {
      await this.configManager.loadConfig();
      await this.pluginManager.loadPlugins();
      await this.program.parseAsync();
    } catch (error) {
      console.error('❌ CLI failed to start:', error);
      process.exit(1);
    }
  }

  private async runAutomation(): Promise<void> {
    console.log(chalk.blue.bold('🚀 AT2 Automation CLI'));
    console.log(chalk.gray('Select automation category...\n'));

    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select automation category:',
        choices: [
          { name: '🔧 Git Operations (clone, pull, push, etc.)', value: PluginCategory.GIT },
          { name: '💬 Communication (Slack, email, etc.)', value: PluginCategory.COMMUNICATION },
          { name: '🏗️ Build Operations (Java, Node.js, etc.)', value: PluginCategory.BUILD },
          { name: '🚀 Deployment Operations', value: PluginCategory.DEPLOYMENT },
          { name: '🛠️ Utility Operations', value: PluginCategory.UTILITY },
          { name: '🎯 Custom Operations', value: PluginCategory.CUSTOM }
        ]
      }
    ]);

    await this.executeCategoryOperations(category);
  }

  private async executeCategoryOperations(category: PluginCategory): Promise<void> {
    const plugins = this.pluginManager.getPluginsByCategory(category);
    
    if (plugins.length === 0) {
      console.log(chalk.yellow(`No plugins available for category: ${category}`));
      return;
    }

    const { selectedPlugin } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPlugin',
        message: `Select ${category} operation:`,
        choices: plugins.map(plugin => ({
          name: `${plugin.name} - ${plugin.description}`,
          value: plugin.name
        }))
      }
    ]);

    const plugin = this.pluginManager.getPlugin(selectedPlugin);
    if (!plugin) {
      console.log(chalk.red(`Plugin not found: ${selectedPlugin}`));
      return;
    }

    // Get context based on plugin category
    const context = await this.buildPluginContext(plugin, category);
    
    const spinner = ora(`Executing ${plugin.name}...`).start();
    
    try {
      await this.pluginManager.executePlugin(selectedPlugin, context);
      spinner.succeed(`${plugin.name} completed successfully!`);
    } catch (error) {
      spinner.fail(`${plugin.name} failed: ${error}`);
    }
  }

  private async buildPluginContext(plugin: any, category: PluginCategory): Promise<PluginContext> {
    const context: PluginContext = {
      options: {},
      parameters: {}
    };

    switch (category) {
      case PluginCategory.GIT:
        const repository = await this.selectRepository();
        if (repository) {
          context.selectedRepository = repository;
          context.projectFolder = repository.path;
        }
        break;

      case PluginCategory.COMMUNICATION:
        const { message, channel } = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: 'Enter message to send:',
            validate: (input: string) => input.trim() ? true : 'Message cannot be empty'
          },
          {
            type: 'input',
            name: 'channel',
            message: 'Enter channel/recipient:',
            default: '#general'
          }
        ]);
        context.parameters = { message, channel };
        break;

      case PluginCategory.BUILD:
        const { buildType, target } = await inquirer.prompt([
          {
            type: 'list',
            name: 'buildType',
            message: 'Select build type:',
            choices: [
              { name: 'Java (Maven)', value: 'java-maven' },
              { name: 'Java (Gradle)', value: 'java-gradle' },
              { name: 'Node.js', value: 'node' },
              { name: 'Python', value: 'python' },
              { name: 'Docker', value: 'docker' },
              { name: 'Custom', value: 'custom' }
            ]
          },
          {
            type: 'input',
            name: 'target',
            message: 'Enter build target (e.g., clean install):',
            default: 'clean install'
          }
        ]);
        context.parameters = { buildType, target };
        break;

      case PluginCategory.DEPLOYMENT:
        const environment = await this.selectEnvironment();
        if (environment) {
          context.environment = environment.name;
          context.parameters = environment.variables;
        }
        break;

      default:
        // For utility and custom plugins, collect generic parameters
        const { customParams } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customParams',
            message: 'Enter custom parameters (JSON format):',
            default: '{}'
          }
        ]);
        try {
          context.parameters = JSON.parse(customParams);
        } catch {
          context.parameters = {};
        }
        break;
    }

    return context;
  }

  private async gitOperations(): Promise<void> {
    console.log(chalk.blue.bold('🔧 Git Operations'));
    
    const { operation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'operation',
        message: 'Select Git operation:',
        choices: [
          { name: 'Clone Repository', value: 'clone' },
          { name: 'Pull Changes', value: 'pull' },
          { name: 'Push Changes', value: 'push' },
          { name: 'Create Branch', value: 'branch' },
          { name: 'Create Pull Request', value: 'pr' },
          { name: 'Merge Branch', value: 'merge' },
          { name: 'Create Tag', value: 'tag' }
        ]
      }
    ]);

    await this.executeCategoryOperations(PluginCategory.GIT);
  }

  private async buildOperations(): Promise<void> {
    console.log(chalk.blue.bold('🏗️ Build Operations'));
    await this.executeCategoryOperations(PluginCategory.BUILD);
  }

  private async deployOperations(): Promise<void> {
    console.log(chalk.blue.bold('🚀 Deployment Operations'));
    await this.executeCategoryOperations(PluginCategory.DEPLOYMENT);
  }

  private async notifyOperations(): Promise<void> {
    console.log(chalk.blue.bold('💬 Notification Operations'));
    await this.executeCategoryOperations(PluginCategory.COMMUNICATION);
  }

  private async selectRepository(): Promise<Repository | null> {
    const repositories = this.configManager.getRepositories();
    
    if (repositories.length === 0) {
      console.log(chalk.yellow('No repositories configured.'));
      const shouldConfigure = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'configure',
          message: 'Would you like to configure repositories now?',
          default: true
        }
      ]);

      if (shouldConfigure.configure) {
        await this.manageConfig();
        return this.selectRepository();
      }
      return null;
    }

    const { selectedRepo } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedRepo',
        message: 'Select a repository:',
        choices: repositories.map(repo => ({
          name: `${repo.name} (${repo.path})`,
          value: repo.name
        }))
      }
    ]);

    const repository = this.configManager.getRepository(selectedRepo);
    if (repository) {
      this.configManager.updateRepositoryLastUsed(selectedRepo);
    }
    
    return repository || null;
  }

  private async selectEnvironment(): Promise<any> {
    const environments = this.configManager.getEnvironments();
    
    if (environments.length === 0) {
      console.log(chalk.yellow('No environments configured.'));
      return null;
    }

    const { selectedEnv } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedEnv',
        message: 'Select an environment:',
        choices: environments.map(env => ({
          name: `${env.name} (${env.type})`,
          value: env.name
        }))
      }
    ]);

    return this.configManager.getEnvironment(selectedEnv);
  }

  // Legacy release process for backward compatibility
  private async startReleaseProcess(): Promise<void> {
    console.log(chalk.blue.bold('🚀 Release Process (Legacy)'));
    console.log(chalk.gray('Starting release process...\n'));

    try {
      const repository = await this.selectRepository();
      if (!repository) {
        console.log(chalk.yellow('No repository selected. Exiting.'));
        return;
      }

      const tagName = await this.getTagName();
      if (!tagName) {
        console.log(chalk.yellow('No tag name provided. Exiting.'));
        return;
      }

      const confirmed = await this.confirmRelease(repository, tagName);
      if (!confirmed) {
        console.log(chalk.yellow('Release cancelled.'));
        return;
      }

      await this.executeRelease(repository, tagName);

    } catch (error) {
      console.error(chalk.red('❌ Release process failed:'), error);
      process.exit(1);
    }
  }

  private async getTagName(): Promise<string | null> {
    const defaultTag = this.configManager.getDefaultTag();
    
    const { tagName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'tagName',
        message: 'Enter the release tag name:',
        default: defaultTag,
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Tag name cannot be empty';
          }
          return true;
        }
      }
    ]);

    return tagName.trim() || null;
  }

  private async confirmRelease(repository: Repository, tagName: string): Promise<boolean> {
    console.log(chalk.cyan('\n📋 Release Summary:'));
    console.log(chalk.cyan('=================='));
    console.log(chalk.white(`Repository: ${chalk.bold(repository.name)}`));
    console.log(chalk.white(`Path: ${chalk.bold(repository.path)}`));
    if (repository.baseBranches) {
      console.log(chalk.white(`Type: ${chalk.bold(repository.baseBranches.type)}`));
      console.log(chalk.white(`Branches: ${chalk.bold(repository.baseBranches.develop)} → ${chalk.bold(repository.baseBranches.production)}`));
    }
    console.log(chalk.white(`Tag: ${chalk.bold(tagName)}`));
    console.log('');

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Do you want to proceed with this release?',
        default: false
      }
    ]);

    return confirmed;
  }

  private async executeRelease(repository: Repository, tagName: string): Promise<void> {
    const spinner = ora('Preparing release...').start();

    try {
      if (!(await fs.pathExists(repository.path))) {
        spinner.fail(`Repository path does not exist: ${repository.path}`);
        throw new Error(`Repository path does not exist: ${repository.path}`);
      }

      const pluginName = repository.baseBranches?.type === 'custom' 
        ? 'custom-release' 
        : 'standard-release';

      const plugin = this.pluginManager.getPlugin(pluginName);
      if (!plugin) {
        spinner.fail(`Plugin not found: ${pluginName}`);
        throw new Error(`Plugin not found: ${pluginName}`);
      }

      spinner.succeed('Release prepared successfully');

      const context: PluginContext = {
        projectFolder: repository.path,
        tagName,
        baseBranches: repository.baseBranches,
        options: {}
      };

      await this.pluginManager.executePlugin(pluginName, context);

      console.log(chalk.green.bold('\n🎉 Release completed successfully!'));

    } catch (error) {
      spinner.fail('Release failed');
      throw error;
    }
  }

  private async manageConfig(): Promise<void> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'List repositories', value: 'list-repos' },
          { name: 'Add repository', value: 'add-repo' },
          { name: 'Remove repository', value: 'remove-repo' },
          { name: 'List plugins', value: 'list-plugins' },
          { name: 'List environments', value: 'list-environments' },
          { name: 'Configure integrations', value: 'integrations' },
          { name: 'Create sample config', value: 'sample' },
          { name: 'Back to main menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'list-repos':
        this.configManager.listRepositories();
        break;
      case 'add-repo':
        await this.addRepository();
        break;
      case 'remove-repo':
        await this.removeRepository();
        break;
      case 'list-plugins':
        this.configManager.listPlugins();
        break;
      case 'list-environments':
        this.configManager.listEnvironments();
        break;
      case 'integrations':
        await this.configureIntegrations();
        break;
      case 'sample':
        await this.configManager.createSampleConfig();
        break;
      case 'back':
        return;
    }

    await this.manageConfig();
  }

  private async addRepository(): Promise<void> {
    const { name, path, type, url } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Repository name:',
        validate: (input: string) => input.trim() ? true : 'Name cannot be empty'
      },
      {
        type: 'input',
        name: 'path',
        message: 'Repository path:',
        default: './',
        validate: (input: string) => input.trim() ? true : 'Path cannot be empty'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Repository type:',
        choices: [
          { name: 'Git', value: 'git' },
          { name: 'SVN', value: 'svn' },
          { name: 'Other', value: 'other' }
        ]
      },
      {
        type: 'input',
        name: 'url',
        message: 'Repository URL (optional):',
        default: ''
      }
    ]);

    const repository: Repository = {
      name: name.trim(),
      path: path.trim(),
      type: type as any,
      url: url.trim() || undefined
    };

    this.configManager.addRepository(repository);
    await this.configManager.saveConfig();
    
    console.log(chalk.green(`✅ Repository '${name}' added successfully`));
  }

  private async removeRepository(): Promise<void> {
    const repositories = this.configManager.getRepositories();
    
    if (repositories.length === 0) {
      console.log(chalk.yellow('No repositories to remove.'));
      return;
    }

    const { repoName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'repoName',
        message: 'Select repository to remove:',
        choices: repositories.map(repo => ({
          name: `${repo.name} (${repo.path})`,
          value: repo.name
        }))
      }
    ]);

    const removed = this.configManager.removeRepository(repoName);
    if (removed) {
      await this.configManager.saveConfig();
      console.log(chalk.green(`✅ Repository '${repoName}' removed successfully`));
    } else {
      console.log(chalk.yellow(`Repository '${repoName}' not found.`));
    }
  }

  private async configureIntegrations(): Promise<void> {
    const { integration } = await inquirer.prompt([
      {
        type: 'list',
        name: 'integration',
        message: 'Select integration to configure:',
        choices: [
          { name: 'Slack', value: 'slack' },
          { name: 'GitHub', value: 'github' },
          { name: 'Jira', value: 'jira' },
          { name: 'Email', value: 'email' },
          { name: 'Webhook', value: 'webhook' }
        ]
      }
    ]);

    // For now, just show a placeholder
    console.log(chalk.yellow(`Integration configuration for ${integration} will be implemented in future versions.`));
  }

  private listPlugins(): void {
    this.pluginManager.listPlugins();
  }

  private async initializeConfig(): Promise<void> {
    try {
      await this.configManager.createSampleConfig();
      console.log(chalk.green('✅ Configuration initialized successfully!'));
      console.log(chalk.cyan('You can now use the "config" command to manage repositories and plugins.'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize configuration:'), error);
    }
  }
}
