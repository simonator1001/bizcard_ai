import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function BusinessCardUpload() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call OCR API
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OCR processing failed');
      }

      const result = await response.json();
      
      // Show success message
      toast({
        title: t('ocr.success'),
        description: t('ocr.cardProcessed'),
      });

      // TODO: Handle the OCR result (e.g., create business card record)
      console.log('OCR Result:', result);

    } catch (error: any) {
      console.error('OCR error:', error);
      toast({
        title: t('ocr.error'),
        description: error.message || t('ocr.processingFailed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('ocr.processing')}
        </div>
      )}
    </div>
  );
} 