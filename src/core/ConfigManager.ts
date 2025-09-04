import { 
  Repository, 
  AutomationConfig, 
  BaseBranches, 
  EnvironmentConfig, 
  IntegrationConfig
} from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';

export class ConfigManager {
  private configPath: string;
  private config: AutomationConfig;

  constructor(configPath: string = './automation-config.yml') {
    this.configPath = configPath;
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): AutomationConfig {
    return {
      repositories: [],
      environments: [
        {
          name: 'development',
          type: 'development',
          variables: {},
          repositories: []
        },
        {
          name: 'staging',
          type: 'staging',
          variables: {},
          repositories: []
        },
        {
          name: 'production',
          type: 'production',
          variables: {},
          repositories: []
        }
      ],
      integrations: {},
      defaultTag: '1.0.0',
      defaultBaseBranches: {
        develop: 'develop',
        production: 'master',
        type: 'standard'
      }
    };
  }

  async loadConfig(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configContent = await fs.readFile(this.configPath, 'utf-8');
        this.config = yaml.parse(configContent);
        console.log(`✅ Configuration loaded from ${this.configPath}`);
      } else {
        console.log(`📝 Configuration file not found. Creating default config at ${this.configPath}`);
        await this.saveConfig();
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load config: ${error}. Using default configuration.`);
      this.config = this.getDefaultConfig();
    }
  }

  async saveConfig(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeFile(this.configPath, yaml.stringify(this.config, { indent: 2 }));
      console.log(`✅ Configuration saved to ${this.configPath}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  // Repository management
  getRepositories(): Repository[] {
    return this.config.repositories;
  }

  addRepository(repo: Repository): void {
    const existingIndex = this.config.repositories.findIndex(r => r.name === repo.name);
    if (existingIndex >= 0) {
      this.config.repositories[existingIndex] = { ...repo, lastUsed: new Date() };
    } else {
      this.config.repositories.push({ ...repo, lastUsed: new Date() });
    }
  }

  removeRepository(repoName: string): boolean {
    const initialLength = this.config.repositories.length;
    this.config.repositories = this.config.repositories.filter(r => r.name !== repoName);
    return this.config.repositories.length < initialLength;
  }

  getRepository(repoName: string): Repository | undefined {
    return this.config.repositories.find(r => r.name === repoName);
  }

  updateRepositoryLastUsed(repoName: string): void {
    const repo = this.getRepository(repoName);
    if (repo) {
      repo.lastUsed = new Date();
    }
  }

  // Environment management
  getEnvironments(): EnvironmentConfig[] {
    return this.config.environments;
  }

  addEnvironment(env: EnvironmentConfig): void {
    const existingIndex = this.config.environments.findIndex(e => e.name === env.name);
    if (existingIndex >= 0) {
      this.config.environments[existingIndex] = env;
    } else {
      this.config.environments.push(env);
    }
  }

  removeEnvironment(envName: string): boolean {
    const initialLength = this.config.environments.length;
    this.config.environments = this.config.environments.filter(e => e.name !== envName);
    return this.config.environments.length < initialLength;
  }

  getEnvironment(envName: string): EnvironmentConfig | undefined {
    return this.config.environments.find(e => e.name === envName);
  }

  // Integration management
  getIntegrations(): IntegrationConfig {
    return this.config.integrations;
  }

  updateIntegrations(integrations: IntegrationConfig): void {
    this.config.integrations = { ...this.config.integrations, ...integrations };
  }

  // Legacy methods for backward compatibility
  getDefaultTag(): string {
    return this.config.defaultTag || '1.0.0';
  }

  setDefaultTag(tag: string): void {
    this.config.defaultTag = tag;
  }

  getDefaultBaseBranches(): BaseBranches {
    return this.config.defaultBaseBranches || {
      develop: 'develop',
      production: 'master',
      type: 'standard'
    };
  }

  setDefaultBaseBranches(baseBranches: BaseBranches): void {
    this.config.defaultBaseBranches = baseBranches;
  }

  // Configuration management
  listRepositories(): void {
    if (this.config.repositories.length === 0) {
      console.log('No repositories configured.');
      return;
    }

    console.log('\n📁 Configured Repositories:');
    console.log('==========================');
    this.config.repositories.forEach((repo, index) => {
      let lastUsedText = '';
      if (repo.lastUsed) {
        // Handle both Date objects and string dates
        const lastUsedDate = repo.lastUsed instanceof Date ? repo.lastUsed : new Date(repo.lastUsed);
        lastUsedText = ` (Last used: ${lastUsedDate.toLocaleDateString()})`;
      }
      console.log(`${index + 1}. ${repo.name} - ${repo.path}${lastUsedText}`);
      if (repo.type) console.log(`   Type: ${repo.type}`);
      if (repo.url) console.log(`   URL: ${repo.url}`);
    });
  }

    listEnvironments(): void {
    if (this.config.environments.length === 0) {
      console.log('No environments configured.');
      return;
    }

    console.log('\n🌍 Configured Environments:');
    console.log('============================');
    this.config.environments.forEach((env, index) => {
      console.log(`${index + 1}. ${env.name} (${env.type})`);
      console.log(`   Repositories: ${env.repositories.join(', ') || 'None'}`);
    });
  }

  async createSampleConfig(): Promise<void> {
    // Add sample repositories
    this.addRepository({
      name: 'custom-project',
      path: './custom-project',
      type: 'git',
      url: 'https://github.com/example/custom-project.git',
      baseBranches: {
        develop: 'develop-custom',
        production: 'develop',
        type: 'custom'
      }
    });

    this.addRepository({
      name: 'standard-project',
      path: './standard-project',
      type: 'git',
      url: 'https://github.com/example/standard-project.git',
      baseBranches: {
        develop: 'develop',
        production: 'master',
        type: 'standard'
      }
    });

    // Add sample integrations
    this.updateIntegrations({
      slack: {
        enabled: false,
        channels: ['#general'],
        defaultChannel: '#general'
      },
      github: {
        enabled: false
      }
    });

    await this.saveConfig();
    console.log('✅ Sample configuration created with example repositories and integrations');
  }
}
