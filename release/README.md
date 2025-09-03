# Release Automation Tool

This tool automates the release process for QIMA projects by executing a series of git commands in the correct order.

## Usage

```bash
./release.sh <project_folder> <tag_name>
```

### Parameters

- `project_folder`: The name of the project folder (must exist in the current directory)
- `tag_name`: The version tag name (e.g., "1.99", "2.0", etc.)

### Example

```bash
./release.sh qimacert 1.99
```

## What the script does

The script performs the following steps in order:

1. **Fetch latest changes**: Fetches and prunes remote branches
2. **Update develop-qimacert**: Checks out and pulls latest changes from develop-qimacert branch
3. **Create rollback tag**: Creates a rollback tag for the current state
4. **Create release branch**: Creates a new release branch from develop-qimacert
5. **Update develop**: Checks out and pulls latest changes from develop branch
6. **Merge develop**: Merges develop branch into the release branch
   - **⚠️ Conflict Resolution**: If merge conflicts occur, the script will pause and wait for manual resolution
   - You'll need to resolve conflicts, add resolved files, and complete the merge before continuing
7. **Create version tag**: Creates a version tag for the release
8. **Push release branch**: Pushes the release branch to origin
9. **Create final release branch**: Creates and pushes a final release branch

## Generated artifacts

The script creates the following:

- **Rollback tag**: `rollback_develop_qimacert_v<tag_name>`
- **Release branch**: `release_develop_qimacert_<tag_name>`
- **Version tag**: `v_qimacert_<tag_name>`
- **Final release branch**: `release_develop_<tag_name>`

## Prerequisites

- Git must be installed and configured
- User must have appropriate permissions to push to the repository
- Project folder must exist in the current directory
- User must be in the parent directory of the project folder when running the script

## Error handling

The script includes error handling for:
- Missing or invalid parameters
- Non-existent project folders
- Git command failures (exits on first error)

## Conflict Resolution

If merge conflicts occur during step 6 (merging develop into release branch), the script will:

1. **Pause execution** and display a warning message
2. **Show current status** of conflicted files
3. **Wait for manual resolution** - you must:
   - Resolve conflicts in your preferred editor
   - Add resolved files: `git add <resolved-files>`
   - Complete the merge: `git commit` or `git merge --continue`
4. **Continue automatically** after you press any key
5. **Verify completion** - the script checks if the merge is still in progress

### Example conflict resolution workflow:

```bash
# When conflicts are detected, the script will pause here
# You'll see something like:
# ⚠️  MERGE CONFLICTS DETECTED!
# ================================================================
# The merge of develop branch into release_develop_qimacert_1.99 has conflicts that need to be resolved.

# 1. Resolve conflicts in your editor
# 2. Add resolved files
git add <conflicted-files>

# 3. Complete the merge
git commit

# 4. Press any key to continue the script
```

## Notes

- The script uses `set -e` to exit immediately if any command fails (except during merge step)
- All git operations are performed in the specified project directory
- The script provides progress feedback for each step
- A summary is displayed at the end showing all created artifacts
- Merge conflicts are handled gracefully with user intervention