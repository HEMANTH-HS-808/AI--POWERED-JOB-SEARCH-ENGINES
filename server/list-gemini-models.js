// List available Gemini models for this API key
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDClwm-ew6jZD_TwezB_Bb5uZg6AbdvZD8";

console.log('Listing available Gemini models...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 5)}` : 'NOT FOUND');

if (!API_KEY) {
  console.error('❌ No API key found!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    // List all available models
    const models = await genAI.listModels();
    
    console.log('\n=== Available Models ===\n');
    
    let visionModels = [];
    let textModels = [];
    
    for await (const model of models) {
      const modelName = model.name;
      const displayName = model.displayName || 'N/A';
      const supportedMethods = model.supportedGenerationMethods || [];
      const supportsVision = supportedMethods.includes('generateContent');
      
      console.log(`Model: ${modelName}`);
      console.log(`  Display Name: ${displayName}`);
      console.log(`  Supported Methods: ${supportedMethods.join(', ')}`);
      
      // Check if it supports vision by looking at input/output token limits
      if (model.inputTokenLimit && model.outputTokenLimit) {
        console.log(`  Input Tokens: ${model.inputTokenLimit}, Output Tokens: ${model.outputTokenLimit}`);
      }
      
      // Try to determine if it supports vision
      if (supportsVision) {
        // Test with a simple call to see if it works
        try {
          const testModel = genAI.getGenerativeModel({ model: modelName });
          const result = await testModel.generateContent('test');
          await result.response;
          textModels.push(modelName);
          console.log(`  ✅ Works for text generation`);
        } catch (e) {
          console.log(`  ❌ Error: ${e.message.substring(0, 100)}`);
        }
      }
      
      console.log('');
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total models found: ${models.length}`);
    console.log(`Text models: ${textModels.length}`);
    
    // Try to find vision-capable models by testing with an image
    console.log('\n=== Testing Vision Capabilities ===\n');
    const visionTestImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const modelsToTest = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const imagePart = {
          inlineData: {
            data: visionTestImage,
            mimeType: 'image/png'
          }
        };
        const result = await model.generateContent(['What is this?', imagePart]);
        const response = await result.response;
        const text = await response.text();
        console.log(`  ✅ ${modelName} supports vision!`);
        visionModels.push(modelName);
      } catch (e) {
        console.log(`  ❌ ${modelName}: ${e.message.substring(0, 100)}`);
      }
    }
    
    if (visionModels.length > 0) {
      console.log(`\n✅ Vision-capable models: ${visionModels.join(', ')}`);
    } else {
      console.log(`\n❌ No vision-capable models found. Your API key may not have vision access.`);
    }
    
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels().catch(console.error);

