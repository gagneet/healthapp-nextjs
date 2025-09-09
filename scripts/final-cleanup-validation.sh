#!/bin/bash
# Final Cleanup and Validation Script
# Healthcare Management Platform - TypeScript Error Resolution
# Created during systematic error resolution process

set -e

echo "🏥 Healthcare Platform - Final Cleanup & Validation"
echo "================================================="

# Final cleanup of any remaining edge cases
echo "🔧 Final cleanup of edge cases..."

# Fix any remaining double references that might have been missed
echo "- Fixing double profile references..."
find app/ lib/ components/ -name "*.ts" -o -name "*.tsx" -type f | xargs sed -i 's/doctorProfileProfile/doctorProfile/g' 2>/dev/null || true
find app/ lib/ components/ -name "*.ts" -o -name "*.tsx" -type f | xargs sed -i 's/patientProfileProfile/patientProfile/g' 2>/dev/null || true
find app/ lib/ components/ -name "*.ts" -o -name "*.tsx" -type f | xargs sed -i 's/hspProfileProfile/hspProfile/g' 2>/dev/null || true

# Fix any remaining session capitalization issues
echo "- Fixing session capitalization..."
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/Session\.user/session.user/g' 2>/dev/null || true
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/Session\.expires/session.expires/g' 2>/dev/null || true

# Fix any remaining enum case issues
echo "- Standardizing enum cases..."
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/STATUS\.ACTIVE/status: "ACTIVE"/g' 2>/dev/null || true
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/ROLE\.DOCTOR/role: "DOCTOR"/g' 2>/dev/null || true
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/TYPE\.PRIMARY/type: "PRIMARY"/g' 2>/dev/null || true

# Fix common import path issues
echo "- Fixing import paths..."
find components/ -name "*.tsx" -type f | xargs sed -i "s/from '@\/types\/auth'/from '@\/lib\/auth'/g" 2>/dev/null || true
find components/ -name "*.tsx" -type f | xargs sed -i "s/from '@\/types\/user'/from '@\/lib\/types'/g" 2>/dev/null || true

# Fix API response consistency
echo "- Fixing API response types..."
find app/api/ -name "*.ts" -type f | xargs sed -i 's/NextResponse<any>/NextResponse/g' 2>/dev/null || true
find app/api/ -name "*.ts" -type f | xargs sed -i 's/Response<any>/Response/g' 2>/dev/null || true

# Fix any undefined property access patterns
echo "- Fixing undefined property access..."
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/user\.doctor\./user?.doctorProfile\./g' 2>/dev/null || true
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/user\.patient\./user?.patientProfile\./g' 2>/dev/null || true
find app/ lib/ -name "*.ts" -type f | xargs sed -i 's/user\.hsp\./user?.hspProfile\./g' 2>/dev/null || true

echo "✅ Final cleanup completed!"

# Comprehensive validation
echo ""
echo "🔍 Comprehensive Validation Summary:"
echo "===================================="

echo -n "- Double profile references: "
if grep -r "ProfileProfile" app/ lib/ components/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "ProfileProfile" app/ lib/ components/ --include="*.ts" --include="*.tsx" | wc -l) remaining"
else
    echo "✅ Clean"
fi

echo -n "- Doctor profile references: "
if grep -r "prisma\.doctor\." app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "prisma\.doctor\." app/ lib/ --include="*.ts" | wc -l) remaining"
else
    echo "✅ Fixed"
fi

echo -n "- Auto-generated relationship names: "
if grep -r "users_.*_userIdTousers" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "users_.*_userIdTousers" app/ lib/ --include="*.ts" | wc -l) remaining"
else
    echo "✅ Fixed"
fi

echo -n "- Snake case field patterns: "
if grep -r "_license_number\|_of_experience\|_of_birth" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "_license_number\|_of_experience\|_of_birth" app/ lib/ --include="*.ts" | wc -l) remaining"
else
    echo "✅ Fixed"
fi

echo -n "- Session capitalization: "
if grep -r "Session\." app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "Session\." app/ lib/ --include="*.ts" | wc -l) remaining"
else
    echo "✅ Fixed"
fi

echo -n "- Import path issues: "
if grep -r "from '@/types/auth'" components/ --include="*.tsx" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "from '@/types/auth'" components/ --include="*.tsx" | wc -l) remaining"
else
    echo "✅ Fixed"
fi

echo ""
echo "📊 Pattern Analysis Complete"
echo ""
echo "💡 Next Steps:"
echo "  1. Run 'npm run type-check' to get current error count"
echo "  2. Review any remaining errors for manual fixes"  
echo "  3. Run 'npm run lint' to ensure code quality"
echo "  4. Test critical healthcare functionality"
echo ""
echo "🎯 All systematic fixes applied!"