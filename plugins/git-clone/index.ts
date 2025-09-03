import { Plugin, PluginContext, PluginCategory } from '../../src/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export default class GitClonePlugin implements Plugin {
  name = 'git-clone';
  description = 'Clone a Git repository to a specified location';
  version = '1.0.0';
  category = PluginCategory.GIT;

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
