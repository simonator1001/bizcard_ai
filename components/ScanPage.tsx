import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { recognizeBusinessCard, preprocessImageForOCR, OCRError } from '@/lib/ocr-service'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression';

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
  const record = {
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

    const { data, error } = await supabase
      .from('business_cards')
      .insert(dbRecord)
      .select('id')
      .single();

    if (error) {
      console.error('[Database] Error details:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('[Database] Error saving to database:', error);
    throw error;
  }
};

// Add this new PremiumButton component at the top of the file
interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
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
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<Partial<BusinessCard> | null>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [processingStage, setProcessingStage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add state for bulk upload progress
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);

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
    if (!files?.length) return;

    setTotalFiles(files.length);
    setProcessedFiles(0);
    
    try {
      const fileArray = Array.from(files);
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          throw new Error(`File "${file.name}" is not an image`);
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
          throw new Error(`File "${file.name}" exceeds 5MB size limit`);
        }

        setFile(file);
        
        try {
          const compressedBase64 = await compressImage(file);
          setPreview(compressedBase64);
          await processImage(compressedBase64);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process "${file.name}"`);
        }
        
        setProcessedFiles(i + 1);
        setUploadProgress(((i + 1) / fileArray.length) * 100);
      }
      
    } catch (error) {
      console.error('File handling error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process files');
    } finally {
      // Clean up
      setFile(null);
      setPreview(null);
      setTotalFiles(0);
      setProcessedFiles(0);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setTotalFiles(files.length);
      setProcessedFiles(0);
      
      try {
        const fileArray = Array.from(files);
        
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          setFile(file);
          
          const compressedBase64 = await compressImage(file);
          setPreview(compressedBase64);
          
          await processImage(compressedBase64);
          
          setProcessedFiles(i + 1);
          setUploadProgress(((i + 1) / fileArray.length) * 100);
        }
        
        setFile(null);
        setPreview(null);
        setExtractedInfo(null);
        toast.success(`Successfully processed ${fileArray.length} business cards`);
        
      } catch (error) {
        console.error('Error processing dropped files:', error);
        toast.error('Failed to process some images');
      } finally {
        setTotalFiles(0);
        setProcessedFiles(0);
        setUploadProgress(0);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processImage = async (base64Image: string) => {
    if (!base64Image) return;
    setIsProcessing(true);
    setProcessingStage('Starting OCR process...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      setProcessingStage('Processing image...');
      try {
        const result = await recognizeBusinessCard(base64Image);
        
        if (!result) {
          throw new Error('Failed to extract data from the image');
        }

        // Continue with storage upload only if OCR succeeds
        setProcessingStage('Uploading to storage...');
        const fileName = `${user.id}/${Date.now()}-card.jpg`;
        
        try {
          const base64Response = await fetch(base64Image);
          const blob = await base64Response.blob();
          
          const { error: uploadError } = await supabase.storage
            .from('business-cards')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Process successful upload
          const { data: { publicUrl } } = supabase.storage
            .from('business-cards')
            .getPublicUrl(fileName);

          setProcessingStage('Saving to database...');
          const record = mapOCRToRecord(result, user.id, publicUrl);
          const savedId = await saveToDatabase(record);

          setProcessingStage('Finalizing...');
          setExtractedInfo({
            id: savedId,
            ...result,
            imageUrl: publicUrl
          });
          
          setProcessingStatus('success');
          toast.success('Business card saved successfully');
          
          // Notify parent
          onAddCard({
            id: savedId,
            ...record,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        } catch (storageError) {
          console.error('[Storage] Error:', storageError);
          throw new Error('Failed to save the image. Please try again.');
        }

      } catch (ocrError) {
        if (ocrError instanceof OCRError) {
          console.error('[OCR] Error details:', ocrError.details);
          
          const errorMessage = ocrError.message.includes('No readable text')
            ? 'No text could be detected. Please ensure the image is clear and contains readable text.'
            : 'Unable to read the business card. Please ensure the image is clear and try again.';
          
          toast.error(errorMessage, { duration: 5000 });
          return;
        }
        throw ocrError;
      }

    } catch (error) {
      console.error('[Process] Error:', error);
      setProcessingStatus('error');
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to process the image. Please try again.';
      
      toast.error(errorMessage, { duration: 5000 });
      handleClear();
    } finally {
      setProcessingStage('');
      setIsProcessing(false);
      setTimeout(() => setProcessingStatus('idle'), 3000);
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
            <CardTitle className="text-4xl font-bold text-center mb-2">Scan Business Card</CardTitle>
            <CardDescription className="text-lg text-center text-gray-600">
              Upload an image of a business card to extract information
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
                    <img src={preview} alt="Business Card Preview" className="max-w-full h-auto mx-auto rounded-md" />
                    <PremiumButton
                      icon={X}
                      label="Clear"
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
                      Click or drag and drop to upload a business card image
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports multiple files
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

            {file && !extractedInfo && (
              <div className="space-y-4 mt-6">
                {isProcessing && (
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
                )}
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
    </ScrollArea>
  )
}