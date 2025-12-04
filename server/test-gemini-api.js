// Test script to verify Gemini API key and vision capabilities
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDClwm-ew6jZD_TwezB_Bb5uZg6AbdvZD8";

console.log('Testing Gemini API...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 5)}` : 'NOT FOUND');

if (!API_KEY) {
  console.error('❌ No API key found!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Test models
const modelsToTest = ['gemini-1.5-flash', 'gemini-pro-vision', 'gemini-1.5-pro'];

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Test simple text generation
    const result = await model.generateContent('Say "Hello" in one word');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ ${modelName} works! Response: ${text}`);
    return true;
  } catch (error) {
    console.error(`❌ ${modelName} failed:`, error.message);
    return false;
  }
}

async function testVision(modelName) {
  try {
    console.log(`\nTesting vision capabilities with ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Create a simple test image (1x1 pixel PNG in base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const imagePart = {
      inlineData: {
        data: testImageBase64,
        mimeType: 'image/png'
      }
    };
    
    const result = await model.generateContent(['What is in this image?', imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ Vision works with ${modelName}! Response: ${text.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Vision failed with ${modelName}:`, error.message);
    if (error.message.includes('API key')) {
      console.error('   This might be an API key authentication issue.');
    }
    return false;
  }
}

async function runTests() {
  console.log('\n=== Testing Text Generation ===');
  let textWorks = false;
  for (const model of modelsToTest) {
    if (await testModel(model)) {
      textWorks = true;
      break;
    }
  }
  
  console.log('\n=== Testing Vision Capabilities ===');
  let visionWorks = false;
  for (const model of modelsToTest) {
    if (await testVision(model)) {
      visionWorks = true;
      break;
    }
  }
  
  console.log('\n=== Summary ===');
  if (textWorks) {
    console.log('✅ Text generation: Working');
  } else {
    console.log('❌ Text generation: Failed - Check your API key');
  }
  
  if (visionWorks) {
    console.log('✅ Vision capabilities: Working');
  } else {
    console.log('❌ Vision capabilities: Failed - Your API key may not have vision access');
    console.log('   Try getting a new API key from: https://makersuite.google.com/app/apikey');
  }
}

runTests().catch(console.error);

