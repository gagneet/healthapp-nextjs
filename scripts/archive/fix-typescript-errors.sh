#!/bin/bash
# TypeScript Error Fix Script for Healthcare Management Platform
# Created during systematic error resolution process
# Usage: ./scripts/fix-typescript-errors.sh [pattern_name]

set -e

echo "🏥 Healthcare Platform - TypeScript Error Fix Script"
echo "=================================================="

# Function to apply prisma model name fixes
fix_prisma_models() {
    echo "🔧 Fixing Prisma model name issues..."
    
    # Fix PascalCase model usage to camelCase
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.Session\./prisma.session./g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.Patient\./prisma.patient./g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.Doctor\./prisma.doctor./g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.User\./prisma.user./g' {} +
    
    echo "✅ Prisma model names fixed"
}

# Function to fix relationship names
fix_relationships() {
    echo "🔧 Fixing relationship name issues..."
    
    # Fix device relationships
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/medicalDevice:/device:/g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/\.medicalDevice\./.device./g' {} +
    
    # Fix vital template to vital type
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/vitalTemplate:/vitalType:/g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/\.vitalTemplate\./.vitalType./g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/vitalTemplateId/vitalTypeId/g' {} +
    
    echo "✅ Relationship names fixed"
}

# Function to fix field name issues
fix_field_names() {
    echo "🔧 Fixing field name issues..."
    
    # Fix adherence status references
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/adherenceStatus:/status:/g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/\.adherenceStatus/.status/g' {} +
    
    # Fix medication ID references in adherence context
    find app/api/medications/adherence/ -name "*.ts" -type f -exec sed -i 's/medicationId:/relatedMedicationId:/g' {} +
    
    # Fix recorded timestamp references
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/\.recordedAt/.createdAt/g' {} + 2>/dev/null || true
    
    echo "✅ Field names fixed"
}

# Function to fix enum values
fix_enum_values() {
    echo "🔧 Fixing enum value issues..."
    
    # Fix medication adherence status enums (uppercase to lowercase)
    find app/ lib/ -name "*.ts" -type f -exec sed -i "s/'TAKEN'/'taken'/g" {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i "s/'MISSED'/'missed'/g" {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i "s/'LATE'/'late'/g" {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i "s/'PARTIAL'/'partial'/g" {} +
    
    echo "✅ Enum values fixed"
}

# Function to fix alert model references
fix_alert_models() {
    echo "🔧 Fixing alert model references..."
    
    # Fix alert model usage
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.vitalAlert\./prisma.patientAlert./g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.adherenceAlert\./prisma.patientAlert./g' {} +
    
    # Fix alert field mappings
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/alertLevel:/severity:/g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/vitalType:/alertType: '\''VITALS'\'',/g' {} + 2>/dev/null || true
    
    echo "✅ Alert models fixed"
}

# Function to fix care plan relationships
fix_care_plan_relationships() {
    echo "🔧 Fixing care plan relationship issues..."
    
    # Fix diet and workout plan relationships
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/\.diets\.map(/\.carePlanToDietPlans.map(/g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/\.workouts\.map(/\.carePlanToWorkoutPlans.map(/g' {} +
    
    echo "✅ Care plan relationships fixed"
}

# Function to fix import issues
fix_import_issues() {
    echo "🔧 Fixing common import issues..."
    
    # Remove healthcareDb imports
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/, healthcareDb//g' {} +
    find app/ lib/ -name "*.ts" -type f -exec sed -i 's/healthcareDb, //g' {} +
    
    echo "✅ Import issues fixed"
}

# Function to run all fixes
run_all_fixes() {
    echo "🚀 Running all TypeScript fixes..."
    fix_prisma_models
    fix_relationships
    fix_field_names
    fix_enum_values
    fix_alert_models
    fix_care_plan_relationships
    fix_import_issues
    echo "🎉 All fixes completed!"
}

# Function to validate fixes
validate_fixes() {
    echo "🔍 Validating fixes..."
    
    # Check for remaining common issues
    echo "Checking for remaining issues:"
    
    echo -n "- PascalCase Prisma models: "
    if grep -r "prisma\.[A-Z]" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
        echo "⚠️  Still found"
        grep -r "prisma\.[A-Z]" app/ lib/ --include="*.ts" | head -3
    else
        echo "✅ None found"
    fi
    
    echo -n "- medicalDevice references: "
    if grep -r "medicalDevice" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
        echo "⚠️  Still found"
        grep -r "medicalDevice" app/ lib/ --include="*.ts" | head -3
    else
        echo "✅ None found"
    fi
    
    echo -n "- vitalTemplate references: "
    if grep -r "vitalTemplate" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
        echo "⚠️  Still found"
        grep -r "vitalTemplate" app/ lib/ --include="*.ts" | head -3
    else
        echo "✅ None found"
    fi
}

# Main execution
case "${1:-all}" in
    "prisma")
        fix_prisma_models
        ;;
    "relationships")
        fix_relationships
        ;;
    "fields")
        fix_field_names
        ;;
    "enums")
        fix_enum_values
        ;;
    "alerts")
        fix_alert_models
        ;;
    "careplans")
        fix_care_plan_relationships
        ;;
    "imports")
        fix_import_issues
        ;;
    "validate")
        validate_fixes
        ;;
    "all")
        run_all_fixes
        validate_fixes
        ;;
    *)
        echo "Usage: $0 [prisma|relationships|fields|enums|alerts|careplans|imports|validate|all]"
        echo ""
        echo "Available fix patterns:"
        echo "  prisma        - Fix Prisma model name issues"
        echo "  relationships - Fix model relationship names"
        echo "  fields        - Fix field name issues"
        echo "  enums         - Fix enum value issues"  
        echo "  alerts        - Fix alert model references"
        echo "  careplans     - Fix care plan relationships"
        echo "  imports       - Fix import issues"
        echo "  validate      - Validate current state"
        echo "  all           - Run all fixes (default)"
        ;;
esac

echo ""
echo "💡 Tip: Run 'npm run type-check' to verify remaining errors"
echo "💡 Tip: Use './scripts/fix-typescript-errors.sh validate' to check progress"