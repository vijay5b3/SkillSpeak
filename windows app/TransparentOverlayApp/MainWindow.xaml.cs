using System;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;

namespace TransparentOverlayApp
{
public partial class MainWindow : Window
{
    private bool _transparentEnabled = true;
    private readonly HttpClient _httpClient;
    private CancellationTokenSource _cancellationTokenSource;
    private StringBuilder _chatMessages = new StringBuilder();
    private bool _isConnected = false;
    private readonly string _serverUrl = "https://chat-bot-six-beta.vercel.app/events";
    private readonly string _chatApiUrl = "https://chat-bot-six-beta.vercel.app/api/chat";
    private List<object> _conversation = new List<object>();
    private StringBuilder _currentStreamingMessage = null; // Track streaming message
    private string _currentStreamingSender = "";  // Track who is streaming

    public MainWindow()
    {
    InitializeComponent();
    // Ensure the window can receive key events
        Focusable = true;
        
        _httpClient = new HttpClient();
        _httpClient.Timeout = TimeSpan.FromMilliseconds(Timeout.Infinite);
        
        // Initialize conversation with system prompt
        _conversation.Add(new
        {
            role = "system",
            content = @"You are a friendly technical interview assistant. Explain concepts in simple, human-readable language that anyone can understand.

**IMPORTANT: Only provide code when explicitly asked for it. If someone asks ""what is X?"" give an explanation, NOT code.**

**For EXPLANATION questions (""What is"", ""Explain"", ""Define"", ""Tell me about"", ""How does""):**

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

For algorithms, mention time/space complexity in simple terms: ""This is efficient because...""

Aim for 150-250 words. Be thorough but friendly.

**For CODE questions (ONLY when they say ""Write"", ""Code"", ""Program"", ""Implement"", ""Show me code"", ""Give me code""):**

**[Topic Name - Implementation]**

Brief explanation of what this code does.

```language
# Clear comments explaining each section
def function_name(parameters):
    # Explain the logic
    code here
```

**How it works:**
Explain the code in plain English.

**Example usage:**
```language
# Show how to use it
example()
```

**CRITICAL RULES:**
1. NO CODE unless they explicitly ask for code/implementation
2. For ""What is X?"" → Give explanation only
3. For ""Write code for X"" → Give code
4. Use simple, conversational language
5. Include real-world analogies
6. Explain WHY, not just WHAT
7. Be thorough (150-250 words for explanations)"
        });
        
        // Setup input textbox handlers
        InputTextBox.GotFocus += (s, e) =>
        {
            if (InputTextBox.Text == "Type your question here...")
            {
                InputTextBox.Text = "";
            }
        };
        
        InputTextBox.LostFocus += (s, e) =>
        {
            if (string.IsNullOrWhiteSpace(InputTextBox.Text))
            {
                InputTextBox.Text = "Type your question here...";
            }
        };
    }

    private void Window_Loaded(object sender, RoutedEventArgs e)
    {
        // Attempt to enable acrylic/blur effect on supported OS versions
        // Only when the window is not using WPF transparency, as mixing both can be unstable.
        if (!AllowsTransparency)
        {
            TryEnableBlurBehind();
        }
        try { Focus(); } catch { }
        
        // Make window excluded from screen capture/sharing
        try
        {
            var hwnd = new WindowInteropHelper(this).Handle;
            if (hwnd != IntPtr.Zero)
            {
                BlurHelper.SetWindowDisplayAffinity(hwnd, BlurHelper.WDA_EXCLUDEFROMCAPTURE);
            }
        }
        catch { }
        
        // Start listening to SSE events from chat server with auto-reconnect
        StartListeningToChat();
    }
    
    private async void StartListeningToChat()
    {
        _cancellationTokenSource = new CancellationTokenSource();
        
        while (!_cancellationTokenSource.Token.IsCancellationRequested)
        {
            try
            {
                UpdateConnectionStatus("Connecting to chat server...");
                await ListenToServerSentEvents(_serverUrl, _cancellationTokenSource.Token);
            }
            catch (Exception ex)
            {
                _isConnected = false;
                UpdateConnectionStatus($"Connection lost. Reconnecting in 2 seconds...\n\nError: {ex.Message}");
                
                // Wait 2 seconds before reconnecting
                await Task.Delay(2000, _cancellationTokenSource.Token);
            }
        }
    }
    
    private void UpdateConnectionStatus(string status)
    {
        Dispatcher.Invoke(() =>
        {
            if (!_isConnected || _chatMessages.Length == 0)
            {
                ChatTextBlock.Text = status;
            }
        });
    }
    
