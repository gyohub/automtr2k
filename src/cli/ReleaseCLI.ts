import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { PluginManager } from '../core/PluginManager';
import { ConfigManager } from '../core/ConfigManager';
import { Repository, BaseBranches, PluginContext } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class ReleaseCLI {
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
      .description('CLI tool for automating QIMA project releases')
      .version('1.0.0');

    this.program
      .command('release')
      .description('Start a release process')
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

  private async startReleaseProcess(): Promise<void> {
    console.log(chalk.blue.bold('🚀 QIMA Release CLI'));
    console.log(chalk.gray('Starting release process...\n'));

    try {
      // Select repository
      const repository = await this.selectRepository();
      if (!repository) {
        console.log(chalk.yellow('No repository selected. Exiting.'));
        return;
      }

      // Get tag name
      const tagName = await this.getTagName();
      if (!tagName) {
        console.log(chalk.yellow('No tag name provided. Exiting.'));
        return;
      }

      // Confirm release
      const confirmed = await this.confirmRelease(repository, tagName);
      if (!confirmed) {
        console.log(chalk.yellow('Release cancelled.'));
        return;
      }

      // Execute release
      await this.executeRelease(repository, tagName);

    } catch (error) {
      console.error(chalk.red('❌ Release process failed:'), error);
      process.exit(1);
    }
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
        message: 'Select a repository to release:',
        choices: repositories.map(repo => ({
          name: `${repo.name} (${repo.path}) - ${repo.baseBranches.type}`,
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
    console.log(chalk.white(`Type: ${chalk.bold(repository.baseBranches.type)}`));
    console.log(chalk.white(`Tag: ${chalk.bold(tagName)}`));
    console.log(chalk.white(`Branches: ${chalk.bold(repository.baseBranches.develop)} → ${chalk.bold(repository.baseBranches.production)}`));
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
      // Check if repository path exists
      if (!(await fs.pathExists(repository.path))) {
        spinner.fail(`Repository path does not exist: ${repository.path}`);
        throw new Error(`Repository path does not exist: ${repository.path}`);
      }

      // Determine which plugin to use
      const pluginName = repository.baseBranches.type === 'qimacert' 
        ? 'qimacert-release' 
        : 'standard-release';

      const plugin = this.pluginManager.getPlugin(pluginName);
      if (!plugin) {
        spinner.fail(`Plugin not found: ${pluginName}`);
        throw new Error(`Plugin not found: ${pluginName}`);
      }

      spinner.succeed('Release prepared successfully');

      // Create plugin context
      const context: PluginContext = {
        projectFolder: repository.path,
        tagName,
        baseBranches: repository.baseBranches,
        options: {}
      };

      // Execute the plugin
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
          { name: 'List repositories', value: 'list' },
          { name: 'Add repository', value: 'add' },
          { name: 'Remove repository', value: 'remove' },
          { name: 'Create sample config', value: 'sample' },
          { name: 'Back to main menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'list':
        this.configManager.listRepositories();
        break;
      case 'add':
        await this.addRepository();
        break;
      case 'remove':
        await this.removeRepository();
        break;
      case 'sample':
        await this.configManager.createSampleConfig();
        break;
      case 'back':
        return;
    }

    // Continue managing config
    await this.manageConfig();
  }

  private async addRepository(): Promise<void> {
    const { name, path, type } = await inquirer.prompt([
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
          { name: 'Standard (develop → master)', value: 'standard' },
          { name: 'QIMACert (develop-qimacert → develop)', value: 'qimacert' }
        ]
      }
    ]);

    const baseBranches: BaseBranches = type === 'qimacert' 
      ? {
          develop: 'develop-qimacert',
          production: 'develop',
          type: 'qimacert'
        }
      : {
          develop: 'develop',
          production: 'master',
          type: 'standard'
        };

    const repository: Repository = {
      name: name.trim(),
      path: path.trim(),
      baseBranches
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

  private listPlugins(): void {
    this.pluginManager.listPlugins();
  }

  private async initializeConfig(): Promise<void> {
    try {
      await this.configManager.createSampleConfig();
      console.log(chalk.green('✅ Configuration initialized successfully!'));
      console.log(chalk.cyan('You can now use the "config" command to manage repositories.'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize configuration:'), error);
    }
  }
}
