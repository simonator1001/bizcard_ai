export class NewsClient {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchNews(query: string, page: number = 1, pageSize: number = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/everything?` + 
        `q=${encodeURIComponent(query)}&` +
        `language=en,zh&` +
        `sortBy=publishedAt&` +
        `page=${page}&` +
        `pageSize=${pageSize}`, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('News API error response:', errorText);
        throw new Error(`News API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('News API response:', data);

      return data.articles.map((article: any) => ({
        id: article.url,
        title: article.title,
        source: article.source.name,
        date: new Date(article.publishedAt).toISOString().split('T')[0],
        snippet: article.description || article.content,
        url: article.url,
        imageUrl: article.urlToImage || 'https://picsum.photos/800/400'
      }));
    } catch (error) {
      console.error('Error in searchNews:', error);
      throw error;
    }
  }
} 