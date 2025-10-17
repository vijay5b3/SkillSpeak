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
    const outgoingMessages = outgoingBase;

    let resp = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: OPENROUTER_MODEL,
        messages: outgoingBase,
        max_tokens: wantsCode ? Math.min(MAX_TOKENS * 6, 2048) : MAX_TOKENS,
        temperature: TEMPERATURE
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    // If the assistant returned a partial/truncated response (finish_reason === 'length'), attempt a continuation retry
    try {
  const assistantMsg = resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message && resp.data.choices[0].message.content;
      const finishReason = resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].finish_reason;
      if (finishReason === 'length') {
        const fs = require('fs');
        const debugPath = path.join(__dirname, 'openrouter_debug.json');
        fs.writeFileSync(debugPath, JSON.stringify({ stage: 'initial_length', request: outgoingMessages, response: resp.data }, null, 2));
        console.warn('Initial response truncated; attempting continuation retry. Wrote debug response to', debugPath);

        // Prepare retry messages: include the partial assistant content so the model continues. Use client's original messages as the base.
        const partialAssistant = assistantMsg || '';
        const retryMax = Math.min(MAX_TOKENS * 3, 1024);
        const retryMessages = Array.isArray(outgoingBase) ? outgoingBase.slice() : [];
        if (partialAssistant) {
          retryMessages.push({ role: 'assistant', content: partialAssistant });
        }
        retryMessages.push({ role: 'user', content: 'Continue the previous assistant response concisely in the same format, starting where it left off. Do not repeat content already provided.' });

        try {
          const retryResp = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
              model: OPENROUTER_MODEL,
              messages: retryMessages,
              max_tokens: retryMax,
              temperature: TEMPERATURE
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000
            }
          );

          const retryMsg = retryResp.data && retryResp.data.choices && retryResp.data.choices[0] && retryResp.data.choices[0].message && retryResp.data.choices[0].message.content;
          if (retryMsg && !/^\s*$/.test(retryMsg)) {
            // Merge partial assistant content and continuation so final output is seamless
            const original = partialAssistant || '';
            const combined = (original + '\n' + retryMsg).trim();
            // Use retryResp as base but replace the assistant content with the merged text
            retryResp.data.choices[0].message.content = combined;
            fs.writeFileSync(debugPath, JSON.stringify({ stage: 'continued', request: retryMessages, response: retryResp.data }, null, 2));
            resp = retryResp;
          } else {
            fs.writeFileSync(debugPath, JSON.stringify({ stage: 'continued_empty', request: retryMessages, response: retryResp.data }, null, 2));
          }
        } catch (retryErr) {
          console.warn('Continuation retry failed', retryErr && retryErr.message);
        }
      }

      // Existing empty-response handling: if the assistant returned an empty or control-token response, attempt one retry and then a fallback
      const assistantMsg2 = resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message && resp.data.choices[0].message.content;
      const looksEmpty = !assistantMsg2 || /^\s*$/.test(assistantMsg2) || /^<.*>$/.test(assistantMsg2);
      if (looksEmpty) {
        const fs = require('fs');
        const debugPath = path.join(__dirname, 'openrouter_debug.json');
        fs.writeFileSync(debugPath, JSON.stringify({ stage: 'initial', request: outgoingMessages, response: resp.data }, null, 2));
        console.warn('Wrote debug response to', debugPath);

        // Attempt one retry with a short, explicit user instruction to answer concisely. Use client messages as base.
        try {
          const lastUser = userMessages.length ? (userMessages[userMessages.length - 1].content || '') : '';
          const retryUser = { role: 'user', content: `Retry: Please answer concisely in the requested format for: ${lastUser || '[user input]'} If this is a greeting, reply: 'Please ask a technical topic.'` };
          const retryResp = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
              model: OPENROUTER_MODEL,
              messages: Array.isArray(outgoingBase) ? [...outgoingBase, retryUser] : [retryUser],
              max_tokens: MAX_TOKENS,
              temperature: TEMPERATURE
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000
            }
          );

          const retryMsg2 = retryResp.data && retryResp.data.choices && retryResp.data.choices[0] && retryResp.data.choices[0].message && retryResp.data.choices[0].message.content;
          if (retryMsg2 && !/^\s*$/.test(retryMsg2)) {
            // use retry response
            fs.writeFileSync(debugPath, JSON.stringify({ stage: 'retry', request: [systemMessage, retryUser], response: retryResp.data }, null, 2));
            resp = retryResp;
          } else {
            // fallback: craft a helpful message
            const fallback = lastUser && lastUser.toLowerCase().trim() === 'hi' ? 'Please ask a technical topic (e.g., "Binary Search").' : 'The assistant did not return an answer. Please rephrase your question.';
            const fallbackData = {
              id: resp.data && resp.data.id ? resp.data.id : 'local-fallback',
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: OPENROUTER_MODEL,
              choices: [{ index: 0, message: { role: 'assistant', content: fallback } }]
            };
            fs.writeFileSync(debugPath, JSON.stringify({ stage: 'fallback', request: [systemMessage, retryUser], response: fallbackData }, null, 2));
            return res.json(fallbackData);
          }
        } catch (retryErr) {
          console.warn('Retry failed', retryErr && retryErr.message);
        }
      }
    } catch (e) {
      console.warn('Debug logging failed', e && e.message);
    }

    // If this was a code request, ensure the reply contains a code block. If not, retry once with a forced instruction.
    try {
      if (wantsCode) {
        const text = resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message && resp.data.choices[0].message.content;
        const hasBlock = typeof text === 'string' && /```\w+[\s\S]*```/.test(text);
        if (!hasBlock) {
          const fs = require('fs');
          const debugPath = path.join(__dirname, 'openrouter_debug.json');
          fs.writeFileSync(debugPath, JSON.stringify({ stage: 'no_code_block', request: outgoingBase, response: resp.data }, null, 2));
          // Retry with explicit user-level code-only instruction (avoid server system prompts)
          const forceUser = { role: 'user', content: 'OUTPUT ONLY the complete source code inside a triple-backtick with language. Do not add explanation.' };
          const forceResp = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
              model: OPENROUTER_MODEL,
              messages: Array.isArray(outgoingBase) ? [...outgoingBase, forceUser] : [forceUser],
              max_tokens: Math.min(MAX_TOKENS * 8, 3072),
              temperature: TEMPERATURE
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000
            }
          );
          const forcedText = forceResp.data && forceResp.data.choices && forceResp.data.choices[0] && forceResp.data.choices[0].message && forceResp.data.choices[0].message.content;
          if (forcedText && /```\w+[\s\S]*```/.test(forcedText)) {
            resp = forceResp;
            fs.writeFileSync(debugPath, JSON.stringify({ stage: 'forced_code', request: [codeInstructionMessage, ...userMessages, forceUser], response: forceResp.data }, null, 2));
          }
        }
      }
    } catch (e) {
      console.warn('Code-block enforcement retry failed', e && e.message);
    }

    // Post-process: if this was a code request, extract only the first ```lang\n...``` block and replace the assistant content with that block
    try {
      if (wantsCode) {
        const msg = resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message;
        if (msg && typeof msg.content === 'string') {
          const codeBlockRe = /```(\w+)?\n([\s\S]*?)```/;
          const m = msg.content.match(codeBlockRe);
          if (m) {
            // include triple backticks and language tag
            const fullBlock = m[0];
            resp.data.choices[0].message.content = fullBlock;
          } else {
            // as a fallback, if text contains multiple lines and looks like code, return it inside a python code block
            const maybeCode = msg.content.split('\n').slice(0, 500).join('\n');
            if (/\n\s*\w+\(|def\s+\w+\(|class\s+\w+/.test(maybeCode)) {
              resp.data.choices[0].message.content = '```python\n' + maybeCode + '\n```';
            }
          }
        }
      }
    } catch (e) {
      console.warn('Post-process code extraction failed', e && e.message);
    }

    // Sanitize assistant output: remove control tokens like <s> and [/s], and clean common stray markers
    try {
      if (resp && resp.data && Array.isArray(resp.data.choices)) {
        resp.data.choices.forEach((c) => {
          if (c && c.message && typeof c.message.content === 'string') {
            let text = c.message.content;
            // Remove common control tokens and markers often returned by providers
            text = text.replace(/<\/?s>/gi, '');
            text = text.replace(/\[\/?s\]/gi, '');
            // Remove stray start/end markers like [/s] or [/] that remain
            text = text.replace(/\[\/.*?\]/g, '');
            // Trim excessive whitespace
            text = text.replace(/\r/g, '').replace(/\t/g, ' ').replace(/ +/g, ' ').trim();
            c.message.content = text;
          }
        });
      }
    } catch (e) {
      console.warn('Sanitization failed', e && e.message);
    }

    // Broadcast to SSE clients (Windows app, etc.)
    try {
      const lastUser = userMessages.length ? userMessages[userMessages.length - 1] : null;
      // Only broadcast the final assistant message (first choice)
      const finalAssistantMsg = resp && resp.data && Array.isArray(resp.data.choices) && resp.data.choices[0] && resp.data.choices[0].message;
      if (finalAssistantMsg && typeof finalAssistantMsg.content === 'string' && finalAssistantMsg.content.trim()) {
        // Broadcast user message first (if present)
        if (lastUser) {
          broadcastEvent({ role: 'user', type: 'user', content: lastUser.content });
        }
        // Then broadcast the single final assistant response
        broadcastEvent({ role: 'assistant', type: 'assistant', content: finalAssistantMsg.content });
      }
    } catch (e) {
      // non-fatal
    }

    return res.json(resp.data);
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
