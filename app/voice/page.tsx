'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Cantonese speech recognition setup
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null

export default function VoicePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Find best Cantonese voice
  const getCantoneseVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null
    const voices = synthRef.current.getVoices()
    
    // Priority: Cantonese/Hong Kong voices
    const priority = [
      'zh-HK', 'yue', 'zh-yue', 'Chinese (Hong Kong)',
      'Sin-Ji', 'Sinji', 'cantonese', '粵語'
    ]
    
    for (const lang of priority) {
      const voice = voices.find(v => 
        v.lang.toLowerCase().includes(lang.toLowerCase()) ||
        v.name.toLowerCase().includes(lang.toLowerCase())
      )
      if (voice) return voice
    }
    
    // Fallback to any Chinese voice
    return voices.find(v => v.lang.startsWith('zh')) || voices[0] || null
  }, [])

  // Speak text in Cantonese
  const speakText = useCallback((text: string) => {
    if (!synthRef.current || isMuted) return
    
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getCantoneseVoice()
    
    if (voice) {
      utterance.voice = voice
    }
    utterance.lang = 'zh-HK'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthRef.current.speak(utterance)
  }, [isMuted, getCantoneseVoice])

  // Send message to AI
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    
    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTranscript('')
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`)
      }

      const assistantMsg: Message = { role: 'assistant', content: data.reply, timestamp: Date.now() }
      setMessages(prev => [...prev, assistantMsg])
      
      // Auto-speak the response
      if (!isMuted) {
        speakText(data.reply)
      }
    } catch (err: any) {
      const errorMsg: Message = { 
        role: 'assistant', 
        content: `❌ 出錯：${err.message || '連接失敗'}`,
        timestamp: Date.now() 
      }
      setMessages(prev => [...prev, errorMsg])
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, isMuted, speakText])

  // Start listening
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('❌ 你嘅 browser 唔支援語音輸入。請用 Chrome 或 Safari。')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'zh-HK'  // Cantonese (Hong Kong)
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        let final = ''
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }
        
        if (final) {
          setTranscript(final)
          sendMessage(final)
        } else if (interim) {
          setTranscript(interim)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          // Just stop, no need to show error
        } else if (event.error === 'not-allowed') {
          setError('❌ 請允許使用咪高峰')
        } else {
          setError(`❌ 語音錯誤：${event.error}`)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
      setError(null)
    } catch (err: any) {
      setError(`❌ 無法開始語音：${err.message}`)
      setIsListening(false)
    }
  }, [sendMessage])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Connect / disconnect
  const toggleConnection = () => {
    if (isConnected) {
      // Disconnect
      setIsConnected(false)
      stopListening()
      synthRef.current?.cancel()
      setIsSpeaking(false)
    } else {
      // Connect
      setIsConnected(true)
      setMessages([{
        role: 'assistant',
        content: '🦞 師傅早晨！我係龍蝦仔。有咩可以幫到你？',
        timestamp: Date.now()
      }])
      // Auto-greet with voice
      setTimeout(() => {
        speakText('師傅早晨！我係龍蝦仔。有咩可以幫到你？')
      }, 500)
    }
  }

  // Handle text input
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = textInputRef.current
    if (input?.value.trim()) {
      sendMessage(input.value)
      input.value = ''
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <div>
            <h1 className="text-lg font-semibold">🦞 龍蝦仔</h1>
            <p className="text-xs text-slate-400">
              {isConnected 
                ? (isListening ? '🎤 聽緊...' : isSpeaking ? '🗣️ 講緊...' : isLoading ? '💭 諗緊...' : '👂 等緊你...')
                : '未連接'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-slate-700/50 transition"
            title={isMuted ? '開聲' : '靜音'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={toggleConnection}
            className={`p-2 rounded-full transition ${
              isConnected 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
            title={isConnected ? '收線' : '打電話'}
          >
            {isConnected ? <PhoneOff size={18} /> : <Phone size={18} />}
          </button>
        </div>
      </div>

      {/* Not Connected State */}
      {!isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-5xl shadow-lg shadow-orange-500/20 animate-bounce">
            🦞
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">龍蝦仔 Voice Chat</h2>
            <p className="text-slate-400 text-sm">
              即時廣東話語音對話 AI<br/>
              有晒記憶，認得師傅你！
            </p>
          </div>
          <button
            onClick={toggleConnection}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded-full font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-green-500/20"
          >
            <Phone size={22} />
            打電話俾龍蝦仔
          </button>
          <p className="text-xs text-slate-500 mt-2">
            請用 Chrome 或 Safari · 需要咪高峰權限
          </p>
        </div>
      )}

      {/* Connected State */}
      {isConnected && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-slate-700/80 text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-red-500/20 text-red-300 text-xs text-center">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">✕</button>
            </div>
          )}

          {/* Transcript preview */}
          {transcript && isListening && (
            <div className="px-4 py-2 bg-blue-500/10 text-blue-300 text-sm text-center italic">
              "{transcript}"
            </div>
          )}

          {/* Bottom Controls */}
          <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur">
            <div className="flex items-center gap-3">
              {/* Mic Button */}
              <button
                onClick={toggleListening}
                disabled={isLoading || isSpeaking}
                className={`p-3 rounded-full transition ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                } disabled:opacity-50`}
                title={isListening ? '停止收聽' : '開始講野'}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* Text Input (fallback) */}
              <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                <input
                  ref={textInputRef}
                  type="text"
                  placeholder="或者打字都得..."
                  className="flex-1 bg-slate-700/50 rounded-full px-4 py-2 text-sm text-white placeholder-slate-400 border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>

            {/* Tips */}
            <p className="text-xs text-slate-500 text-center mt-2">
              🎤 撳咪高峰開始講廣東話 · ⌨️ 或者打字都得
            </p>
          </div>
        </>
      )}
    </div>
  )
}
