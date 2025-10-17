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
    recordBtn.classList.add('recording');
  };

  recognition.onend = () => {
    isRecording = false;
    recordBtn.textContent = '🎤 Voice';
    recordBtn.classList.remove('recording');
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
    recordBtn.textContent = '🎤 Voice';
    recordBtn.classList.remove('recording');
    
    let errorMsg = 'Speech recognition error';
    if (event.error === 'no-speech') {
      errorMsg = 'No speech detected. Please try again.';
    } else if (event.error === 'not-allowed') {
      errorMsg = 'Microphone access denied. Please allow microphone access.';
    }
    alert(errorMsg);
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
let currentStreamingMessage = null; // Track currently streaming message

async function send() {
  const text = promptEl.value.trim();
  if (!text) return;
  
  // Add user message to conversation
  conversation.push({ role: 'user', content: text });
  promptEl.value = '';
  render();
  sendBtn.disabled = true;

  // Create placeholder for streaming assistant response
  currentStreamingMessage = { role: 'assistant', content: '' };
  conversation.push(currentStreamingMessage);
  render();

  try {
    // Send entire conversation history (including system prompt) to API
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Source': 'web-ui'
      },
      body: JSON.stringify({ messages: conversation.slice(0, -1) }) // Exclude placeholder
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

    // Update the streaming placeholder with final content
    if (currentStreamingMessage) {
      currentStreamingMessage.content = assistantText;
      currentStreamingMessage = null;
      render();
    }
  } catch (err) {
    console.error('Send error:', err);
    // Remove placeholder and add error
    if (currentStreamingMessage) {
      conversation.pop();
      currentStreamingMessage = null;
    }
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
    alert('🎤 Voice input is not supported in your browser.\n\nPlease use:\n- Chrome\n- Edge\n- Safari (iOS)\n\nFirefox does not support speech recognition.');
    return;
  }
  
  if (isRecording) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.error('Recognition start error:', e);
      if (e.message.includes('already started')) {
        recognition.stop();
        setTimeout(() => recognition.start(), 100);
      }
    }
  }
});

promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

render();

// **ENABLED**: SSE listening for real-time streaming updates
// Listen for server-sent events to get streaming chunks
if (typeof EventSource !== 'undefined') {
  const es = new EventSource('/events');
  
  es.addEventListener('message', (ev) => {
    try {
      const obj = JSON.parse(ev.data);
      if (obj && obj.role && obj.content) {
        // Handle streaming chunks
        if (obj.type === 'chunk' && obj.isStreaming && currentStreamingMessage) {
          // Append chunk to current streaming message
          currentStreamingMessage.content += obj.content;
          render(); // Update display in real-time
        }
        // Handle complete message
        else if (obj.type === 'complete' && !obj.isStreaming) {
          // Final message received - already handled by send() function
          console.log('Streaming complete');
        }
        // Handle user message echo (for Windows app sync)
        else if (obj.role === 'user' && !currentStreamingMessage) {
          // Skip user messages from other clients (already added locally)
        }
      }
    } catch (e) {
      console.warn('Failed to parse SSE message', e);
    }
  });
  
  es.addEventListener('error', (e) => {
    console.warn('SSE connection error, will retry automatically');
  });
}
