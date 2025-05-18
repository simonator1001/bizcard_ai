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
      console.log('[Scan] Starting image processing...');

      // Get the authentication token with refresh - ENHANCED SESSION MANAGEMENT
      console.log('[Scan] Getting session data from supabase...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Scan] Session error:', sessionError);
        // Try refreshing the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('[Scan] Session refresh failed:', refreshError);
          throw new Error('Your session has expired. Please sign in again.');
        }
        
        console.log('[Scan] Session refreshed successfully');
      }
      
      if (!sessionData?.session) {
        console.error('[Scan] No session found, attempting to refresh');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('[Scan] Session refresh failed:', refreshError);
          throw new Error('Authentication failed. Please sign in again.');
        }
        
        console.log('[Scan] Session refreshed successfully');
      }
      
      // Make sure we have a valid token
      const session = sessionData?.session || (await supabase.auth.getSession()).data.session;
      
      if (!session) {
        console.error('[Scan] Still no session after refresh attempts');
        throw new Error('Unable to authenticate. Please sign in again.');
      }
      
      console.log('[Scan] Session found:', { 
        userId: session.user?.id,
        email: session.user?.email,
        expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
        tokenLength: session.access_token?.length || 0
      });
      
      if (!session.access_token) {
        console.error('[Scan] No access token in session');
        throw new Error('No authentication token found. Please sign in again.');
      }

      // Upload the image to our API with enhanced headers
      console.log('[Scan] Sending image to API with auth token');
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Session-Id': session.user?.id || '',
          'X-Auth-Token': session.access_token.substring(0, 15) + '...',
          'X-User-Email': session.user?.email || ''
        },
        body: JSON.stringify({ image: base64Image }),
        credentials: 'include' // Important: include cookies
      });

      // Check response with enhanced error handling
      console.log(`[Scan] API response received: status=${response.status}`);
      
      // After any API call, verify the session is still intact
      const sessionCheckPromise = supabase.auth.getSession();
      
      if (!response.ok) {
        let errorMessage = 'Failed to scan business card';
        
        try {
          const errorData = await response.json();
          console.error('[Scan] API error:', errorData);
          errorMessage = errorData.message || errorData.details || errorData.error || errorMessage;
          
          // Handle specific error types
          if (response.status === 401 || 
              response.status === 403 || 
              errorMessage.includes('Authentication') || 
              errorMessage.includes('Unauthorized') || 
              errorMessage.includes('session')) {
            console.error('[Scan] Authentication error:', { status: response.status, message: errorMessage });
            
            // Try refreshing the session before failing
            console.log('[Scan] Attempting session refresh...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshData.session) {
              console.error('[Scan] Session refresh failed:', refreshError);
              throw new Error('Your session has expired. Please sign in again.');
            }
            
            // Retry with new token after refresh
            console.log('[Scan] Retrying with refreshed token, new expiry:', 
              refreshData.session.expires_at ? new Date(refreshData.session.expires_at * 1000).toISOString() : 'unknown');
            
            const retryResponse = await fetch('/api/scan', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshData.session.access_token}`
              },
              body: JSON.stringify({ image: base64Image }),
              credentials: 'include'
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json();
              throw new Error(retryErrorData.message || 'Session expired. Please sign in again.');
            }
            
            const retryResult = await retryResponse.json();
            console.log('[Scan] Card scanned successfully after token refresh:', retryResult);
            
            // Update UI state
            setProcessingStatus('success');
            setProcessingStage(`Card scanned successfully! ID: ${retryResult.id}`);
            
            // Add the card to the list
            if (retryResult && onAddCard) {
              onAddCard({
                id: retryResult.id,
                name: retryResult.name || '',
                name_zh: retryResult.name_zh || '',
                company: retryResult.company || '',
                company_zh: retryResult.company_zh || '',
                title: retryResult.title || '',
                title_zh: retryResult.title_zh || '',
                email: retryResult.email || '',
                phone: retryResult.phone || '',
                address: retryResult.address || '',
                address_zh: retryResult.address_zh || '',
                imageUrl: retryResult.image_url || '',
                notes: retryResult.notes || '',
                created_at: retryResult.created_at || new Date().toISOString(),
                updated_at: retryResult.updated_at || new Date().toISOString()
              });
            }
            
            // Refresh usage stats
            refreshUsage?.();
            
            // Clear form
            setFile(null);
            setPreview(null);
            
            return retryResult;
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('Session expired')) {
            throw parseError;
          }
          console.error('[Scan] Failed to parse error response:', await response.text());
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      const result = await response.json();
      console.log('[Scan] Card scanned successfully:', result);

      // Update UI state
      setProcessingStatus('success');
      setProcessingStage(`Card scanned successfully! ID: ${result.id}`);
      
      // Add the card to the list
      if (result && onAddCard) {
        onAddCard({
          id: result.id,
          name: result.name || '',
          name_zh: result.name_zh || '',
          company: result.company || '',
          company_zh: result.company_zh || '',
          title: result.title || '',
          title_zh: result.title_zh || '',
          email: result.email || '',
          phone: result.phone || '',
          address: result.address || '',
          address_zh: result.address_zh || '',
          imageUrl: result.image_url || '',
          notes: result.notes || '',
          created_at: result.created_at || new Date().toISOString(),
          updated_at: result.updated_at || new Date().toISOString()
        });
      }
      
      // After successful scan, always make sure session is still valid
      setTimeout(async () => {
        console.log('[Scan] Verifying session is still active after scan...');
        const { data: verifyData, error: verifyError } = await supabase.auth.getSession();
        
        if (verifyError || !verifyData.session) {
          console.error('[Scan] Session lost after scan:', verifyError);
          const { data: refreshResult, error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr && refreshResult.session) {
            console.log('[Scan] Successfully restored session after scan');
          } else {
            console.error('[Scan] Failed to restore session after scan:', refreshErr);
          }
        } else {
          console.log('[Scan] Session verified after scan');
        }
      }, 1000);
      
      // Clear form
      setFile(null);
      setPreview(null);
      
      return result;
    } catch (error) {
      console.error('[Scan] Process image error:', error);
      setProcessingStatus('error');
      setProcessingStage('Error scanning card');
      
      // Show appropriate error message based on error type
      if (error instanceof Error && error.message.includes('Session expired')) {
        toast.error('Your session has expired. Please sign in again.');
        // Redirect to sign in page
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to scan business card');
      }
      
      throw error;
    } finally {
      // Remove any redirects from error cases when processing has completed
      setIsProcessing(false);
    }
  };

  // Keep the user session active with enhanced session management
  useEffect(() => {
    const refreshSession = async () => {
      try {
        if (user) {
          // Refresh the session to keep it active
          console.log('[Session] Attempting to refresh session...');
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('[Session] Refresh error:', error);
            
            // Check browser storage for session information
            const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') 
              ? process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0]
              : 'rzmqepriffysavamtxzg';
            
            // Attempt recovery from localStorage
            const storedSession = localStorage.getItem(`sb-${projectId}-auth-token-raw`);
            const hasAuthSuccess = document.cookie.includes('auth-success=true');
            const hasUserSession = document.cookie.includes('x-user-session');
            
            console.log('[Session] Recovery check:', {
              hasStoredToken: !!storedSession,
              hasAuthSuccess,
              hasUserSession
            });
            
            if (storedSession || hasAuthSuccess || hasUserSession) {
              // Attempt to recover using stored session information
              console.log('[Session] Found stored session information, attempting recovery');
              
              try {
                // Try to recover by forcing a session refresh
                const { data: recoveryData, error: recoveryError } = await supabase.auth.getSession();
                
                if (recoveryError || !recoveryData?.session) {
                  // If still no session, try manual refresh
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                  
                  if (refreshError || !refreshData?.session) {
                    console.error('[Session] Recovery failed, redirecting to login');
                    router.push('/signin');
                  } else {
                    console.log('[Session] Successfully recovered session via refresh');
                  }
                } else {
                  console.log('[Session] Session recovered successfully');
                }
              } catch (recoveryError) {
                console.error('[Session] Error during session recovery:', recoveryError);
                router.push('/signin');
              }
            } else {
              // Try getting the session to see if it's still valid
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
              if (sessionError || !sessionData.session) {
                console.error('[Session] Session invalid, redirecting to login');
                router.push('/signin');
              } else {
                console.log('[Session] Session still valid despite refresh error');
              }
            }
          } else {
            console.log('[Session] Session refreshed successfully:', {
              userId: data.session?.user?.id,
              expires: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown'
            });
            
            // If we have cookies enabled, also set a marker cookie to help middleware
            if (data.session?.user) {
              try {
                document.cookie = `x-user-session=${data.session.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
                document.cookie = `auth-success=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
              } catch (e) {
                console.error('[Session] Error setting cookies:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('[Session] Error refreshing session:', err);
      }
    };

    // Refresh session when component mounts
    refreshSession();

    // Set up interval to refresh session more frequently (every 2 minutes)
    const interval = setInterval(refreshSession, 2 * 60 * 1000);
    
    // Also refresh after a period of inactivity
    let activityTimeout: NodeJS.Timeout;
    
    const handleUserActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(refreshSession, 30000); // Refresh after 30s of inactivity
    };
    
    // Listen for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    
    // Add specific listeners for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Session] Page became visible, refreshing session');
        refreshSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      clearTimeout(activityTimeout);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, supabase.auth, router]);

  const checkSession = async () => {
    console.log('[Debug] Checking current session status...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Debug] Error checking session:', error);
    } else {
      console.log('[Debug] Current session:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        expires: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown',
        tokenLength: data.session?.access_token?.length || 0
      });
    }
  };

  // Check the session status at mount and after navigation
  useEffect(() => {
    checkSession();
    
    // For App Router, we need to use usePathname or similar hooks
    // instead of router.events which is Pages Router only
    const handleRouteChange = () => {
      console.log('[Debug] Route changed, checking session...');
      setTimeout(checkSession, 100); // Slight delay to ensure navigation is complete
    };
    
    // Add event listener for navigation
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

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