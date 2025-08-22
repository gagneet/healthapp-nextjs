#!/bin/bash

# Fix Next.js dynamic server usage issues by adding dynamic exports
echo "🔧 Fixing Next.js dynamic server usage issues..."

# Find all API route files and add dynamic exports if missing
find /home/gagneet/healthapp-nextjs/app/api -name "*.ts" | while read -r file; do
    # Check if file contains export async function and doesn't already have dynamic export
    if grep -q "export async function" "$file" && ! grep -q "export const dynamic" "$file"; then
        echo "📝 Fixing: $file"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Add dynamic exports at the top after imports
        sed -i '/^import/a\\nexport const dynamic = '\''force-dynamic'\''\nexport const runtime = '\''nodejs'\''' "$file"
        
        # Clean up multiple newlines
        sed -i '/^$/N;/^\n$/d' "$file"
    fi
done

echo "✅ Applied dynamic exports to API routes"
echo "🔧 Testing Next.js build..."

# Test the build
cd /home/gagneet/healthapp-nextjs
npm run build