    private async Task ListenToServerSentEvents(string url, CancellationToken cancellationToken)
    {
        using var httpClient = new HttpClient();
        httpClient.Timeout = System.Threading.Timeout.InfiniteTimeSpan;
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Accept", "text/event-stream");
        request.Headers.Add("Cache-Control", "no-cache");
        request.Headers.ConnectionClose = false;
        request.Version = new Version(1, 1);
        
        using (var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken))
        {
            response.EnsureSuccessStatusCode();
            
            _isConnected = true;
            Dispatcher.Invoke(() =>
            {
                _chatMessages.Clear();
                _chatMessages.AppendLine($"✅ Connected - Ready to chat!");
                _chatMessages.AppendLine();
                ChatTextBlock.Text = _chatMessages.ToString();
            });
            
            using (var stream = await response.Content.ReadAsStreamAsync())
            using (var reader = new StreamReader(stream))
            {
                string? line;
                int messageCount = 0;
                int lineCount = 0;
                
                while ((line = await reader.ReadLineAsync()) != null && !cancellationToken.IsCancellationRequested)
                {
                    lineCount++;
                    System.Diagnostics.Debug.WriteLine($"[Line {lineCount}] {line}");
                    
                    // Keep-alive or comment line
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith(":"))
                    {
                        continue;
                    }
                    
                    if (line.StartsWith("data: "))
                    {
                        string jsonData = line.Substring(6);
                        System.Diagnostics.Debug.WriteLine($"[JSON] {jsonData}");
                        
                        try
                        {
                            using (JsonDocument doc = JsonDocument.Parse(jsonData))
                            {
                                var root = doc.RootElement;
                                
                                string role = "";
                                if (root.TryGetProperty("role", out var roleElement))
                                {
                                    role = roleElement.GetString() ?? "";
                                }
                                else if (root.TryGetProperty("type", out var typeElement))
                                {
                                    role = typeElement.GetString() ?? "";
                                }
                                
                                string content = "";
                                if (root.TryGetProperty("content", out var contentElement))
                                {
                                    content = contentElement.GetString() ?? "";
                                }
                                
                                // Check if this is a streaming chunk
                                bool isStreaming = false;
                                string messageType = "";
                                if (root.TryGetProperty("isStreaming", out var isStreamingElement))
                                {
                                    isStreaming = isStreamingElement.GetBoolean();
                                }
                                if (root.TryGetProperty("type", out var typeElement2))
                                {
                                    messageType = typeElement2.GetString() ?? "";
                                }
                                
                                if (!string.IsNullOrWhiteSpace(content))
                                {
                                    // Handle streaming chunks
                                    if (messageType == "chunk" && isStreaming)
                                    {
                                        string sender = role == "user" ? "👤 You" : "🤖 Assistant";
                                        
                                        // Start new streaming message if needed
                                        if (_currentStreamingMessage == null || _currentStreamingSender != sender)
                                        {
                                            _currentStreamingMessage = new StringBuilder();
                                            _currentStreamingSender = sender;
                                            
                                            Dispatcher.Invoke(() =>
                                            {
                                                _chatMessages.AppendLine($"[{sender}] ⚡ streaming...");
                                                _chatMessages.AppendLine();
                                                ChatTextBlock.Text = _chatMessages.ToString();
                                            });
                                        }
                                        
                                        // Append chunk to streaming message
                                        _currentStreamingMessage.Append(content);
                                        
                                        // Update display in real-time
                                        Dispatcher.Invoke(() =>
                                        {
                                            // Remove the "streaming..." header and rebuild with current content
                                            var lines = _chatMessages.ToString().Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None).ToList();
                                            
                                            // Find and update the last message
                                            for (int i = lines.Count - 1; i >= 0; i--)
                                            {
                                                if (lines[i].Contains($"[{_currentStreamingSender}]"))
                                                {
                                                    // Rebuild from this point
                                                    _chatMessages.Clear();
                                                    for (int j = 0; j < i; j++)
                                                    {
                                                        _chatMessages.AppendLine(lines[j]);
                                                    }
                                                    _chatMessages.AppendLine($"[{_currentStreamingSender}] ⚡ streaming...");
                                                    _chatMessages.AppendLine();
                                                    _chatMessages.AppendLine(_currentStreamingMessage.ToString());
                                                    break;
                                                }
                                            }
                                            
                                            ChatTextBlock.Text = _chatMessages.ToString();
                                            ChatScrollViewer.ScrollToEnd();
                                        });
                                    }
                                    // Handle complete message
                                    else if (messageType == "complete" && !isStreaming)
                                    {
                                        string sender = role == "user" ? "👤 You" : "🤖 Assistant";
                                        
                                        // Finalize streaming message
                                        if (_currentStreamingMessage != null && _currentStreamingSender == sender)
                                        {
                                            Dispatcher.Invoke(() =>
                                            {
                                                // Remove "streaming..." and add final version
                                                var lines = _chatMessages.ToString().Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None).ToList();
                                                
                                                for (int i = lines.Count - 1; i >= 0; i--)
                                                {
                                                    if (lines[i].Contains($"[{_currentStreamingSender}]"))
                                                    {
                                                        // Rebuild from this point
                                                        _chatMessages.Clear();
                                                        for (int j = 0; j < i; j++)
                                                        {
                                                            _chatMessages.AppendLine(lines[j]);
                                                        }
                                                        _chatMessages.AppendLine($"[{_currentStreamingSender}]");
                                                        _chatMessages.AppendLine(content);
                                                        _chatMessages.AppendLine();
                                                        break;
                                                    }
                                                }
                                                
                                                ChatTextBlock.Text = _chatMessages.ToString();
                                                ChatScrollViewer.ScrollToEnd();
                                            });
                                            
                                            _currentStreamingMessage = null;
                                            _currentStreamingSender = "";
                                        }
                                    }
                                    // Handle regular non-streaming messages (user messages, etc.)
                                    else
                                    {
                                        messageCount++;
                                        string sender = role == "user" ? "👤 You" : "🤖 Assistant";
                                        AddMessage($"{sender} (#{messageCount})", content);
                                        System.Diagnostics.Debug.WriteLine($"[SUCCESS] Added {role} message #{messageCount}");
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            System.Diagnostics.Debug.WriteLine($"[ERROR] Parse failed: {ex.Message}");
                            Dispatcher.Invoke(() =>
                            {
                                _chatMessages.AppendLine($"❌ [Parse Error #{lineCount}]");
                                _chatMessages.AppendLine($"Error: {ex.Message}");
                                _chatMessages.AppendLine($"Data: {jsonData.Substring(0, Math.Min(100, jsonData.Length))}...");
                                _chatMessages.AppendLine();
                                ChatTextBlock.Text = _chatMessages.ToString();
                            });
                        }
                    }
                }
                
                System.Diagnostics.Debug.WriteLine($"[DISCONNECT] Stream ended. Total lines: {lineCount}, Messages: {messageCount}");
            }
        }
    }
    
