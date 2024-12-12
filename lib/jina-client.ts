export class JinaClient {
  private apiKey: string;
  private baseUrl = 'https://api.jina.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchNews(query: string, page: number = 1, pageSize: number = 10) {
    try {
      // Format the query to focus on news
      const searchQuery = `${query} news articles recent`;
      console.log('Search query:', searchQuery);

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [{
            text: searchQuery
          }],
          execEndpoint: '/search',
          parameters: {
            limit: pageSize,
            filter: {
              docType: 'news',
              timeRange: {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString()
              }
            }
          }
        })
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('Jina API error response:', responseText);
        throw new Error(`Jina API error: ${response.statusText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);

      // Transform the response to our format
      return (data.data?.[0]?.matches || []).map((article: any) => ({
        id: article.id || String(Math.random()),
        title: article.metadata?.title || article.text?.slice(0, 100) || 'Untitled',
        source: article.metadata?.source || 'Unknown Source',
        date: new Date(article.metadata?.published_at || Date.now()).toISOString().split('T')[0],
        snippet: article.metadata?.description || article.text || 'No description available',
        url: article.metadata?.url || '#',
        imageUrl: article.metadata?.image_url || 'https://picsum.photos/800/400',
        summary: article.metadata?.summary || article.text?.slice(0, 200) || 'No summary available'
      }));
    } catch (error) {
      console.error('Error in searchNews:', error);
      throw error;
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const prompt = `Generate 3 bullet points summarizing this: ${text}`;
      const encodedPrompt = encodeURIComponent(prompt);
      
      const response = await fetch(`${this.baseUrl}/${encodedPrompt}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return 'Unable to generate summary';
      }

      const data = await response.json();
      const summaryText = data.documents?.[0]?.text || data.results?.[0]?.text;
      return summaryText || 'No summary available';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Failed to generate summary';
    }
  }
} 