---
name: voice-chat-nextjs
description: Add real-time voice chat to a Next.js app — Web Speech API for STT/TTS, backend LLM proxy with memory injection, Vercel deploy.
version: 1.4.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [nextjs, voice, speech-recognition, tts, llm, web-speech-api, vercel]
    triggers:
      - "voice chat"
      - "speech to text"
      - "text to speech"
      - "real-time voice"
      - "Cantonese voice"
      - "廣東話語音"
      - "add voice to app"
      - "talk to AI"
      - "walkie-talkie"
      - "對講機"
      - "handsfree"
      - "call AI"
      - "iOS speech recognition not working"
      - "zh-HK unsupported"
      - "Safari audio input"
---

# Voice Chat in Next.js

Add real-time voice conversation to any Next.js App Router app. Uses browser-native Web Speech API (no extra dependencies) for STT/TTS, with a backend API route proxying to an LLM with injected memory context.

## Architecture

```
Browser mic → Web Speech API (STT) → /api/voice/chat → LLM API → response → Web Speech API (TTS) → speaker
                                                                     ↓
                                                               text displayed
```

## Step 1: Backend API Route

Create `app/api/voice/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const LLM_API_KEY = process.env.LLM_API_KEY || ''
const LLM_API_URL = 'https://api.deepseek.com/v1/chat/completions' // or any OpenAI-compatible endpoint

// Inject memory/context as system prompt
const SYSTEM_PROMPT = `You are [AGENT NAME]. [Memory context here — projects, user preferences, etc.]

Communication style: [language, tone, formality level]`

export async function POST(request: NextRequest) {
  const { message, history } = await request.json()

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ]

  const response = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 500 })
  })

  const data = await response.json()
  return NextResponse.json({ reply: data.choices?.[0]?.message?.content || 'No response' })
}
```

**Set Vercel env var**: `npx vercel env add LLM_API_KEY production`

## Step 2: Voice Chat Page

Create `app/voice/page.tsx` — a `'use client'` component:

### 🔴 CRITICAL: Start Recognition FIRST, Then getUserMedia For Stream

**`SpeechRecognition.start()` MUST be called within the direct user gesture (click/tap) call stack on iOS Safari.** Any `await`, `setTimeout`, or `Promise.then` between the click and `start()` silently breaks the gesture chain — recognition never activates, no error is thrown.

**🔥 Correct order**: `startListening()` FIRST (preserves gesture), then `getUserMedia()` for stream keep-alive:

```typescript
const streamRef = useRef<MediaStream | null>(null)

const connect = async () => {
  // 1. Set up state + start recognition IMMEDIATELY — must be in gesture context!
  setConnected(true)
  autoListenRef.current = true
  startListening()  // ✅ Called directly in the click handler call stack

  // 2. Now handle mic stream for keep-alive (doesn't need gesture context)
  // On iOS Safari, keeping a muted MediaStream alive prevents mic permission
  // from being revoked between recognition sessions.
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    stream.getTracks().forEach(t => { t.enabled = false })  // Mute but don't stop
  } catch (e: any) {
    // recognition may still work without the stream — don't disconnect
    console.warn('getUserMedia error:', e.message)
  }

  // Speak greeting after recognition started (TTS runs async, doesn't block)
  setTimeout(() => speakText('你好！'), 800)
}

const disconnect = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }
}
```

**Why this order**: iOS Safari's security model requires `SpeechRecognition.start()` to be called synchronously within the original user gesture. `await getUserMedia()` is a microtask break — by the time it resolves, the gesture context is gone. Calling `startListening()` FIRST preserves the gesture, then `getUserMedia()` runs in parallel for stream keep-alive. The recognition API uses its own audio path and doesn't need the MediaStream to function.

**What happens if order is wrong**: `getUserMedia` succeeds → `startListening()` is called → `SpeechRecognition.start()` appears to work → but `onstart` never fires, `onaudiostart` never fires, and the UI sits at "listening" forever. No error is thrown. This is the #1 cause of "it worked on desktop but not on my iPhone."

### Speech Recognition (STT)

```typescript
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null

const recognition = new SpeechRecognition()
recognition.lang = 'zh-HK'  // Cantonese; use 'en-US', 'ja-JP', etc.
recognition.continuous = false
recognition.interimResults = true

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  // Send to API
}

recognition.start()
```

### Speech Synthesis (TTS)

