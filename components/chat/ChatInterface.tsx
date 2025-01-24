"use client";

import { useState, useEffect } from 'react';
import { AIInputWithSearch } from '@/components/ui/ai-input-with-search';
import { toast } from 'sonner';
import { getBusinessCards, searchBusinessCards } from '@/lib/supabase-client';
import { BusinessCard } from '@/types/business-card';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);

  useEffect(() => {
    // Load business cards on component mount
    const loadBusinessCards = async () => {
      try {
        const cards = await getBusinessCards();
        setBusinessCards(cards);
      } catch (error) {
        console.error('Error loading business cards:', error);
        toast.error('Failed to load business cards');
      }
    };

    loadBusinessCards();
  }, []);

  const handleSubmit = async (userInput: string) => {
    if (!userInput.trim()) return;

    try {
      setIsLoading(true);
      const userMessage = { role: 'user', content: userInput };
      setMessages(prev => [...prev, userMessage]);

      // Get business card data based on query
      let relevantCards: BusinessCard[] = [];
      if (userInput.toLowerCase().includes('how many') || userInput.toLowerCase().includes('count')) {
        relevantCards = await getBusinessCards();
      } else {
        relevantCards = await searchBusinessCards(userInput);
      }

      // Prepare context with business card data
      const context = `Based on the business card database:
${relevantCards.length > 0 ? `Found ${relevantCards.length} relevant business cards.
${relevantCards.map(card => `- ${card.name || 'Unnamed'} | ${card.title || 'No title'} at ${card.company || 'No company'}`).join('\n')}` : 'No relevant business cards found.'}

User question: ${userInput}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: getSystemPrompt() },
            { role: 'user', content: context }
          ]
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Failed to get response - ${response.statusText}${data ? `: ${JSON.stringify(data)}` : ''}`);
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[calc(100vh-400px)]">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start a conversation by typing a message below
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-sky-500/10 ml-auto max-w-[80%]'
                : 'bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]'
            }`}
          >
            <p className={`text-sm whitespace-pre-wrap ${
              message.role === 'user'
                ? 'text-black'
                : 'text-foreground dark:text-white'
            }`}>{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
          </div>
        )}
      </div>
      <div className="mt-auto border-t dark:border-gray-800 bg-white dark:bg-gray-900">
        <AIInputWithSearch
          placeholder="Ask anything about your business cards..."
          onSubmit={handleSubmit}
          minHeight={60}
          maxHeight={200}
        />
      </div>
    </div>
  );
} 