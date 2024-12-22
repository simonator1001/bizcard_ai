'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { t, ready } = useTranslation();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();

  if (!ready) {
    return (
      <div className="flex items-center justify-between opacity-50">
        <div>
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-40 mt-1 bg-muted rounded" />
        </div>
        <div className="h-10 w-[180px] bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="language">{t('settings.language')}</Label>
        <p className="text-sm text-muted-foreground">
          {t('settings.languageDescription', 'Choose your preferred language')}
        </p>
      </div>
      <Select value={currentLanguage} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[180px]">
          <Globe className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 