#!/bin/bash
# Pre-deployment cleanup script for breveasy.com
# This script removes untracked files that would conflict with git pull

cd /path/to/public_html || exit 1

# Remove untracked files that would be overwritten by merge
git clean -fd

# Force pull latest changes
git fetch origin
git reset --hard origin/main

echo "Deployment cleanup completed successfully"

