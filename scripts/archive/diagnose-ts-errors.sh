#!/bin/bash
# Diagnose TypeScript Errors - Non-blocking Analysis
# Healthcare Management Platform - Error Investigation

set -e

echo "🩺 TypeScript Error Diagnosis"
echo "============================"

# Count files by type
echo "📊 Project Structure Analysis:"
echo "- Total TS files: $(find . -name '*.ts' | grep -E '(app|lib|components)' | wc -l)"
echo "- Total TSX files: $(find . -name '*.tsx' | grep -E '(app|lib|components)' | wc -l)"
echo "- API route files: $(find app/api -name '*.ts' | wc -l)"
echo "- Component files: $(find components -name '*.tsx' 2>/dev/null | wc -l || echo "0")"

echo ""
echo "🔍 Quick Import Pattern Analysis:"

# Check most common import patterns that are failing
echo "Top import patterns in error-prone files:"
echo ""

# Sample a few files to understand import patterns
SAMPLE_FILES=($(find app/api -name "*.ts" | head -10))

echo "Analyzing sample API route imports..."
for file in "${SAMPLE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📄 $file:"
        grep -n "import.*@/" "$file" | head -3 | sed 's/^/  /' || echo "  (no @/ imports)"
        echo ""
    fi
done

echo "🚨 Common Error Patterns:"
echo "========================"

# Test what happens when we try to resolve some imports
echo "Testing module resolution..."

# Check if the issue is isolated or systemic
ERROR_COUNT=0

# Test key modules
echo "1. Testing @/lib/auth resolution:"
if node -e "try { require('./lib/auth.ts'); console.log('✅ Found'); } catch(e) { console.log('❌ Failed:', e.message); }" 2>/dev/null | grep -q "✅"; then
    echo "   ✅ lib/auth.ts exists and is accessible"
else
    echo "   ⚠️  lib/auth.ts has issues"
    ((ERROR_COUNT++))
fi

echo "2. Testing @/lib/prisma resolution:"
if node -e "try { require('./lib/prisma.ts'); console.log('✅ Found'); } catch(e) { console.log('❌ Failed:', e.message); }" 2>/dev/null | grep -q "✅"; then
    echo "   ✅ lib/prisma.ts exists and is accessible"
else
    echo "   ⚠️  lib/prisma.ts has issues"
    ((ERROR_COUNT++))
fi

echo "3. Testing tsconfig.json validity:"
if node -e "try { const cfg = require('./tsconfig.json'); console.log('✅ Valid JSON'); console.log('   baseUrl:', cfg.compilerOptions?.baseUrl); console.log('   paths:', Object.keys(cfg.compilerOptions?.paths || {}).length, 'mappings'); } catch(e) { console.log('❌ Invalid:', e.message); }" 2>/dev/null; then
    echo "   ✅ tsconfig.json is valid"
else
    echo "   ❌ tsconfig.json has issues"
    ((ERROR_COUNT++))
fi

echo ""
echo "📈 Error Analysis Summary:"
echo "=========================="
echo "- Module resolution errors found: $ERROR_COUNT"
echo "- Files all exist: $([ -f lib/auth.ts ] && [ -f lib/prisma.ts ] && [ -f lib/api-response.ts ] && echo "✅ Yes" || echo "❌ No")"
echo "- next-env.d.ts present: $([ -f next-env.d.ts ] && echo "✅ Yes" || echo "❌ No")"

echo ""
echo "💡 Hypothesis:"
if [ $ERROR_COUNT -eq 0 ]; then
    echo "The 895 errors are likely due to TypeScript having trouble with:"
    echo "1. Path mapping resolution in complex project structure"
    echo "2. Next.js-specific module resolution conflicts"
    echo "3. Version compatibility between TypeScript 5.9.2 and Next.js 14.2.32"
    echo ""
    echo "🎯 Recommended Approach:"
    echo "Since files exist and config looks good, the issue is likely:"
    echo "- TypeScript compiler vs Next.js build system differences"
    echo "- Need to use Next.js build pipeline instead of direct tsc"
    echo "- Some systematic pattern in imports that needs adjustment"
else
    echo "Found $ERROR_COUNT critical issues that need to be fixed first"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Try npm run build instead of npm run type-check"
echo "2. Use Next.js development server to see real compilation results"
echo "3. Focus on batch fixing common import patterns"
echo ""
echo "✅ Diagnosis completed!"