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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processImage = async () => {
    if (!preview) return
    setIsProcessing(true)
    
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Process image with OCR
      const optimizedImage = await preprocessImageForOCR(preview)
      const result = await recognizeBusinessCard(optimizedImage)

      // Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-card.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-cards')
        .upload(fileName, file!, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-cards')
        .getPublicUrl(fileName)

      setExtractedInfo({
        ...result,
        imageUrl: publicUrl
      })
      setProcessingStatus('success')
    } catch (error) {
      console.error('Error processing image:', error)
      setProcessingStatus('error')
      toast.error('Failed to process image')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingStatus('idle'), 3000)
    }
  }

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
              <Button 
                className="mt-6 w-full" 
                onClick={processImage}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </motion.div>
                ) : (
                  'Extract Information'
                )}
              </Button>
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