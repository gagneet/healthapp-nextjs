#!/bin/bash
# Validation Script for TypeScript Error Resolution
# Healthcare Management Platform - Systematic Error Resolution
# Created during comprehensive TypeScript fix process

set -e

echo "🏥 Healthcare Platform - Fix Validation Report"
echo "=============================================="

# Count total TypeScript files
TOTAL_TS_FILES=$(find . -name "*.ts" -o -name "*.tsx" | grep -E "(app|lib|components)" | wc -l)
echo "📊 Total TypeScript files analyzed: $TOTAL_TS_FILES"

echo ""
echo "🔍 Pattern Analysis Results:"
echo "============================"

# Check for remaining common error patterns
echo "1. Doctor Profile Relationship Issues:"
DOCTOR_PRISMA_REFS=$(grep -r "prisma\.doctor\." app/ lib/ --include="*.ts" 2>/dev/null | wc -l)
echo "   - Legacy prisma.doctor references: $DOCTOR_PRISMA_REFS remaining"

DOCTOR_INCLUDE_REFS=$(grep -r "include: { doctor:" app/ lib/ --include="*.ts" 2>/dev/null | wc -l)
echo "   - Old doctor include patterns: $DOCTOR_INCLUDE_REFS remaining"

echo ""
echo "2. Field Name Standardization:"
SNAKE_CASE_FIELDS=$(grep -r "_license_number\|_of_experience\|_of_birth" app/ lib/ --include="*.ts" 2>/dev/null | wc -l)
echo "   - Snake case field patterns: $SNAKE_CASE_FIELDS remaining"

AUTO_GEN_RELATIONS=$(grep -r "users_.*_userIdTousers" app/ lib/ --include="*.ts" 2>/dev/null | wc -l)
echo "   - Auto-generated relationship names: $AUTO_GEN_RELATIONS remaining"

echo ""
echo "3. Double Reference Issues:"
DOUBLE_PROFILES=$(grep -r "ProfileProfile" app/ lib/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "   - Double profile references: $DOUBLE_PROFILES remaining"

echo ""
echo "4. Session and Import Issues:"
SESSION_CAPS=$(grep -r "Session\." app/ lib/ --include="*.ts" 2>/dev/null | wc -l)
echo "   - Session capitalization issues: $SESSION_CAPS remaining"

IMPORT_ISSUES=$(grep -r "from '@/types/auth'" components/ --include="*.tsx" 2>/dev/null | wc -l)
echo "   - Import path issues: $IMPORT_ISSUES remaining"

echo ""
echo "5. API Response Consistency:"
ANY_RESPONSES=$(grep -r "NextResponse<any>" app/api/ --include="*.ts" 2>/dev/null | wc -l)
echo "   - Generic API responses: $ANY_RESPONSES remaining"

echo ""
echo "📈 Overall Fix Assessment:"
echo "========================="

TOTAL_REMAINING=$(($DOCTOR_PRISMA_REFS + $DOCTOR_INCLUDE_REFS + $SNAKE_CASE_FIELDS + $AUTO_GEN_RELATIONS + $DOUBLE_PROFILES + $SESSION_CAPS + $ANY_RESPONSES))
echo "Total pattern issues remaining: $TOTAL_REMAINING"

if [ $TOTAL_REMAINING -eq 0 ]; then
    echo "✅ All systematic patterns have been resolved!"
    echo "🎯 Ready for comprehensive testing"
elif [ $TOTAL_REMAINING -lt 20 ]; then
    echo "🟡 Few remaining issues - excellent progress!"
    echo "💡 Consider manual review for remaining edge cases"
else
    echo "🟠 Some patterns still need attention"
    echo "💡 May need additional targeted fixes"
fi

echo ""
echo "🚀 Next Recommended Actions:"
echo "============================="
echo "1. Manual review of any remaining pattern matches"
echo "2. Test critical healthcare functionality"
echo "3. Run integration tests for key user flows"
echo "4. Validate HIPAA compliance patterns"
echo ""

# List specific files with remaining issues for manual review
if [ $TOTAL_REMAINING -gt 0 ] && [ $TOTAL_REMAINING -lt 50 ]; then
    echo "🔍 Files needing manual review:"
    echo "==============================="
    
    if [ $DOCTOR_PRISMA_REFS -gt 0 ]; then
        echo "Doctor prisma references:"
        grep -r "prisma\.doctor\." app/ lib/ --include="*.ts" -l 2>/dev/null | head -5
        echo ""
    fi
    
    if [ $SNAKE_CASE_FIELDS -gt 0 ]; then
        echo "Snake case fields:"
        grep -r "_license_number\|_of_experience\|_of_birth" app/ lib/ --include="*.ts" -l 2>/dev/null | head -5
        echo ""
    fi
fi

echo "✅ Validation complete!"