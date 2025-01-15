import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { recognizeBusinessCard } from '@/lib/ocr-service'
import { supabase, testConnection } from '@/lib/supabase-client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression';
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt'
import { useTranslation } from 'react-i18next'
import { SubscriptionService } from '@/lib/subscription'
import { useAuth } from '@/lib/auth-context'

interface BusinessCard {
  id: string
  name: string
  name_zh: string
  company: string
  company_zh: string
  title: string
  title_zh: string
  email: string
  phone: string
  address: string
  address_zh: string
  imageUrl: string
  notes: string
  created_at: string
  updated_at: string
}

interface ScanPageProps {
  onAddCard: (card: BusinessCard) => void
}

// Add this interface for the database record
interface BusinessCardRecord {
  user_id: string
  name: string
  name_zh: string
  company: string
  company_zh: string
  title: string
  title_zh: string
  email: string
  phone: string
  address: string
  address_zh: string
  image_url: string
  notes: string
  created_at?: string
  updated_at?: string
}

// Add this function to map OCR result to database record
const mapOCRToRecord = (
  result: any, 
  userId: string, 
  imageUrl: string
): BusinessCardRecord => {
  const record: BusinessCardRecord = {
    user_id: userId,
    name: result.words_result.NAME?.words || '',
    name_zh: result.words_result.NAME_ZH?.words || '',
    company: result.words_result.COMPANY?.words || '',
    company_zh: result.words_result.COMPANY_ZH?.words || '',
    title: result.words_result.TITLE?.words || '',
    title_zh: result.words_result.TITLE_ZH?.words || '',
    email: result.words_result.EMAIL?.words || '',
    phone: result.words_result.MOBILE?.words || '',
    address: result.words_result.ADDR?.words || '',
    address_zh: result.words_result.ADDR_ZH?.words || '',
    image_url: imageUrl,
    notes: result.raw_text || ''
  };

  console.log('[OCR] Mapped record:', record);
  return record;
};

// Add this function to save to database
const saveToDatabase = async (record: BusinessCardRecord): Promise<string> => {
  try {
    // Create a clean record object with only the fields we want to save
    const dbRecord = {
      user_id: record.user_id,
      name: record.name,
      name_zh: record.name_zh,
      company: record.company,
      company_zh: record.company_zh,
      title: record.title,
      title_zh: record.title_zh,
      email: record.email,
      phone: record.phone,
      address: record.address,
      address_zh: record.address_zh,
      image_url: record.image_url,
      notes: record.notes
    };

    console.log('[Database] Saving record:', dbRecord);

    // Try to insert with minimal fields first
    const { data, error } = await supabase
      .from('business_cards')
      .insert({
        user_id: record.user_id,
        name: record.name,
        company: record.company
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Database] Error details:', error);
      throw error;
    }

    // If successful, update with remaining fields
    if (data?.id) {
      const { error: updateError } = await supabase
        .from('business_cards')
        .update(dbRecord)
        .eq('id', data.id);

      if (updateError) {
        console.error('[Database] Error updating full record:', updateError);
        throw updateError;
      }

      console.log('[Database] Successfully saved record:', data);
      return data.id;
    }

    throw new Error('Failed to get ID from insert');
  } catch (error) {
    console.error('[Database] Error saving to database:', error);
    throw error;
  }
};

