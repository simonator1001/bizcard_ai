import { Building2, Image as ImageIcon } from "lucide-react"
import { NewsArticle } from "@/types/news"
import Image from "next/image"
import { useState } from "react"

interface NewsItemProps {
  article: NewsArticle;
  onClick: () => void;
  showCompany?: boolean;
}

// Static test image from a reliable source
const DEFAULT_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png"

export const NewsItem: React.FC<NewsItemProps> = ({
  article,
  onClick,
  showCompany = false
}) => {
  const [imageError, setImageError] = useState(false)

  // Function to get the company logo from the article source
  const getCompanyLogo = () => {
    // Clean the company name if available, otherwise use the source
    const sourceName = article.company || article.source;
    const cleanSource = sourceName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleanSource}.com`;
  };

  // Get the most appropriate image
  const imageUrl = !imageError && article.image 
    ? article.image 
    : getCompanyLogo();

  return (
    <div
      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Image Container */}
        <div 
          className="relative min-w-[120px] h-[80px] rounded-md overflow-hidden bg-white border"
        >
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {showCompany && article.company && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{article.company}</span>
            </div>
          )}
          <h3 className="font-semibold mb-2">{article.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{article.snippet}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{article.source}</span>
            <span>•</span>
            <span>{new Date(article.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 