import { Plugin, PluginContext, ReleaseResult, PluginCategory } from '../../src/types';
import { GitManager } from '../../src/core/GitManager';

export default class StandardReleasePlugin implements Plugin {
  name = 'standard-release';
  description = 'Standard release process for repositories with develop and master branches';
  version = '1.0.0';
  category = PluginCategory.DEPLOYMENT;

  async execute(context: PluginContext): Promise<void> {
    const { projectFolder, tagName, baseBranches } = context;
    
    if (!projectFolder) {
      throw new Error('Project folder is required');
    }
    
    if (!tagName) {
      throw new Error('Tag name is required');
    }
    
    if (!baseBranches) {
      throw new Error('Base branches configuration is required');
    }
    
    console.log(`🚀 Starting standard release process for: ${projectFolder}`);
    console.log(`📝 Tag: ${tagName}`);
    console.log(`🌿 Base branches: ${baseBranches.develop} → ${baseBranches.production}`);
    console.log('==============================================================');

    const gitManager = new GitManager(projectFolder);
    const result: ReleaseResult = { success: false };

    try {
      // Step 1: Fetch and update
      await gitManager.fetchAndUpdate(baseBranches);

      // Step 2: Checkout and pull develop
      await gitManager.checkoutBranch(baseBranches.develop);
      await gitManager.pullBranch(baseBranches.develop);

      // Step 3: Create rollback tag
      const rollbackTag = `rollback_${baseBranches.develop}_v${tagName}`;
      await gitManager.createTag(rollbackTag);
      await gitManager.pushTag(rollbackTag);
      result.rollbackTag = rollbackTag;

      // Step 4: Create release branch from develop
      const releaseBranch = `release_${baseBranches.develop}_${tagName}`;
      await gitManager.createBranch(releaseBranch, baseBranches.develop);
      result.releaseBranch = releaseBranch;

      // Step 5: Checkout master and pull
      await gitManager.checkoutBranch(baseBranches.production);
      await gitManager.pullBranch(baseBranches.production);

      // Step 6: Merge master into release branch
      await gitManager.checkoutBranch(releaseBranch);
      const mergeSuccess = await gitManager.mergeBranch(baseBranches.production);

      if (!mergeSuccess) {
        await gitManager.waitForConflictResolution();
      }

      // Step 7: Create version tag
      const versionTag = `v_${projectFolder}_${tagName}`;
      await gitManager.createTag(versionTag);
      await gitManager.pushTag(versionTag);
      result.versionTag = versionTag;

      // Step 8: Push release branch
      await gitManager.pushBranch(releaseBranch, true);

      // Step 9: Create and push final release branch
      const finalReleaseBranch = `release_${baseBranches.develop}_${tagName}`;
      await gitManager.createBranch(finalReleaseBranch, releaseBranch);
      await gitManager.pushBranch(finalReleaseBranch);
      result.finalReleaseBranch = finalReleaseBranch;

      result.success = true;

      console.log('==============================================================');
      console.log('✅ Standard release process completed successfully!');
      console.log('');
      console.log('Summary:');
      console.log(`- Rollback tag: ${result.rollbackTag}`);
      console.log(`- Release branch: ${result.releaseBranch}`);
      console.log(`- Version tag: ${result.versionTag}`);
      console.log(`- Final release branch: ${result.finalReleaseBranch}`);
      console.log('');
      console.log('All branches and tags have been pushed to origin.');

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error('❌ Standard release process failed:', error);
      throw error;
    }
  }
}
