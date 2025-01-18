'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { NewsArticle } from '@/types/news-article';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NewsItemProps {
  article: NewsArticle;
  onClick: () => void;
  showCompany?: boolean;
}

export function NewsItem({ article, onClick, showCompany = true }: NewsItemProps) {
  const [imageError, setImageError] = useState(false);

  const formattedDate = new Date(article.publishedDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card className="group overflow-hidden hover:bg-muted/50 transition-colors">
      <div className="flex gap-4 p-4">
        <div className="relative h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={!imageError ? (article.imageUrl || '/placeholder-news.jpg') : 
              article.company ? 
                `https://logo.clearbit.com/${article.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` :
                '/placeholder-news.jpg'
            }
            alt={article.title}
            fill
            className={cn(
              "object-cover transition-all hover:scale-105",
              imageError && "object-contain p-2"
            )}
            onError={() => setImageError(true)}
          />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block hover:underline"
              >
                <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
              </a>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {formattedDate}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {article.source}
                </Badge>
                {showCompany && (
                  <Badge variant="default" className="text-xs">
                    {article.company}
                  </Badge>
                )}
                {article.mentionedEmployees?.map((employee, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                    {employee}
                  </Badge>
                ))}
              </div>
            </div>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {article.summary}
          </p>
        </div>
      </div>
    </Card>
  );
} 