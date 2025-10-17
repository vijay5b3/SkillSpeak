                                                                                                const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple Server-Sent Events (SSE) clients list for broadcasting chat events to the web UI
const sseClients = [];

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  // send a comment to keep the connection alive in some proxies
  res.write(': connected\n\n');
  sseClients.push(res);
  console.log(`SSE client connected. Total clients: ${sseClients.length}`);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
    console.log(`SSE client disconnected. Total clients: ${sseClients.length}`);
  });
});

function broadcastEvent(obj) {
  const payload = `data: ${JSON.stringify(obj)}\n\n`;
  console.log(`Broadcasting to ${sseClients.length} clients:`, JSON.stringify(obj).substring(0, 100));
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      console.error('Failed to write to SSE client:', e.message);
    }
  }
}

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MAX_TOKENS = process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS, 10) : 120;
const TEMPERATURE = process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : 0.0;
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

    // **STREAMING ENABLED**: Use responseType: 'stream' to get real-time chunks
    const resp = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: OPENROUTER_MODEL,
        messages: outgoingBase,
        max_tokens: wantsCode ? Math.min(MAX_TOKENS * 6, 2048) : MAX_TOKENS,
        temperature: TEMPERATURE,
        stream: true  // Enable streaming from OpenRouter
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000,
        responseType: 'stream'  // Receive response as a stream
      }
    );

    // Broadcast user message first
    const lastUser = userMessages.length ? userMessages[userMessages.length - 1] : null;
    if (lastUser) {
      broadcastEvent({ role: 'user', type: 'user', content: lastUser.content });
    }

    // Stream the response chunks in real-time
    let fullResponse = '';
    let buffer = '';
    
    resp.data.on('data', (chunk) => {
      const chunkStr = chunk.toString('utf8');
      buffer += chunkStr;
      
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
              fullResponse += delta;
              
              // Broadcast each chunk immediately to SSE clients (Windows app)
              broadcastEvent({ 
                role: 'assistant', 
                type: 'chunk',  // Mark as streaming chunk
                content: delta,
                isStreaming: true
              });
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

    // Broadcast final complete message
    if (fullResponse) {
      broadcastEvent({ 
        role: 'assistant', 
        type: 'complete',  // Mark as final complete message
        content: fullResponse,
        isStreaming: false
      });
    }

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
          content: fullResponse
        },
        finish_reason: 'stop'
      }]
    };

    return res.json(responseData);
  } catch (err) {
    console.error('OpenRouter error:', err && err.response ? err.response.data : err.message);
    const status = err.response ? err.response.status : 500;
    const data = err.response ? err.response.data : { error: err.message };
    return res.status(status).json({ error: data });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
