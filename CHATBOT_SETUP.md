# Gemini AI Chatbot Setup

## Overview

The chatbot has been built using Gemini 2.0 Flash model, matching the Python implementation you provided. It supports continuous conversation with session management.

## Features

✅ **Gemini 2.0 Flash Model** - Uses the latest Gemini model  
✅ **Session Management** - Maintains conversation history automatically  
✅ **Exit Command** - Type 'exit' or 'quit' to end the session  
✅ **Job-Focused** - Specialized for career and job-related questions  
✅ **Continuous Chat** - Remembers previous messages in the conversation  

## API Configuration

The chatbot uses your Gemini API key:
- **API Key**: `AIzaSyDClwm-ew6jZD_TwezB_Bb5uZg6AbdvZD8` (configured in code)
- **Model**: `gemini-2.0-flash-exp`
- **Method**: `startChat()` with session management

## Backend Implementation

### Chat Endpoint
```
POST /api/ai/chat
```

**Request Body:**
```json
{
  "message": "How do I prepare for an interview?",
  "sessionId": "session_1234567890_abc123"
}
```

**Response:**
```json
{
  "response": "Here's how to prepare for job interviews...",
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "model": "gemini-2.0-flash-exp"
}
```

### Start Session Endpoint
```
POST /api/ai/chat/start
```

Creates a new chat session and returns a session ID.

### End Session Endpoint
```
DELETE /api/ai/chat/:sessionId
```

Ends a chat session.

## How It Works

1. **Session Creation**: When you first send a message, a new chat session is created
2. **History Management**: Gemini automatically maintains conversation history
3. **Continuous Chat**: Each message uses the same session, so context is preserved
4. **Exit Command**: Type 'exit' or 'quit' to end the session

## Usage

### Web Interface
1. Go to: `http://localhost:3000/chatbot`
2. Start typing your questions
3. The chatbot maintains conversation context
4. Type 'exit' to quit

### Example Conversation
```
You: How do I prepare for a job interview?
Gemini: Here's how to prepare for job interviews...

You: What about technical interviews?
Gemini: For technical interviews, you should...

You: exit
Gemini: Chat session ended. Thank you for using Gemini!
```

## Code Structure

### Backend (Node.js)
```javascript
// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Start chat session
const chat = model.startChat({
  systemInstruction: "You are a helpful career advisor...",
  history: []
});

// Send message
const result = await chat.sendMessage(userInput);
const response = await result.response;
const text = response.text();
```

### Frontend (React)
- Automatically starts a session on page load
- Maintains session ID across messages
- Handles exit command
- Displays conversation history

## Differences from Python Version

The Node.js implementation matches the Python functionality:

| Python | Node.js |
|--------|---------|
| `genai.configure(api_key=API_KEY)` | `new GoogleGenerativeAI(API_KEY)` |
| `model.start_chat()` | `model.startChat()` |
| `chat.send_message(user_input)` | `chat.sendMessage(userInput)` |
| `response.text` | `response.text()` |

## Testing

1. **Start the server:**
   ```bash
   npm run server
   ```

2. **Open the chatbot:**
   - Navigate to `http://localhost:3000/chatbot`
   - Or click "Chatbot" in the navbar

3. **Test the conversation:**
   - Ask: "How do I prepare for an interview?"
   - Follow up: "What about technical interviews?"
   - Type: "exit" to end

## Troubleshooting

### Model Not Found
If `gemini-2.0-flash-exp` is not available, try:
- `gemini-2.0-flash`
- `gemini-pro`
- `gemini-1.5-pro`

Update the model name in `server/routes/ai.js`:
```javascript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

### Session Issues
- Sessions are stored in memory (Map)
- Sessions are lost on server restart
- For production, use Redis or database for session storage

## Production Considerations

1. **Session Storage**: Use Redis or database instead of in-memory Map
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Error Handling**: Improve error messages for users
4. **Session Cleanup**: Add automatic cleanup for old sessions
5. **Monitoring**: Add logging and monitoring for API usage

## Next Steps

The chatbot is ready to use! It:
- ✅ Uses Gemini 2.0 Flash model
- ✅ Maintains conversation history
- ✅ Supports exit command
- ✅ Focused on job-related questions
- ✅ Works with your API key

Enjoy chatting with Gemini! 🚀

