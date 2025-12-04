const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const User = require('../models/User');
const demoStorage = require('../utils/demoStorage');

const router = express.Router();

// Initialize Gemini AI
let genAI;
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDClwm-ew6jZD_TwezB_Bb5uZg6AbdvZD8";
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// Store chat sessions (in production, use Redis or database)
const chatSessions = new Map();

// @route   POST /api/ai/chat
// @desc    Chat with Gemini AI - continuous conversation with session management
// @access  Public
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check for exit command
    if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
      if (sessionId && chatSessions.has(sessionId)) {
        chatSessions.delete(sessionId);
      }
      return res.json({
        response: 'Chat session ended. Thank you for using Gemini!',
        sessionEnded: true,
        timestamp: new Date().toISOString()
      });
    }

    if (!genAI) {
      // Return error if no API key configured
      return res.status(500).json({ 
        response: 'Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.',
        timestamp: new Date().toISOString(),
        error: true
      });
    }

    try {
      // Get or create chat session
      let chat;
      if (sessionId && chatSessions.has(sessionId)) {
        // Use existing chat session (maintains conversation history)
        chat = chatSessions.get(sessionId);
      } else {
        // Create new chat session
        // Use gemini-2.0-flash which is available (works for chat)
        // Keep the models/ prefix as it was working before
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
        const modelName = 'gemini-2.0-flash';
        
        // System instruction for job-related assistance
        const systemInstruction = `You are a helpful career advisor and job search assistant. Answer questions directly and helpfully. Be specific and provide real, actionable advice based on the user's question. Don't just list your capabilities - actually answer their question.

IMPORTANT: Format your responses using Markdown for better readability:
- Use **bold** for important points
- Use bullet points (-) or numbered lists (1.) for lists
- Use headings (##) for sections
- Use code formatting (\`code\`) for technical terms
- Keep paragraphs short and well-spaced
- Make your responses easy to read and visually appealing`;

        // Start chat with system instruction
        chat = model.startChat({
          systemInstruction: systemInstruction,
          history: []
        });

        // Store chat session
        const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        chatSessions.set(newSessionId, chat);
        
        // Send message and get response
        const aiResponse = await sendMessageToChat(chat, message);
        
        // Return session ID to client
        res.json({
          response: aiResponse,
          sessionId: newSessionId,
          timestamp: new Date().toISOString(),
          model: modelName
        });
        return;
      }

      // Send message to existing chat session
      const aiResponse = await sendMessageToChat(chat, message);

      res.json({
        response: aiResponse,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        model: 'gemini-2.0-flash'
      });

    } catch (aiError) {
      console.error('Gemini AI error details:', aiError);
      console.error('Error message:', aiError.message);
      console.error('Error stack:', aiError.stack);
      
      // Return error instead of mock - let user know there's an issue
      res.status(500).json({ 
        response: `I apologize, but I'm having trouble connecting to the AI service right now. Error: ${aiError.message}. Please try again in a moment.`,
        timestamp: new Date().toISOString(),
        error: true,
        errorDetails: process.env.NODE_ENV === 'development' ? aiError.message : undefined
      });
    }

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message' });
  }
});

