const messagesEl = document.getElementById('messages');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const recordBtn = document.getElementById('record');
const toggleModeBtn = document.getElementById('toggle-mode');

let isSimpleMode = false; // Track current mode

// System prompts for different modes
const detailedSystemPrompt = `You are a friendly technical interview assistant. Provide clear, complete explanations.

**IMPORTANT RULES:**
1. Answer the EXACT question asked - don't provide code unless specifically requested
2. If asked "What is X?" or "Explain X" → Give explanation ONLY, NO CODE
3. If asked "Write code for X" or "Implement X" → Give code ONLY
4. Keep formatting simple - use plain text with minimal Markdown
5. NEVER rollback or delete previous content
6. Complete your full response without stopping mid-sentence

**For EXPLANATION questions (What is, Explain, Define, Tell me about, How does):**

Provide a complete explanation in this simple format:

**[Topic Name]**

[2-3 clear paragraphs explaining the concept in simple language. Use everyday examples and analogies. Make it easy to understand.]

**Why it's useful:**
[1-2 sentences explaining the purpose and importance]

**How it works:**
- [Key point 1 with brief example]
- [Key point 2 with brief example]
- [Key point 3 with brief example]

**Key things to remember:**
- [Important takeaway 1]
- [Important takeaway 2]
- [Common use cases]

For algorithms, mention time/space complexity simply: "This is O(log n) because..."

**For CODE questions (ONLY when they explicitly say "Write", "Code", "Program", "Implement", "Show code"):**

**[Topic Name - Implementation]**

[Brief 1-sentence description]

\`\`\`python
# Complete, working code
# Include ALL necessary functions, classes, and methods
# Add clear comments
# NEVER truncate or use ... to indicate omitted code
# Write the COMPLETE implementation

def function_name(params):
    # Full implementation here
    pass
\`\`\`

**How it works:**
[Explain the code briefly in 2-3 sentences]

**Important:**
- Provide COMPLETE, runnable code
- Include ALL functions and methods
- NO placeholders like "# ... rest of code"
- Write every line needed
- If code is long, write ALL of it anyway

**CRITICAL:**
- Answer ONLY what is asked
- NO code for "What is" questions
- NO explanation for "Write code" questions
- Complete the FULL code without truncation
- Never use ... or ellipsis in code
- Never delete or rollback content`;

const simpleSystemPrompt = `You are a concise technical assistant. Provide SHORT, clear answers with numbered steps.

**IMPORTANT RULES:**
1. Answer ONLY what is asked
2. Keep it SHORT but COMPLETE
3. Use SIMPLE words
4. Use NUMBERED STEPS for how things work
5. NEVER rollback or delete previous content
6. Complete your full response

**RESPONSE FORMAT:**

**Definition:** 
[One clear sentence explaining what it is]

**Simple Explanation:**
[2-3 sentences in very simple words, like explaining to a beginner]

**How it works (Key Steps):**
1. [First step - one simple sentence]
2. [Second step - one simple sentence]
3. [Third step - one simple sentence]
4. [Additional steps if needed]

**Example:**
[One practical, real-world example in simple terms]

**CRITICAL:**
- Be SHORT but COMPLETE
- Use simple language
- Answer ONLY the question asked
- NO code unless requested
- Complete without cutting off`;

let conversation = [
  { role: 'system', content: detailedSystemPrompt }
];

let recognition = null;
let isRecording = false;