    private string ExtractJsonField(string json, string fieldName)
    {
        string searchPattern = $"\"{fieldName}\":\"";
        int startIndex = json.IndexOf(searchPattern);
        if (startIndex == -1) return "";
        
        startIndex += searchPattern.Length;
        int endIndex = json.IndexOf("\"", startIndex);
        if (endIndex == -1) return "";
        
        string value = json.Substring(startIndex, endIndex - startIndex);
        // Unescape basic JSON characters
        value = value.Replace("\\n", "\n").Replace("\\\"", "\"").Replace("\\\\", "\\");
        return value;
    }
    
    private void AddMessage(string sender, string content)
    {
        Dispatcher.Invoke(() =>
        {
            // Add message with clean format - no horizontal lines
            _chatMessages.AppendLine($"[{sender}]");
            _chatMessages.AppendLine(content);
            _chatMessages.AppendLine(); // Just one blank line between messages
            
            ChatTextBlock.Text = _chatMessages.ToString();
            
            // Auto-scroll to bottom
            ChatScrollViewer.ScrollToEnd();
        });
    }

    private void DragSurface_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        // Allow dragging the window by clicking anywhere on the background
        if (e.ButtonState == MouseButtonState.Pressed)
        {
            try
            {
                DragMove();
            }
            catch
            {
                // Ignore invalid drag operations
            }
        }
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F2)
        {
            ToggleTransparency();
        }
    }

    private void Window_PreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F2)
        {
            ToggleTransparency();
            e.Handled = true;
        }
    }

    private void ToggleTransparency()
    {
        _transparentEnabled = !_transparentEnabled;

        // Only toggle window opacity to avoid runtime AllowsTransparency toggle issues
        if (_transparentEnabled)
        {
            Opacity = 0.6;
        }
        else
        {
            Opacity = 1.0;
        }
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        _cancellationTokenSource?.Cancel();
        _httpClient?.Dispose();
        Close();
    }
    
    private void SendButton_Click(object sender, RoutedEventArgs e)
    {
        SendMessage();
    }
    
    private void InputTextBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && !Keyboard.Modifiers.HasFlag(ModifierKeys.Shift))
        {
            e.Handled = true;
            SendMessage();
        }
    }
    
    private async void SendMessage()
    {
        string message = InputTextBox.Text?.Trim() ?? "";
        
        // Skip if empty or placeholder
        if (string.IsNullOrWhiteSpace(message) || message == "Type your question here...")
        {
            return;
        }
        
        // Clear input
        InputTextBox.Text = "";
        InputTextBox.Focus();
        
        // Disable send button temporarily
        SendButton.IsEnabled = false;
        SendButton.Content = "⏳ Sending...";
        
        try
        {
            // Add user message to conversation
            _conversation.Add(new { role = "user", content = message });
            
            // Display user message immediately
            Dispatcher.Invoke(() =>
            {
                _chatMessages.AppendLine($"[👤 You]");
                _chatMessages.AppendLine(message);
                _chatMessages.AppendLine();
                ChatTextBlock.Text = _chatMessages.ToString();
                ChatScrollViewer.ScrollToEnd();
            });
            
            // Log the request for debugging
            System.Diagnostics.Debug.WriteLine($"[SEND] Sending message to: {_chatApiUrl}");
            System.Diagnostics.Debug.WriteLine($"[SEND] Message: {message}");
            
            // Send to API
            var requestBody = new
            {
                messages = _conversation.ToArray()
            };
            
            string jsonBody = JsonSerializer.Serialize(requestBody);
            System.Diagnostics.Debug.WriteLine($"[SEND] Request body length: {jsonBody.Length} chars");
            
            var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            content.Headers.Add("X-Source", "windows-app");
            
            System.Diagnostics.Debug.WriteLine($"[SEND] Posting to API...");
            var response = await _httpClient.PostAsync(_chatApiUrl, content);
            System.Diagnostics.Debug.WriteLine($"[SEND] Response status: {response.StatusCode}");
            
            response.EnsureSuccessStatusCode();
            
            string responseText = await response.Content.ReadAsStringAsync();
            System.Diagnostics.Debug.WriteLine($"[SEND] Response length: {responseText.Length} chars");
            
            // Parse response
            using (JsonDocument doc = JsonDocument.Parse(responseText))
            {
                var root = doc.RootElement;
                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var messageObj))
                    {
                        if (messageObj.TryGetProperty("content", out var contentElement))
                        {
                            string assistantResponse = contentElement.GetString() ?? "";
                            System.Diagnostics.Debug.WriteLine($"[SEND] Got assistant response: {assistantResponse.Substring(0, Math.Min(50, assistantResponse.Length))}...");
                            
                            // Add to conversation
                            _conversation.Add(new { role = "assistant", content = assistantResponse });
                            
                            // Display assistant response
                            Dispatcher.Invoke(() =>
                            {
                                _chatMessages.AppendLine($"[🤖 Assistant]");
                                _chatMessages.AppendLine(assistantResponse);
                                _chatMessages.AppendLine();
                                ChatTextBlock.Text = _chatMessages.ToString();
                                ChatScrollViewer.ScrollToEnd();
                            });
                        }
                        else
                        {
                            System.Diagnostics.Debug.WriteLine("[SEND] ERROR: No content in message");
                        }
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine("[SEND] ERROR: No message in choice");
                    }
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine("[SEND] ERROR: No choices in response");
                }
            }
        }
        catch (HttpRequestException httpEx)
        {
            System.Diagnostics.Debug.WriteLine($"[SEND] HTTP ERROR: {httpEx.Message}");
            Dispatcher.Invoke(() =>
            {
                _chatMessages.AppendLine($"[❌ Network Error]");
                _chatMessages.AppendLine($"Could not connect to server. Please check:");
                _chatMessages.AppendLine($"1. Server is running");
                _chatMessages.AppendLine($"2. Internet connection is active");
                _chatMessages.AppendLine($"3. Firewall is not blocking the app");
                _chatMessages.AppendLine($"\nError: {httpEx.Message}");
                _chatMessages.AppendLine();
                ChatTextBlock.Text = _chatMessages.ToString();
                ChatScrollViewer.ScrollToEnd();
            });
        }
        catch (JsonException jsonEx)
        {
            System.Diagnostics.Debug.WriteLine($"[SEND] JSON ERROR: {jsonEx.Message}");
            Dispatcher.Invoke(() =>
            {
                _chatMessages.AppendLine($"[❌ Response Error]");
                _chatMessages.AppendLine($"Server returned invalid response.");
                _chatMessages.AppendLine($"\nError: {jsonEx.Message}");
                _chatMessages.AppendLine();
                ChatTextBlock.Text = _chatMessages.ToString();
                ChatScrollViewer.ScrollToEnd();
            });
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[SEND] ERROR: {ex.GetType().Name} - {ex.Message}");
            System.Diagnostics.Debug.WriteLine($"[SEND] Stack: {ex.StackTrace}");
            Dispatcher.Invoke(() =>
            {
                _chatMessages.AppendLine($"[❌ Error]");
                _chatMessages.AppendLine($"Failed to send message: {ex.Message}");
                _chatMessages.AppendLine();
                ChatTextBlock.Text = _chatMessages.ToString();
                ChatScrollViewer.ScrollToEnd();
            });
        }
        finally
        {
            // Re-enable send button
            Dispatcher.Invoke(() =>
            {
                SendButton.IsEnabled = true;
                SendButton.Content = "📤 Send";
            });
        }
    }
    
    protected override void OnClosed(EventArgs e)
    {
        base.OnClosed(e);
        _cancellationTokenSource?.Cancel();
        _httpClient?.Dispose();
    }

    private void TryEnableBlurBehind()
    {
        try
        {
            var hwnd = new WindowInteropHelper(this).Handle;
            if (hwnd == IntPtr.Zero) return;

            // Prefer Acrylic (ACCENT_ENABLE_ACRYLICBLURBEHIND) on Windows 10/11; fallback to blur.
            if (!BlurHelper.EnableAcrylic(hwnd))
            {
                BlurHelper.EnableBlur(hwnd);
            }
        }
        catch
        {
            // Silently ignore if not supported
        }
    }
}

