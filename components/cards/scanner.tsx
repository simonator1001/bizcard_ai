'use client'

import React, { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamically import the compression library
const imageCompression = dynamic(() => import('browser-image-compression'), {
  ssr: false
})

interface ScannerProps {
  onScan?: (result: any) => void
  onError?: (error: Error) => void
}

export function Scanner({ onScan, onError }: ScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setScanning(true)
        
        // Handle the case where imageCompression is not loaded yet
        if (typeof imageCompression === 'function') {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920
          })
          const reader = new FileReader()
          reader.readAsDataURL(compressedFile)
          reader.onload = () => {
            setUploadedImage(reader.result as string)
          }
        } else {
          // Fallback if compression is not available
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            setUploadedImage(reader.result as string)
          }
        }
      } catch (error) {
        console.error('Error processing image:', error)
        onError?.(error as Error)
        toast.error('Failed to process image')
      } finally {
        setScanning(false)
      }
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Scan Business Cards</CardTitle>
        <CardDescription>Upload or take a photo of a business card</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start py-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mr-2 h-5 w-5" />
            Take a Photo
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start py-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Image
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        {scanning && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Processing image...
          </div>
        )}
        {uploadedImage && (
          <div className="mt-4">
            <img 
              src={uploadedImage} 
              alt="Uploaded business card" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}