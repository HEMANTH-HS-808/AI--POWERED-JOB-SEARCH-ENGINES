/**
 * Script to verify API keys are loaded correctly
 * Run with: node verify-api-keys.js
 */

require('dotenv').config();

console.log('🔍 Checking API Keys Configuration...\n');

// Check GitHub API Key
const githubKey = process.env.GITHUB_API_KEY;
if (githubKey && githubKey.startsWith('github_pat_')) {
  console.log('✅ GitHub API Key: Configured');
  console.log(`   Key: ${githubKey.substring(0, 20)}...${githubKey.substring(githubKey.length - 10)}`);
} else {
  console.log('⚠️  GitHub API Key: Using default key from code');
}

// Check Gemini API Key
if (process.env.GEMINI_API_KEY) {
  console.log('✅ Gemini API Key: Configured');
  console.log(`   Key: ${process.env.GEMINI_API_KEY.substring(0, 20)}...`);
} else {
  console.log('❌ Gemini API Key: Not found in .env');
  console.log('   Add GEMINI_API_KEY=your_key to server/.env');
}

// Check JSearch API Key
if (process.env.JSEARCH_API_KEY) {
  console.log('✅ JSearch API Key: Configured');
} else {
  console.log('⚠️  JSearch API Key: Not configured (optional)');
}

// Check Adzuna API Keys
if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
  console.log('✅ Adzuna API: Configured');
} else {
  console.log('⚠️  Adzuna API: Not configured (optional)');
}

// Check LinkedIn API Key
if (process.env.LINKEDIN_API_KEY) {
  console.log('✅ LinkedIn API Key: Configured');
} else {
  console.log('⚠️  LinkedIn API Key: Not configured (optional)');
}

// Check Unstop API Key
if (process.env.UNSTOP_API_KEY) {
  console.log('✅ Unstop API Key: Configured');
} else {
  console.log('⚠️  Unstop API Key: Not configured (optional)');
}

console.log('\n📝 Summary:');
console.log('   - GitHub API: Active (location-based search works)');
if (process.env.GEMINI_API_KEY) {
  console.log('   - Gemini API: Active (AI features enabled)');
} else {
  console.log('   - Gemini API: Not configured (AI features will use mock data)');
}

console.log('\n💡 To test:');
console.log('   1. Restart your server: npm run server');
console.log('   2. Test location search: GET /api/recommendations/companies/Bangalore');
console.log('   3. Test AI features: Use the career path feature');