// Helper function to send message to chat and get response
async function sendMessageToChat(chat, message) {
  try {
    console.log('Sending message to Gemini:', message.substring(0, 50) + '...');
    
    // Add timeout wrapper to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 50 seconds')), 50000);
    });
    
    const chatPromise = chat.sendMessage(message);
    
    // Race between chat response and timeout
    const result = await Promise.race([chatPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();
    console.log('Received AI response from Gemini (length:', text.length, 'chars)');
    return text;
  } catch (error) {
    console.error('Error sending message to chat:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    throw error;
  }
}

// @route   POST /api/ai/chat/start
// @desc    Start a new chat session
// @access  Public
router.post('/chat/start', async (req, res) => {
  try {
    if (!genAI) {
      return res.json({
        sessionId: null,
        message: 'Gemini API not configured. Using mock responses.',
        timestamp: new Date().toISOString()
      });
    }

    // Use gemini-2.0-flash which is available
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
    const modelName = 'gemini-2.0-flash';
    
    const systemInstruction = `You are a helpful career advisor and job search assistant. Answer questions directly and helpfully. Be specific and provide real, actionable advice based on the user's question. Don't just list your capabilities - actually answer their question.

IMPORTANT: Format your responses using Markdown for better readability:
- Use **bold** for important points
- Use bullet points (-) or numbered lists (1.) for lists
- Use headings (##) for sections
- Use code formatting (\`code\`) for technical terms
- Keep paragraphs short and well-spaced
- Make your responses easy to read and visually appealing`;

    const chat = model.startChat({
      systemInstruction: systemInstruction,
      history: []
    });

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    chatSessions.set(sessionId, chat);

    res.json({
      sessionId: sessionId,
      message: 'Chat session started! You can now send messages.',
      timestamp: new Date().toISOString(),
      model: 'gemini-2.0-flash'
    });

  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({ message: 'Error starting chat session' });
  }
});

// @route   DELETE /api/ai/chat/:sessionId
// @desc    End a chat session
// @access  Public
router.delete('/chat/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
    res.json({ message: 'Chat session ended', sessionId });
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

// @route   POST /api/ai/career-path
// @desc    Get AI-powered career path recommendations
// @access  Private
router.post('/career-path', auth, async (req, res) => {
  try {
    const { companyName, userSkills = [] } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    if (!genAI) {
      // Return mock response if no API key
      const mockResponse = generateMockCareerPath(companyName, userSkills);
      return res.json({ careerPath: mockResponse });
    }

    // Prepare the prompt for Gemini
    const prompt = createCareerPathPrompt(companyName, userSkills);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const careerPath = response.text();

      res.json({
        careerPath,
        companyName,
        userSkills,
        generatedAt: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('Gemini AI error:', aiError);
      // Fall back to mock response
      const mockResponse = generateMockCareerPath(companyName, userSkills);
      res.json({ 
        careerPath: mockResponse,
        note: 'Generated using fallback system due to AI service unavailability'
      });
    }

  } catch (error) {
    console.error('Career path error:', error);
    res.status(500).json({ message: 'Error generating career path' });
  }
});

// @route   POST /api/ai/skill-gap-analysis
// @desc    Analyze skill gaps for a specific role
// @access  Private
router.post('/skill-gap-analysis', auth, async (req, res) => {
  try {
    const { jobTitle, companyName, userSkills = [], jobRequirements = [] } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    const analysis = analyzeSkillGap(userSkills, jobRequirements, jobTitle, companyName);

    res.json({
      analysis,
      jobTitle,
      companyName,
      userSkills,
      jobRequirements,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({ message: 'Error analyzing skill gap' });
  }
});

// Helper function to create career path prompt
function createCareerPathPrompt(companyName, userSkills) {
  const skillsList = userSkills.length > 0 ? userSkills.join(', ') : 'beginner level';
  
  return `You are a Senior Tech Recruiter & Career Coach at ${companyName}. A student is interested in a software engineering role at your company.

Their current skills are: ${skillsList}

Based on publicly available information about ${companyName}'s tech stack and recent job postings, please provide a concise, actionable learning plan. Your response must be in Markdown format.

Include:

## 1. Core Languages & Frameworks
What are the top 3-4 technologies they MUST learn to be a strong candidate for ${companyName}?

## 2. Advanced Topics & Concepts  
What 2-3 advanced topics (e.g., 'distributed systems', 'cloud-native computing', 'large-scale data processing') are important for this company?

## 3. Suggested Learning Path
Give them a 3-step path to follow over the next 6 months:
- **Step 1 (Months 1-2):** Foundation building
- **Step 2 (Months 3-4):** Intermediate skills
- **Step 3 (Months 5-6):** Advanced concepts and projects

## 4. Project Recommendations
Suggest 2-3 specific projects they should build to demonstrate their skills.

## 5. Additional Resources
Recommend specific courses, documentation, or certifications.

Keep the response practical, specific, and encouraging. Focus on actionable steps rather than general advice.`;
}

// Helper function to generate mock career path
// Helper function to generate mock chat response
function generateMockChatResponse(message) {
  const messageLower = message.toLowerCase();
  
  // Job search related
  if (messageLower.includes('job') || messageLower.includes('search') || messageLower.includes('find')) {
    return `Here are some effective job search strategies:

1. **Optimize Your Resume**: Tailor your resume for each application, highlighting relevant skills and experiences.

2. **Use Multiple Platforms**: Search on job boards, company websites, LinkedIn, and professional networks.

3. **Network Actively**: Attend industry events, connect with professionals, and leverage your network.

4. **Set Up Job Alerts**: Use filters on job sites to get notified about relevant positions.

5. **Prepare for Interviews**: Research the company, practice common questions, and prepare thoughtful questions to ask.

6. **Follow Up**: Send thank-you emails after interviews and follow up on applications.

Remember, persistence and a positive attitude are key to a successful job search!`;
  }
  
  // Interview related
  if (messageLower.includes('interview') || messageLower.includes('prepare')) {
    return `Great question! Here's how to prepare for job interviews:

**Before the Interview:**
- Research the company thoroughly (mission, values, recent news)
- Review the job description and match your skills
- Prepare STAR method examples (Situation, Task, Action, Result)
- Prepare questions to ask the interviewer

**Common Questions to Prepare:**
- "Tell me about yourself"
- "Why do you want this job?"
- "What are your strengths/weaknesses?"
- "Where do you see yourself in 5 years?"

**During the Interview:**
- Arrive early (10-15 minutes)
- Dress professionally
- Maintain eye contact and positive body language
- Listen carefully and answer concisely

**After the Interview:**
- Send a thank-you email within 24 hours
- Follow up if you haven't heard back in a week

Good luck with your interview preparation!`;
  }
  
  // Resume related
  if (messageLower.includes('resume') || messageLower.includes('cv')) {
    return `Here are tips for creating an effective resume:

**Key Sections:**
1. **Contact Information**: Name, phone, email, LinkedIn
2. **Professional Summary**: 2-3 sentences highlighting your value
3. **Work Experience**: Reverse chronological order with achievements
4. **Education**: Degrees, certifications, relevant coursework
5. **Skills**: Technical and soft skills relevant to the job

**Best Practices:**
- Keep it to 1-2 pages
- Use action verbs (achieved, developed, implemented)
- Quantify achievements (e.g., "Increased sales by 30%")
- Tailor for each job application
- Use a clean, professional format
- Proofread carefully for errors

**Format Tips:**
- Use consistent formatting
- Choose readable fonts (Arial, Calibri, Times New Roman)
- Use bullet points for clarity
- Save as PDF for applications

Would you like specific advice on any section of your resume?`;
  }
  
  // Salary related
  if (messageLower.includes('salary') || messageLower.includes('negotiate') || messageLower.includes('pay')) {
    return `Salary negotiation is an important skill! Here's how to approach it:

**Before Negotiating:**
- Research market rates for your role and location (Glassdoor, Payscale, LinkedIn)
- Know your worth based on experience and skills
- Consider total compensation (benefits, stock, bonuses)

**During Negotiation:**
- Wait for them to make the first offer
- Express enthusiasm for the role
- Present your research and value proposition
- Be professional and respectful
- Consider negotiating other benefits if salary is fixed

**What to Say:**
"I'm very excited about this opportunity. Based on my research and experience, I was hoping for a salary in the range of [X-Y]. Is there flexibility in the compensation package?"

**Remember:**
- It's okay to negotiate - it's expected
- Be prepared to walk away if the offer doesn't meet your needs
- Consider the full package, not just base salary

Good luck with your negotiation!`;
  }
  
  // Skills related
  if (messageLower.includes('skill') || messageLower.includes('learn') || messageLower.includes('develop')) {
    return `Here are effective ways to develop your skills:

**Technical Skills:**
- Take online courses (Coursera, Udemy, edX)
- Build projects to practice
- Contribute to open source
- Get certifications
- Join coding communities

**Soft Skills:**
- Practice communication through presentations
- Seek feedback regularly
- Take on leadership opportunities
- Read industry books and articles
- Attend workshops and webinars

**Career Development:**
- Set clear learning goals
- Create a learning schedule
- Find a mentor
- Join professional associations
- Attend conferences and meetups

**Online Resources:**
- FreeCodeCamp, Khan Academy, YouTube tutorials
- Industry blogs and podcasts
- LinkedIn Learning
- GitHub for coding practice

What specific skills are you looking to develop?`;
  }
  
  // Default response
  return `I'm here to help with job and career-related questions! I can assist with:

- Job search strategies
- Interview preparation
- Resume and cover letter tips
- Salary negotiations
- Skill development
- Career advice
- Industry insights

What would you like to know? Feel free to ask me anything about your career journey!`;
}

function generateMockCareerPath(companyName, userSkills) {
  const hasReact = userSkills.some(skill => skill.toLowerCase().includes('react'));
  const hasNode = userSkills.some(skill => skill.toLowerCase().includes('node'));
  const hasPython = userSkills.some(skill => skill.toLowerCase().includes('python'));
  
  return `# Career Path for ${companyName}

## 1. Core Languages & Frameworks

Based on ${companyName}'s tech stack, you should focus on:

- **JavaScript/TypeScript** - Essential for modern web development
- **React.js** - ${hasReact ? 'Great! You already have this' : 'Critical frontend framework used extensively'}
- **Node.js** - ${hasNode ? 'Excellent foundation you have' : 'Important for backend development'}
- **${hasPython ? 'Python' : 'Java/Go'}** - ${hasPython ? 'Your Python skills are valuable' : 'Backend services and microservices'}

## 2. Advanced Topics & Concepts

Key areas ${companyName} values:

- **Distributed Systems** - Understanding microservices architecture
- **Cloud Computing** - AWS/GCP experience is highly valued
- **System Design** - Scalability and performance optimization

## 3. Suggested Learning Path

### Step 1 (Months 1-2): Foundation Building
- Master JavaScript ES6+ features
- ${hasReact ? 'Deepen React knowledge with hooks and context' : 'Learn React.js fundamentals'}
- Understand RESTful API design

### Step 2 (Months 3-4): Intermediate Skills  
- Learn TypeScript for better code quality
- Explore ${hasNode ? 'advanced Node.js patterns' : 'Node.js and Express.js'}
- Database design (SQL and NoSQL)

### Step 3 (Months 5-6): Advanced Concepts
- System design principles
- Cloud services (AWS Lambda, S3, RDS)
- Testing strategies and CI/CD

## 4. Project Recommendations

1. **Full-Stack Web Application** - Build a complete CRUD app with authentication
2. **Microservices Project** - Create a distributed system with multiple services
3. **Cloud-Native App** - Deploy an application using cloud services

## 5. Additional Resources

- **Courses:** "System Design Interview" course, AWS Cloud Practitioner
- **Documentation:** React docs, Node.js guides, AWS documentation  
- **Certifications:** AWS Solutions Architect Associate

Focus on building projects that demonstrate these skills. ${companyName} values practical experience over theoretical knowledge.

Good luck with your learning journey! 🚀`;
}

// Helper function to analyze skill gaps
function analyzeSkillGap(userSkills, jobRequirements, jobTitle, companyName) {
  const userSkillsLower = userSkills.map(skill => skill.toLowerCase());
  const requiredSkillsLower = jobRequirements.map(req => req.toLowerCase());

  const matchingSkills = userSkillsLower.filter(skill => 
    requiredSkillsLower.some(req => req.includes(skill) || skill.includes(req))
  );

  const missingSkills = requiredSkillsLower.filter(req => 
    !userSkillsLower.some(skill => req.includes(skill) || skill.includes(req))
  );

  const matchPercentage = jobRequirements.length > 0 
    ? Math.round((matchingSkills.length / jobRequirements.length) * 100)
    : 0;

  return {
    matchPercentage,
    matchingSkills,
    missingSkills: missingSkills.slice(0, 5), // Limit to top 5 missing skills
    recommendations: generateSkillRecommendations(missingSkills, jobTitle),
    readinessLevel: getReadinessLevel(matchPercentage)
  };
}

function generateSkillRecommendations(missingSkills, jobTitle) {
  const recommendations = [];
  
  missingSkills.slice(0, 3).forEach(skill => {
    recommendations.push({
      skill,
      priority: 'High',
      estimatedTime: '2-4 weeks',
      resources: [`Learn ${skill} fundamentals`, `Build a project using ${skill}`]
    });
  });

  return recommendations;
}

function getReadinessLevel(matchPercentage) {
  if (matchPercentage >= 80) return 'Ready to Apply';
  if (matchPercentage >= 60) return 'Almost Ready';
  if (matchPercentage >= 40) return 'Needs Preparation';
  return 'Significant Gap';
}

// @route   POST /api/ai/resume/upload
// @desc    Upload and analyze resume image using Gemini Vision API
// @access  Private
router.post('/resume/upload', auth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.user._id;

    if (!imageBase64) {
      return res.status(400).json({ message: 'Resume image is required' });
    }

    if (!genAI) {
      console.error('Gemini AI not initialized. API_KEY:', API_KEY ? 'Present' : 'Missing');
      return res.status(500).json({ 
        message: 'Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.' 
      });
    }

    console.log('Gemini AI initialized. API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Missing');

    // Extract base64 data and mime type
    let base64Data, mimeType;
    
    if (imageBase64.startsWith('data:image/')) {
      const base64Match = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ message: 'Invalid image format. Please provide a valid base64 image.' });
      }
      mimeType = base64Match[1];
      base64Data = base64Match[2];
    } else {
      // Assume it's already base64 without prefix, default to jpeg
      base64Data = imageBase64;
      mimeType = 'jpeg';
    }

    // Use Gemini Vision API to analyze resume
    // Based on the chat endpoint, models/gemini-2.0-flash works, so try that first for vision
    let model;
    // Try models in order - models/gemini-2.0-flash works for chat, so it should work for vision too
    const modelNames = [
      'models/gemini-2.0-flash',  // This works for chat, try it first with models/ prefix
      'gemini-2.0-flash',         // Try without prefix
      'models/gemini-1.5-flash',
      'gemini-1.5-flash',
      'models/gemini-1.5-pro',
      'gemini-1.5-pro'
    ];
    
    let lastError = null;
    for (const modelName of modelNames) {
      try {
        // Initialize model (without models/ prefix - SDK handles it)
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Attempting to use model: ${modelName}`);
        
        // Test if model works with a simple text call first (quick validation)
        try {
          const testResult = await model.generateContent('Say "OK"');
          const testResponse = await testResult.response;
          const testText = await testResponse.text();
          console.log(`✅ Model ${modelName} initialized and tested successfully. Response: ${testText.substring(0, 50)}`);
          break;
        } catch (testError) {
          console.error(`Model ${modelName} test failed:`, testError.message);
          lastError = testError;
          model = null;
          // Continue to next model
        }
      } catch (modelError) {
        console.error(`Error initializing ${modelName}:`, modelError.message);
        lastError = modelError;
        model = null;
      }
    }
    
    if (!model) {
      const triedModels = modelNames.join(', ');
      return res.status(500).json({ 
        message: `Model not available. Please check your API key has access to vision models. Tried: ${triedModels}. Run 'node list-gemini-models.js' to see available models.`,
        error: process.env.NODE_ENV === 'development' ? (lastError?.message || 'No model could be initialized') : undefined
      });
    }
    
    const prompt = `You are an expert resume analyzer. Analyze this resume image carefully and extract all key information. 

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown code blocks, explanations, or additional text. Return ONLY the JSON object.

Required JSON format:
{
  "summary": {
    "name": "Full name from resume",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
      {
        "title": "Job title",
        "company": "Company name",
        "duration": "Duration (e.g., Jan 2020 - Present)",
        "description": "Brief description of role"
      }
    ],
    "education": [
      {
        "degree": "Degree name",
        "institution": "Institution name",
        "year": "Graduation year"
      }
    ],
    "projects": [
      {
        "name": "Project name",
        "description": "Project description",
        "technologies": ["tech1", "tech2"]
      }
    ]
  },
  "score": 8.5,
  "recommendations": {
    "companies": [
      {
        "name": "Company name",
        "role": "Job role title",
        "matchReason": "Why this role matches"
      }
    ],
    "tips": [
      "Tip 1 to improve resume",
      "Tip 2 to improve resume"
    ]
  }
}

Instructions:
- Score (0-10): Evaluate based on resume quality, clarity, completeness, formatting, and market readiness
- Provide 5-10 recommended companies and roles matching the candidate's skills and experience
- Provide 3-5 actionable tips to improve the resume
- Extract ALL skills, experience, education, and projects mentioned
- Be accurate and specific
- Return ONLY the JSON object, no other text`;

    // Prepare image part for Gemini Vision API
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: `image/${mimeType}`
      }
    };

    console.log('Sending resume image to Gemini for analysis...');
    console.log('Image size:', base64Data.length, 'bytes');
    console.log('MIME type:', `image/${mimeType}`);

    let text;
    try {
      // Generate content with timeout (90 seconds for image analysis)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Resume analysis timeout after 90 seconds')), 90000);
      });

      console.log('Calling Gemini API with image and prompt...');
      console.log('Image data length:', base64Data.length);
      console.log('MIME type:', `image/${mimeType}`);
      
      // Generate content with image and prompt
      const generatePromise = model.generateContent([prompt, imagePart]);
      const result = await Promise.race([generatePromise, timeoutPromise]);
      
      if (!result) {
        throw new Error('No result returned from Gemini API');
      }
      
      if (!result.response) {
        throw new Error('Invalid response from Gemini API - no response object');
      }
      
      const response = await result.response;
      
      if (!response || !response.text) {
        throw new Error('Invalid response from Gemini API - no text method');
      }
      
      text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      console.log('Received response from Gemini (length:', text.length, 'chars)');
      console.log('Response preview:', text.substring(0, 300));
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      console.error('Error details:', {
        message: apiError.message,
        name: apiError.name,
        stack: apiError.stack?.substring(0, 500)
      });
      
      // Provide more specific error messages
      let errorMessage = 'Error analyzing resume with AI. ';
      const errorMsg = apiError.message || '';
      const errorStr = errorMsg.toLowerCase();
      
      console.error('Full API error details:', {
        message: apiError.message,
        name: apiError.name,
        code: apiError.code,
        status: apiError.status,
        response: apiError.response?.data || apiError.response
      });
      
      if (errorStr.includes('timeout')) {
        errorMessage += 'The analysis took too long. Please try again with a smaller or clearer image.';
      } else if (errorStr.includes('api key') || errorStr.includes('authentication') || errorStr.includes('401') || errorStr.includes('403')) {
        errorMessage += 'API authentication failed. Please verify your Gemini API key in the .env file is correct.';
      } else if (errorStr.includes('quota') || errorStr.includes('limit') || errorStr.includes('429')) {
        errorMessage += 'API quota exceeded. Please try again later or check your API usage limits.';
      } else if (errorStr.includes('invalid') || errorStr.includes('400')) {
        errorMessage += 'Invalid request. Please ensure the image format is supported (JPG, PNG).';
      } else if (errorStr.includes('model') || errorStr.includes('not found') || errorStr.includes('404')) {
        errorMessage += 'Model not available. Please check your API key has access to vision models.';
      } else {
        errorMessage += `Please check your API key and try again. ${process.env.NODE_ENV === 'development' ? `Error: ${apiError.message}` : ''}`;
      }
      
      return res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? apiError.message : undefined,
        errorCode: apiError.code || apiError.status
      });
    }

    // Parse JSON from response
    let analysisData;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const jsonString = jsonMatch[0];
      analysisData = JSON.parse(jsonString);
      
      console.log('Successfully parsed analysis data');
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      console.error('Raw response (last 500 chars):', text.substring(Math.max(0, text.length - 500)));
      
      // Try to create a fallback response with basic structure
      try {
        // Extract basic info using regex as fallback
        const nameMatch = text.match(/name["\s:]+"([^"]+)"/i) || text.match(/Name:\s*([^\n]+)/i);
        const skillsMatch = text.match(/skills["\s:]+\[([^\]]+)\]/i);
        
        analysisData = {
          summary: {
            name: nameMatch ? nameMatch[1] : 'Not found',
            skills: skillsMatch ? skillsMatch[1].split(',').map(s => s.trim().replace(/"/g, '')) : [],
            experience: [],
            education: [],
            projects: []
          },
          score: 7.0,
          recommendations: {
            companies: [],
            tips: ['Unable to fully parse resume. Please ensure the image is clear and try again.']
          }
        };
        
        console.log('Created fallback analysis data');
      } catch (fallbackError) {
        return res.status(500).json({ 
          message: 'Error parsing resume analysis. The AI response format was unexpected. Please try again with a clearer resume image.',
          error: process.env.NODE_ENV === 'development' ? parseError.message : undefined,
          rawResponse: process.env.NODE_ENV === 'development' ? text.substring(0, 500) : undefined
        });
      }
    }

    // Validate and fix analysis data structure
    if (!analysisData.summary) {
      analysisData.summary = {
        name: '',
        skills: [],
        experience: [],
        education: [],
        projects: []
      };
    }
    
    if (!analysisData.summary.skills) analysisData.summary.skills = [];
    if (!analysisData.summary.experience) analysisData.summary.experience = [];
    if (!analysisData.summary.education) analysisData.summary.education = [];
    if (!analysisData.summary.projects) analysisData.summary.projects = [];
    
    if (!analysisData.recommendations) {
      analysisData.recommendations = {
        companies: [],
        tips: []
      };
    }
    
    if (!analysisData.recommendations.companies) analysisData.recommendations.companies = [];
    if (!analysisData.recommendations.tips) analysisData.recommendations.tips = [];

    // Ensure score is a number between 0-10
    if (typeof analysisData.score !== 'number' || isNaN(analysisData.score)) {
      analysisData.score = 7.5; // Default score
    } else {
      analysisData.score = Math.max(0, Math.min(10, analysisData.score)); // Clamp between 0-10
    }

    // Add analyzedAt timestamp
    analysisData.analyzedAt = new Date();
    
    console.log('Analysis completed successfully. Score:', analysisData.score);

    // Save resume image URL and analysis to user profile
    const resumeData = {
      imageUrl: imageBase64, // Store base64 for now (in production, upload to cloud storage)
      analysis: analysisData
    };

    let user;
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserById(userId);
      if (user) {
        user.resume = resumeData;
        await demoStorage.updateUser(userId, { resume: resumeData });
      }
    } else {
      user = await User.findByIdAndUpdate(
        userId,
        { resume: resumeData },
        { new: true, runValidators: true }
      ).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Resume analyzed successfully',
      analysis: analysisData,
      resume: user.resume
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ 
      message: 'Error analyzing resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/ai/resume/analysis
// @desc    Get user's resume analysis
// @access  Private
router.get('/resume/analysis', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    let user;
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserById(userId);
    } else {
      user = await User.findById(userId).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resume || !user.resume.analysis) {
      return res.status(404).json({ message: 'No resume analysis found. Please upload a resume first.' });
    }

    res.json({
      resume: user.resume
    });

  } catch (error) {
    console.error('Get resume analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;