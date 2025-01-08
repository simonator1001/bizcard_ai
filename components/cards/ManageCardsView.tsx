import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

interface BusinessCard {
  id: string;
  name: string;
  name_zh: string;
  company: string;
  company_zh: string;
  title: string;
  title_zh: string;
  email: string;
  phone: string;
  address: string;
  address_zh: string;
  image_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function ManageCardsView() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('No user found');
      return;
    }

    const fetchCards = async () => {
      console.log('Fetching cards for user:', user.id);
      
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cards:', error);
        return;
      }

      console.log('Fetched cards:', data);

      const mappedCards: BusinessCard[] = data?.map(card => ({
        id: card.id,
        name: card.name || '',
        name_zh: card.name_zh || '',
        company: card.company || '',
        company_zh: card.company_zh || '',
        title: card.title || '',
        title_zh: card.title_zh || '',
        email: card.email || '',
        phone: card.phone || '',
        address: card.address || '',
        address_zh: card.address_zh || '',
        image_url: card.image_url || '',
        notes: card.notes || '',
        created_at: card.created_at,
        updated_at: card.updated_at
      })) || [];

      console.log('Mapped cards:', mappedCards);
      setCards(mappedCards);
    };

    fetchCards();
  }, [user]);

  console.log('Rendering cards:', cards);

  return (
    <div className="space-y-4">
      {cards.map(card => (
        <div key={card.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4">
            {card.image_url && (
              <div className="w-32 h-20 relative rounded-lg overflow-hidden bg-gray-100">
                <Image 
                  src={card.image_url}
                  alt="Business Card"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 128px"
                  onError={(e) => {
                    console.error('Error loading image:', e, 'URL:', card.image_url);
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-card.png';
                    target.classList.add('error');
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {card.name || card.name_zh}
                    {card.name && card.name_zh && ` (${card.name_zh})`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {card.title || card.title_zh}
                    {card.title && card.title_zh && ` (${card.title_zh})`}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {card.company || card.company_zh}
                    {card.company && card.company_zh && ` (${card.company_zh})`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(card.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {card.email && (
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <a href={`mailto:${card.email}`} className="hover:text-primary">
                      {card.email}
                    </a>
                  </p>
                )}
                {card.phone && (
                  <p className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <a href={`tel:${card.phone}`} className="hover:text-primary">
                      {card.phone}
                    </a>
                  </p>
                )}
                {(card.address || card.address_zh) && (
                  <p className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>
                      {card.address || card.address_zh}
                      {card.address && card.address_zh && ` (${card.address_zh})`}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {cards.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No business cards found. Start by scanning some cards!
        </div>
      )}
    </div>
  );
} 