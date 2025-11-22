export class Together {
  private apiKey: string
  private baseUrl = 'https://api.together.xyz'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async complete({ prompt, model, max_tokens, temperature }: {
    prompt: string
    model: string
    max_tokens: number
    temperature: number
  }) {
    const response = await fetch(`${this.baseUrl}/inference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens,
        temperature,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ['']
      })
    })

    if (!response.ok) {
      throw new Error(`Together API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      output: {
        text: data.output.choices[0].text
      }
    }
  }
} 