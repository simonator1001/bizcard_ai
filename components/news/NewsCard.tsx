import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsArticle } from '@/types/news-article';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  onClick: () => void;
}

export function NewsCard({ article, onClick }: NewsCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {article.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex justify-between items-center text-white">
              <span className="text-sm font-medium">{article.source}</span>
              <span className="text-sm">
                {new Date(article.publishedDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-2 flex-1">{article.title}</h3>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-500 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{article.company}</Badge>
          {article.sentiment && (
            <Badge
              variant={
                article.sentiment === 'positive'
                  ? 'success'
                  : article.sentiment === 'negative'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {article.sentiment}
            </Badge>
          )}
          {article.mentionedEmployees?.map((employee, index) => (
            <Badge key={index} variant="outline" title={`${employee.title} at ${employee.company}`}>
              {employee.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 