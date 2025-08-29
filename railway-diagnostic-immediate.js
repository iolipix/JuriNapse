console.log('🔍 RAILWAY DIAGNOSTIC - Immediate file check');
console.log('=' .repeat(50));

console.log('📂 Current working directory:', process.cwd());
console.log('📂 __dirname would be:', __dirname);

const fs = require('fs');
const path = require('path');

// Check if the auth controller file exists and what it contains
const authPath = path.join(process.cwd(), 'controllers', 'auth.controller.js');
console.log('🔍 Checking auth controller at:', authPath);

if (fs.existsSync(authPath)) {
  console.log('✅ Auth controller file exists');
  
  // Read first 500 characters to see what's in the file
  const content = fs.readFileSync(authPath, 'utf8');
  const preview = content.substring(0, 500);
  
  console.log('📝 File preview (first 500 chars):');
  console.log('-'.repeat(40));
  console.log(preview);
  console.log('-'.repeat(40));
  
  // Check for problematic imports
  if (content.includes('require(\'../services/email.service\')')) {
    console.log('🚨 PROBLEM FOUND: Old email.service import detected!');
  } else if (content.includes('email.service')) {
    console.log('⚠️ WARNING: email.service string found but not as require');
  } else {
    console.log('✅ NO PROBLEMATIC EMAIL IMPORTS FOUND');
  }
  
  // Check for the new railway markers
  if (content.includes('RAILWAY AUTH CONTROLLER FINAL')) {
    console.log('✅ NEW RAILWAY VERSION DETECTED');
  } else {
    console.log('❌ OLD VERSION - New railway markers not found');
  }
  
} else {
  console.log('❌ Auth controller file not found!');
}

console.log('\n🧪 Testing controller import...');
try {
  const controller = require('./controllers/auth.controller.js');
  console.log('✅ Controller imported successfully');
  console.log('📋 Available methods:', Object.keys(controller));
} catch (error) {
  console.log('❌ Controller import failed:', error.message);
  console.log('📍 Error stack:', error.stack);
}

console.log('\n📊 Diagnostic complete');
console.log('=' .repeat(50));
