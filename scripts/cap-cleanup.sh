#!/bin/bash
# CAP Restructuring Cleanup Script
# Run this inside the Docker container (agent_sandbox_v1)
# 
# This script completes the CAP restructuring by:
# 1. Moving orphan files from root to _orphans/
# 2. Deleting empty project directories

set -e  # Exit on error

WORKSPACE="/app/HTML_Apps_Workspace"
cd "$WORKSPACE"

echo "=== CAP Restructuring Cleanup ==="
echo ""

# Step 1: Move orphan files to _orphans/
echo "[1/3] Moving orphan files to _orphans/..."
if [ -f "index.html" ]; then
    mv index.html _orphans/
    echo "  ✓ Moved index.html"
fi
if [ -f "style.css" ]; then
    mv style.css _orphans/
    echo "  ✓ Moved style.css"
fi
if [ -f "test-diagnostic.html" ]; then
    mv test-diagnostic.html _orphans/
    echo "  ✓ Moved test-diagnostic.html"
fi
if [ -f "test-minimal.html" ]; then
    mv test-minimal.html _orphans/
    echo "  ✓ Moved test-minimal.html"
fi

# Step 2: Delete empty project directories
echo ""
echo "[2/3] Removing empty project directories..."
for dir in premium-todo-app simple-todo world-class-todo; do
    if [ -d "projects/$dir" ]; then
        rm -rf "projects/$dir"
        echo "  ✓ Removed projects/$dir"
    fi
done

# Step 3: Verify structure
echo ""
echo "[3/3] Verifying new structure..."
echo ""
echo "Root level:"
ls -la | grep -v node_modules | grep -v "^d.*\.git$"
echo ""
echo "_orphans/ contents:"
ls -la _orphans/
echo ""
echo "projects/ contents:"
ls -la projects/

echo ""
echo "=== Cleanup Complete ==="
echo "New CAP-compliant structure is ready!"
