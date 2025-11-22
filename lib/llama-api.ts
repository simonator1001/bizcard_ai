interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
}

export class LlamaAPI {
  private apiKey: string;
  private baseUrl = 'https://api.llama-api.com'; // Replace with actual Llama API endpoint

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(options: ChatOptions) {
    const response = await fetch(`${this.baseUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.statusText}`);
    }

    return response.json();
  }
} 