'use client';

import { useState, useRef, useEffect, useActionState, startTransition, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Camera, CheckCircle, XCircle, Loader2, AlertCircle, ScanLine, FileText, ImageUp, Tags, Search, ClipboardPaste, ShieldCheck } from 'lucide-react';
import { decryptAndVerifyQrData, type VerifyQrResult } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/global/header';
import { debounce } from '@/lib/performance';
import jsQR from 'jsqr';

// Lazy load heavy components
const Textarea = dynamic(() => import('@/components/ui/textarea').then(mod => ({ default: mod.Textarea })), {
  loading: () => <div className="h-20 bg-muted animate-pulse rounded-md" />,
});

const initialState: VerifyQrResult = {
  success: false,
  message: '',
};

// Optimized audio context management
class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window !== 'undefined') {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    }
    return this.audioContext;
  }

  public playBeep(): void {
    const context = this.getAudioContext();
    if (context && context.state === 'running') {
      try {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
      } catch (e) {
        console.error("Error playing beep:", e);
      }
    }
  }

  public suspend(): void {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  public resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export default function VerifyQrPage() {
  const [state, formAction, isPending] = useActionState(decryptAndVerifyQrData, initialState);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [qrDataFromDecoder, setQrDataFromDecoder] = useState<string | null>(null);
  const [manualQrDataInput, setManualQrDataInput] = useState<string>("");

  const [fileName, setFileName] = useState<string | null>(null);
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);


  useEffect(() => {
    if (verificationAttempted && state.message && state.message !== initialState.message) { 
      if (state.success) {
        toast({
          title: 'Verification Successful',
          description: state.message,
        });
      } else { 
        toast({
          title: 'Verification Failed',
          description: state.message,
          variant: 'destructive',
        });
      }
      // Reset verificationAttempted after toast to prevent re-toasting on subsequent renders without new action
      // setVerificationAttempted(false); // Let's manage this more carefully
    }
  }, [state, toast, verificationAttempted]);


  const clearPreviousStateAndSetAttempted = useCallback(() => {
    setVerificationAttempted(false); 
    setQrDataFromDecoder(null);
    startTransition(() => { 
        // Create a new empty FormData for each reset to ensure useActionState re-evaluates with initial state
        const newFormData = new FormData();
        formAction(newFormData); 
    });
  }, [formAction]);

  const submitQrDataForVerification = useCallback((data: string) => {
    setQrDataFromDecoder(data); 
    const formData = new FormData();
    formData.append('qrData', data);
    setVerificationAttempted(true); 
    startTransition(() => {
      formAction(formData);
    });
  }, [formAction]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCameraScan(); 
      setFileName(file.name);
      clearPreviousStateAndSetAttempted();

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0, img.width, img.height);
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
              if (code && code.data) {
                AudioManager.getInstance().playBeep();
                if (navigator.vibrate) navigator.vibrate(100);
                submitQrDataForVerification(code.data);
              } else {
                setQrDataFromDecoder(null);
                toast({ title: 'Decoding Error', description: 'Could not decode QR code from the uploaded image.', variant: 'destructive' });
                setVerificationAttempted(true); // Show that an attempt was made, even if it failed locally
                 startTransition(() => {
                    const formData = new FormData(); // Empty form
                    formData.append('qrData', ''); // Send empty to signal local failure or no QR
                    formAction(formData); 
                 });
              }
            }
          }
        };
        img.onerror = () => {
            toast({ title: 'Image Error', description: 'Could not load the selected image file.', variant: 'destructive' });
            setVerificationAttempted(true); 
            startTransition(() => { const fd = new FormData(); fd.append('qrData', ''); formAction(fd); }); 
        }
        if (e.target?.result) {
            img.src = e.target.result as string;
        } else {
            toast({ title: 'File Error', description: 'Could not read the selected file.', variant: 'destructive' });
            setVerificationAttempted(true); 
            startTransition(() => { const fd = new FormData(); fd.append('qrData', ''); formAction(fd); }); 
        }
      };
      reader.onerror = () => {
        toast({ title: 'File Error', description: 'Could not read the selected file.', variant: 'destructive' });
        setVerificationAttempted(true); 
        startTransition(() => { const fd = new FormData(); fd.append('qrData', ''); formAction(fd); }); 
      }
      reader.readAsDataURL(file);
    }
  };
  
  const stopCameraScan = useCallback(() => {
    setIsCameraScanning(false); 
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);


  const scanFrame = useCallback(async () => {
    if (!isCameraScanning || !videoRef.current || !canvasRef.current ) {
      if (isCameraScanning) animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }
  
    const video = videoRef.current;
     if (video.paused || video.ended || video.readyState < HTMLMediaElement.HAVE_METADATA || video.videoWidth === 0 || video.videoHeight === 0) {
      if (isCameraScanning) animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      if (isCameraScanning) animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (code && code.data) {
      AudioManager.getInstance().playBeep();
      if (navigator.vibrate) navigator.vibrate(100);
      submitQrDataForVerification(code.data);
      stopCameraScan();
    } else {
      if (isCameraScanning) animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  }, [isCameraScanning, stopCameraScan, toast, submitQrDataForVerification]);


  const startCameraScan = useCallback(async () => {
    setFileName(null); 
    if (fileInputRef.current) { 
      fileInputRef.current.value = "";
    }
    setManualQrDataInput("");
    clearPreviousStateAndSetAttempted(); // Reset state before starting camera
    setHasCameraPermission(null); 

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play(); 
          setIsCameraScanning(true); 
          animationFrameId.current = requestAnimationFrame(scanFrame);
          toast({title: "Camera Started", description: "Point your camera at a QR code."});
        }
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraScanning(false);
        stopCameraScan(); 
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings.',
            });
        } else {
            toast({
              variant: 'destructive',
              title: 'Camera Error',
              description: `Could not access camera: ${error.message || 'Unknown error'}.`,
            });
        }
      }
    } else {
        toast({variant: 'destructive', title: 'Camera Not Supported', description: 'Your browser does not support camera access.'});
        setHasCameraPermission(false); 
        setIsCameraScanning(false);
    }
  }, [scanFrame, toast, stopCameraScan, clearPreviousStateAndSetAttempted]);


  useEffect(() => {
    return () => {
      stopCameraScan();
      // AudioManager handles its own cleanup
    };
  }, [stopCameraScan]);

  const handleManualInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualQrDataInput(event.target.value);
  };

  const handleVerifyManualInput = () => {
    if (!manualQrDataInput.trim()) {
      toast({ title: "Input Empty", description: "Please paste QR data or Short ID into the text area.", variant: "destructive" });
      return;
    }
    stopCameraScan();
    if (fileInputRef.current) fileInputRef.current.value = ""; 
    setFileName(null);
    clearPreviousStateAndSetAttempted(); // Reset state
    submitQrDataForVerification(manualQrDataInput.trim());
  };


  const renderDecryptedContent = (contentData: VerifyQrResult['decryptedContent'], shortId?: string, uuid?: string) => {
    let displayObject: Record<string, any> = {};
    let rawStringContent: string | null = null;

    if (typeof contentData === 'string') {
        try {
            const parsed = JSON.parse(contentData);
            if (typeof parsed === 'object' && parsed !== null) {
                displayObject = parsed;
            } else {
                rawStringContent = contentData;
            }
        } catch (e) {
            rawStringContent = contentData; 
        }
    } else if (typeof contentData === 'object' && contentData !== null) {
        displayObject = contentData;
    }
    
    // Ensure shortId and uuid from the main state are prioritized if available, especially if they came from a failed parse
    if (shortId && (!displayObject.shortId || displayObject.shortId !== shortId) ) displayObject.shortId = shortId;
    if (uuid && (!displayObject.uuid || displayObject.uuid !== uuid)) displayObject.uuid = uuid;


    if (rawStringContent) {
         return <p className="mt-2 text-sm font-mono break-all bg-muted p-3 rounded-md">{rawStringContent}</p>;
    }

    if (Object.keys(displayObject).length > 0) {
        return (
            <div className="space-y-2 mt-2 text-sm bg-muted p-3 rounded-md">
                 {Object.entries(displayObject).map(([key, value]) => (
                    <div key={key} className="flex justify-between flex-wrap items-start">
                        <span className="font-semibold text-foreground mr-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-mono break-all text-muted-foreground text-right max-w-[70%]">{String(value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    // If contentData is undefined or an empty object, but we have a shortId/uuid from the state, show them.
    if(!rawStringContent && Object.keys(displayObject).length === 0 && (shortId || uuid)) {
        return (
             <div className="space-y-2 mt-2 text-sm bg-muted p-3 rounded-md">
                {shortId && (
                    <div className="flex justify-between flex-wrap items-start">
                        <span className="font-semibold text-foreground mr-2">Short ID:</span>
                        <span className="font-mono break-all text-muted-foreground text-right max-w-[70%]">{shortId}</span>
                    </div>
                )}
                {uuid && (
                     <div className="flex justify-between flex-wrap items-start">
                        <span className="font-semibold text-foreground mr-2">UUID:</span>
                        <span className="font-mono break-all text-muted-foreground text-right max-w-[70%]">{uuid}</span>
                    </div>
                )}
            </div>
        );
    }
    return <p className="mt-2 text-sm text-muted-foreground">No decrypted content to display.</p>;
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header /> 
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 flex items-center justify-center gap-3">
            <ScanLine className="h-10 w-10" /> Verify QR Code
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Upload, scan via camera, or paste QR code data/Short ID to verify its authenticity and decrypt its content.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl"><ImageUp className="mr-2 h-6 w-6 text-primary" /> Upload QR Code Image</CardTitle>
              <CardDescription>Select an image file containing the QR code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                id="qrImageUpload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                disabled={isCameraScanning || isPending}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="w-full"
                disabled={isCameraScanning || isPending}
              >
                <Upload className="mr-2 h-4 w-4" /> {fileName || "Choose Image"}
              </Button>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl"><Camera className="mr-2 h-6 w-6 text-primary" /> Scan with Camera</CardTitle>
              <CardDescription>Use your device's camera to scan a QR code directly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {!isCameraScanning ? (
                  <Button onClick={startCameraScan} className="w-full" disabled={isPending}>
                      <Camera className="mr-2 h-4 w-4" /> Start Camera Scan
                  </Button>
              ) : (
                  <Button onClick={stopCameraScan} variant="destructive" className="w-full" disabled={isPending}>
                      <Camera className="mr-2 h-4 w-4" /> Stop Camera Scan
                  </Button>
              )}
              <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                  {hasCameraPermission === false && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-primary-foreground p-4 text-center">
                          <XCircle className="h-12 w-12 mb-2 text-red-400"/>
                          <p className="text-lg font-semibold">Camera Access Problem</p>
                          <p className="text-sm">Camera access denied or an error occurred. Please check browser permissions.</p>
                      </div>
                  )}
                  {hasCameraPermission === null && isCameraScanning && ( 
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-background/80">
                          <Loader2 className="h-12 w-12 mb-2 animate-spin"/>
                          <p>Requesting camera access...</p>
                      </div>
                  )}
                  {hasCameraPermission === true && isCameraScanning && videoRef.current?.paused && ( 
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-background/80">
                          <Loader2 className="h-12 w-12 mb-2 animate-spin"/>
                          <p>Starting camera feed...</p>
                      </div>
                  )}
                   {hasCameraPermission !== false && !isCameraScanning && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                          <Camera className="h-12 w-12 mb-2"/>
                          <p>Camera preview will appear here.</p>
                      </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><ClipboardPaste className="mr-2 h-6 w-6 text-primary" /> Paste QR Data or Short ID</CardTitle>
            <CardDescription>Manually paste the raw QR data string or a 6-character Short ID to verify.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Paste full QR data (e.g., IV$AuthTag$EncryptedData$HMAC) or a 6-character Short ID..."
              value={manualQrDataInput}
              onChange={handleManualInputChange}
              className="min-h-[100px] font-mono text-xs"
              disabled={isPending}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleVerifyManualInput} className="w-full sm:w-auto" disabled={isPending || !manualQrDataInput.trim()}>
              {isPending && manualQrDataInput.trim() ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
              Verify Pasted Data
            </Button>
          </CardFooter>
        </Card>

        {(verificationAttempted || (state.message && state.message !== initialState.message)) && ( 
          <Card className="mt-8 max-w-4xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                {isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> : 
                 state.success ? <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> : <XCircle className="mr-2 h-6 w-6 text-red-500" />}
                Verification Result
              </CardTitle>
              {state.message && <CardDescription>{state.message}</CardDescription>}
              {!state.message && isPending && <CardDescription>Verifying data...</CardDescription>}
            </CardHeader>
            
            {qrDataFromDecoder && !isPending && (
                <CardContent className="pt-0 pb-3">
                    <Label className="text-xs font-semibold text-muted-foreground">Raw Data Submitted for Verification:</Label>
                    <p className="mt-1 text-xs font-mono break-all bg-muted/50 p-2 rounded-md">{qrDataFromDecoder.substring(0,200)}{qrDataFromDecoder.length > 200 ? "..." : ""}</p>
                </CardContent>
            )}

            {(!isPending && state.message) && ( 
              (state.success && state.decryptedContent) || (!state.success && state.decryptedContent) || (!state.success && (state.shortId || state.uuid)) ? (
                <CardContent>
                  <Label className="text-base font-semibold text-foreground">
                    {state.success ? "Decrypted Content:" : "Details (Verification Failed):"}
                  </Label>
                  {renderDecryptedContent(state.decryptedContent, state.shortId, state.uuid)}
                </CardContent>
              ) : !state.success && state.error && ( 
                <CardContent>
                    <p className="text-sm text-destructive">Error details: {state.error}</p>
                     {state.shortId && <p className="text-sm text-muted-foreground mt-1">Short ID from input/payload: {state.shortId}</p>}
                     {state.uuid && <p className="text-sm text-muted-foreground mt-1">UUID from input/payload: {state.uuid}</p>}
                </CardContent>
              )
            )}
          </Card>
        )}
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} CodeSafe QR. All rights reserved.
      </footer>
    </div>
  );
}
