#!/bin/bash
# Quick TypeScript Error Analysis Script
# Healthcare Management Platform - Error Spike Investigation

set -e

echo "🔍 Quick TypeScript Error Analysis"
echo "=================================="

# Check if key module files exist
echo "📁 Core Module Files:"
echo "- lib/auth.ts: $([ -f lib/auth.ts ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "- lib/prisma.ts: $([ -f lib/prisma.ts ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "- lib/api-response.ts: $([ -f lib/api-response.ts ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "- next-env.d.ts: $([ -f next-env.d.ts ] && echo "✅ EXISTS" || echo "❌ MISSING")"
echo "- tsconfig.json: $([ -f tsconfig.json ] && echo "✅ EXISTS" || echo "❌ MISSING")"

echo ""
echo "🔧 TypeScript Configuration:"
echo "- baseUrl: $(grep '"baseUrl"' tsconfig.json | cut -d'"' -f4 || echo "NOT FOUND")"
echo "- paths configured: $(grep -A5 '"paths"' tsconfig.json | grep '@/' | wc -l) mappings"

echo ""
echo "🚨 Sample Import Analysis:"
echo "Checking a few files for import patterns..."

SAMPLE_FILES=(
  "app/api/admin/dashboard/route.ts"
  "app/api/doctors/dashboard/route.ts"
  "app/api/patients/route.ts"
)

for file in "${SAMPLE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "- $file:"
    grep "from '@/" "$file" | head -3 | sed 's/^/    /'
  fi
done

echo ""
echo "💡 Suspected Issue:"
echo "The error spike suggests a module resolution problem."
echo "This typically happens when:"
echo "1. tsconfig.json paths are not working correctly"
echo "2. Missing next-env.d.ts file"
echo "3. TypeScript can't resolve @ path mappings"
echo ""

# Quick module resolution test
echo "🧪 Quick Resolution Test:"
if timeout 5 npx tsc --noEmit --showConfig >/dev/null 2>&1; then
    echo "✅ TypeScript configuration loads successfully"
else
    echo "❌ TypeScript configuration has issues"
fi

echo ""
echo "🎯 Recommended Fix Strategy:"
echo "1. Ensure next-env.d.ts exists and is correct"
echo "2. Verify tsconfig.json path mappings"
echo "3. Test module resolution with a single file"
echo "4. Apply systematic fixes to resolve import issues"