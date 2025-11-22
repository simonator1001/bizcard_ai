const axios = require('axios');

class GoogleSearchMCP {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.searchEngineId = process.env.CX || process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  async search({ query, num = 10 }) {
    try {
      if (!this.apiKey || !this.searchEngineId) {
        throw new Error('Missing required API credentials');
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: Math.min(num, 10)
        }
      });

      return {
        results: response.data.items.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }))
      };
    } catch (error) {
      console.error('Google Search API Error:', error.response?.data || error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

const searchClient = new GoogleSearchMCP();

async function handleRequest(request) {
  if (request.method === 'search') {
    const { query, num } = request.params;
    return await searchClient.search({ query, num });
  }
  throw new Error(`Unknown method: ${request.method}`);
}

let buffer = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const messages = buffer.split('\n');
  buffer = messages.pop();

  for (const message of messages) {
    try {
      const request = JSON.parse(message);
      const response = await handleRequest(request);
      process.stdout.write(JSON.stringify({ result: response }) + '\n');
    } catch (error) {
      process.stdout.write(JSON.stringify({ error: error.message }) + '\n');
    }
  }
});

process.stdin.on('end', () => {
  if (buffer) {
    try {
      const request = JSON.parse(buffer);
      handleRequest(request)
        .then(response => {
          process.stdout.write(JSON.stringify({ result: response }) + '\n');
        })
        .catch(error => {
          process.stdout.write(JSON.stringify({ error: error.message }) + '\n');
        });
    } catch (error) {
      process.stdout.write(JSON.stringify({ error: error.message }) + '\n');
    }
  }
}); 