import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Calendar, User } from "lucide-react";
import { useScroll, useTransform, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface NewsArticle {
  title: string;
  publishedDate: string;
  source: string;
  summary: string;
  url: string;
  company?: string;
  imageUrl?: string;
}

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-background font-sans md:px-10" ref={containerRef}>
      <div className="max-w-7xl mx-auto py-10 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-3xl mb-4 text-foreground max-w-4xl font-bold">
          Latest News
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-sm">
          Stay updated with the latest news and announcements.
        </p>
      </div>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-20 md:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-background dark:bg-background flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-muted border border-border p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-3xl font-bold text-muted-foreground">
                {item.title}
              </h3>
            </div>
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-muted-foreground">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-border to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-primary from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

const NewsArticleCard = ({ article }: { article: NewsArticle }) => {
  // Use article.imageUrl or fallback to company logo
  const imageUrl = article.imageUrl || (article.company ? `https://logo.clearbit.com/${article.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : '/placeholder-news.jpg');
  return (
    <Card className="p-4 mb-4 hover:shadow-md transition-shadow duration-200 flex gap-4 items-start">
      <div className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover rounded-lg"
          sizes="80px"
        />
      </div>
      <div className="flex flex-col flex-1 space-y-3">
        <div>
          <h4 className="text-lg font-semibold text-foreground">{article.title}</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {article.publishedDate}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3" />
              {article.source}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{article.summary}</p>
        <div className="flex justify-end">
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
          >
            Read more <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
};

const NewsTimeline = ({ articles }: { articles: NewsArticle[] }) => {
  // Group articles by month/year
  const groupedArticles: Record<string, NewsArticle[]> = {};
  articles.forEach(article => {
    const date = new Date(article.publishedDate);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    if (!groupedArticles[monthYear]) {
      groupedArticles[monthYear] = [];
    }
    groupedArticles[monthYear].push(article);
  });
  // Convert to timeline data format
  const timelineData: TimelineEntry[] = Object.entries(groupedArticles).map(
    ([monthYear, articles]) => ({
      title: monthYear,
      content: (
        <div className="space-y-4">
          {articles.map((article, idx) => (
            <NewsArticleCard key={idx} article={article} />
          ))}
        </div>
      ),
    })
  );
  return <Timeline data={timelineData} />;
};

const NewsTab = () => {
  // Replace this with your real news data
  const newsArticles: NewsArticle[] = [
    {
      title: "Watsons Expands Partnership with ClimatePartner on Earth Day",
      publishedDate: "2025-04-22",
      source: "AS Watson Group / PARKnSHOP",
      summary: "Watsons, part of the AS Watson Group which also includes ParknShop, has expanded its partnership with ClimatePartner to enhance carbon compensation initiatives. This move aims to offset over 4,000 tons of CO2 emissions from selected sustainable products.",
      url: "https://example.com/article1"
    },
    {
      title: "Hong Kong economy: Can mainland bargain-bin grocery stores push out Hong Kong's dominant chains?",
      publishedDate: "2024-12-10",
      source: "South China Morning Post / PARKnSHOP",
      summary: "New entrant HotMaxx is winning customers by offering prices at a fraction of what ParknShop charges, bringing mainland sales tactics to Hong Kong. This competition could potentially challenge the dominance of traditional supermarket chains like ParknShop.",
      url: "https://example.com/article2"
    }
  ];
  return (
    <div className="w-full min-h-screen bg-background">
      <NewsTimeline articles={newsArticles} />
    </div>
  );
};

export default NewsTab;
export { NewsTimeline }; 