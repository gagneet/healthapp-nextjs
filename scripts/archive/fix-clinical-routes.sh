#!/bin/bash
# Clinical Routes TypeScript Fix Script
# Fixes common issues in clinical API routes

set -e

echo "🏥 Fixing Clinical Routes TypeScript Errors"
echo "========================================="

# Fix doctor relationship issues in clinical routes
echo "🔧 Fixing doctor profile relationships..."
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/include: { doctor: true }/include: { doctorProfile: true }/g' {} +
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/user\.doctor\./user.doctorProfile./g' {} +
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/!user\.doctor/!user.doctorProfile/g' {} +
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/user?.doctor/user?.doctorProfile/g' {} +

# Fix patient assignments relationship
echo "🔧 Fixing patient assignment relationships..."
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/assignments: {/patientDoctorAssignments: {/g' {} +
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/\.assignments\.length/.patientDoctorAssignments.length/g' {} +

# Fix patient relationship includes
echo "🔧 Fixing patient relationship includes..."
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/include: { patient: true }/include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } }/g' {} +

# Fix symptom assessment relationships
echo "🔧 Fixing symptom assessment relationships..."
find app/api/clinical/ -name "*.ts" -type f -exec sed -i 's/patient: {/patient: { include: { user: true } }/g' {} + 2>/dev/null || true

echo "✅ Clinical routes fixes completed!"

# Validate fixes
echo ""
echo "🔍 Validation:"
echo -n "- Doctor profile references: "
if grep -r "user\.doctor\." app/api/clinical/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  Still found"
else
    echo "✅ Fixed"
fi

echo -n "- Assignment relationships: "
if grep -r "\.assignments\." app/api/clinical/ --include="*.ts" >/dev/null 2>&1; then
    echo "⚠️  Still found"
else
    echo "✅ Fixed"
fi