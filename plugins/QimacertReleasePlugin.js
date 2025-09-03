"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitManager_1 = require("../dist/src/core/GitManager");
class QimacertReleasePlugin {
    constructor() {
        this.name = 'qimacert-release';
        this.description = 'QIMACert release process for repositories with develop and develop-qimacert branches';
        this.version = '1.0.0';
    }
    async execute(context) {
        const { projectFolder, tagName, baseBranches } = context;
        console.log(`🚀 Starting QIMACert release process for: ${projectFolder}`);
        console.log(`📝 Tag: ${tagName}`);
        console.log(`🌿 Base branches: ${baseBranches.develop} → ${baseBranches.production}`);
        console.log('==============================================================');
        const gitManager = new GitManager_1.GitManager(projectFolder);
        const result = { success: false };
        try {
            // Step 1: Fetch and update
            await gitManager.fetchAndUpdate(baseBranches);
            // Step 2: Checkout and pull develop-qimacert
            await gitManager.checkoutBranch(baseBranches.develop);
            await gitManager.pullBranch(baseBranches.develop);
            // Step 3: Create rollback tag
            const rollbackTag = `rollback_${baseBranches.develop}_v${tagName}`;
            await gitManager.createTag(rollbackTag);
            await gitManager.pushTag(rollbackTag);
            result.rollbackTag = rollbackTag;
            // Step 4: Create release branch from develop-qimacert
            const releaseBranch = `release_${baseBranches.develop}_${tagName}`;
            await gitManager.createBranch(releaseBranch, baseBranches.develop);
            result.releaseBranch = releaseBranch;
            // Step 5: Checkout develop and pull
            await gitManager.checkoutBranch(baseBranches.production);
            await gitManager.pullBranch(baseBranches.production);
            // Step 6: Merge develop into release branch
            await gitManager.checkoutBranch(releaseBranch);
            const mergeSuccess = await gitManager.mergeBranch(baseBranches.production);
            if (!mergeSuccess) {
                await gitManager.waitForConflictResolution();
            }
            // Step 7: Create version tag
            const versionTag = `v_qimacert_${tagName}`;
            await gitManager.createTag(versionTag);
            await gitManager.pushTag(versionTag);
            result.versionTag = versionTag;
            // Step 8: Push release branch
            await gitManager.pushBranch(releaseBranch, true);
            // Step 9: Create and push final release branch
            const finalReleaseBranch = `release_develop_${tagName}`;
            await gitManager.createBranch(finalReleaseBranch, releaseBranch);
            await gitManager.pushBranch(finalReleaseBranch);
            result.finalReleaseBranch = finalReleaseBranch;
            result.success = true;
            console.log('==============================================================');
            console.log('✅ QIMACert release process completed successfully!');
            console.log('');
            console.log('Summary:');
            console.log(`- Rollback tag: ${result.rollbackTag}`);
            console.log(`- Release branch: ${result.releaseBranch}`);
            console.log(`- Version tag: ${result.versionTag}`);
            console.log(`- Final release branch: ${result.finalReleaseBranch}`);
            console.log('');
            console.log('All branches and tags have been pushed to origin.');
        }
        catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
            console.error('❌ QIMACert release process failed:', error);
            throw error;
        }
    }
}
exports.default = QimacertReleasePlugin;
//# sourceMappingURL=QimacertReleasePlugin.js.map