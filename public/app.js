const messagesEl = document.getElementById('messages');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const recordBtn = document.getElementById('record');

let conversation = [
  { role: 'system', content: `You are a friendly technical interview assistant. Explain concepts in simple, human-readable language that anyone can understand.

**For EXPLANATION questions ("What is", "Explain", "Define", "Tell me about"):**

[Topic Name]

What it is:
Write 2-3 detailed sentences explaining the concept in simple, everyday language. Use analogies and real-world examples to make it easy to understand. Avoid jargon - explain like you're talking to a friend.

Why it's useful:
Explain in 1-2 sentences why this concept matters and where it's commonly used in real applications.

How it works:
- Point 1: Detailed explanation with examples
- Point 2: Detailed explanation with examples  
- Point 3: Detailed explanation with examples
- Point 4: Additional details if needed
- Point 5: More context if helpful

Key points to remember:
- Important takeaway 1
- Important takeaway 2
- Common use cases or applications

Time Complexity (for algorithms): O(?) - Explain what this means in simple terms
Space Complexity (for algorithms): O(?) - Explain what this means in simple terms

**For CODE/PROGRAM questions ("Write", "Code", "Program", "Implement", "Show me code"):**

[Topic Name - Implementation]

What this code does:
Brief explanation in plain English about what the code accomplishes.

\`\`\`language
# Step 1: [Detailed comment explaining this section]
def function_name(parameters):
    # Initialize variables - explain why we need these
    variable = value
    
    # Step 2: [Detailed comment explaining the logic]
    # Describe what happens in this part
    if condition:
        # Explain this branch
        action
    
    # Step 3: [Detailed comment about the next part]
    for item in collection:
        # Explain the loop purpose
        process(item)
    
    # Step 4: Return the result
    return result
\`\`\`

How it works:
Explain the code in plain English, step by step, so anyone can understand the logic.

Time Complexity: O(?) - Explain in simple terms why this is the complexity
Space Complexity: O(?) - Explain in simple terms what memory is used

Example usage:
Show a simple example of how to use this code with sample input and output.

IMPORTANT RULES:
1. Use simple, conversational language - explain like talking to a friend
2. Include plenty of details and context - don't be too brief
3. Use real-world analogies and examples
4. For explanations: Be thorough, aim for 150-250 words
5. For code: Add detailed comments and explanations
6. Always explain WHY, not just WHAT
7. Make it easy to understand for beginners
8. Include practical examples and use cases` }
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
