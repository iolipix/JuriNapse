console.log('🚨 RAILWAY EMERGENCY DIAGNOSTIC - IMMEDIATE EXECUTION');
console.log('=' .repeat(60));
console.log('🕐 Timestamp:', new Date().toISOString());
console.log('📂 Working Directory:', process.cwd());
console.log('📂 __dirname:', __dirname);

const fs = require('fs');
const path = require('path');

// 1. Check what files exist in controllers/
console.log('\n📁 CONTROLLERS DIRECTORY CONTENT:');
console.log('-' .repeat(40));
try {
  const controllersPath = path.join(process.cwd(), 'controllers');
  const files = fs.readdirSync(controllersPath);
  console.log('✅ Controllers directory exists');
  console.log('📋 Files found:', files.length);
  files.forEach(file => {
    console.log(`  📄 ${file}`);
  });
} catch (error) {
  console.log('❌ Error reading controllers directory:', error.message);
}

// 2. Check specifically for auth controllers
console.log('\n🔍 AUTH CONTROLLER FILES CHECK:');
console.log('-' .repeat(40));
const authFiles = [
  'controllers/auth.controller.js',
  'controllers/auth-new-232235.js'
];

authFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath} EXISTS`);
    
    // Read first 200 characters
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const preview = content.substring(0, 200).replace(/\n/g, ' ');
      console.log(`   Preview: ${preview}...`);
      
      // Check for problematic imports
      if (content.includes('require(\'../services/email.service\')') || 
          content.includes('require("../services/email.service")')) {
        console.log(`   🚨 PROBLEM: Contains email.service import!`);
      } else {
        console.log(`   ✅ GOOD: No problematic email.service imports`);
      }
      
    } catch (readError) {
      console.log(`   ❌ Error reading file: ${readError.message}`);
    }
  } else {
    console.log(`❌ ${filePath} DOES NOT EXIST`);
  }
});

// 3. Check which file auth.routes.js is trying to load
console.log('\n🔍 AUTH ROUTES IMPORT CHECK:');
console.log('-' .repeat(40));
try {
  const routesPath = path.join(process.cwd(), 'routes', 'auth.routes.js');
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    console.log('✅ auth.routes.js exists');
    
    // Find the require line
    const requireMatch = routesContent.match(/require\(['"][^'"]+\/auth[^'"]*['"]\)/);
    if (requireMatch) {
      console.log(`📋 Routes require statement: ${requireMatch[0]}`);
    } else {
      console.log('❌ Could not find auth controller require statement');
    }
  } else {
    console.log('❌ auth.routes.js does not exist');
  }
} catch (error) {
  console.log('❌ Error checking auth.routes.js:', error.message);
}

// 4. Try to import the controllers
console.log('\n🧪 CONTROLLER IMPORT TESTS:');
console.log('-' .repeat(40));

// Test old controller
try {
  console.log('Testing require("./controllers/auth.controller")...');
  const oldController = require('./controllers/auth.controller');
  console.log('✅ OLD controller imported successfully');
} catch (error) {
  console.log('❌ OLD controller failed:', error.message);
}

// Test new controller
try {
  console.log('Testing require("./controllers/auth-new-232235")...');
  const newController = require('./controllers/auth-new-232235');
  console.log('✅ NEW controller imported successfully');
} catch (error) {
  console.log('❌ NEW controller failed:', error.message);
}

// 5. Environment info
console.log('\n🔧 ENVIRONMENT INFO:');
console.log('-' .repeat(40));
console.log('📊 Node version:', process.version);
console.log('📊 Platform:', process.platform);
console.log('📊 NODE_ENV:', process.env.NODE_ENV || 'undefined');

console.log('\n📊 DIAGNOSTIC COMPLETE');
console.log('=' .repeat(60));
