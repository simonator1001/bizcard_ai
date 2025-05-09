import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, Loader2, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { recognizeBusinessCard } from '@/lib/ocr-service'
import { supabase, testConnection } from '@/lib/supabase-client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression';
import { useSubscription } from '@/hooks/useSubscription'
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

const FileUpload = ({ 
  onFileSelect, 
  isProcessing, 
  preview, 
  onClear,
  processingStage,
  uploadProgress,
  totalFiles,
  processedFiles,
  t
}: { 
  onFileSelect: (files: FileList) => void;
  isProcessing: boolean;
  preview: string | null;
  onClear: () => void;
  processingStage: string;
  uploadProgress: number;
  totalFiles: number;
  processedFiles: number;
  t: any;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('[UPLOAD-DEBUG] FileUpload component mounted');
    console.log('[UPLOAD-DEBUG] fileInputRef exists:', !!fileInputRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[UPLOAD-DEBUG] Upload area clicked');
    console.log('[UPLOAD-DEBUG] isProcessing:', isProcessing);
    console.log('[UPLOAD-DEBUG] fileInputRef exists:', !!fileInputRef.current);
    
    if (!isProcessing && fileInputRef.current) {
      console.log('[UPLOAD-DEBUG] Attempting to trigger file input click');
      try {
        fileInputRef.current.click();
        console.log('[UPLOAD-DEBUG] File input click triggered');
      } catch (error) {
        console.error('[UPLOAD-DEBUG] Error triggering file input:', error);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('[UPLOAD-DEBUG] File dropped');
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    console.log('[UPLOAD-DEBUG] Dropped files count:', files?.length);
    if (files && files.length > 0) {
      console.log('[UPLOAD-DEBUG] Calling onFileSelect with dropped files');
      onFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('[UPLOAD-DEBUG] Drag over event');
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[UPLOAD-DEBUG] File input change event triggered');
    console.log('[UPLOAD-DEBUG] Files present:', !!event.target.files);
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('[UPLOAD-DEBUG] Number of files selected:', files.length);
      console.log('[UPLOAD-DEBUG] Calling onFileSelect with selected files');
      onFileSelect(files);
    }
  };

  return (
    <div
      className={`relative block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-all duration-300 bg-gray-50 ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      style={{ 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      }}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={(e) => {
        console.log('[UPLOAD-DEBUG] Drag enter event');
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
        onClick={(e) => {
          console.log('[UPLOAD-DEBUG] File input clicked directly');
          // Reset the value to ensure onChange fires even if selecting the same file
          e.currentTarget.value = '';
        }}
        disabled={isProcessing}
      />
      {preview ? (
        <div className="relative">
          <img src={preview} alt={t('scan.preview')} className="max-w-full h-auto mx-auto rounded-md" />
          {!isProcessing && (
            <PremiumButton
              icon={X}
              label={t('actions.clear')}
              variant="destructive"
              className="absolute top-2 right-2 !p-2"
              onClick={(e) => {
                console.log('[UPLOAD-DEBUG] Clear button clicked');
                e.stopPropagation();
                onClear();
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-lg font-medium text-gray-700">{processingStage}</div>
              {totalFiles > 0 && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {processedFiles} of {totalFiles} cards processed
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {t('scan.dropzone.title')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('scan.dropzone.description')}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
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
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [totalFiles, setTotalFiles] = useState<number>(0)
  const [processedFiles, setProcessedFiles] = useState<number>(0)
  const { t } = useTranslation()

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

  const handleFileSelect = async (files: FileList) => {
    console.log('[UPLOAD-DEBUG] handleFileSelect called with files:', files.length);
    
    if (!files || files.length === 0) {
      console.log('[UPLOAD-DEBUG] No files selected');
      return;
    }

    try {
      // Check if user can perform scan action
      if (!user) {
        console.log('[UPLOAD-DEBUG] No user found');
        toast.error('Please sign in to scan business cards');
        return;
      }

      const canScan = await SubscriptionService.canPerformAction(user.id, 'scan');
      if (!canScan) {
        console.log('[UPLOAD-DEBUG] User cannot scan - subscription limit');
        setShowUpgradePrompt(true);
        return;
      }

      setTotalFiles(files.length);
      setProcessedFiles(0);
      setIsProcessing(true);
      
      // Process files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('[UPLOAD-DEBUG] Processing file:', file.name);
        
        setFile(file);
        
        // Compress and get base64
        const compressedBase64 = await compressImage(file);
        setPreview(compressedBase64);
        
        // Process image
        await processImage(compressedBase64);
        
        // Update progress
        setProcessedFiles(i + 1);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      // Clear states after all files are processed
      setFile(null);
      setPreview(null);
      setExtractedInfo(null);
      toast.success(`Successfully processed ${files.length} business cards`);
    } catch (error) {
      console.error('[UPLOAD-DEBUG] Error processing files:', error);
      toast.error('Failed to process some business cards');
    } finally {
      setIsProcessing(false);
      setTotalFiles(0);
      setProcessedFiles(0);
      setUploadProgress(0);
    }
  };

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
            <div className="space-y-4">
              <Button 
                className="w-full py-6 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      console.log('[UPLOAD-DEBUG] Files selected from input:', files.length);
                      handleFileSelect(files);
                    }
                  };
                  input.click();
                }}
                disabled={isProcessing}
              >
                <Upload className="h-8 w-8 mr-3" />
                Upload Images
              </Button>

              <Button 
                variant="outline"
                className="w-full py-6 text-lg font-semibold rounded-full border-2 hover:bg-gray-50"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      console.log('[UPLOAD-DEBUG] Photo captured:', files.length);
                      handleFileSelect(files);
                    }
                  };
                  input.click();
                }}
                disabled={isProcessing}
              >
                <Camera className="h-8 w-8 mr-3" />
                Take a Photo
              </Button>
            </div>

            {preview && (
              <div className="mt-6">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <img src={preview} alt="Preview" className="max-w-full h-auto rounded-lg" />
                  {!isProcessing && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setExtractedInfo(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="mt-6">
                <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-gray-600">{processingStage}</p>
                  {totalFiles > 0 && (
                    <div className="w-full">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Processing {processedFiles} of {totalFiles} files
                      </p>
                    </div>
                  )}
                </div>
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
                            className={`col-span-3${key === 'email' ? ' bg-white' : ''}`}
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