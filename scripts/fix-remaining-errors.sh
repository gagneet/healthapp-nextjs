#!/bin/bash
# Comprehensive TypeScript Error Fix Script
# Fixes remaining common patterns across the healthcare platform

set -e

echo "🏥 Healthcare Platform - Comprehensive Error Fix"
echo "=============================================="

# Fix doctor profile relationships across all files
echo "🔧 Fixing doctor profile relationships..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.doctor\./prisma.doctorProfile./g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/include: { doctor:/include: { doctorProfile:/g' {} +

# Fix patient profile relationships
echo "🔧 Fixing patient profile relationships..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.patient\./prisma.patient./g' {} +

# Fix HSP profile relationships  
echo "🔧 Fixing HSP profile relationships..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/prisma\.hsp\./prisma.hspProfile./g' {} + 2>/dev/null || true

# Fix user field references
echo "🔧 Fixing user field references..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/date_of_birth/dateOfBirth/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/medical_license_number/medicalLicenseNumber/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/years_of_experience/yearsOfExperience/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/consultation_fee/consultationFee/g' {} +

# Fix auto-generated relationship names
echo "🔧 Fixing auto-generated relationship names..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/users_Doctor_userIdTousers/user/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/users_doctors_userIdTousers/user/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/specialities:/specialty:/g' {} +

# Fix common typos in double relationship references
echo "🔧 Fixing double profile references..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/doctorProfileProfile/doctorProfile/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/patientProfileProfile/patientProfile/g' {} +
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/hspProfileProfile/hspProfile/g' {} +

# Fix session type issues  
echo "🔧 Fixing session type issues..."
find app/ lib/ -name "*.ts" -type f -exec sed -i 's/Session.user/session.user/g' {} + 2>/dev/null || true

# Fix component import issues
echo "🔧 Fixing component import issues..."
find components/ -name "*.tsx" -type f -exec sed -i "s/from '@\/types\/auth'/from '@\/lib\/auth'/g" {} + 2>/dev/null || true

# Fix API response type consistency
echo "🔧 Fixing API response types..."
find app/api/ -name "*.ts" -type f -exec sed -i 's/NextResponse<any>/NextResponse/g' {} +

echo "✅ Comprehensive fixes completed!"

# Validation
echo ""
echo "🔍 Validation Summary:"

echo -n "- Doctor profile references: "
if grep -r "prisma\.doctor\." app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  $(grep -r "prisma\.doctor\." app/ lib/ --include="*.ts" | wc -l) remaining"
else
    echo "✅ Fixed"
fi

echo -n "- Auto-generated relationship names: "
if grep -r "users_.*_userIdTousers" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  Still found"
else
    echo "✅ Fixed"
fi

echo -n "- Snake case field names: "
if grep -r "_license_number\|_of_experience" app/ lib/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  Still found"
else
    echo "✅ Fixed"
fi

echo ""
echo "💡 Next: Run 'npm run type-check' to verify error count reduction"