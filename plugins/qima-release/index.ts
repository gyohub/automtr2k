import { Plugin, PluginContext, PluginCategory, ConfigMenu } from '../../src/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export default class QimaReleasePlugin implements Plugin {
  name = 'qima-release';
  description = 'Simple QIMA release process with develop and master branches';
  version = '1.0.0';
  category = PluginCategory.RELEASE;

  getConfigMenu(): ConfigMenu {
    return {
      title: 'QIMA Release Configuration',
      description: 'Configure the simple QIMA release process settings',
      options: [
        {
          key: 'developBranch',
          label: 'Develop Branch',
          description: 'Main develop branch name',
          type: 'input',
          default: 'develop'
        },
        {
          key: 'masterBranch',
          label: 'Master Branch',
          description: 'Master branch name',
          type: 'input',
          default: 'master'
        },
        {
          key: 'tagPrefix',
          label: 'Tag Prefix',
          description: 'Prefix for version tags (e.g., v_qimacert_)',
          type: 'input',
          default: 'v_qimacert_'
        },
        {
          key: 'releaseBranchPrefix',
          label: 'Release Branch Prefix',
          description: 'Prefix for release branches (e.g., release_)',
          type: 'input',
          default: 'release_'
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
    const masterBranch = settings.masterBranch || 'master';
    const tagPrefix = settings.tagPrefix || 'v_qimacert_';
    const releaseBranchPrefix = settings.releaseBranchPrefix || 'release_';
    const autoPush = settings.autoPush !== false; // Default to true

    console.log(chalk.blue(`🚀 Starting QIMA Release Process`));
    console.log(chalk.gray(`Version: ${version}`));
    console.log(chalk.gray(`Project Directory: ${projectDir}`));
    console.log(chalk.gray(`Develop Branch: ${developBranch}`));
    console.log(chalk.gray(`Master Branch: ${masterBranch}`));
    console.log('==============================================================');

    // Track what has been created for potential rollback
    const createdItems = {
      tag: false,
      tagPushed: false,
      releaseBranch: false,
      releaseBranchPushed: false
    };

    let versionTag = '';
    let releaseBranch = '';

    try {
      // Step 1: Check current branch and switch to develop if needed
      console.log(chalk.cyan('\n🔍 Step 1: Checking current branch...'));
      const currentBranch = await this.executeCommand('git branch --show-current', projectDir);
      console.log(chalk.gray(`Current branch: ${currentBranch.trim()}`));
      
      if (currentBranch.trim() !== developBranch) {
        console.log(chalk.yellow(`⚠️ Currently on ${currentBranch.trim()} branch. Switching to ${developBranch}...`));
        await this.executeCommand(`git checkout ${developBranch}`, projectDir);
      }
      
      // Step 2: Fetch and pull latest changes
      console.log(chalk.cyan('\n📥 Step 2: Fetching and pulling latest changes...'));
      await this.executeCommand('git fetch --prune', projectDir);
      await this.executeCommand(`git pull origin ${developBranch}`, projectDir);
      
      // Step 3: Create version tag
      console.log(chalk.cyan('\n🏷️ Step 3: Creating version tag...'));
      versionTag = `${tagPrefix}${version}`;
      await this.executeCommand(`git tag -a ${versionTag} -m "Release ${versionTag}"`, projectDir);
      createdItems.tag = true;
      
      if (autoPush) {
        console.log(chalk.cyan('\n⬆️ Step 3a: Pushing version tag...'));
        await this.executeCommand(`git push origin ${versionTag}`, projectDir);
        createdItems.tagPushed = true;
      }
      
      // Step 4: Create release branch from the tag
      console.log(chalk.cyan('\n🌿 Step 4: Creating release branch from tag...'));
      releaseBranch = `${releaseBranchPrefix}${versionTag}`;
      await this.executeCommand(`git checkout -b ${releaseBranch} ${versionTag}`, projectDir);
      createdItems.releaseBranch = true;
      
      // Step 5: Push release branch
      console.log(chalk.cyan('\n⬆️ Step 5: Pushing release branch...'));
      await this.executeCommand(`git push -u origin ${releaseBranch}`, projectDir);
      createdItems.releaseBranchPushed = true;

      console.log('==============================================================');
      console.log(chalk.green('✅ QIMA Release Process Completed Successfully!'));
      console.log('');
      console.log(chalk.cyan('📋 Summary:'));
      console.log(chalk.white(`- Version Tag: ${versionTag}`));
      console.log(chalk.white(`- Release Branch: ${releaseBranch}`));
      console.log('');
      console.log(chalk.gray('Tag and release branch have been created and pushed to origin.'));

    } catch (error) {
      console.error(chalk.red('❌ QIMA Release Process Failed:'), error);
      
      // Check if this is a merge conflict error
      if (error instanceof Error && error.message.includes('merge conflict')) {
        await this.handleMergeConflict(projectDir, createdItems, versionTag, releaseBranch);
      } else {
        // For other errors, offer rollback
        await this.offerRollback(projectDir, createdItems, versionTag, releaseBranch);
      }
      
      throw error;
    }
  }

  private async handleMergeConflict(projectDir: string, createdItems: any, versionTag: string, releaseBranch: string): Promise<void> {
    console.log(chalk.yellow('\n⚠️ Merge conflicts detected!'));
    console.log(chalk.cyan('Please resolve the conflicts manually and then choose an option:'));
    console.log('');
    console.log(chalk.gray('To resolve conflicts:'));
    console.log(chalk.gray('1. Edit the conflicted files'));
    console.log(chalk.gray('2. Stage the resolved files: git add .'));
    console.log(chalk.gray('3. Complete the merge: git commit'));
    console.log('');

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
      
      // Offer rollback after aborting
      await this.offerRollback(projectDir, createdItems, versionTag, releaseBranch);
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

  private async offerRollback(projectDir: string, createdItems: any, versionTag: string, releaseBranch: string): Promise<void> {
    if (createdItems.tag || createdItems.releaseBranch) {
      console.log(chalk.yellow('\n🔄 Rollback Options:'));
      console.log(chalk.gray('The following items were created during this process:'));
      
      if (createdItems.tag) console.log(chalk.gray(`- Local tag: ${versionTag}`));
      if (createdItems.tagPushed) console.log(chalk.gray(`- Remote tag: ${versionTag}`));
      if (createdItems.releaseBranch) console.log(chalk.gray(`- Local branch: ${releaseBranch}`));
      if (createdItems.releaseBranchPushed) console.log(chalk.gray(`- Remote branch: ${releaseBranch}`));

      const { rollback } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'rollback',
          message: 'Would you like to rollback (clean up) what was created?',
          default: true
        }
      ]);

      if (rollback) {
        await this.performRollback(projectDir, createdItems, versionTag, releaseBranch);
      }
    }
  }

  private async performRollback(projectDir: string, createdItems: any, versionTag: string, releaseBranch: string): Promise<void> {
    console.log(chalk.yellow('\n🔄 Performing rollback...'));

    try {
      // Switch back to develop branch first
      await this.executeCommand('git checkout develop', projectDir);

      // Delete local release branch if created
      if (createdItems.releaseBranch) {
        console.log(chalk.gray(`Deleting local branch: ${releaseBranch}`));
        await this.executeCommand(`git branch -D ${releaseBranch}`, projectDir);
      }

      // Delete local tag if created
      if (createdItems.tag) {
        console.log(chalk.gray(`Deleting local tag: ${versionTag}`));
        await this.executeCommand(`git tag -d ${versionTag}`, projectDir);
      }

      // Delete remote tag if pushed
      if (createdItems.tagPushed) {
        console.log(chalk.gray(`Deleting remote tag: ${versionTag}`));
        await this.executeCommand(`git push origin --delete ${versionTag}`, projectDir);
      }

      // Delete remote release branch if pushed
      if (createdItems.releaseBranchPushed) {
        console.log(chalk.gray(`Deleting remote branch: ${releaseBranch}`));
        await this.executeCommand(`git push origin --delete ${releaseBranch}`, projectDir);
      }

      console.log(chalk.green('✅ Rollback completed successfully!'));
      console.log(chalk.gray('All created items have been cleaned up.'));

    } catch (rollbackError) {
      console.error(chalk.red('❌ Rollback failed:'), rollbackError);
      console.log(chalk.yellow('⚠️ Some items may need to be cleaned up manually.'));
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