// Add this new PremiumButton component at the top of the file
interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: 'default' | 'destructive' | 'outline';
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ 
  icon: Icon, 
  label, 
  variant = 'default',
  className,
  ...props 
}) => {
  const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400";
  const variantStyles = {
    default: "border border-gray-300 text-gray-700 hover:bg-gray-100 hover:shadow-md active:scale-95",
    destructive: "border border-red-300 text-red-600 hover:bg-red-50 hover:shadow-md active:scale-95",
    outline: "border border-primary text-primary hover:bg-primary/10 hover:shadow-md active:scale-95"
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Icon className="w-5 h-5 transition-all duration-300" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export function ScanPage({ onAddCard }: ScanPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, usage, refreshUsage } = useSubscription();
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<Partial<BusinessCard> | null>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [processingStage, setProcessingStage] = useState<string>('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  // Add state for bulk upload progress
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [totalFiles, setTotalFiles] = useState<number>(0)
  const [processedFiles, setProcessedFiles] = useState<number>(0)

  const compressImage = async (file: File): Promise<string> => {
    console.log('[Compression] Original file size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1800,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log('[Compression] Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');

      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error('[Compression] Error compressing image:', error);
      throw error;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      // Check if user can perform scan action
      if (!user) {
        toast.error('Please sign in to scan business cards');
        return;
      }

      const canScan = await SubscriptionService.canPerformAction(user.id, 'scan');
      if (!canScan) {
        setShowUpgradePrompt(true);
        return;
      }

      setTotalFiles(files.length);
      setProcessedFiles(0);
      setIsProcessing(true);
      
      // Convert FileList to Array
      const fileArray = Array.from(files);
      
      // Process files sequentially
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setFile(file);
        
        // Compress and get base64
        const compressedBase64 = await compressImage(file);
        setPreview(compressedBase64);
        
        // Process image
        await processImage(compressedBase64);
        
        // Update progress
        setProcessedFiles(i + 1);
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      }
      
      // Clear states after all files are processed
      setFile(null);
      setPreview(null);
      setExtractedInfo(null);
      toast.success(`Successfully processed ${files.length} business cards`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process some business cards');
    } finally {
      setIsProcessing(false);
      setTotalFiles(0);
      setProcessedFiles(0);
      setUploadProgress(0);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    try {
      // Check if user can perform scan action
      if (!user) {
        toast.error('Please sign in to scan business cards');
        return;
      }

      const canScan = await SubscriptionService.canPerformAction(user.id, 'scan');
      if (!canScan) {
        setShowUpgradePrompt(true);
        return;
      }

      setTotalFiles(files.length);
      setProcessedFiles(0);
      
      const fileArray = Array.from(files);
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setFile(file);
        
        // Compress and get base64
        const compressedBase64 = await compressImage(file);
        setPreview(compressedBase64);
        
        await processImage(compressedBase64);
        
        setProcessedFiles(i + 1);
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      }
      
      setFile(null);
      setPreview(null);
      setExtractedInfo(null);
      toast.success(`Successfully processed ${processedFiles} business cards`);
      
    } catch (error) {
      console.error('Error processing dropped files:', error);
      toast.error('Failed to process some images');
    } finally {
      setTotalFiles(0);
      setProcessedFiles(0);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processImage = async (base64Image: string) => {
    if (!user) {
      toast.error('Please sign in to scan business cards');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('idle');
    setProcessingStage('Scanning business card...');

    try {
      // Get the session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No valid session found');
      }

      // Call our scan API endpoint with the session token
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ image: base64Image })
      });

      let errorData;
      let errorText;
      try {
        // Try to get JSON response
        errorData = await response.json();
      } catch (e) {
        // If JSON parsing fails, get text response
        errorText = await response.text();
        console.error('[Scan] Non-JSON response:', errorText);
      }

      if (!response.ok) {
        console.error('[Scan] API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorText
        });
        throw new Error(
          errorData?.message || 
          errorData?.error || 
          'Failed to scan business card'
        );
      }

      if (!errorData) {
        throw new Error('No response data received from scan endpoint');
      }

      const savedCard = errorData; // We already parsed the JSON above
      console.log('[Scan] Card saved:', savedCard);

      // Update UI state
      setProcessingStatus('success');
      setProcessingStage('Card scanned successfully!');
      
      // Refresh usage stats
      refreshUsage?.();

      // Clear form
      setFile(null);
      setPreview(null);
      setExtractedInfo(null);

      toast.success('Business card scanned and saved successfully!');
    } catch (error: any) {
      console.error('[Scan] Error:', error);
      setProcessingStatus('error');
      setProcessingStage('Failed to scan card');
      toast.error(error.message || 'Failed to scan business card');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setExtractedInfo(null)
    setProcessingStatus('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-280px)]">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center mb-2">
              {t('scan.title')}
            </CardTitle>
            <CardDescription className="text-lg text-center text-gray-600">
              {t('scan.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-all duration-300 bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{ 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt={t('scan.preview')} className="max-w-full h-auto mx-auto rounded-md" />
                    <PremiumButton
                      icon={X}
                      label={t('actions.clear')}
                      variant="destructive"
                      className="absolute top-2 right-2 !p-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClear()
                      }}
                    />
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      {t('scan.dropzone.title')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('scan.dropzone.subtitle')}
                    </p>
                  </motion.div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            </motion.div>

            {isProcessing && (
              <div className="space-y-4 mt-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm"
                >
                  <Loader2 className="mb-2 h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-gray-700">{processingStage}</span>
                  {totalFiles > 0 && (
                    <div className="w-full mt-3">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center mt-2">
                        Processing {processedFiles} of {totalFiles} files
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            <AnimatePresence>
              {processingStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center font-medium shadow-sm"
                >
                  Card successfully processed!
                </motion.div>
              )}
            </AnimatePresence>

            {extractedInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                <h3 className="text-xl font-semibold mb-4">Extracted Information</h3>
                <div className="space-y-4">
                  {Object.entries(extractedInfo).map(([key, value]) => {
                    if (key !== 'id' && key !== 'imageUrl' && key !== 'raw_text') {
                      const displayLabel = key === 'notes' ? 'Remarks' : 
                                          key.includes('_zh') ? `${key.replace('_zh', '')} (Chinese)` : 
                                          key;
                      return (
                        <div key={key} className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={key} className="text-right capitalize">
                            {displayLabel}
                          </Label>
                          <Input
                            id={key}
                            value={value as string}
                            onChange={(e) => setExtractedInfo({ ...extractedInfo, [key]: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {showUpgradePrompt && (
        <UpgradePrompt
          type="scan_limit"
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </ScrollArea>
  )
}