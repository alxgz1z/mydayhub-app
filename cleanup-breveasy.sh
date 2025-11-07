#!/bin/bash
# Cleanup script for breveasy.com - removes backup/diagnostic files only
# Preserves user-uploaded content in media/imgs/

cd /path/to/public_html || exit 1

# Remove backup files
rm -f composer.json.renamed
rm -f composer.lock.renamed

# Remove diagnostic file (if it exists)
rm -f diagnostics.php

# Note: We intentionally preserve media/imgs/ files as they are user-uploaded content

echo "Cleanup completed. User files preserved."

