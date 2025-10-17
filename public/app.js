const messagesEl = document.getElementById('messages');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const recordBtn = document.getElementById('record');

let conversation = [
  { role: 'system', content: `You are a technical interview assistant. Follow these rules based on the question type:

**For EXPLANATION questions ("What is", "Explain", "Define"):**
[Topic Name]
Definition:
One clear sentence explaining the concept.

How it works:
- Step 1 or key point 1
- Step 2 or key point 2
- Step 3 or key point 3

Time Complexity (algorithms only): O(?)
Space Complexity (algorithms only): O(?)

**For CODE/PROGRAM questions ("Write", "Code", "Program", "Implement"):**
[Topic Name - Implementation]

Main Logic:
\`\`\`language
# Clear descriptive comments explaining each section
# Proper indentation (4 spaces for Python, 2/4 for others)

def function_name(parameters):
    # Step 1: Explain what this section does
    code_here
    
    # Step 2: Explain next section
    more_code
    
    # Step 3: Return/output
    return result
\`\`\`

Time Complexity: O(?)
Space Complexity: O(?)

STRICT RULES:
1. Detect if user wants explanation OR code
2. For explanations: Use bullet points, NO code blocks
3. For code: Provide COMPLETE working code with:
   - Proper indentation (4 spaces Python, 2-4 others)
   - Comments for each major section
   - Clean, readable formatting
4. ALWAYS include complexity analysis
5. Keep explanations under 120 words
6. For code, provide full implementation` }
];

let recognition = null;
let isRecording = false;

// Initialize Web Speech API if available
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecording = true;
    recordBtn.textContent = '⏹️ Stop';
    recordBtn.style.background = '#ff4444';
    recordBtn.style.color = '#fff';
  };

  recognition.onend = () => {
    isRecording = false;
    recordBtn.textContent = '🎤 Record';
    recordBtn.style.background = '';
    recordBtn.style.color = '';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    promptEl.value = transcript;
    // Auto-send after transcription
    send();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isRecording = false;
    recordBtn.textContent = '🎤 Record';
    recordBtn.style.background = '';
    recordBtn.style.color = '';
    alert('Speech recognition error: ' + event.error);
  };
}

function render() {
  messagesEl.innerHTML = '';
  conversation.slice(1).forEach(m => {
    const div = document.createElement('div');
    div.className = 'msg';
    // Render code blocks specially
    const content = m.content || '';
    const codeBlockMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1] || '';
      const code = codeBlockMatch[2] || '';
      div.innerHTML = `<div class="${m.role}"><strong>${m.role}:</strong><pre><code class="lang-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre></div>`;
    } else {
      // Preserve newlines for plain text
      const html = escapeHtml(content).replace(/\n/g, '<br>');
      div.innerHTML = `<div class="${m.role}"><strong>${m.role}:</strong> ${html}</div>`;
    }
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Track messages added directly via API to prevent SSE duplication
let lastDirectApiMessage = null;

async function send() {
  const text = promptEl.value.trim();
  if (!text) return;
  
  // Add user message to conversation
  conversation.push({ role: 'user', content: text });
  promptEl.value = '';
  render();
  sendBtn.disabled = true;

  try {
    // Send entire conversation history (including system prompt) to API
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Source': 'web-ui'
      },
      body: JSON.stringify({ messages: conversation })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Parse OpenRouter response format
    let assistantText = '';
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      assistantText = data.choices[0].message.content || '';
    }
    
    // Fallback if no content received
    if (!assistantText || /^\s*$/.test(assistantText)) {
      assistantText = "The assistant did not return a response. Please try again.";
    }

    // Add assistant response to conversation
    conversation.push({ role: 'assistant', content: assistantText });
    render();
  } catch (err) {
    console.error('Send error:', err);
    conversation.push({ 
      role: 'assistant', 
      content: 'Error: ' + (err.message || 'Failed to get response') 
    });
    render();
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener('click', send);
recordBtn.addEventListener('click', () => {
  if (!recognition) {
    alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    return;
  }
  
  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

render();

// DISABLED: SSE listening for web UI
// The web UI gets responses directly from API calls
// Only the Windows app (SRMV) should listen to SSE broadcasts
// This prevents duplicate messages in the web interface

/*
// Listen for server-sent events - DISABLED FOR WEB UI
if (typeof EventSource !== 'undefined') {
  const es = new EventSource('/events');
  es.addEventListener('message', (ev) => {
    try {
      const obj = JSON.parse(ev.data);
      if (obj && obj.role && obj.content) {
        // Skip if this message was just added via direct API call
        if (lastDirectApiMessage === obj.content) {
          console.log('Skipping SSE duplicate of direct API response');
          return;
        }
        
        // Strong deduplication: check if ANY message in conversation has the same content and role
        const isDuplicate = conversation.some(msg => 
          msg.role === obj.role && msg.content === obj.content
        );
        if (!isDuplicate) {
          conversation.push({ role: obj.role, content: obj.content });
          render();
        }
      }
    } catch (e) {
      console.warn('Failed to parse SSE message', e);
    }
  });
  es.addEventListener('error', (e) => {
    // noop - connection might retry automatically
  });
}
*/
