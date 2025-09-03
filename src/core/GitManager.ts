import { simpleGit, SimpleGit, GitError } from 'simple-git';
import { GitStatus, BaseBranches } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';

export class GitManager {
  private git: SimpleGit;
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.git = simpleGit(projectPath);
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const status = await this.git.status();
      const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      
      const conflicts = status.conflicted || [];
      const untracked = status.not_added || [];
      const modified = status.modified || [];

      return {
        isClean: status.isClean(),
        currentBranch,
        hasConflicts: conflicts.length > 0,
        conflicts,
        untracked,
        modified
      };
    } catch (error) {
      throw new Error(`Failed to get git status: ${error}`);
    }
  }

  async fetchAndUpdate(baseBranches: BaseBranches): Promise<void> {
    try {
      console.log('📥 Fetching latest changes...');
      await this.git.fetch(['--prune']);
      
      if (baseBranches.type === 'custom') {
        await this.git.fetch([
          'origin',
          `${baseBranches.develop}:${baseBranches.develop}`,
          '--recurse-submodules=no',
          '--progress',
          '--prune'
        ]);
      }
      
      console.log('✅ Fetch completed');
    } catch (error) {
      throw new Error(`Failed to fetch and update: ${error}`);
    }
  }

  async checkoutBranch(branchName: string): Promise<void> {
    try {
      await this.git.checkout(branchName);
      console.log(`✅ Checked out branch: ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to checkout branch ${branchName}: ${error}`);
    }
  }

  async pullBranch(branchName: string): Promise<void> {
    try {
      await this.git.pull('origin', branchName);
      console.log(`✅ Pulled latest changes from ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to pull branch ${branchName}: ${error}`);
    }
  }

  async createBranch(newBranchName: string, fromBranch: string): Promise<void> {
    try {
      await this.git.checkoutBranch(newBranchName, fromBranch);
      console.log(`✅ Created and checked out branch: ${newBranchName} from ${fromBranch}`);
    } catch (error) {
      throw new Error(`Failed to create branch ${newBranchName}: ${error}`);
    }
  }

  async createTag(tagName: string): Promise<void> {
    try {
      await this.git.addTag(tagName);
      console.log(`✅ Created tag: ${tagName}`);
    } catch (error) {
      throw new Error(`Failed to create tag ${tagName}: ${error}`);
    }
  }

  async pushTag(tagName: string): Promise<void> {
    try {
      await this.git.pushTags('origin');
      console.log(`✅ Pushed tag: ${tagName}`);
    } catch (error) {
      throw new Error(`Failed to push tag ${tagName}: ${error}`);
    }
  }

  async pushBranch(branchName: string, setUpstream: boolean = false): Promise<void> {
    try {
      if (setUpstream) {
        await this.git.push(['--set-upstream', 'origin', branchName]);
      } else {
        await this.git.push('origin', branchName);
      }
      console.log(`✅ Pushed branch: ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to push branch ${branchName}: ${error}`);
    }
  }

  async mergeBranch(sourceBranch: string): Promise<boolean> {
    try {
      console.log(`🔄 Merging ${sourceBranch} into current branch...`);
      await this.git.merge([sourceBranch]);
      console.log(`✅ Merge completed successfully`);
      return true;
    } catch (error) {
      if (error instanceof GitError && error.message.includes('CONFLICT')) {
        console.log(`⚠️  Merge conflicts detected when merging ${sourceBranch}`);
        return false;
      }
      throw new Error(`Failed to merge ${sourceBranch}: ${error}`);
    }
  }

  async waitForConflictResolution(): Promise<void> {
    console.log('\n⚠️  MERGE CONFLICTS DETECTED!');
    console.log('==============================================================');
    console.log('The merge has conflicts that need to be resolved manually.');
    console.log('');
    
    const status = await this.getStatus();
    if (status.conflicts.length > 0) {
      console.log('Current conflicts:');
      status.conflicts.forEach(conflict => {
        console.log(`  - ${conflict}`);
      });
    }
    
    console.log('');
    console.log('Please resolve all conflicts manually, then:');
    console.log('1. Add the resolved files: git add <resolved-files>');
    console.log('2. Complete the merge: git commit (or git merge --continue)');
    console.log('3. Press Enter to continue with the release process...');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise<void>((resolve) => {
      rl.question('Press Enter to continue after resolving conflicts...', () => {
        rl.close();
        resolve();
      });
    });

    // Check if merge is still in progress
    if (await fs.pathExists(path.join(this.projectPath, '.git', 'MERGE_HEAD'))) {
      throw new Error('Merge is still in progress. Please complete the merge before continuing.');
    }

    console.log('✅ Merge conflicts resolved successfully!');
  }

  async isMergeInProgress(): Promise<boolean> {
    return await fs.pathExists(path.join(this.projectPath, '.git', 'MERGE_HEAD'));
  }
}