internal static class BlurHelper
{
    // Interop structures and enums adapted for enabling blur/acrylic via SetWindowCompositionAttribute
    private enum AccentState
    {
        ACCENT_DISABLED = 0,
        ACCENT_ENABLE_GRADIENT = 1,
        ACCENT_ENABLE_TRANSPARENTGRADIENT = 2,
        ACCENT_ENABLE_BLURBEHIND = 3,
        ACCENT_ENABLE_ACRYLICBLURBEHIND = 4,
        ACCENT_INVALID_STATE = 5
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct AccentPolicy
    {
        public AccentState AccentState;
        public int AccentFlags;
        public int GradientColor;
        public int AnimationId;
    }

    private enum WindowCompositionAttribute
    {
        WCA_ACCENT_POLICY = 19
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct WindowCompositionAttributeData
    {
        public WindowCompositionAttribute Attribute;
        public IntPtr Data;
        public int SizeOfData;
    }

    [DllImport("user32.dll")]
    private static extern int SetWindowCompositionAttribute(IntPtr hwnd, ref WindowCompositionAttributeData data);
    
    // For excluding window from screen capture
    [DllImport("user32.dll")]
    public static extern bool SetWindowDisplayAffinity(IntPtr hwnd, uint affinity);
    
    public const uint WDA_NONE = 0x00000000;
    public const uint WDA_EXCLUDEFROMCAPTURE = 0x00000011;

