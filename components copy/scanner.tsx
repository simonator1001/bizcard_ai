'use client'

import React, { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface ScannerProps {
  onScan?: (result: any) => void
  onError?: (error: Error) => void
}

const ScanButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <Button
    variant="outline"
    className="w-full justify-start rounded-full py-6 px-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
    onClick={onClick}
  >
    {icon}
    <span className="ml-4 text-lg font-medium">{label}</span>
  </Button>
)

export function Scanner({ onScan, onError }: ScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const processImage = async (file: File) => {
    try {
      setScanning(true)
      
      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      })

      // Convert to base64
      const reader = new FileReader()
      reader.readAsDataURL(compressedFile)
      
      reader.onload = async () => {
        const base64Image = reader.result as string
        setUploadedImage(base64Image)
        
        try {
          const response = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: base64Image
            })
          })

          if (!response.ok) throw new Error('Scan failed')
          
          const result = await response.json()
          onScan?.(result)
          toast.success('Card scanned successfully')
        } catch (error) {
          console.error('Scan error:', error)
          onError?.(error as Error)
          toast.error('Failed to scan card')
        }
      }
    } catch (error) {
      console.error('Image processing error:', error)
      onError?.(error as Error)
      toast.error('Failed to process image')
    } finally {
      setScanning(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const handleScan = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="mb-8 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 opacity-20"></div>
          <div className="relative z-10 p-8 space-y-6">
            <CardTitle className="text-3xl font-bold">Scan Business Cards</CardTitle>
            <CardDescription className="text-lg">
              Quickly capture and organize your business contacts
            </CardDescription>
            <div className="space-y-4">
              <ScanButton
                icon={<Camera className="h-8 w-8" />}
                label="Take a Photo"
                onClick={handleScan}
              />
              <ScanButton
                icon={<Upload className="h-8 w-8" />}
                label="Upload Image"
                onClick={handleScan}
              />
            </div>
          </div>
        </div>
        <input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        {uploadedImage && (
          <div className="p-8">
            <img 
              src={uploadedImage} 
              alt="Uploaded business card" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <Button 
              onClick={() => setUploadedImage(null)}
              className="mt-4 w-full"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
        {scanning && (
          <div className="text-center text-sm text-gray-500 p-4">
            Scanning card...
          </div>
        )}
      </CardContent>
    </Card>
  )
} 