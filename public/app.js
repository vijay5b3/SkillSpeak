const messagesEl = document.getElementById('messages');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const recordBtn = document.getElementById('record');

let conversation = [
  { role: 'system', content: `You are a friendly technical interview assistant. Explain concepts in simple, human-readable language that anyone can understand.

**IMPORTANT: Only provide code when explicitly asked for it. If someone asks "what is X?" give an explanation, NOT code.**

**For EXPLANATION questions ("What is", "Explain", "Define", "Tell me about", "How does"):**

Give a friendly, conversational explanation in this format:

**[Topic Name]**

Write 2-3 paragraphs explaining the concept in simple, everyday language. Use analogies and real-world examples. Explain like you're talking to a friend who's learning programming.

**Why it's useful:**
Explain in 1-2 sentences why this matters and where it's used.

**How it works:**
- Key point 1 with example
- Key point 2 with example  
- Key point 3 with example
- Additional important details

**Key things to remember:**
- Important takeaway 1
- Important takeaway 2
- Common use cases

For algorithms, mention time/space complexity in simple terms: "This is efficient because..."

Aim for 150-250 words. Be thorough but friendly.

**For CODE questions (ONLY when they say "Write", "Code", "Program", "Implement", "Show me code", "Give me code"):**

**[Topic Name - Implementation]**

Brief explanation of what this code does.

\`\`\`language
# Clear comments explaining each section
def function_name(parameters):
    # Explain the logic
    code here
\`\`\`

**How it works:**
Explain the code in plain English.

**Example usage:**
\`\`\`language
# Show how to use it
example()
\`\`\`

**CRITICAL RULES:**
1. NO CODE unless they explicitly ask for code/implementation
2. For "What is X?" → Give explanation only
3. For "Write code for X" → Give code
4. Use simple, conversational language
5. Include real-world analogies
6. Explain WHY, not just WHAT
7. Be thorough (150-250 words for explanations)` }
];

let recognition = null;
let isRecording = false;

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
