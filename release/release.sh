#!/bin/bash

# Release automation script for QIMA projects
# Usage: ./release.sh <project_folder> <tag_name>
# Example: ./release.sh qimacert 1.99

set -e  # Exit on any error

# Check if required arguments are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <project_folder> <tag_name>"
    echo "Example: $0 qimacert 1.99"
    exit 1
fi

PROJECT_FOLDER="$1"
TAG_NAME="$2"

# Validate inputs
if [ -z "$PROJECT_FOLDER" ] || [ -z "$TAG_NAME" ]; then
    echo "Error: Project folder and tag name cannot be empty"
    exit 1
fi

# Check if project folder exists
if [ ! -d "$PROJECT_FOLDER" ]; then
    echo "Error: Project folder '$PROJECT_FOLDER' does not exist"
    exit 1
fi

echo "Starting release process for project: $PROJECT_FOLDER with tag: $TAG_NAME"
echo "================================================================"

# Change to project directory
cd "$PROJECT_FOLDER"

# Step 1: Fetch and update
echo "Step 1: Fetching latest changes..."
git fetch --prune
git fetch origin develop-qimacert:develop-qimacert --recurse-submodules=no --progress --prune

# Step 2: Checkout and pull develop-qimacert
echo "Step 2: Checking out develop-qimacert..."
git checkout develop-qimacert
git pull

# Step 3: Create rollback tag
echo "Step 3: Creating rollback tag..."
ROLLBACK_TAG="rollback_develop_qimacert_v$TAG_NAME"
git tag "$ROLLBACK_TAG"
git push origin "$ROLLBACK_TAG"

# Step 4: Create release branch from develop-qimacert
echo "Step 4: Creating release branch..."
RELEASE_BRANCH="release_develop_qimacert_$TAG_NAME"
git checkout -b "$RELEASE_BRANCH" develop-qimacert

# Step 5: Checkout develop and pull
echo "Step 5: Checking out develop and pulling latest changes..."
git checkout develop
git pull

# Step 6: Merge develop into release branch
echo "Step 6: Merging develop into release branch..."
git checkout "$RELEASE_BRANCH"

# Temporarily disable exit on error for merge step
set +e
git merge develop
MERGE_EXIT_CODE=$?
set -e

# Check if there are any merge conflicts
if [ $MERGE_EXIT_CODE -ne 0 ] || [ -n "$(git status --porcelain | grep '^UU\|^AA\|^DD')" ]; then
    echo ""
    echo "⚠️  MERGE CONFLICTS DETECTED!"
    echo "================================================================"
    echo "The merge of develop branch into $RELEASE_BRANCH has conflicts that need to be resolved."
    echo ""
    echo "Current status:"
    git status --short
    echo ""
    echo "Please resolve all conflicts manually, then:"
    echo "1. Add the resolved files: git add <resolved-files>"
    echo "2. Complete the merge: git commit (or git merge --continue)"
    echo "3. Press any key to continue with the release process..."
    echo ""
    read -n 1 -s -r -p "Press any key to continue after resolving conflicts..."
    echo ""
    
    # Check if merge is still in progress
    if [ -f ".git/MERGE_HEAD" ]; then
        echo "❌ Merge is still in progress. Please complete the merge before continuing."
        echo "Run 'git status' to see what needs to be done."
        exit 1
    fi
    
    echo "✅ Merge conflicts resolved successfully!"
else
    echo "✅ Merge completed successfully with no conflicts."
fi

# Step 7: Create version tag
echo "Step 7: Creating version tag..."
VERSION_TAG="v_qimacert_$TAG_NAME"
git tag "$VERSION_TAG"
git push origin "$VERSION_TAG"

# Step 8: Push release branch
echo "Step 8: Pushing release branch..."
git push --set-upstream origin "$RELEASE_BRANCH"

# Step 9: Create and push final release branch
echo "Step 9: Creating final release branch..."
FINAL_RELEASE_BRANCH="release_develop_$TAG_NAME"
git checkout -b "$FINAL_RELEASE_BRANCH"
git push origin "$FINAL_RELEASE_BRANCH"

echo "================================================================"
echo "Release process completed successfully!"
echo ""
echo "Summary:"
echo "- Rollback tag created: $ROLLBACK_TAG"
echo "- Release branch created: $RELEASE_BRANCH"
echo "- Version tag created: $VERSION_TAG"
echo "- Final release branch created: $FINAL_RELEASE_BRANCH"
echo ""
echo "All branches and tags have been pushed to origin." 