```typescript
const utterance = new SpeechSynthesisUtterance(text)
utterance.lang = 'zh-HK'  // Match STT language

// Find best voice for the language
const voices = speechSynthesis.getVoices()
const voice = voices.find(v => v.lang.startsWith('zh')) || voices[0]
if (voice) utterance.voice = voice

speechSynthesis.speak(utterance)
```

**🔴 CRITICAL — TTS Debug Logging**: Unlike STT (which has `onstart`, `onresult`, `onerror`), TTS can fail **silently** — `speak()` returns void, errors may not fire, and the user just hears nothing. Every TTS function MUST include debug logging at every step:

```typescript
const speakText = useCallback((text: string) => {
  addDebug(`🗣️ speakText() called — muted=${isMuted}, synth=${!!synthRef.current}`)
  if (!synthRef.current) {
    addDebug('❌ TTS: No speechSynthesis (synthRef null)')
    return
  }
  // Check if voices are loaded — getVoices() can return [] on first call
  const voices = synthRef.current.getVoices()
  addDebug(`🗣️ TTS: ${voices.length} voices available`)
  
  const u = new SpeechSynthesisUtterance(text)
  const voice = getCantoneseVoice()
  if (voice) {
    u.voice = voice
    addDebug(`🗣️ TTS: Using voice "${voice.name}" (${voice.lang})`)
  } else {
    addDebug(`⚠️ TTS: No matching voice found — falling back to default`)
  }
  u.onstart = () => { setIsSpeaking(true); addDebug('🗣️ TTS: Speaking started ✅') }
  u.onend = () => { setIsSpeaking(false); addDebug('🗣️ TTS: Speaking ended ✅') }
  u.onerror = (e) => {
    setIsSpeaking(false)
    addDebug(`❌ TTS error: ${e.error} — "${e.error === 'interrupted' ? 'interrupted by new speech' : e.error}"`)
  }
  synthRef.current.speak(u)
}, [isMuted, getCantoneseVoice, connected, addDebug])
```

**Common TTS silent-fail causes and their debug signatures:**
| Symptom | Debug panel shows | Fix |
|---|---|---|
| No voice at all | `🗣️ speakText() called — synth=true` but no `Speaking started` | Check `voices available` count — if 0, voices not loaded yet |
| Wrong/no voice loaded | `0 voices available` or `No matching voice found` | Add `voiceschanged` listener (see below) |
| iOS Safari blocks TTS | `Speaking started` never fires | iOS may require user gesture for TTS — ensure `speakText()` is called inside the click handler call stack |
| Browser muted/autoplay blocked | `Speaking started` fires but no audio | Check browser tab audio indicator, `u.volume` |
| Env var missing (no AI reply to speak) | `API key not configured` | See Vercel env var pitfall below |

**`voiceschanged` Event Listener**: On many browsers (especially mobile Safari), voices load asynchronously. `getVoices()` returns `[]` on first call. Listen for the event:

```typescript
useEffect(() => { 
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  synthRef.current = synth
  const loadVoices = () => {
    const voices = synth.getVoices()
    console.log(`[TTS] voiceschanged: ${voices.length} voices loaded`)
  }
  synth.getVoices() // preload trigger
  synth.addEventListener('voiceschanged', loadVoices)
  return () => synth.removeEventListener('voiceschanged', loadVoices)
}, [])
```

### Key UI States

- **Disconnected**: Prominent call button, agent avatar, description
- **Connected**: Message bubble list + mic button + text fallback input
- **Listening**: Pulsing mic icon, interim transcript preview
- **Speaking**: Visual indicator that agent is talking
- **Loading**: "Thinking..." indicator while waiting for API

### Language Codes

| Language | `lang` code | iOS Support |
|---|---|---|
| Cantonese (HK) | `zh-HK` | ❌ NOT supported by Apple speech servers — causes silent failure |
| Mandarin | `zh-CN` | ✅ Supported |
| English | `en-US` | ✅ Supported |
| Japanese | `ja-JP` | ✅ Supported |
| Korean | `ko-KR` | ✅ Supported |

**🔴 CRITICAL — iOS `zh-HK` unsupported**: Apple's speech recognition servers do NOT support `zh-HK` (Cantonese). Using `zh-HK` on iOS Safari causes `SpeechRecognition.start()` to fail **silently** — no `onstart` fires, no `onerror` fires, no exception thrown. The debug panel will show `getUserMedia` succeeded but `onstart` is never logged. The only fix is to detect iOS and use `zh-CN` (Mandarin) instead:

```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
r.lang = isIOS ? 'zh-CN' : 'zh-HK'
```

