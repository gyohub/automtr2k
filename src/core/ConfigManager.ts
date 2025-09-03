import { Repository, ReleaseConfig, BaseBranches } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';

export class ConfigManager {
  private configPath: string;
  private config: ReleaseConfig;

  constructor(configPath: string = './qima-release-config.yml') {
    this.configPath = configPath;
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): ReleaseConfig {
    return {
      repositories: [],
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

  async createSampleConfig(): Promise<void> {
    const sampleRepos: Repository[] = [
      {
        name: 'qimacert',
        path: './qimacert',
        baseBranches: {
          develop: 'develop-qimacert',
          production: 'develop',
          type: 'qimacert'
        }
      },
      {
        name: 'standard-project',
        path: './standard-project',
        baseBranches: {
          develop: 'develop',
          production: 'master',
          type: 'standard'
        }
      }
    ];

    this.config.repositories = sampleRepos;
    await this.saveConfig();
    console.log('✅ Sample configuration created with example repositories');
  }

  listRepositories(): void {
    if (this.config.repositories.length === 0) {
      console.log('No repositories configured');
      return;
    }

    console.log('\n📁 Configured Repositories:');
    console.log('============================');
    
    this.config.repositories.forEach((repo, index) => {
      const lastUsed = repo.lastUsed ? ` (Last used: ${repo.lastUsed.toLocaleDateString()})` : '';
      console.log(`${index + 1}. ${repo.name} - ${repo.path}${lastUsed}`);
      console.log(`   Type: ${repo.baseBranches.type}`);
      console.log(`   Branches: ${repo.baseBranches.develop} → ${repo.baseBranches.production}`);
      console.log('');
    });
  }
}
