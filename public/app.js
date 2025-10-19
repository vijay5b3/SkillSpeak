const messagesEl = document.getElementById('messages');
const promptEl = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const recordBtn = document.getElementById('record');
const toggleModeBtn = document.getElementById('toggle-mode');
const adminBtn = document.getElementById('admin-btn');
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

// Client ID management
// DO NOT persist on refresh - always start fresh
let clientId = null; // Removed localStorage.getItem - always null on refresh

// Clear any stored username on page load (session reset)
if (typeof(Storage) !== 'undefined') {
  localStorage.removeItem('clientId');
}

// Update admin button text based on username
function updateAdminButton() {
  if (clientId) {
    adminBtn.textContent = `👤 ${clientId}`;
    adminBtn.classList.add('has-username');
    adminBtn.title = `Logged in as: ${clientId}. Click to change username.`;
  } else {
    adminBtn.textContent = '👤 Guest';
    adminBtn.classList.remove('has-username');
    adminBtn.title = 'Set your username for private sessions';
  }
}

// Show username modal
function showUsernameModal() {
  usernameInput.value = clientId || '';
  usernameModal.style.display = 'block';
  usernameInput.focus();
}

// Hide username modal
function hideUsernameModal() {
  usernameModal.style.display = 'none';
  usernameInput.value = '';
}

// Save username
function saveUsername() {
  const username = usernameInput.value.trim().toLowerCase();
  
  // Validate username (alphanumeric only)
  if (!username) {
    alert('Please enter a username');
    return;
  }
  
  if (!/^[a-z0-9]+$/.test(username)) {
    alert('Username can only contain letters and numbers (no spaces or special characters)');
    return;
  }
  
  if (username.length < 3) {
    alert('Username must be at least 3 characters long');
    return;
  }
  
  // Save to sessionStorage (cleared on refresh/close)
  clientId = username;
  sessionStorage.setItem('clientId', clientId);
  
  // Update UI
  updateAdminButton();
  hideUsernameModal();
  
  // Show notification
  showNotification(`✅ Username set to: ${clientId}`, true);
  
  // Reconnect SSE with new clientId
  reconnectSSE();
}

// Show notification
function showNotification(message, isSuccess = false) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isSuccess ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)'};
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-weight: 600;
    animation: slideDown 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Event listeners for admin button and modal
adminBtn.addEventListener('click', showUsernameModal);
modalCancelBtn.addEventListener('click', hideUsernameModal);
modalSaveBtn.addEventListener('click', saveUsername);

// Allow Enter key to save in modal
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveUsername();
  } else if (e.key === 'Escape') {
    hideUsernameModal();
  }
});

