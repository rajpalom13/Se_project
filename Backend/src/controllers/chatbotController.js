const ChatHistory = require('../models/ChatHistory');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using gemini-pro-latest as per available models
const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get chat history for context
    let chatHistory = await ChatHistory.findOne({
      user: req.user.id,
      sessionId: sessionId || 'default'
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        user: req.user.id,
        sessionId: sessionId || 'default',
        messages: []
      });
    }

    // Prepare history for Gemini
    const history = chatHistory.messages.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful health assistant. Provide SHORT, CONCISE, and DIRECT answers. Do NOT use markdown formatting (no asterisks ** or *). Use plain text only. Use simple numbering (1., 2.) for lists if needed. Focus on actionable advice. Always end with a brief reminder to consult a doctor." }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will provide short, concise, and direct health information in plain text without markdown symbols. I will use simple numbering for lists and always end with a brief reminder to consult a doctor." }],
        },
        ...history
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    // Debug history
    console.log("Sending Chat History to Gemini:", JSON.stringify(history, null, 2));

    let assistantMessage = "";

    try {
      // Send message
      const result = await chat.sendMessage(message);
      const response = await result.response;
      assistantMessage = response.text();
    } catch (chatError) {
      console.error("Gemini Chat Error:", chatError);
    }
    
    // Fallback: If response is empty or failed, try direct generation (ignoring history)
    if (!assistantMessage) {
        console.log("Gemini response was empty or failed. Attempting fallback generation without history...");
        try {
          const fallbackResult = await model.generateContent(message);
          const fallbackResponse = await fallbackResult.response;
          assistantMessage = fallbackResponse.text();
        } catch (fallbackError) {
           console.error("Gemini Fallback Error:", fallbackError);
        }
    }

    // Final fallback if everything fails
    if (!assistantMessage) {
        assistantMessage = "I apologize, but I am unable to generate a response at this time. Please try again later or consult a healthcare professional.";
    }

    // Save messages to history (using original schema format)
    chatHistory.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    chatHistory.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date()
    });

    await chatHistory.save();

    res.json({
      success: true,
      message: assistantMessage,
      sessionId: chatHistory.sessionId
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message
    });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;

    const chatHistory = await ChatHistory.findOne({
      user: req.user.id,
      sessionId: sessionId || 'default'
    });

    if (!chatHistory) {
      return res.json({
        success: true,
        messages: []
      });
    }

    res.json({
      success: true,
      messages: chatHistory.messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
};
