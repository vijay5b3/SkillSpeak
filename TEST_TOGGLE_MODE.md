# 🧪 Toggle Mode Feature - Quick Test Guide

## ✅ Server Status
**Server running at:** http://localhost:3000

---

## 🧪 Web Application Testing

### Test 1: Visual Appearance
1. Open http://localhost:3000
2. ✅ Look for **"📚 Detailed Mode"** button (green, first in controls)
3. ✅ Button should be visible and styled correctly

### Test 2: Toggle Functionality
1. Click the **"📚 Detailed Mode"** button
2. ✅ Button should change to **"💡 Simple Mode"** (orange)
3. ✅ Notification should appear: "💡 Simple Mode: Short definitions & numbered steps"
4. ✅ Notification should auto-dismiss after 2 seconds
5. Click button again
6. ✅ Should switch back to **"📚 Detailed Mode"** (green)
7. ✅ Notification: "📚 Detailed Mode: Comprehensive explanations"

### Test 3: Response Quality - Detailed Mode
1. Make sure button shows **"📚 Detailed Mode"**
2. Ask: "What is binary search?"
3. ✅ Response should be 150-250 words
4. ✅ Should have sections: Topic Name, Why it's useful, How it works, Key things
5. ✅ Should include examples and analogies
6. ✅ Should be comprehensive

### Test 4: Response Quality - Simple Mode
1. Click button to switch to **"💡 Simple Mode"**
2. Ask: "What is binary search?"
3. ✅ Response should be 50-100 words
4. ✅ Should have: Definition, Simple Explanation, Key Steps, Example
5. ✅ Key Steps should be NUMBERED (1, 2, 3)
6. ✅ Should use simple, beginner-friendly language
7. ✅ Should be concise and clear

### Test 5: Mode Persistence
1. Stay in Simple Mode
2. Ask another question: "What is recursion?"
3. ✅ Response should still be in simple mode (short, numbered)
4. Ask another: "What is a hash table?"
5. ✅ Response should still be simple mode
6. Switch to Detailed Mode
7. Ask: "What is a linked list?"
8. ✅ Response should be detailed (150-250 words)

### Test 6: Mobile Responsiveness
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone, Android)
4. ✅ Toggle button should be visible and usable
5. ✅ Button should adapt to screen size
6. ✅ Click functionality should work on mobile

---

## 🖥️ Windows Application Testing

### Test 1: Visual Appearance
1. Run `SRMV.exe` (or build and run from Visual Studio)
2. ✅ Look for **"📚 Detailed"** button in top-left corner
3. ✅ Button should be green with white text
4. ✅ Status bar should show: "F2: Transparency | F3: Mode"

### Test 2: Button Click Toggle
1. Click the **"📚 Detailed"** button
2. ✅ Button should change to **"💡 Simple"** (orange)
3. ✅ Chat should show notification:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 Switched to SIMPLE MODE
   Responses will be short, clear definitions with numbered steps.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```
4. Click button again
5. ✅ Should switch back to **"📚 Detailed"** (green)
6. ✅ Notification should confirm: "📚 Switched to DETAILED MODE"

### Test 3: F3 Keyboard Shortcut
1. Make sure app is in **Detailed Mode**
2. Press **F3** key
3. ✅ Should switch to Simple Mode
4. ✅ Button and notification should update
5. Press **F3** again
6. ✅ Should switch back to Detailed Mode

### Test 4: Response Quality
1. Switch to **Detailed Mode**
2. Type: "What is binary search?" and press Enter
3. ✅ Should get comprehensive response (150-250 words)
4. Switch to **Simple Mode** (F3 or button)
5. Type: "What is recursion?" and press Enter
6. ✅ Should get short response with numbered steps

### Test 5: Integration with Other Features
1. Test F2 transparency toggle
2. ✅ Should work independently of mode toggle
3. Test sending messages
4. ✅ Should work in both modes
5. Test window dragging and resizing
6. ✅ Mode button should stay in position

---

## 📊 Expected Results

### Detailed Mode Response Example:
```
**Binary Search**

Binary search is an efficient algorithm for finding a specific item in a sorted list. 
Think of it like finding a name in a phone book - instead of checking every page, you 
open the book in the middle and decide whether to look in the first half or second 
half, cutting your search area in half each time.

**Why it's useful:**
It's incredibly fast for large datasets, reducing search time from potentially millions 
of checks to just a few dozen.

**How it works:**
- Start with the middle element of your sorted list
- If it's the target, you're done!
- If target is smaller, search the left half
- If target is larger, search the right half
- Repeat until found or list exhausted

**Key things to remember:**
- Only works on SORTED data
- Much faster than linear search (O(log n) vs O(n))
- Common in databases, file systems, and search algorithms
```

### Simple Mode Response Example:
```
**Definition:** 
Binary search finds items in a sorted list by repeatedly dividing the search area in half.

**Simple Explanation:**
It's like finding a word in a dictionary. You open to the middle, see if your word comes 
before or after, then repeat with only that half.

**Key Steps:**
1. Start at the middle of the sorted list
2. Compare with your target value
3. Go left if target is smaller, right if larger
4. Repeat until you find it

**Example:**
Finding 7 in [1,3,5,7,9,11,13]: Check 7 (middle) → Found it in 1 step!
```

---

## ✅ Checklist

### Web App:
- [ ] Button appears in correct position
- [ ] Button has correct styling (green/orange)
- [ ] Click toggles between modes
- [ ] Notification appears and dismisses
- [ ] Detailed mode gives comprehensive responses
- [ ] Simple mode gives short, numbered responses
- [ ] Mode persists across multiple questions
- [ ] Works on mobile devices

### Windows App:
- [ ] Button appears in top-left
- [ ] Button has correct colors
- [ ] Click toggles mode
- [ ] F3 key toggles mode
- [ ] Chat shows mode change notifications
- [ ] Detailed mode works correctly
- [ ] Simple mode works correctly
- [ ] Works with F2 transparency
- [ ] Status bar updated with F3 shortcut

---

## 🐛 Known Issues / Notes

- Mode resets when app is restarted (by design)
- Simple mode aims for 50-100 words but may vary slightly
- Detailed mode aims for 150-250 words but AI may vary
- Both modes should respect the core difference: detailed vs. simple

---

## 📝 Test Questions

Use these to test both modes:

1. **"What is binary search?"**
2. **"What is recursion?"**
3. **"Explain hash tables"**
4. **"What is a linked list?"**
5. **"How does bubble sort work?"**
6. **"What is Big O notation?"**
7. **"Explain REST API"**
8. **"What is machine learning?"**

---

## ✅ Ready to Test!

Server is running at: **http://localhost:3000**

Start testing and verify all features work as expected!