**Timeout detection pattern**: Since iOS doesn't fire `onerror` for unsupported languages, add a 4-second timeout after `r.start()`. If `onstart` hasn't fired by then, the language is likely unsupported:

```typescript
let startTimeout: ReturnType<typeof setTimeout> | null = null
if (isIOS) {
  startTimeout = setTimeout(() => {
    // onstart never fired — try zh-CN as fallback
    try { r.stop() } catch {}
    r.lang = 'zh-CN'
    r.start()
    startTimeout = setTimeout(() => {
      addDebug('⏰ Timeout after zh-CN too — speech not supported on this device')
      setError('Speech input not supported on this device. Try using text input instead.')
    }, 4000)
  }, 4000)
}

r.onstart = () => {
  if (startTimeout) clearTimeout(startTimeout)
  addDebug('🎙️ onstart ✅')
  // ...
}
```

**iOS Safari `onaudiostart` / `onsoundstart`**: These events never fire on iOS Safari (even when speech is working). Don't rely on them for pipeline diagnostics on iOS — only `onstart`, `onresult`, `onend`, and `onerror` (for real errors only) are reliable.

## Step 3: Middleware

Add `/voice` to public routes in `middleware.ts`:

```typescript
const PUBLIC_ROUTES = [
  // ... existing routes
  '/voice',
]
```

## Step 4: Deploy

```bash
git add -A && git commit -m "feat: voice chat at /voice"
git push origin main
npx vercel --prod --yes
```

## Standalone Project (New Vercel App)

To create this as a standalone Vercel project (not adding to an existing app):

```bash
mkdir my-voice-app && cd my-voice-app
mkdir -p app/api/voice/chat public
```

Create `package.json` with just `next`, `react`, `react-dom`, and dev deps. Avoid optional heavy deps (Tailwind, lucide-react) — see Zero-Dependency UI below.

```bash
# Create .gitignore BEFORE git init to avoid committing node_modules
echo "node_modules/\n.next/" > .gitignore
git init && git add -A && git commit -m "init"

# Deploy — Vercel auto-links and creates the project
npx vercel --prod --yes

# Add LLM API key env var after first deploy
npx vercel env add LLM_API_KEY production
npx vercel --prod --yes  # redeploy to pick up env var
```

Vercel auto-generates a friendly alias (e.g., `myapp-xxxx.vercel.app`). Set a custom domain later if needed.

## Zero-Dependency UI

To avoid build issues from Tailwind/PostCSS version conflicts or heavy icon libraries, use inline styles and inline SVGs:

- **Styles**: Use `const styles = { ... }` objects with typed CSS properties — no PostCSS config needed
- **Icons**: Inline SVG components instead of `lucide-react` (Mic, Phone, Send, Volume icons are ~6 lines each)
- **Global CSS**: `app/globals.css` for reset, scrollbar, and body defaults only

This keeps `npm install` fast and avoids Vercel build failures from dependency version mismatches.

## Handsfree Walkie-Talkie Mode (Advanced)

For a true handsfree experience — no button presses, continuous conversation like a phone call:

### Auto-Listening Loop

When the call connects, start `SpeechRecognition` immediately. After each interaction, auto-restart:

```typescript
// Auto-start listening when connected
// ⚠️ iOS: setTimeout before startListening() breaks gesture chain — start directly!
const connect = () => {
  setConnected(true)
  // ... greeting ...
  // Fire greeting TTS (non-blocking), then start listening immediately
  speakText('你好！')  // TTS runs async, doesn't block
  startListening()      // ✅ Direct call inside click handler — iOS-safe
}

// Auto-resume after AI finishes speaking
// This setTimeout IS safe because it fires from onend which is a browser event callback
utterance.onend = () => {
  setIsSpeaking(false)
  setTimeout(() => {
    if (autoListenRef.current && connected) startListening()
  }, 600) // brief pause before resuming
}
```

**🔥 CRITICAL — iOS Safari User Gesture Chain**: `SpeechRecognition.start()` on iOS Safari MUST be called synchronously within the original user gesture (click/tap) call stack. Any `setTimeout`, `Promise.then`, or `await` between the click and `start()` will silently break the gesture chain — recognition never activates, no error is thrown. Always call `startListening()` directly at the end of the connect handler, not inside a timer callback. The same applies to `onend`/`onerror` restart handlers that use `setTimeout` — these are already broken on iOS because the gesture is long gone. Use `continuous: false` + restart from `onend` on iOS (see below).

### Silence Detection (Auto-Send)

Instead of a manual send button, detect when the user stops speaking:

