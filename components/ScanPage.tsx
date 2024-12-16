import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { recognizeBusinessCard, preprocessImageForOCR } from '@/lib/ocr-service'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression';

interface BusinessCard {
  id: string
  name: string
  company: string
  position: string
  email: string
  phone: string
  description: string
  imageUrl: string
}

interface ScanPageProps {
  onAddCard: (card: BusinessCard) => void
}

export function ScanPage({ onAddCard }: ScanPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<Partial<BusinessCard> | null>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [processingStage, setProcessingStage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      try {
        setFile(selectedFile);
        const compressedBase64 = await compressImage(selectedFile);
        setPreview(compressedBase64);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Failed to process image');
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      try {
        setFile(droppedFile);
        const compressedBase64 = await compressImage(droppedFile);
        setPreview(compressedBase64);
      } catch (error) {
        console.error('Error processing dropped file:', error);
        toast.error('Failed to process image');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processImage = async () => {
    if (!preview) return;
    setIsProcessing(true);
    setProcessingStage('Starting OCR process...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // No need for additional preprocessing since image is already compressed
      setProcessingStage('Processing image...');
      const result = await recognizeBusinessCard(preview);

      // Upload the compressed image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-card.jpg`;
      
      // Convert base64 to blob for upload
      const base64Response = await fetch(preview);
      const blob = await base64Response.blob();
      
      setProcessingStage('Uploading to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-cards')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-cards')
        .getPublicUrl(fileName);

      setProcessingStage('Finalizing...');
      setExtractedInfo({
        ...result,
        imageUrl: publicUrl
      });
      setProcessingStatus('success');
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessingStatus('error');
      toast.error('Failed to process image');
    } finally {
      setProcessingStage('');
      setIsProcessing(false);
      setTimeout(() => setProcessingStatus('idle'), 3000);
    }
  };

  const handleSave = () => {
    if (extractedInfo) {
      onAddCard(extractedInfo as BusinessCard)
      setFile(null)
      setPreview(null)
      setExtractedInfo(null)
    }
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setExtractedInfo(null)
    setProcessingStatus('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const testOCR = async () => {
    if (!preview) {
      toast.error('Please upload an image first')
      return
    }

    setIsProcessing(true)
    try {
      console.log('[Test] Starting OCR test...')
      
      const response = await fetch('/api/test-ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: preview
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'OCR test failed')
      }

      console.log('[Test] OCR test result:', result)
      toast.success('OCR test completed successfully')

    } catch (error) {
      console.error('[Test] OCR test error:', error)
      toast.error('OCR test failed: ' + error.message)
    } finally {
      setIsProcessing(false)
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
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClear()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-700">Click or drag and drop to upload a business card image</p>
                  </motion.div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </motion.div>

            {file && !extractedInfo && (
              <div className="space-y-4 mt-6">
                <Button 
                  className="w-full" 
                  onClick={processImage}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <Loader2 className="mb-2 h-4 w-4 animate-spin" />
                      <span className="text-sm">{processingStage}</span>
                    </motion.div>
                  ) : (
                    'Extract Information'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={testOCR}
                  disabled={isProcessing}
                >
                  Test OCR API
                </Button>
              </div>
            )}

            <AnimatePresence>
              {processingStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-center"
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
                    if (key !== 'id' && key !== 'imageUrl') {
                      return (
                        <div key={key} className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={key} className="text-right capitalize">
                            {key}
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
                <Button className="mt-6 w-full" onClick={handleSave}>
                  Save Business Card
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}