import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsArticle } from '@/types/news-article';
import Image from 'next/image';
import { ExternalLink, Building2, ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface NewsCardProps {
  article: NewsArticle;
  onClick: () => void;
}

export function NewsCard({ article, onClick }: NewsCardProps) {
  const [imageError, setImageError] = useState(false);

  // Function to get the company logo
  const getCompanyLogo = () => {
    try {
      const cleanCompany = article.company?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      return `https://logo.clearbit.com/${cleanCompany}.com`;
    } catch (error) {
      console.error('Error getting company logo:', error);
      return null;
    }
  };

  const imageUrl = article.imageUrl || getCompanyLogo();
  console.log('Article image URL:', imageUrl);

  const handleImageError = () => {
    console.warn('Image failed to load:', imageUrl);
    setImageError(true);
  };

  const formattedDate = (() => {
    try {
      return new Date(article.publishedDate).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  })();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative">
        <div className="relative w-full h-48">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">{article.company}</span>
            </div>
            <span className="text-sm">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-2 flex-1">{article.title}</h3>
          {article.url && article.url !== '#' && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
        
        {/* Tags Section */}
        {((article.mentionedEmployees && article.mentionedEmployees.length > 0) || article.source) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {article.source && (
              <Badge variant="secondary" className="text-xs">
                {article.source}
              </Badge>
            )}
            {article.mentionedEmployees?.map((employee, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {employee}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
} 