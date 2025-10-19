# Code Block with Explanation UI Fix

## Issue Description

**Problem:** In the web chat, when asking for an explanation with code, both the explanation and code display correctly during streaming. However, after completion, only the code block is visible and the explanation text (before and after the code) disappears.

**Example:**
- User asks: "Explain binary search with code"
- During streaming: Shows explanation + code ✓
- After completion: Shows only code, explanation disappears ✗

## Root Cause

The `render()` and `updateLastMessage()` functions had flawed logic when handling code blocks:

```javascript
// OLD BUGGY CODE
const codeBlockMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
if (codeBlockMatch) {
  const lang = codeBlockMatch[1] || '';
  const code = codeBlockMatch[2] || '';
  // ONLY renders the code, ignoring text before/after!
  div.innerHTML = `<pre><code class="lang-${lang}">${code}</code></pre>`;
}
```

**Issue:** When a code block was detected, it extracted ONLY the code and ignored:
- Explanation text BEFORE the code block
- Explanation text AFTER the code block
- Multiple code blocks in the same response

## Solution

Created a new `formatContentWithCode()` helper function that:
1. Detects ALL code blocks using regex with global flag
2. Preserves text BEFORE each code block
3. Preserves text AFTER each code block
4. Handles multiple code blocks correctly
5. Formats everything properly with HTML

### New Code

```javascript
function formatContentWithCode(content, role) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  if (content.match(codeBlockRegex)) {
    let result = `<div class="${role}"><strong>${role}:</strong> `;
    let lastIndex = 0;
    let match;
    
    codeBlockRegex.lastIndex = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text BEFORE code block
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
    
    // Add text AFTER last code block
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      const htmlAfter = escapeHtml(textAfter).replace(/\n/g, '<br>');
      result += htmlAfter;
    }
    
    result += '</div>';
    return result;
  } else {
    // No code blocks
    const html = escapeHtml(content).replace(/\n/g, '<br>');
    return `<div class="${role}"><strong>${role}:</strong> ${html}</div>`;
  }
}
```

## Files Modified

### `public/app.js`

1. **Added `formatContentWithCode()` helper function**
   - Properly parses content with multiple code blocks
   - Preserves all text before, between, and after code blocks
   - Returns properly formatted HTML

2. **Updated `render()` function**
   - Replaced inline code block handling with `formatContentWithCode()`
   - Now correctly displays full content

3. **Updated `updateLastMessage()` function**
   - Replaced inline code block handling with `formatContentWithCode()`
   - Ensures streaming updates also show complete content

## Testing

### Before Fix:
```
User: "Explain bubble sort with code"

Response After Completion:
[Shows only code block]
```

### After Fix:
```
User: "Explain bubble sort with code"

Response After Completion:
**[Bubble Sort - Implementation]**

Bubble Sort is a simple sorting algorithm that repeatedly steps through...

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
```

**How it works:**
The algorithm compares adjacent elements and swaps them if they are in wrong order...
```

## Benefits

✅ **Complete Content Display:** All explanation text now visible with code blocks  
✅ **Multiple Code Blocks:** Handles responses with multiple code examples  
✅ **Consistent Rendering:** Same behavior during streaming and after completion  
✅ **Better UX:** Users see the full explanation they requested  
✅ **No Breaking Changes:** Works with all existing features  

## Date
October 19, 2025
