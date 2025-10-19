                                                                                                const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration: Enable strict username matching validation
// Set to false to allow any username to connect to any session
const STRICT_USERNAME_VALIDATION = false; // Can be changed to true for strict mode

// Client-specific conversation storage
// Map: clientId -> { clients: [SSE responses], conversation: [messages], activeUsernames: Set }
const clientSessions = new Map();

// Legacy SSE clients list (for backward compatibility with clients that don't send clientId)
const legacySseClients = [];

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');
  
  const clientId = req.query.clientId || req.headers['x-client-id'];
  
  if (clientId) {
    // Client-specific session
    if (!clientSessions.has(clientId)) {
      clientSessions.set(clientId, {
        clients: [],
        conversation: [], // Will be initialized with system prompt on first chat
        sources: new Set() // Track connection sources (web, windows)
      });
    }
    const session = clientSessions.get(clientId);
    
    // Track connection source from query param or header
    const source = req.query.source || req.headers['x-source'] || 'unknown';
    session.sources.add(source);
    
    session.clients.push(res);
    console.log(`SSE client connected with ID: ${clientId}, source: ${source}. Session clients: ${session.clients.length}`);
    
    req.on('close', () => {
      const idx = session.clients.indexOf(res);
      if (idx !== -1) session.clients.splice(idx, 1);
      console.log(`SSE client disconnected. ID: ${clientId}. Session clients: ${session.clients.length}`);
      
      // Clean up empty sessions after 5 minutes
      if (session.clients.length === 0) {
        setTimeout(() => {
          if (clientSessions.has(clientId) && clientSessions.get(clientId).clients.length === 0) {
            clientSessions.delete(clientId);
            console.log(`Cleaned up empty session: ${clientId}`);
          }
        }, 5 * 60 * 1000);
      }
    });
  } else {
    // Legacy mode - no clientId
    legacySseClients.push(res);
    console.log(`SSE client connected (legacy). Total clients: ${legacySseClients.length}`);
    
    req.on('close', () => {
      const idx = legacySseClients.indexOf(res);
      if (idx !== -1) legacySseClients.splice(idx, 1);
      console.log(`SSE client disconnected (legacy). Total clients: ${legacySseClients.length}`);
    });
  }
});

function broadcastEvent(obj, clientId = null) {
  const payload = `data: ${JSON.stringify(obj)}\n\n`;
  
  if (clientId && clientSessions.has(clientId)) {
    // Broadcast to specific client session
    const session = clientSessions.get(clientId);
    console.log(`Broadcasting to client ${clientId} (${session.clients.length} connections):`, JSON.stringify(obj).substring(0, 100));
    for (const client of session.clients) {
      try {
        client.write(payload);
      } catch (e) {
        console.error(`Failed to write to SSE client ${clientId}:`, e.message);
      }
    }
  } else {
    // Broadcast to all legacy clients (backward compatibility)
    console.log(`Broadcasting to ${legacySseClients.length} legacy clients:`, JSON.stringify(obj).substring(0, 100));
    for (const client of legacySseClients) {
      try {
        client.write(payload);
      } catch (e) {
        console.error('Failed to write to legacy SSE client:', e.message);
      }
    }
  }
}

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MAX_TOKENS = process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS, 10) : 32768;
const TEMPERATURE = process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : 0.3;
const OPENROUTER_SYSTEM_PROMPT = process.env.OPENROUTER_SYSTEM_PROMPT || `You are an expert technical interview assistant. STRICTLY follow the exact cheat-sheet format below and nothing else. Do not add extra commentary, examples, or apologies. If you cannot answer precisely, respond with "I don't know." Keep responses extremely concise (preferably under 120 words).

Format to use (exact):

[Topic Name]
Definition:
- one short 1–2 line plain-language explanation.

Steps (if applicable):
- short bullet points, only if the concept is a process.

Time Complexity (if applicable):
Best Case: [value]
Worst Case: [value]

Space Complexity (if applicable):
[value]

Example output for "Binary Search":

[Binary Search]
Definition:
- Find an item's position in a sorted list by repeatedly halving the search interval until found or exhausted.

Steps (if applicable):
- Compare target to middle element.
- If equal return index, else search lower or upper half.

Time Complexity (if applicable):
Best Case: O(1)
Worst Case: O(log n)

Space Complexity (if applicable):
O(1)`;

