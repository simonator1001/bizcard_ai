"use client";

import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { AIInputWithSearch } from './AIInputWithSearch';
import { toast } from 'sonner';
import { getSystemPrompt } from '@/lib/prompts';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            userMessage
          ]
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Failed to get response - ${response.statusText}${data ? `: ${JSON.stringify(data)}` : ''}`);
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear messages when user changes
  useEffect(() => {
    setMessages([]);
  }, [user?.id]);

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