```typescript
r.continuous = true // keep mic open
r.interimResults = true

let finalTranscript = ''
let silenceTimer: any = null

r.onresult = (e) => {
  // Accumulate final + interim
  if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript
  
  if (finalTranscript) {
    clearTimeout(silenceTimer)
    // After 1.5s of silence, auto-send
    silenceTimer = setTimeout(() => {
      sendMessage(finalTranscript.trim())
      finalTranscript = ''
    }, 1500)
  }
r.onend = () => {
  setIsListening(false)
  // 🔴 iOS CRITICAL: Call r.start() on the SAME instance, NOT startListening()!
  // startListening() creates a NEW SpeechRecognition — iOS Safari blocks
  // new instances outside the original user gesture. But calling .start()
  // on the SAME instance within its own onend event chain IS allowed.
  try {
    if (autoListenRef.current && connected && !isSpeaking && !isLoading) {
      r.start()  // ✅ Same instance — iOS-safe
    }
  } catch {
    // Rare: if same-instance restart fails, fall back to new instance
    setTimeout(() => {
      if (autoListenRef.current && connected && !isSpeaking && !isLoading) startListening()
    }, 300)
  }
}

r.onerror = (e) => {
  if (e.error === 'no-speech') {
    // iOS: fire no-speech frequently — restart SAME instance directly
    setIsListening(false)
    try {
      if (autoListenRef.current && connected && !isSpeaking && !isLoading) {
        r.start()  // ✅ Same instance restart
      }
    } catch {
      setTimeout(() => {
        if (autoListenRef.current && connected && !isSpeaking && !isLoading) startListening()
      }, 500)
    }
    return
  }
  // Real errors (not-allowed, network, etc.) — retry with longer delay
  setIsListening(false)
  setTimeout(() => {
    if (autoListenRef.current && connected) startListening()
  }, 2000)
}

r.onend = () => {
  setIsListening(false)
  // Restart immediately — no setTimeout! iOS Safari onend callbacks
  // happen in a context that allows restart without new user gesture
  if (autoListenRef.current && connected && !isSpeaking && !isLoading) 
    startListening()
}
```

### Key State Machine

| State | Action |
|---|---|
| Connected, idle | Auto-start listening |
| Listening, speech detected | Show interim transcript |
| Listening, 1.5s silence | Auto-send to API |
| Waiting for AI | Stop listening, show "thinking..." |
| AI response ready | Speak TTS, then auto-resume listening |
| Disconnected | Stop everything, clear timers |

### Visual Idle Indicator

Show a subtle waveform when listening but no speech yet:

```css
@keyframes wave { 0%,100%{height:8px} 50%{height:24px} }
/* 5 bars with staggered animation-delay: 0s, 0.12s, 0.24s, 0.36s, 0.48s */
```

### `useRef` for Auto-Listen Flag

Use a ref (not state) for the auto-listen flag so callbacks always read the latest value:

```typescript
const autoListenRef = useRef(true)
// Set to false only on disconnect
const disconnect = () => { autoListenRef.current = false; /* ... */ }
```

## Pitfalls