if (!OPENROUTER_API_KEY) {
  console.warn('Warning: OPENROUTER_API_KEY is not set. Please set it in .env');
}

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }

  // Extract clientId from headers or query
  const clientId = req.query.clientId || req.headers['x-client-id'];

  // Check if this request is from the web UI or external source (Python script)
  const isWebUI = req.headers['x-source'] === 'web-ui';

  try {
    // Do NOT inject any server-side system prompt. Use the client's messages as the conversation start.
    const clientMessages = Array.isArray(messages) ? messages.slice() : [];
    const userMessages = clientMessages.filter(m => m.role === 'user');

    // If the user's last message appears to be asking for a program, detect it from the client's last user message
    const lastUserText = userMessages.length ? (userMessages[userMessages.length - 1].content || '') : '';

    // Intent detection (simple heuristics). We support three intents:
    // - code: user explicitly requests a program or 'write a' etc.
    // - steps: user asks for steps or 'program steps'
    // - cheatsheet: default - short definition/cheatsheet
  const lower = lastUserText.toLowerCase();
  const codeRequestKeywords = ['code', 'implement', 'write a', 'source code', 'script', 'function', 'class'];
  const stepsKeywords = ['steps', 'step', 'program steps', 'algorithm steps', 'pseudo', 'pseudocode', 'how to implement'];
  // If the user explicitly asks for "program steps" prefer steps intent over code
  const asksProgramSteps = lower.includes('program steps') || (lower.includes('program') && lower.includes('steps'));
  const wantsSteps = asksProgramSteps || stepsKeywords.some(k => lower.includes(k));
  const wantsCode = !wantsSteps && codeRequestKeywords.some(k => lower.includes(k));

  // For code requests we'll use an explicit user-level instruction when needed (avoid injecting server-side system prompts)
  const codeSystemPrompt = `You are a code assistant. When the user requests code, output ONLY the complete source code in a single triple-backtick code block with an explicit language tag (e.g., \`\`\`python). Do not include any additional explanation, headers, or steps. Ensure the code is runnable and minimal.`;
  const stepsSystemPrompt = `You are a concise technical assistant. When the user asks for steps, return only short numbered or bullet steps (no extra paragraphs), then optionally a one-line complexity summary.`;

    // Use the client's messages as the outgoing conversation start (do not inject server-side system prompts)
    const outgoingBase = clientMessages;
    
    // Get last user message (needed for greeting check and broadcasting)
    const lastUser = userMessages.length ? userMessages[userMessages.length - 1] : null;

    // Check for simple greetings and respond immediately
    const greetingKeywords = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    const isSimpleGreeting = lastUserText.trim().length < 20 && greetingKeywords.some(g => lastUserText.toLowerCase().includes(g));
    
    if (isSimpleGreeting) {
      const greetingResponse = `Hello! 👋 I'm your friendly technical interview assistant. I'm here to help you with:

- **Explaining concepts** in simple, easy-to-understand language
- **Providing code examples** with detailed comments
- **Breaking down algorithms** step-by-step
- **Answering technical questions** about programming, data structures, and more

Ask me anything! For example:
- "What is binary search?"
- "Explain how quicksort works"
- "Write a Python function to reverse a string"

What would you like to learn about today?`;

      // Broadcast greeting exchange
      if (lastUser) {
        broadcastEvent({ role: 'user', type: 'user', content: lastUser.content }, clientId);
      }
      broadcastEvent({ role: 'assistant', type: 'complete', content: greetingResponse, isStreaming: false }, clientId);

      return res.json({
        id: 'greeting-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: OPENROUTER_MODEL,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: greetingResponse },
          finish_reason: 'stop'
        }]
      });
    }

    // **STREAMING ENABLED**: Use responseType: 'stream' to get real-time chunks
    const resp = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: OPENROUTER_MODEL,
        messages: outgoingBase,
        max_tokens: 6000, // Increased for large code responses (within Mistral 7B's 8K limit)
        temperature: TEMPERATURE,
        stream: true,  // Enable streaming from OpenRouter
        top_p: 0.95,   // Add top_p for better completion
        presence_penalty: 0.0,  // Don't penalize topics
        frequency_penalty: 0.0  // Don't penalize repetition (helps avoid rollback)
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000,  // Increased to 5 minutes for large code responses
        responseType: 'stream',  // Receive response as a stream
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Only accept 2xx status codes
        }
      }
    );

    // Check if response status is OK
    if (resp.status !== 200) {
      throw new Error(`OpenRouter API returned status ${resp.status}`);
    }

    // Broadcast user message first
    if (lastUser) {
      broadcastEvent({ role: 'user', type: 'user', content: lastUser.content }, clientId);
    }

    // Stream the response chunks in real-time
    let fullResponse = '';
    let buffer = '';
    let streamError = null;
    
    resp.data.on('data', (chunk) => {
      const chunkStr = chunk.toString('utf8');
      buffer += chunkStr;
      
      // Check if this is an error response (JSON error instead of SSE)
      if (buffer.includes('"error"') && buffer.includes('{') && !buffer.includes('data:')) {
        try {
          const errorData = JSON.parse(buffer);
          if (errorData.error) {
            streamError = errorData.error.message || errorData.error || 'API error occurred';
            return;
          }
        } catch (e) {
          // Not a JSON error, continue processing as SSE
        }
      }
      
      // Process complete SSE messages (data: {...}\n\n)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          
          // Skip [DONE] marker
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed?.choices?.[0]?.delta?.content;
            
            if (delta) {
              // Filter out special tokens like <s>, </s>, <|endoftext|>, etc.
              // DON'T use .trim() here - it removes important line breaks and spacing
              const filteredDelta = delta.replace(/<\/?s>|<\|endoftext\|>|<\|im_start\|>|<\|im_end\|>/g, '');
              
              // Only add and broadcast if there's actual content after filtering
              // Check for content without trimming to preserve formatting
              if (filteredDelta && filteredDelta.length > 0) {
                fullResponse += filteredDelta;
                
                // Broadcast each chunk immediately to SSE clients (Windows app)
                broadcastEvent({ 
                  role: 'assistant', 
                  type: 'chunk',  // Mark as streaming chunk
                  content: filteredDelta,
                  isStreaming: true
                }, clientId);
              }
            }
          } catch (e) {
            console.warn('Failed to parse streaming chunk:', e.message);
          }
        }
      }
    });

    // Wait for stream to complete
    await new Promise((resolve, reject) => {
      resp.data.on('end', resolve);
      resp.data.on('error', reject);
    });

    // Check if stream error occurred
    if (streamError) {
      throw new Error(streamError);
    }

    // Clean up the full response - filter tokens again and trim only leading/trailing whitespace
    // Apply final token filter to catch any that slipped through
    let cleanedResponse = fullResponse.replace(/<\/?s>|<\|endoftext\|>|<\|im_start\|>|<\|im_end\|>/g, '').trim();
    
    // If response is empty after filtering tokens, provide helpful message
    if (!cleanedResponse || cleanedResponse.length === 0) {
      console.warn('Empty response received from OpenRouter after token filtering');
      const fallbackMessage = "I apologize, but I didn't generate a proper response. Please try asking your question again, or rephrase it slightly.";
      
      broadcastEvent({ 
        role: 'assistant', 
        type: 'complete',
        content: fallbackMessage,
        isStreaming: false
      }, clientId);
      
      return res.json({
        id: 'stream-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: OPENROUTER_MODEL,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: fallbackMessage
          },
          finish_reason: 'stop'
        }]
      });
    }

    // Broadcast final complete message
    broadcastEvent({ 
      role: 'assistant', 
      type: 'complete',  // Mark as final complete message
      content: cleanedResponse,
      isStreaming: false
    }, clientId);

    // Return standard chat completion format for compatibility
    const responseData = {
      id: 'stream-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: OPENROUTER_MODEL,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: cleanedResponse
        },
        finish_reason: 'stop'
      }]
    };

    return res.json(responseData);
  } catch (err) {
    console.error('OpenRouter error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    const status = err.response?.status || 500;
    const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Unknown error occurred';
    return res.status(status).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
