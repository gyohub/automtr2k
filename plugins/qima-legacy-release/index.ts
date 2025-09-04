import { Plugin, PluginContext, PluginCategory, ConfigMenu } from '../../src/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export default class QimaLegacyReleasePlugin implements Plugin {
  name = 'qima-legacy-release';
  description = 'Legacy QIMA release process with develop-qimacert and develop branches';
  version = '1.0.0';
  category = PluginCategory.RELEASE;

  getConfigMenu(): ConfigMenu {
    return {
      title: 'QIMA Legacy Release Configuration',
      description: 'Configure the legacy QIMA release process settings',
      options: [
        {
          key: 'developBranch',
          label: 'Develop Branch',
          description: 'Main develop branch name',
          type: 'input',
          default: 'develop'
        },
        {
          key: 'qimacertBranch',
          label: 'QIMACert Branch',
          description: 'QIMACert develop branch name',
          type: 'input',
          default: 'develop-qimacert'
        },
        {
          key: 'tagPrefix',
          label: 'Tag Prefix',
          description: 'Prefix for version tags (e.g., v_qimacert_)',
          type: 'input',
          default: 'v_qimacert_'
        },
        {
          key: 'rollbackPrefix',
          label: 'Rollback Tag Prefix',
          description: 'Prefix for rollback tags (e.g., rollback_develop_qimacert_v)',
          type: 'input',
          default: 'rollback_develop_qimacert_v'
        },
        {
          key: 'releaseBranchPrefix',
          label: 'Release Branch Prefix',
          description: 'Prefix for release branches (e.g., release_develop_qimacert_)',
          type: 'input',
          default: 'release_develop_qimacert_'
        },
        {
          key: 'finalReleasePrefix',
          label: 'Final Release Branch Prefix',
          description: 'Prefix for final release branches (e.g., release_develop_)',
          type: 'input',
          default: 'release_develop_'
        },
        {
          key: 'enableSubmodules',
          label: 'Enable Submodules',
          description: 'Enable submodule operations during fetch',
          type: 'boolean',
          default: false
        },
        {
          key: 'autoPush',
          label: 'Auto Push',
          description: 'Automatically push all branches and tags',
          type: 'boolean',
          default: true
        }
      ]
    };
  }

  async execute(context: PluginContext): Promise<void> {
    const { version } = context.parameters || {};
    
    if (!version) {
      throw new Error('Version parameter is required (e.g., "2.02")');
    }

    const projectDir = context.projectFolder || process.cwd();
    const settings = context.options || {};

    // Get configuration settings with defaults
    const developBranch = settings.developBranch || 'develop';
    const qimacertBranch = settings.qimacertBranch || 'develop-qimacert';
    const tagPrefix = settings.tagPrefix || 'v_qimacert_';
    const rollbackPrefix = settings.rollbackPrefix || 'rollback_develop_qimacert_v';
    const releaseBranchPrefix = settings.releaseBranchPrefix || 'release_develop_qimacert_';
    const finalReleasePrefix = settings.finalReleasePrefix || 'release_develop_';
    const enableSubmodules = settings.enableSubmodules || false;
    const autoPush = settings.autoPush !== false; // Default to true

    console.log(chalk.blue(`🚀 Starting QIMA Legacy Release Process`));
    console.log(chalk.gray(`Version: ${version}`));
    console.log(chalk.gray(`Project Directory: ${projectDir}`));
    console.log(chalk.gray(`QIMACert Branch: ${qimacertBranch}`));
    console.log(chalk.gray(`Develop Branch: ${developBranch}`));
    console.log('==============================================================');

    try {
      // Step 0: Check current branch and switch to a safe branch if needed
      console.log(chalk.cyan('\n🔍 Step 0: Checking current branch...'));
      const currentBranch = await this.executeCommand('git branch --show-current', projectDir);
      console.log(chalk.gray(`Current branch: ${currentBranch.trim()}`));
      
      // If we're on develop-qimacert, switch to develop first
      if (currentBranch.trim() === qimacertBranch) {
        console.log(chalk.yellow(`⚠️ Currently on ${qimacertBranch} branch. Switching to ${developBranch} first...`));
        await this.executeCommand(`git checkout ${developBranch}`, projectDir);
      }
      
      // Step 1: Fetch and prune
      console.log(chalk.cyan('\n📥 Step 1: Fetching and pruning...'));
      await this.executeCommand('git fetch --prune', projectDir);
      
      // Step 2: Fetch qimacert branch (now safe since we're not on it)
      console.log(chalk.cyan('\n📥 Step 2: Fetching qimacert branch...'));
      const submoduleFlag = enableSubmodules ? '--recurse-submodules=yes' : '--recurse-submodules=no';
      await this.executeCommand(`git fetch origin ${qimacertBranch}:${qimacertBranch} ${submoduleFlag} --progress --prune`, projectDir);
      
      // Step 3: Checkout qimacert branch
      console.log(chalk.cyan('\n🔀 Step 3: Checking out qimacert branch...'));
      await this.executeCommand(`git checkout ${qimacertBranch}`, projectDir);
      
      // Step 4: Pull latest changes
      console.log(chalk.cyan('\n⬇️ Step 4: Pulling latest changes...'));
      await this.executeCommand(`git pull origin ${qimacertBranch}`, projectDir);
      
      // Step 5: Create rollback tag
      console.log(chalk.cyan('\n🏷️ Step 5: Creating rollback tag...'));
      const rollbackTag = `${rollbackPrefix}${version}`;
      await this.executeCommand(`git tag ${rollbackTag}`, projectDir);
      
      if (autoPush) {
        console.log(chalk.cyan('\n⬆️ Step 5a: Pushing rollback tag...'));
        await this.executeCommand(`git push origin ${rollbackTag}`, projectDir);
      }
      
      // Step 6: Create release branch from qimacert
      console.log(chalk.cyan('\n🌿 Step 6: Creating release branch from qimacert...'));
      const releaseBranch = `${releaseBranchPrefix}${version}`;
      await this.executeCommand(`git checkout -b ${releaseBranch} ${qimacertBranch}`, projectDir);
      
      // Step 7: Checkout develop branch
      console.log(chalk.cyan('\n🔀 Step 7: Checking out develop branch...'));
      await this.executeCommand(`git checkout ${developBranch}`, projectDir);
      
      // Step 8: Pull develop branch
      console.log(chalk.cyan('\n⬇️ Step 8: Pulling develop branch...'));
      await this.executeCommand(`git pull origin ${developBranch}`, projectDir);
      
      // Step 9: Checkout release branch
      console.log(chalk.cyan('\n🔀 Step 9: Checking out release branch...'));
      await this.executeCommand(`git checkout ${releaseBranch}`, projectDir);
      
      // Step 10: Merge develop into release branch
      console.log(chalk.cyan('\n🔀 Step 10: Merging develop into release branch...'));
      try {
        await this.executeCommand(`git merge ${developBranch}`, projectDir);
      } catch (error) {
        console.log(chalk.yellow('\n⚠️ Merge conflicts detected!'));
        console.log(chalk.cyan('Please resolve the conflicts manually and then choose an option:'));
        console.log('');
        console.log(chalk.gray('To resolve conflicts:'));
        console.log(chalk.gray('1. Edit the conflicted files'));
        console.log(chalk.gray('2. Stage the resolved files: git add .'));
        console.log(chalk.gray('3. Complete the merge: git commit'));
        console.log('');
        
        // Wait for user to resolve conflicts
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '✅ Continue after resolving conflicts', value: 'continue' },
              { name: '❌ Abort merge and exit', value: 'abort' }
            ]
          }
        ]);
        
        if (action === 'abort') {
          console.log(chalk.yellow('\n🔄 Aborting merge...'));
          await this.executeCommand('git merge --abort', projectDir);
          throw new Error('Merge aborted by user');
        } else {
          // User chose to continue, check if merge is complete
          console.log(chalk.cyan('\n🔍 Checking merge status...'));
          const mergeStatus = await this.executeCommand('git status --porcelain', projectDir);
          
          if (mergeStatus.includes('UU') || mergeStatus.includes('AA')) {
            console.log(chalk.red('❌ Conflicts still exist. Please resolve all conflicts before continuing.'));
            throw new Error('Merge conflicts not fully resolved');
          }
          
          console.log(chalk.green('✅ Merge conflicts resolved successfully!'));
        }
      }
      
      // Step 11: Create version tag
      console.log(chalk.cyan('\n🏷️ Step 11: Creating version tag...'));
      const versionTag = `${tagPrefix}${version}`;
      await this.executeCommand(`git tag ${versionTag}`, projectDir);
      
      if (autoPush) {
        console.log(chalk.cyan('\n⬆️ Step 11a: Pushing version tag...'));
        await this.executeCommand(`git push origin ${versionTag}`, projectDir);
      }
      
      // Step 12: Push release branch
      console.log(chalk.cyan('\n⬆️ Step 12: Pushing release branch...'));
      await this.executeCommand(`git push --set-upstream origin ${releaseBranch}`, projectDir);
      
      // Step 13: Create final release branch
      console.log(chalk.cyan('\n🌿 Step 13: Creating final release branch...'));
      const finalReleaseBranch = `${finalReleasePrefix}${version}`;
      await this.executeCommand(`git checkout -b ${finalReleaseBranch}`, projectDir);
      
      // Step 14: Push final release branch
      console.log(chalk.cyan('\n⬆️ Step 14: Pushing final release branch...'));
      await this.executeCommand(`git push origin ${finalReleaseBranch}`, projectDir);

      console.log('==============================================================');
      console.log(chalk.green('✅ QIMA Legacy Release Process Completed Successfully!'));
      console.log('');
      console.log(chalk.cyan('📋 Summary:'));
      console.log(chalk.white(`- Rollback Tag: ${rollbackTag}`));
      console.log(chalk.white(`- Release Branch: ${releaseBranch}`));
      console.log(chalk.white(`- Version Tag: ${versionTag}`));
      console.log(chalk.white(`- Final Release Branch: ${finalReleaseBranch}`));
      console.log('');
      console.log(chalk.gray('All branches and tags have been created and pushed to origin.'));

    } catch (error) {
      console.error(chalk.red('❌ QIMA Legacy Release Process Failed:'), error);
      throw error;
    }
  }

  private async executeCommand(command: string, cwd: string): Promise<string> {
    console.log(chalk.gray(`Executing: ${command}`));
    
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      
      if (stdout && stdout.trim()) {
        console.log(chalk.gray(stdout.trim()));
      }
      
      if (stderr && stderr.trim() && !stderr.includes('warning')) {
        console.warn(chalk.yellow(stderr.trim()));
      }
      
      return stdout;
      
    } catch (error: any) {
      console.error(chalk.red(`Command failed: ${command}`));
      console.error(chalk.red(`Error: ${error.message}`));
      throw error;
    }
  }
}
