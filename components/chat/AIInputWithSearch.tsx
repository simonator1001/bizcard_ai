import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface AIInputWithSearchProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  minHeight?: number;
  maxHeight?: number;
}

export function AIInputWithSearch({ 
  placeholder = 'Type a message...', 
  onSubmit,
  minHeight = 60,
  maxHeight = 200
}: AIInputWithSearchProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [content, minHeight, maxHeight]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        onSubmit(content);
        setContent('');
      }
    }
  };

  return (
    <div className="relative p-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:border-sky-500"
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`
        }}
      />
      <button
        onClick={() => {
          if (content.trim()) {
            onSubmit(content);
            setContent('');
          }
        }}
        className="absolute bottom-6 right-6 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
        disabled={!content.trim()}
      >
        Send
      </button>
    </div>
  );
} 