// Initialize admin button
updateAdminButton();

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
    document.body.classList.add('simple-mode'); // Add theme class to body
    // Update system prompt
    conversation[0].content = simpleSystemPrompt;
  } else {
    toggleModeBtn.textContent = '📚 Detailed Mode';
    toggleModeBtn.classList.remove('simple-mode');
    toggleModeBtn.title = 'Currently in Detailed Mode - Click for Simple Mode';
    document.body.classList.remove('simple-mode'); // Remove theme class from body
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
    background: linear-gradient(135deg, ${isSimpleMode ? 'rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%' : 'rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%'});
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

// Simple auto-dismissing voice notification (optimized)
let voiceNotificationTimeout = null;
function showVoiceNotification(message) {
  // Remove existing notification if any
  let notification = document.getElementById('voice-notification');
  
  if (!notification) {
    // Create notification element only once
    notification = document.createElement('div');
    notification.id = 'voice-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: none;
    `;
    document.body.appendChild(notification);
  }
  
  // Clear any existing timeout
  if (voiceNotificationTimeout) {
    clearTimeout(voiceNotificationTimeout);
  }
  
  // Update message and show
  notification.textContent = message;
  notification.style.display = 'block';
  notification.style.animation = 'fadeInOut 2s ease-in-out';
  
  // Auto-hide after 2 seconds
  voiceNotificationTimeout = setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}

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
      errorMsg = 'Voice not recognized';
    } else if (event.error === 'not-allowed') {
      errorMsg = 'Microphone access denied. Please allow microphone access.';
      alert(errorMsg); // Only show alert for permission issues
      return;
    }
    
    // Show simple auto-dismissing notification for voice not recognized
    showVoiceNotification(errorMsg);
  };
}

function render() {
  // Clear only if full re-render is needed
  messagesEl.innerHTML = '';
  conversation.slice(1).forEach(m => {
    const div = document.createElement('div');
    div.className = 'msg';
    // Render content with code blocks properly formatted
    const content = m.content || '';
    const formattedContent = formatContentWithCode(content, m.role);
    div.innerHTML = formattedContent;
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Helper function to format content with code blocks while preserving explanation text
function formatContentWithCode(content, role) {
  // Check if content has code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  if (content.match(codeBlockRegex)) {
    // Split content by code blocks but preserve text before and after
    let result = `<div class="${role}"><strong>${role}:</strong> `;
    let lastIndex = 0;
    let match;
    
    // Reset regex for iteration
    codeBlockRegex.lastIndex = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        const htmlBefore = escapeHtml(textBefore).replace(/\n/g, '<br>');
        result += htmlBefore;
      }
      
      // Add code block
      const lang = match[1] || '';
      const code = match[2] || '';
      result += `<pre><code class="lang-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`;
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text after last code block
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      const htmlAfter = escapeHtml(textAfter).replace(/\n/g, '<br>');
      result += htmlAfter;
    }
    
    result += '</div>';
    return result;
  } else {
    // No code blocks, preserve newlines for plain text
    const html = escapeHtml(content).replace(/\n/g, '<br>');
    return `<div class="${role}"><strong>${role}:</strong> ${html}</div>`;
  }
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
  // Use the same formatting function to preserve explanation with code
  lastDiv.innerHTML = formatContentWithCode(content, lastMsg.role);
  
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
    // Build URL with clientId if available
    const chatUrl = clientId ? `/api/chat?clientId=${encodeURIComponent(clientId)}` : '/api/chat';
    
    // Send entire conversation history (including system prompt) to API
    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Source': 'web-ui',
        ...(clientId && { 'X-Client-ID': clientId }) // Add clientId header if available
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
// SSE connection management
let eventSource = null;
let reconnectInterval = null;
let reconnectAttempts = 0;

function connectSSE() {
  if (eventSource) {
    eventSource.close();
  }
  
  // Clear any existing reconnect interval
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  
  // Build URL with clientId if available
  const sseUrl = clientId 
    ? `/events?clientId=${encodeURIComponent(clientId)}&source=web` 
    : '/events?source=web';
  
  if (typeof EventSource !== 'undefined') {
    try {
      eventSource = new EventSource(sseUrl);
      
      eventSource.addEventListener('open', () => {
        console.log('SSE connected successfully');
        reconnectAttempts = 0; // Reset counter on successful connection
      });
      
      eventSource.addEventListener('message', (ev) => {
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
      
      eventSource.addEventListener('error', (e) => {
        console.warn('SSE connection error, attempting reconnect...');
        reconnectAttempts++;
        
        // Close current connection
        if (eventSource) {
          eventSource.close();
        }
        
        // Only reconnect if we have a clientId (private session)
        if (clientId) {
          // Attempt reconnection every 1 second
          if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
              console.log(`Reconnection attempt ${reconnectAttempts} for user: ${clientId}`);
              connectSSE();
            }, 1000); // Reconnect every 1 second
          }
        }
      });
      
      console.log('SSE connected with URL:', sseUrl);
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      
      // Retry connection for private sessions
      if (clientId && !reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log(`Reconnection attempt ${reconnectAttempts} for user: ${clientId}`);
          connectSSE();
        }, 1000);
      }
    }
  }
}

function reconnectSSE() {
  console.log('Reconnecting SSE with new clientId...');
  connectSSE();
}

// Initial SSE connection
connectSSE();
