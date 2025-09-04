import { Plugin, PluginContext, PluginCategory, ConfigMenu } from '../../src/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export default class GitClonePlugin implements Plugin {
  name = 'git-clone';
  description = 'Clone a Git repository to a specified location';
  version = '1.0.0';
  category = PluginCategory.GIT;

  getConfigMenu(): ConfigMenu {
    return {
      title: 'Git Clone Configuration',
      description: 'Configure default clone settings and repository preferences',
      options: [
        {
          key: 'defaultBranch',
          label: 'Default Branch',
          description: 'Default branch to clone (e.g., main, master, develop)',
          type: 'input',
          default: 'main'
        },
        {
          key: 'defaultTargetPath',
          label: 'Default Target Path',
          description: 'Default directory for cloned repositories',
          type: 'input',
          default: './cloned-repo'
        },
        {
          key: 'cloneDepth',
          label: 'Clone Depth',
          description: 'Depth for shallow clone (0 for full clone)',
          type: 'input',
          default: '0',
          validation: (value: string) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 0) {
              return 'Depth must be a non-negative number';
            }
            return null;
          }
        },
        {
          key: 'enableSubmodules',
          label: 'Enable Submodules',
          description: 'Clone submodules recursively',
          type: 'boolean',
          default: true
        },
        {
          key: 'enableLFS',
          label: 'Enable Git LFS',
          description: 'Enable Git Large File Storage',
          type: 'boolean',
          default: false
        },
        {
          key: 'timeout',
          label: 'Clone Timeout (minutes)',
          description: 'Maximum time to wait for clone completion',
          type: 'input',
          default: '10',
          validation: (value: string) => {
            const num = parseInt(value);
            if (isNaN(num) || num <= 0) {
              return 'Timeout must be a positive number';
            }
            return null;
          }
        }
      ]
    };
  }

  async execute(context: PluginContext): Promise<void> {
    const { url, targetPath, branch } = context.parameters || {};
    
    if (!url) {
      throw new Error('Repository URL is required');
    }

    const clonePath = targetPath || './cloned-repo';
    const cloneBranch = branch || 'main';

    console.log(chalk.blue(`🔧 Cloning repository: ${url}`));
    console.log(chalk.gray(`Target path: ${clonePath}`));
    console.log(chalk.gray(`Branch: ${cloneBranch}`));

    try {
      // Clone the repository
      const cloneCommand = `git clone -b ${cloneBranch} ${url} ${clonePath}`;
      console.log(chalk.gray(`Executing: ${cloneCommand}`));
      
      const { stdout, stderr } = await execAsync(cloneCommand);
      
      if (stderr && !stderr.includes('Cloning into')) {
        console.warn(chalk.yellow(`Warning: ${stderr}`));
      }
      
      console.log(chalk.green(`✅ Repository cloned successfully to ${clonePath}`));
      console.log(chalk.gray(stdout));
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to clone repository: ${error}`));
      throw error;
    }
  }
}
