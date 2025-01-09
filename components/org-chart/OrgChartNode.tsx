import { BusinessCard } from '@/types/business-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone } from 'lucide-react';

interface OrgChartNodeProps {
  contact: BusinessCard;
  subordinates: BusinessCard[];
  viewMode: 'tree' | 'list';
  onNodeClick: (contact: BusinessCard) => void;
}

export function OrgChartNode({ contact, subordinates, viewMode, onNodeClick }: OrgChartNodeProps) {
  const initials = contact.name
    ? contact.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const renderTreeNode = () => (
    <div className="flex flex-col items-center">
      <Card
        className="w-64 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNodeClick(contact)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              {contact.image_url ? (
                <AvatarImage src={contact.image_url} alt={contact.name || 'Contact'} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {contact.name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {contact.title}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {subordinates.length > 0 && (
        <>
          <div className="w-px h-4 bg-gray-300" />
          <div className="relative flex">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" />
            <div className="flex space-x-4 pt-4">
              {subordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={subordinate}
                  subordinates={[]} // For simplicity, not showing deeper levels
                  viewMode={viewMode}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderListNode = () => (
    <div className="w-full">
      <Card
        className="mb-2 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNodeClick(contact)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              {contact.image_url ? (
                <AvatarImage src={contact.image_url} alt={contact.name || 'Contact'} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contact.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {contact.title}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-primary"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {subordinates.length > 0 && (
        <div className="pl-8 border-l border-gray-200">
          {subordinates.map((subordinate) => (
            <OrgChartNode
              key={subordinate.id}
              contact={subordinate}
              subordinates={[]} // For simplicity, not showing deeper levels
              viewMode={viewMode}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );

  return viewMode === 'tree' ? renderTreeNode() : renderListNode();
} 