    public static bool EnableBlur(IntPtr hwnd)
    {
        return ApplyAccent(hwnd, AccentState.ACCENT_ENABLE_BLURBEHIND, 0);
    }

    public static bool EnableAcrylic(IntPtr hwnd)
    {
        // GradientColor uses ABGR format. High byte is alpha.
        // Here we set a slightly translucent dark backdrop (alpha ~ 0x99)
        int gradientColor = unchecked((int)0x99000000);
        return ApplyAccent(hwnd, AccentState.ACCENT_ENABLE_ACRYLICBLURBEHIND, gradientColor);
    }

    private static bool ApplyAccent(IntPtr hwnd, AccentState state, int gradientColor)
    {
        try
        {
            var accent = new AccentPolicy
            {
                AccentState = state,
                AccentFlags = 2, // enable blur behind, don't draw borders
                GradientColor = gradientColor,
                AnimationId = 0
            };

            int size = Marshal.SizeOf(accent);
            IntPtr accentPtr = Marshal.AllocHGlobal(size);
            Marshal.StructureToPtr(accent, accentPtr, false);

            var data = new WindowCompositionAttributeData
            {
                Attribute = WindowCompositionAttribute.WCA_ACCENT_POLICY,
                Data = accentPtr,
                SizeOfData = size
            };

            int result = SetWindowCompositionAttribute(hwnd, ref data);
            Marshal.FreeHGlobal(accentPtr);
            return result != 0;
        }
        catch
        {
            return false;
        }
    }
}
}
