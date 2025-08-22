#!/bin/bash

# Fix Next.js dynamic server usage issues by adding dynamic exports
# Usage: ./fix-dynamic-routes.sh [filename]
# If filename is provided, fixes only that file
# If no filename provided, shows usage

if [ $# -eq 0 ]; then
    echo "Usage: $0 <filename>"
    echo "Example: $0 app/api/doctors/dashboard/route.ts"
    echo "This script adds 'export const dynamic = \"force-dynamic\"' to the specified API route file"
    exit 1
fi

FILE_PATH="$1"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: File '$FILE_PATH' does not exist"
    exit 1
fi

# Check if file is a TypeScript file
if [[ ! "$FILE_PATH" =~ \.ts$ ]]; then
    echo "❌ Error: File '$FILE_PATH' is not a TypeScript file"
    exit 1
fi

# Check if file contains export async function and doesn't already have dynamic export
if grep -q "export async function" "$FILE_PATH" && ! grep -q "export const dynamic" "$FILE_PATH"; then
    echo "📝 Fixing: $FILE_PATH"
    
    # Create backup
    cp "$FILE_PATH" "$FILE_PATH.backup"
    echo "📋 Backup created: $FILE_PATH.backup"
    
    # Add dynamic exports at the top after imports
    sed -i '/^import/a\\nexport const dynamic = '\''force-dynamic'\''\nexport const runtime = '\''nodejs'\''' "$FILE_PATH"
    
    # Clean up multiple newlines
    sed -i '/^$/N;/^\n$/d' "$FILE_PATH"
    
    echo "✅ Applied dynamic exports to $FILE_PATH"
    echo "Added:"
    echo "  - export const dynamic = 'force-dynamic'"
    echo "  - export const runtime = 'nodejs'"
    
elif ! grep -q "export async function" "$FILE_PATH"; then
    echo "⚠️  Warning: File '$FILE_PATH' does not contain 'export async function'"
    echo "This script is intended for Next.js API route files"
    
elif grep -q "export const dynamic" "$FILE_PATH"; then
    echo "ℹ️  Info: File '$FILE_PATH' already has dynamic export configured"
    echo "No changes needed"
    
else
    echo "❓ Unexpected condition for file '$FILE_PATH'"
fi