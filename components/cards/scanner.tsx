'use client'

import React, { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface ScannerProps {
  onCapture: (image: string) => void
}

export function Scanner({ onCapture }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setError(null)
      }
    } catch (err) {
      setError('Failed to access camera')
      toast.error('Failed to access camera')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg', 0.95)
      })

      // Compress the image
      const compressedFile = await imageCompression(new File([blob], 'capture.jpg', { type: 'image/jpeg' }), {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920
      })

      // Convert compressed file to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        onCapture(base64String)
        stopCamera()
      }
      reader.readAsDataURL(compressedFile)

    } catch (err) {
      console.error('Error capturing image:', err)
      toast.error('Failed to capture image')
    }
  }

  React.useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camera Scanner</CardTitle>
        <CardDescription>
          Position the business card in the camera view and take a photo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex justify-center gap-4">
          {!isStreaming ? (
            <Button onClick={startCamera}>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={captureImage}>
              <Upload className="mr-2 h-4 w-4" />
              Capture
            </Button>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}