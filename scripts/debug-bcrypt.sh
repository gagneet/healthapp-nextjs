#!/bin/bash

# debug-bcrypt.sh - Debug bcrypt vs bcryptjs compatibility
# Usage: ./scripts/debug-bcrypt.sh

set -e

STACK_NAME="healthapp-test"
APP_CONTAINER=$(docker ps --filter "name=${STACK_NAME}_app" --format "{{.ID}}" | head -1)
POSTGRES_CONTAINER=$(docker ps --filter "name=${STACK_NAME}_postgres" --format "{{.ID}}" | head -1)

echo "🔍 bcrypt vs bcryptjs Compatibility Debug"
echo "=========================================="

echo "✅ App container: $APP_CONTAINER"
echo "✅ DB container: $POSTGRES_CONTAINER"
echo

# Get the actual hash from database
echo "📊 Getting actual password hash from database..."
ACTUAL_HASH=$(docker exec $POSTGRES_CONTAINER psql -U healthapp_user -d healthapp_test -t -c "SELECT password_hash FROM users WHERE email = 'doctor@healthapp.com';" | tr -d ' ')

echo "🔍 Actual hash from DB: $ACTUAL_HASH"
echo

# Check what packages are available in the container
echo "📦 Checking available bcrypt packages in container..."
docker exec $APP_CONTAINER node -e "
try {
    const bcrypt = require('bcrypt');
    console.log('✅ bcrypt package available:', bcrypt.VERSION || 'version unknown');
} catch (e) {
    console.log('❌ bcrypt package not available:', e.message);
}

try {
    const bcryptjs = require('bcryptjs');
    console.log('✅ bcryptjs package available:', bcryptjs.version || 'version unknown');
} catch (e) {
    console.log('❌ bcryptjs package not available:', e.message);
}
"

echo
echo "🔍 Testing password verification with both libraries..."

# Test with bcryptjs
docker exec $APP_CONTAINER node -e "
const bcryptjs = require('bcryptjs');
const hash = '$ACTUAL_HASH';

console.log('🧪 Testing with bcryptjs:');
const testPasswords = ['T3mpP@ssw0rd2376!', 'password', 'doctor123', 'healthapp123', 'doctor', 'test123'];

testPasswords.forEach(pwd => {
    try {
        const matches = bcryptjs.compareSync(pwd, hash);
        console.log(\`  bcryptjs - '\${pwd}': \${matches ? '✅ MATCHES!' : '❌ No match'}\`);
    } catch (e) {
        console.log(\`  bcryptjs - '\${pwd}': ❌ Error: \${e.message}\`);
    }
});
"

# Test with bcrypt if available
docker exec $APP_CONTAINER node -e "
try {
    const bcrypt = require('bcrypt');
    const hash = '$ACTUAL_HASH';

    console.log('\\n🧪 Testing with bcrypt:');
    const testPasswords = ['T3mpP@ssw0rd2376!', 'password', 'doctor123', 'healthapp123', 'doctor', 'test123'];

    testPasswords.forEach(pwd => {
        try {
            const matches = bcrypt.compareSync(pwd, hash);
            console.log(\`  bcrypt - '\${pwd}': \${matches ? '✅ MATCHES!' : '❌ No match'}\`);
        } catch (e) {
            console.log(\`  bcrypt - '\${pwd}': ❌ Error: \${e.message}\`);
        }
    });
} catch (e) {
    console.log('\\n⚠️ bcrypt not available, skipping bcrypt tests');
}
" 2>/dev/null || echo "⚠️ bcrypt not available for testing"

echo
echo "🔍 Checking what your auth system imports..."

# Check the auth configuration file
docker exec $APP_CONTAINER find . -name "*.ts" -o -name "*.js" | xargs grep -l "bcrypt" | head -5 | while read file; do
    echo "📄 Found bcrypt usage in: $file"
    docker exec $APP_CONTAINER grep -n "bcrypt" "$file" | head -3
done

echo
echo "🔍 Checking package.json dependencies..."
docker exec $APP_CONTAINER cat package.json | grep -E "(bcrypt|bcryptjs)" || echo "No bcrypt packages found in package.json"

echo
echo "🔧 Creating a test hash with the SAME method as your seeder..."

# Check what the seeder actually uses
docker exec $APP_CONTAINER node -e "
// Try to recreate the seeding process
console.log('🌱 Recreating seeder hash generation...');

try {
    // Try bcryptjs first (most common)
    const bcryptjs = require('bcryptjs');
    const testPassword = 'T3mpP@ssw0rd2376!';
    const newHash = bcryptjs.hashSync(testPassword, 12);
    console.log('bcryptjs hash for \"T3mpP@ssw0rd2376!\":', newHash);
    
    // Test if this new hash works with the same password
    const verification = bcryptjs.compareSync(testPassword, newHash);
    console.log('bcryptjs self-verification:', verification ? '✅ Works' : '❌ Failed');
    
} catch (e) {
    console.log('❌ Error with bcryptjs:', e.message);
}

try {
    // Try bcrypt if available
    const bcrypt = require('bcrypt');
    const testPassword = 'T3mpP@ssw0rd2376!';
    const newHash = bcrypt.hashSync(testPassword, 12);
    console.log('bcrypt hash for \"T3mpP@ssw0rd2376!\":', newHash);
    
    // Test if this new hash works with the same password
    const verification = bcrypt.compareSync(testPassword, newHash);
    console.log('bcrypt self-verification:', verification ? '✅ Works' : '❌ Failed');
    
} catch (e) {
    console.log('⚠️ bcrypt not available');
}
"

echo
echo "📋 Summary & Next Steps:"
echo "========================"
echo "1. Check which bcrypt library your auth system uses"
echo "2. Check which bcrypt library your seeder uses"  
echo "3. If there's a mismatch, update one to match the other"
echo "4. Re-run seeder with consistent library"
echo
echo "🔧 Quick fixes to try:"
echo "====================="
echo "# Option 1: Reset password using the same library as auth:"
echo "docker exec $APP_CONTAINER node -e \"
const bcryptjs = require('bcryptjs');
console.log('New hash:', bcryptjs.hashSync('T3mpP@ssw0rd2376!', 12));
\""
echo
echo "# Option 2: Check your auth.ts or auth.js file for bcrypt imports"
echo "# Option 3: Make sure seeder and auth use the same bcrypt library"
