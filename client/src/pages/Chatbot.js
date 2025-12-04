import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, MessageSquare, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your career advisor powered by Gemini AI. I can help you with job search strategies, interview preparation, resume tips, salary negotiations, and career advice. What would you like to know? Type 'exit' to quit.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat session on mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await api.post('/ai/chat/start');
        if (response.data.sessionId) {
          setSessionId(response.data.sessionId);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };
    initializeChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Use longer timeout for AI chat requests (60 seconds)
      const response = await api.post('/ai/chat', {
        message: userMessage,
        sessionId: sessionId
      }, {
        timeout: 60000 // 60 seconds for AI responses
      });

      // Update session ID if a new one was created
      if (response.data.sessionId && !sessionId) {
        setSessionId(response.data.sessionId);
      }

      // Check if session was ended
      if (response.data.sessionEnded) {
        setSessionId(null);
        // Optionally clear messages or show a message
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp || new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Handle timeout errors specifically
      let errorMsg;
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMsg = "The request is taking longer than expected. This might be due to high demand. Please try again in a moment.";
      } else {
        // Get error message from response
        errorMsg = error.response?.data?.response || 
                    error.response?.data?.message || 
                    error.message || 
                    "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
      }
      
      toast.error(errorMsg.substring(0, 100));
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestedQuestions = [
    "How do I prepare for a job interview?",
    "What should I include in my resume?",
    "How do I negotiate salary?",
    "What skills are in demand?",
    "How do I find remote jobs?",
    "What's the best way to search for jobs?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Career Advisor Chatbot
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Ask me anything about jobs, careers, interviews, and more!
          </p>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    } ${message.error ? 'bg-red-50 text-red-800 border border-red-200' : ''}`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="markdown-content">
                        <ReactMarkdown
                          components={{
                            // Headings
                            h1: ({children, ...props}) => <h1 className="text-lg font-bold mb-3 mt-2 text-gray-900 first:mt-0" {...props}>{children}</h1>,
                            h2: ({children, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 text-gray-900 first:mt-0" {...props}>{children}</h2>,
                            h3: ({children, ...props}) => <h3 className="text-sm font-semibold mb-2 mt-3 text-gray-900 first:mt-0" {...props}>{children}</h3>,
                            // Paragraphs
                            p: ({children, ...props}) => <p className="text-sm leading-relaxed mb-3 text-gray-800 last:mb-0" {...props}>{children}</p>,
                            // Lists
                            ul: ({children, ...props}) => <ul className="list-disc list-inside space-y-1.5 mb-3 ml-1 text-sm" {...props}>{children}</ul>,
                            ol: ({children, ...props}) => <ol className="list-decimal list-inside space-y-1.5 mb-3 ml-1 text-sm" {...props}>{children}</ol>,
                            li: ({children, ...props}) => <li className="text-sm leading-relaxed mb-0.5" {...props}>{children}</li>,
                            // Code blocks
                            code: ({inline, children, ...props}) => 
                              inline ? (
                                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800" {...props}>{children}</code>
                              ) : (
                                <code className="block bg-gray-200 p-3 rounded text-xs font-mono text-gray-800 overflow-x-auto mb-3 whitespace-pre" {...props}>{children}</code>
                              ),
                            pre: ({children, ...props}) => <pre className="bg-gray-200 p-3 rounded text-xs font-mono text-gray-800 overflow-x-auto mb-3" {...props}>{children}</pre>,
                            // Strong and emphasis
                            strong: ({children, ...props}) => <strong className="font-semibold text-gray-900" {...props}>{children}</strong>,
                            em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                            // Links
                            a: ({children, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline break-all" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                            // Blockquotes
                            blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-blue-400 pl-3 italic my-3 text-gray-700 bg-blue-50 py-2 rounded-r" {...props}>{children}</blockquote>,
                            // Horizontal rule
                            hr: ({...props}) => <hr className="my-4 border-gray-300" {...props} />,
                            // Tables
                            table: ({children, ...props}) => <div className="overflow-x-auto mb-3"><table className="min-w-full border border-gray-300 text-sm" {...props}>{children}</table></div>,
                            thead: ({children, ...props}) => <thead className="bg-gray-200" {...props}>{children}</thead>,
                            tbody: ({children, ...props}) => <tbody {...props}>{children}</tbody>,
                            tr: ({children, ...props}) => <tr className="border-b border-gray-300" {...props}>{children}</tr>,
                            th: ({children, ...props}) => <th className="px-3 py-2 text-left font-semibold text-gray-900" {...props}>{children}</th>,
                            td: ({children, ...props}) => <td className="px-3 py-2 text-gray-800" {...props}>{children}</td>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 justify-start"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions (only show when no messages or first message) */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-600 mb-3 font-medium">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about jobs and careers..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by Gemini AI • Ask about jobs, careers, interviews, and more
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Chatbot;