// Toggle mode function
function toggleMode() {
  isSimpleMode = !isSimpleMode;
  
  // Update button appearance and text
  if (isSimpleMode) {
    toggleModeBtn.textContent = '💡 Simple Mode';
    toggleModeBtn.classList.add('simple-mode');
    toggleModeBtn.title = 'Currently in Simple Mode - Click for Detailed Mode';
    // Update system prompt
    conversation[0].content = simpleSystemPrompt;
  } else {
    toggleModeBtn.textContent = '📚 Detailed Mode';
    toggleModeBtn.classList.remove('simple-mode');
    toggleModeBtn.title = 'Currently in Detailed Mode - Click for Simple Mode';
    // Update system prompt
    conversation[0].content = detailedSystemPrompt;
  }
  
  // Show notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-weight: 600;
    animation: slideDown 0.3s ease-out;
  `;
  notification.textContent = isSimpleMode 
    ? '💡 Simple Mode: Short definitions & numbered steps' 
    : '📚 Detailed Mode: Comprehensive explanations';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add event listener for toggle button
toggleModeBtn.addEventListener('click', toggleMode);

// Technical vocabulary for better speech recognition
const technicalPhrases = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Node.js', 'React', 'Angular', 'Vue.js',
  'Databricks', 'Delta Lake', 'MLflow', 'Unity Catalog', 'Spark SQL', 'Pandas', 'NumPy', 'TensorFlow',
  'AWS', 'Azure', 'Google Cloud', 'Kubernetes', 'Docker', 'API', 'REST', 'GraphQL', 'MongoDB', 'PostgreSQL',
  'Binary Search', 'Linked List', 'Hash Table', 'Recursion', 'Algorithm', 'Machine Learning', 'Neural Network'
];

// Initialize Web Speech API if available
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true; // Enable interim results for better UX
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
  
  // Add technical vocabulary grammar (if supported)
  if (SpeechGrammarList) {
    const grammarList = new SpeechGrammarList();
    const grammar = '#JSGF V1.0; grammar technical; public <term> = ' + technicalPhrases.join(' | ') + ' ;';
    grammarList.addFromString(grammar, 1);
    recognition.grammars = grammarList;
  }

  recognition.onstart = () => {
    isRecording = true;
    recordBtn.textContent = '⏹️ Stop';
    recordBtn.classList.add('recording');
    promptEl.placeholder = '🎤 Listening... (speak now)';
  };

  recognition.onend = () => {
    isRecording = false;
    recordBtn.textContent = '🎤 Voice';
    recordBtn.classList.remove('recording');
    promptEl.placeholder = 'Ask me anything... (e.g., "What is binary search?")';
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    // Process all results
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Show interim results in the input box
    if (interimTranscript) {
      promptEl.value = interimTranscript;
      promptEl.style.fontStyle = 'italic';
      promptEl.style.opacity = '0.7';
    }
    
    // When final result is available, send it
    if (finalTranscript) {
      promptEl.value = finalTranscript;
      promptEl.style.fontStyle = 'normal';
      promptEl.style.opacity = '1';
      // Auto-send after transcription
      setTimeout(() => send(), 500); // Small delay for user to see the transcription
    }
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
  // Clear only if full re-render is needed
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

// Optimized render for streaming updates - only update the last message
function updateLastMessage() {
  const lastMsg = conversation[conversation.length - 1];
  if (!lastMsg) return;
  
  // Find or create the last message element
  let lastDiv = messagesEl.lastElementChild;
  if (!lastDiv || lastDiv.children.length === 0) {
    lastDiv = document.createElement('div');
    lastDiv.className = 'msg';
    messagesEl.appendChild(lastDiv);
  }
  
  const content = lastMsg.content || '';
  const codeBlockMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
  
  if (codeBlockMatch) {
    const lang = codeBlockMatch[1] || '';
    const code = codeBlockMatch[2] || '';
    lastDiv.innerHTML = `<div class="${lastMsg.role}"><strong>${lastMsg.role}:</strong><pre><code class="lang-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre></div>`;
  } else {
    const html = escapeHtml(content).replace(/\n/g, '<br>');
    lastDiv.innerHTML = `<div class="${lastMsg.role}"><strong>${lastMsg.role}:</strong> ${html}</div>`;
  }
  
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
    // Note: For streaming, this will be updated via SSE events
    // This is just a fallback for non-streaming responses
    if (currentStreamingMessage && currentStreamingMessage.content === '') {
      currentStreamingMessage.content = assistantText;
      currentStreamingMessage = null;
      render();
    } else if (currentStreamingMessage) {
      // SSE already populated it, just clear the reference
      currentStreamingMessage = null;
      render(); // Final render to ensure code highlighting
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
          updateLastMessage(); // Only update last message - no flicker!
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