- **Browser support**: Web Speech API works in Chrome and Safari. Firefox has limited STT support.
- **HTTPS required**: `getUserMedia` (mic) requires HTTPS except localhost.
- **Voice availability**: TTS voice quality varies by OS/browser. Test on target devices.
- **Mobile**: iOS Safari requires user gesture before `SpeechRecognition.start()`. The initial "Connect" button tap satisfies this **only if `start()` is called synchronously** — no `setTimeout` in between. Background audio stops when screen locks — user must keep screen on.
- **API key exposure**: Always proxy LLM calls through backend — never embed API keys in client code.
- **Vercel env vars**: Must be set via `vercel env add` or dashboard before first deploy; redeploy after adding to pick up the change. **Prebuilt caveat**: Deploying with `--prebuilt` reuses compiled artifacts from a prior local build — if that build didn't have the env var, the deployed function won't either. After adding/changing env vars, deploy WITHOUT `--prebuilt` so Vercel rebuilds from source with the new env var.
- **Interim results**: Web Speech API returns interim (partial) and final results. Only send final results to the API to avoid duplicate requests.
- **`.gitignore` first**: Create `.gitignore` before `git init` to avoid accidentally committing `node_modules/` and `.next/`. If already committed, `rm -rf .git && git init` and re-add only source files.
- **Cantonese voice names**: Browser TTS voices for Cantonese may be named `Sin-Ji` (Apple) or under `zh-HK`. Fallback to `zh-CN` or the first available voice if no Cantonese voice is found.
- **`useMemo`/`useCallback` with empty deps on voice lookups**: Voices load asynchronously (`onvoiceschanged` event fires after initial load). Wrapping `getCantoneseVoice()` in `useMemo(() => getVOice(), [])` or `useCallback` with `[]` deps locks in the voice list from before `onvoiceschanged` fires — usually empty or without Cantonese voices. **Fix**: either recompute voices in `useCallback` with a `[voicesLoaded]` state dependency, or call `speechSynthesis.getVoices()` fresh inside `speakText()` each time (the runtime cost is negligible).
- **`continuous: true` caveat**: On iOS Safari, `continuous: true` is **completely ignored** — Safari always behaves as if `continuous: false`. Recognition ends after a single utterance or silence. The auto-restart-on-end pattern (`continuous: false` + restart loop) is more reliable on mobile. On Chrome desktop, `continuous: true` works normally.
- **History window**: Send last 20 messages (not 6) for handsfree conversation context. The system prompt already provides static memory; conversation history provides short-term continuity.
- **Next.js tree-shaking with empty env vars**: If `LLM_API_KEY` is empty at build time, Next.js statically evaluates `process.env.LLM_API_KEY || ''` → `''` → **tree-shakes the entire API call code path**. The compiled `.next/server/app/api/voice/chat/route.js` will contain only the `if (!key) return error` guard and nothing else. Even after setting the env var on Vercel and redeploying, the route still returns "API key not configured" because the compiled JS has no LLM call code. **Fix**: Set the env var via Vercel API/Dashboard BEFORE the first build, or delete the env var and recreate it, then redeploy. See `vercel-deployment-debugging` skill for env var management.

- **Debugging silent failures**: Add event handlers for diagnosis:
  ```typescript
  r.onstart = () => { console.log('[Speech] ✅ Recognition started'); setIsListening(true); setError(null) }
  r.onaudiostart = () => { console.log('[Speech] 🎤 Audio detected') }
  r.onsoundstart = () => { console.log('[Speech] 🔊 Sound detected') }
  ```
  **Let `onstart` manage `isListening` and `setError`** — don't set them in the try/catch block after `r.start()`. If `r.start()` succeeds but `onstart` never fires, the UI shows a false "listening" indicator. Diagnostic map:
  - `onstart` never fires → `getUserMedia` never called (most common!), iOS gesture chain broken, or mic permission denied
  - `onstart` fires but `onaudiostart` never → mic permission issue, wrong mic selected, or user silent
  - `onend` fires immediately after `onstart` → iOS Safari ignoring `continuous: true` (expected, handle via restart loop)
  - `no-speech` error → user hasn't spoken — restart immediately, NOT via setTimeout
  - `aborted` or `not-allowed` error + `onstart` never fires → `getUserMedia({ audio: true })` was NOT called before `start()`. This is the #1 cause of silent failures.

- **Visual debug panel for live pipeline tracing**: Add a `debugLog` state array that records every pipeline event with timestamps. Each step logs via an `addDebug()` helper. Render a scrollable monospace panel at the bottom of the connected view so the user can see exactly which step failed. Sample pipeline trace:
  ```
  02:03:01 📞 connect() start
  02:03:01 🎤 Requesting getUserMedia...
  02:03:02 ✅ getUserMedia granted, stream alive
  02:03:02 🎙️ SpeechRecognition.onstart
  02:03:05 🔊 Audio detected
  02:03:08 📝 Final transcript: "你好龍蝦仔..."
  02:03:10 📤 Sending: "你好龍蝦仔..."
  02:03:10 🤖 Calling AI...
  02:03:13 ✅ AI reply: "師傅你好！🦞"
  02:03:13 🗣️ Speaking AI reply...
  ```
  Implementation:
  ```typescript
  const [debugLog, setDebugLog] = useState<string[]>([])
  
  const addDebug = (msg: string) => {
    const ts = new Date().toLocaleTimeString('zh-HK', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
    console.log(`[Pipeline] ${msg}`)
    setDebugLog(prev => [...prev.slice(-19), `${ts} ${msg}`])
  }
  // Call addDebug() at every pipeline step: connect, getUserMedia, onstart, onresult, sendMessage, API response, speakText
  // Render: {debugLog.length > 0 && <div style={{...}}>{debugLog.map(...)}</div>}
  ```
  This eliminates guesswork — when the user says "it doesn't work", the debug panel shows exactly which step broke.
