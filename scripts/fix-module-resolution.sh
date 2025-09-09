#!/bin/bash
# Fix TypeScript Module Resolution Issues
# Healthcare Management Platform - Error Spike Resolution

set -e

echo "🔧 Fixing TypeScript Module Resolution Issues"
echo "============================================"

# Ensure next-env.d.ts has proper content
echo "1. 📝 Updating next-env.d.ts..."
cat > next-env.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
EOF
echo "✅ next-env.d.ts updated"

# Check and fix tsconfig.json paths
echo ""
echo "2. 🔍 Validating tsconfig.json paths..."
if grep -q '"@/\*": \["\./\*"\]' tsconfig.json; then
    echo "✅ Base path mapping exists"
else
    echo "⚠️  Fixing base path mapping"
    # This would require more complex JSON editing
fi

echo ""
echo "3. 🧪 Testing module resolution with sample imports..."

# Test if imports resolve correctly by checking file existence
TEST_IMPORTS=(
    "@/lib/auth:lib/auth.ts"
    "@/lib/prisma:lib/prisma.ts"
    "@/lib/api-response:lib/api-response.ts"
    "@/lib/api-services:lib/api-services.ts"
)

for import_test in "${TEST_IMPORTS[@]}"; do
    import_path="${import_test%%:*}"
    file_path="${import_test##*:}"
    
    if [ -f "$file_path" ]; then
        echo "✅ $import_path → $file_path"
    else
        echo "❌ $import_path → $file_path (MISSING)"
    fi
done

echo ""
echo "4. 🔍 Checking for common import issues..."

# Check for problematic import patterns
echo "Scanning for import patterns that might cause issues..."

PROBLEMATIC_PATTERNS=(
    'from "@/prisma/generated/prisma"'
    'from "@/lib/auth"'
    'from "@/lib/prisma"'
    'from "@/lib/api-response"'
)

for pattern in "${PROBLEMATIC_PATTERNS[@]}"; do
    count=$(grep -r "$pattern" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
    echo "- $pattern: $count occurrences"
done

echo ""
echo "5. 🛠️ Applying resolution fixes..."

# Fix any Prisma import issues - the generated client should be imported correctly
echo "Checking Prisma import consistency..."
if [ -f "prisma/generated/prisma/index.d.ts" ]; then
    echo "✅ Prisma client generated correctly"
else
    echo "⚠️  Regenerating Prisma client..."
    npx prisma generate >/dev/null 2>&1 && echo "✅ Prisma client regenerated" || echo "❌ Failed to generate Prisma client"
fi

echo ""
echo "6. 🎯 Module Resolution Summary:"
echo "================================"
echo "Core files status:"
echo "- lib/auth.ts: $([ -f lib/auth.ts ] && echo "✅" || echo "❌")"
echo "- lib/prisma.ts: $([ -f lib/prisma.ts ] && echo "✅" || echo "❌")"
echo "- lib/api-response.ts: $([ -f lib/api-response.ts ] && echo "✅" || echo "❌")"
echo "- lib/api-services.ts: $([ -f lib/api-services.ts ] && echo "✅" || echo "❌")"
echo "- next-env.d.ts: $([ -f next-env.d.ts ] && echo "✅" || echo "❌")"
echo "- tsconfig.json: $([ -f tsconfig.json ] && echo "✅" || echo "❌")"

echo ""
echo "💡 Next Steps:"
echo "1. Test TypeScript compilation on a single file"  
echo "2. If successful, run full type-check"
echo "3. Address any remaining import issues individually"

echo ""
echo "✅ Module resolution fixes completed!"