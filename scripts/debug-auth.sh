#!/bin/bash

# debug-auth.sh - Debug authentication issues
# Usage: ./scripts/debug-auth.sh

set -e

STACK_NAME="healthapp-test"

echo "🔍 HealthApp Authentication Debugging"
echo "====================================="

# Get running app container
CONTAINER_ID=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No running app containers found"
    exit 1
fi

echo "✅ Found app container: $CONTAINER_ID"
echo

# Get PostgreSQL container for direct database queries
POSTGRES_CONTAINER=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ No running PostgreSQL containers found"
    exit 1
fi

echo "✅ Found PostgreSQL container: $POSTGRES_CONTAINER"
echo

echo "📊 Checking database users..."
echo "=============================="

# Check all users in the database
echo "🔍 All users in database:"
docker exec "$POSTGRES_CONTAINER" psql -U healthapp_user -d healthapp_test -c "
SELECT 
    id, 
    email, 
    name, 
    role, 
    password_hash IS NOT NULL as has_password,
    LENGTH(password_hash) as password_length,
    createdAt
FROM users 
ORDER BY email;
"

echo
echo "🔍 Looking for doctor@healthapp.com specifically:"
docker exec "$POSTGRES_CONTAINER" psql -U healthapp_user -d healthapp_test -c "
SELECT 
    id, 
    email, 
    name, 
    role, 
    password_hash,
    createdAt
FROM users 
WHERE email = 'doctor@healthapp.com';
"

echo
echo "🔍 All users with doctor role:"
docker exec "$POSTGRES_CONTAINER" psql -U healthapp_user -d healthapp_test -c "
SELECT 
    id, 
    email, 
    name, 
    role, 
    password_hash IS NOT NULL as has_password
FROM users 
WHERE role = 'DOCTOR' 
ORDER BY email;
"

echo
echo "🔍 Checking password hashing in application..."
echo "=============================================="

# Check if we can verify passwords using the app's hashing mechanism
echo "Testing password verification for doctor@healthapp.com..."

# Create a test script to run inside the container
docker exec "$CONTAINER_ID" node -e "
const bcrypt = require('bcryptjs');

console.log('🔍 Testing password hashing...');

// Test password (usually 'T3mpP@ssw0rd2376!' or 'password' for seeded data)
const testPasswords = ['T3mpP@ssw0rd2376!', 'password', 'doctor123', 'healthapp123'];

testPasswords.forEach(pwd => {
    const hash = bcrypt.hashSync(pwd, 12);
    console.log(\`Password '\${pwd}' -> Hash: \${hash.substring(0, 30)}...\`);
});

console.log('\\n🔍 If you know the expected password hash, test verification:');
console.log('bcrypt.compareSync(\"T3mpP@ssw0rd2376!\", \"your_hash_here\")');
" || echo "⚠️ Could not run password test (bcryptjs might not be available)"

echo
echo "🔍 Check Auth.js configuration..."
echo "================================="

# Check environment variables related to auth
echo "Environment variables in app container:"
docker exec "$CONTAINER_ID" env | grep -E "(NEXTAUTH|AUTH|DATABASE)" | sort

echo
echo "📋 Common Issues & Solutions:"
echo "============================="
echo "1. Check if user exists: ✓ (see query above)"
echo "2. Check password hash format: ✓ (see query above)" 
echo "3. Verify password matches: Run manual test below"
echo "4. Check Auth.js configuration: Verify NEXTAUTH_SECRET is set"
echo "5. Database connection: Check if DATABASE_URL is correct"
echo
echo "🧪 Manual Password Test:"
echo "========================"
echo "If you want to test a specific password, run:"
echo "docker exec $CONTAINER_ID node -e \""
echo "const bcrypt = require('bcryptjs');"
echo "const password = 'YOUR_PASSWORD_HERE';"
echo "const hash = 'HASH_FROM_DATABASE_HERE';"
echo "console.log('Password matches:', bcrypt.compareSync(password, hash));"
echo "\""
echo
echo "🔧 Quick Fix Commands:"
echo "====================="
echo "# Reset a user's password:"
echo "docker exec $POSTGRES_CONTAINER psql -U healthapp_user -d healthapp_test -c \""
echo "UPDATE users SET password_hash = '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAArtL.xayP1CJUm' WHERE email = 'doctor@healthapp.com';\""
echo "# (This sets password to 'T3mpP@ssw0rd2376!')"
echo
echo "# Re-run seeds to reset all test data:"
echo "docker exec $CONTAINER_ID npm run seed"
