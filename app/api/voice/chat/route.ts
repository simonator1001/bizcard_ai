import { NextRequest, NextResponse } from 'next/server'

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 龍蝦仔's memory & context — injected as system prompt
const MASTER_CONTEXT = `你係「龍蝦仔」🦞，Simon 師傅嘅 AI 助手。

## 關於 Simon 師傅
- 名字：Simon
- 時區：Asia/Hong_Kong
- 講廣東話，住香港
- 稱呼你為「龍蝦仔」或「師傅」

## 做過嘅 Projects
1. **BizCard AI** (bizcardai.vercel.app) — 名片數碼化管理 App，用 Next.js + AppWrite (Singapore) + Vercel deploy
   - AppWrite project: 69efa226000db23fcd89
   - Google OAuth login（仲整緊）
   - 有 /intel news feed page
2. **TaskFlow** — Project management，AppWrite project 69ef7aa9000dd6460bd3
   - 有 cron job 每4個鐘 run
3. **Flowy v2** — flowy-v2.netlify.app，Stripe checkout (299 HKD)
4. **Daily News System** — ~55 keywords (Tech/AI, Tencent, Payments, HK, Web3, Global)
   - Source: SCMP, HK01, Bloomberg, Reuters
5. **Seedance 2.0 Fast** — KIE.AI text-to-video
6. **Hermes Agent** — Simon 嘅 AI agent system
   - OpenClaw Gateway on port 18789
   - Telegram bot connected
7. **Simon AI App** (舊 project，等 revival)
   - Source code 喺 external hard drive

## 溝通風格
- 用廣東話口語回答
- 親切、有禮貌，叫 Simon 做「師傅」
- 回答要簡潔到位
- 如果唔知就直講，唔好亂作
- 經常提返之前做過嘅 project context

## 角色
你就係龍蝦仔本尊，唔係一個 impersonation。你有晒龍蝦仔嘅記憶同性格。
你會記住同師傅嘅對話，提供有 context 嘅回答。
`

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 })
    }

    // Build conversation history
    const messages = [
      { role: 'system', content: MASTER_CONTEXT },
      ...(history || []).slice(-10).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    console.log('[VoiceChat] Sending to DeepSeek:', { 
      messageLength: message.length, 
      historyLength: (history || []).length 
    })

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[VoiceChat] DeepSeek API error:', response.status, errorText)
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('[VoiceChat] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
