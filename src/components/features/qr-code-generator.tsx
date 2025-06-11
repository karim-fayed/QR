'use client';

import { useState, useEffect, useActionState, ReactNode, useCallback, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, FileImage, FileText, ShieldCheck, ShieldAlert, ShieldX, Info, Palette, CheckCircle, AlertCircle, XCircle, Loader2, Type, FileInput, Tags, Fingerprint } from 'lucide-react';
import { analyzeUrl, createAndSaveQrCode, type QrGenerationResult } from '@/app/actions';
import type { AnalyzeQrDestinationOutput } from '@/ai/flows/analyze-qr-destination';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { debounce } from '@/lib/performance';

// Lazy load heavy components
const Image = dynamic(() => import('next/image'), {
  loading: () => <div className="w-full h-64 bg-muted animate-pulse rounded-lg" />,
});

const Textarea = dynamic(() => import('@/components/ui/textarea').then(mod => ({ default: mod.Textarea })), {
  loading: () => <div className="h-20 bg-muted animate-pulse rounded-md" />,
});

const initialGeneratorState: QrGenerationResult = {
  message: '',
  analysis: undefined,
  error: undefined,
  fieldErrors: undefined,
  qrCodeDataUrl: undefined,
  uuid: undefined,
  shortId: undefined,
  dataTypeProcessed: undefined,
  originalContent: undefined
};

interface SubmitButtonProps {
  formActionFn: (payload: FormData) => void; 
  userId?: string;
  qrName: string;
  destinationUrlOrText: string;
  dataType: 'url' | 'text';
  children: ReactNode;
}

function SubmitButtonWrapper(props: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const { formActionFn, userId, qrName, destinationUrlOrText, dataType, children } = props;

  const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const formData = new FormData();
    formData.append('destinationUrl', destinationUrlOrText);
    formData.append('dataType', dataType);
    formData.append('qrName', qrName);
    if (userId) {
      formData.append('userId', userId);
    }
    // Instead of event.preventDefault() and calling formAction directly,
    // we let the button submit the form it's associated with,
    // and the form's action prop handles calling the correct server action.
    // This button primarily handles assembling FormData.
    // The actual submission is handled by the form.
  };


  return (
    <Button 
      type="submit" // Ensure this submits the form
      disabled={pending || !destinationUrlOrText.trim() || (!!userId && !qrName.trim())} 
      className="w-full"
      // onClick={handleSubmitClick} // onClick is not needed if type="submit" and inside a form
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}


interface QrCodeGeneratorProps {
  userId?: string;
}

export function QrCodeGenerator({ userId }: QrCodeGeneratorProps) {
  const { currentUser } = useAuth();
  const [monthlyQrCount, setMonthlyQrCount] = useState(0);
  const { toast } = useToast();

  const [qrName, setQrName] = useState('');
  const [dataType, setDataType] = useState<'url' | 'text'>('url');
  const [destinationUrlOrText, setDestinationUrlOrText] = useState('');
  
  const [analysisResult, setAnalysisResult] = useState<AnalyzeQrDestinationOutput | null>(null);
  const [generatedQrCodeDataUrl, setGeneratedQrCodeDataUrl] = useState<string | null>(null);
  const [generatedUuid, setGeneratedUuid] = useState<string | null>(null);
  const [generatedShortId, setGeneratedShortId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(''); // Placeholder for logo customization
  const [currentDataTypeProcessed, setCurrentDataTypeProcessed] = useState<'url' | 'text' | undefined>(undefined);
  const [isLimitReached, setIsLimitReached] = useState(false);

  const actionToUse = userId ? createAndSaveQrCode : analyzeUrl;
  const [state, formAction] = useActionState(actionToUse, initialGeneratorState);

  // Get user's subscription plan limits
  const getPlanLimits = () => {
    if (!currentUser) return { monthlyLimit: 10, validityDays: 5 };
    
    switch (currentUser.subscriptionPlan) {
      case 'basic':
        return { monthlyLimit: 100, validityDays: 365 };
      case 'professional':
        return { monthlyLimit: 1000, validityDays: 365 };
      case 'enterprise':
        return { monthlyLimit: Infinity, validityDays: 365 };
      default:
        return { monthlyLimit: 10, validityDays: 5 };
    }
  };

  const { monthlyLimit, validityDays } = getPlanLimits();

  useEffect(() => {
    if (userId) {
      // Fetch user's monthly QR code count
      const fetchMonthlyCount = async () => {
        try {
          const response = await fetch(`/api/users/${userId}/qr-count`);
          const data = await response.json();
          setMonthlyQrCount(data.count);
          setIsLimitReached(data.count >= monthlyLimit);
        } catch (error) {
          console.error('Error fetching QR count:', error);
          // Use the count from the user object as fallback
          setMonthlyQrCount(currentUser?.monthlyQrCount || 0);
          setIsLimitReached((currentUser?.monthlyQrCount || 0) >= monthlyLimit);
        }
      };
      
      fetchMonthlyCount();
    }
  }, [userId, monthlyLimit, currentUser?.monthlyQrCount]);

  useEffect(() => {
    if (state.message && state.message !== initialGeneratorState.message) {
      if(state.error || state.fieldErrors) {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: state.message,
        });
      }
    }
  }, [state.message, state.error, state.fieldErrors, toast]);

  const handleDataInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDestinationUrlOrText(e.target.value);
    // Don't clear results immediately on input change, let submission do that
  };

  const handleDataTypeChange = (value: string) => {
    const newDataType = value as 'url' | 'text';
    setDataType(newDataType);
    setDestinationUrlOrText(''); 
    // Clear previous results when data type changes as it implies new input
    setGeneratedQrCodeDataUrl(null);
    setGeneratedUuid(null);
    setGeneratedShortId(null); 
    setAnalysisResult(null);
    setCurrentDataTypeProcessed(newDataType); 
  }

  const getAnalysisResultIcon = (action?: string) => {
    if (!action) return <Info className="h-5 w-5 text-muted-foreground" />;
    switch (action) {
      case 'allow':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rewrite':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'refuse':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getAnalysisResultColor = (action?: string) => {
    if (!action) return 'border-muted-foreground/50';
    switch (action) {
      case 'allow':
        return 'border-green-500/50';
      case 'rewrite':
        return 'border-yellow-500/50';
      case 'refuse':
        return 'border-red-500/50';
      default:
        return 'border-muted-foreground/50';
    }
  };

  const handleDownload = (fileExtension: 'png' | 'pdf') => {
    if (!generatedQrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = generatedQrCodeDataUrl;
    // Use QR name if available, otherwise shortId or UUID
    const baseFileName = qrName || generatedShortId || generatedUuid || Date.now();
    const fileName = `CodeSafe-QR-${baseFileName}.${fileExtension}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (fileExtension === 'pdf') {
        toast({
            title: "PDF Download Started (Image)",
            description: "Note: This is the QR image saved as a .pdf. True PDF generation for printing is a future enhancement.",
            duration: 5000,
        });
    }
  };
  
  const createFormData = () => {
    const formData = new FormData();
    formData.append('destinationUrl', destinationUrlOrText);
    formData.append('dataType', dataType);
    formData.append('qrName', qrName);
    if (userId) {
      formData.append('userId', userId);
    }
    return formData;
  };


  return (
    <form 
      action={(formData) => { // Pass formData directly
        // Clear previous visual state before new submission
        setGeneratedQrCodeDataUrl(null);
        setGeneratedUuid(null);
        setGeneratedShortId(null);
        setAnalysisResult(null);
        formAction(formData);
      }} 
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start"
    >
       {/* Hidden inputs to pass all necessary data if SubmitButtonWrapper doesn't handle it */}
      <input type="hidden" name="destinationUrl" value={destinationUrlOrText} />
      <input type="hidden" name="dataType" value={dataType} />
      <input type="hidden" name="qrName" value={qrName} />
      {userId && <input type="hidden" name="userId" value={userId} />}

      <div className="space-y-4 lg:space-y-6">
        {isLimitReached && (
          <Alert variant="destructive">
            <AlertTitle>Monthly Limit Reached</AlertTitle>
            <AlertDescription>
              You have reached your monthly limit of {monthlyLimit} QR codes. 
              {currentUser?.subscriptionPlan === 'free' && (
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href="/pricing">Upgrade your plan</Link>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {!isLimitReached && userId && (
          <Alert>
            <AlertTitle>Monthly Usage</AlertTitle>
            <AlertDescription>
              You have created {monthlyQrCount} out of {monthlyLimit} QR codes this month.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl lg:text-2xl">
            <FileInput className="mr-2 h-5 w-5 lg:h-6 lg:w-6 text-primary" /> QR Code Details
          </CardTitle>
          <CardDescription>
            Enter the necessary information to generate your secure QR code.
            {userId && " This QR code will be saved to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="qrNameInput">QR Code Name {userId ? "(Required)" : "(Optional)"}</Label>
            <Input
              id="qrNameInput" // Changed ID to avoid conflict with name attribute
              // name="qrName" // Name attribute is on hidden input
              placeholder="e.g., My Website Link"
              value={qrName}
              onChange={(e) => setQrName(e.target.value)}
              required={!!userId}
            />
             {state.fieldErrors?.qrName && (
              <p className="text-sm text-destructive">{state.fieldErrors.qrName.join(', ')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataTypeSelect" className="flex items-center gap-1.5"><Type className="h-4 w-4 text-muted-foreground"/>Data Type</Label>
            <Select 
              // name="dataType" // Name attribute is on hidden input
              value={dataType} 
              onValueChange={handleDataTypeChange}
            >
              <SelectTrigger id="dataTypeSelect">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
             {state.fieldErrors?.dataType && (
              <p className="text-sm text-destructive">{state.fieldErrors.dataType.join(', ')}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destinationUrlOrTextInput">
              {dataType === 'url' ? 'Destination URL' : 'Text Content'} (Required)
            </Label>
            {dataType === 'url' ? (
              <Input
                id="destinationUrlOrTextInput" 
                // name="destinationUrl" // Name attribute is on hidden input
                type="url"
                placeholder={'https://example.com'}
                value={destinationUrlOrText}
                onChange={handleDataInputChange}
                required
                className="text-base py-2.5"
              />
            ) : (
              <Textarea
                id="destinationUrlOrTextInput"
                // name="destinationUrl" // Name attribute is on hidden input
                placeholder={'Enter your text here'}
                value={destinationUrlOrText}
                onChange={handleDataInputChange}
                required
                className="text-base py-2.5 min-h-[100px]"
              />
            )}
            {state.fieldErrors?.destinationUrl && (
              <p className="text-sm text-destructive">{state.fieldErrors.destinationUrl.join(', ')}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
           <SubmitButtonWrapper 
            formActionFn={formAction}
            userId={userId}
            qrName={qrName}
            destinationUrlOrText={destinationUrlOrText}
            dataType={dataType}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {userId ? "Analyze, Generate & Save QR" : "Analyze & Generate QR"}
          </SubmitButtonWrapper>
        </CardFooter>
      </Card>

      <Card className="shadow-lg lg:sticky lg:top-6 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center text-xl lg:text-2xl">
            <Palette className="mr-2 h-5 w-5 lg:h-6 lg:w-6 text-primary" /> Preview & Options
          </CardTitle>
           <CardDescription>Your generated QR code and customization settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
          {generatedQrCodeDataUrl ? (
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/10">
              <Image
                src={generatedQrCodeDataUrl}
                alt="Generated QR Code"
                data-ai-hint="qr code"
                width={250}
                height={250}
                className="rounded-md shadow-md w-full max-w-[250px] h-auto"
              />
              {generatedShortId && (
                <div className="mt-3 p-2 border rounded-md bg-muted/30 w-full text-center">
                  <Label htmlFor="generatedShortIdDisplay" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Tags className="h-4 w-4"/> Short ID</Label>
                  <p id="generatedShortIdDisplay" className="text-xs font-mono break-all mt-1 text-foreground">{generatedShortId}</p>
                </div>
              )}
              {generatedUuid && (
                <div className="mt-2 p-2 border rounded-md bg-muted/30 w-full text-center">
                  <Label htmlFor="generatedUuidDisplay" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Fingerprint className="h-4 w-4"/> Unique ID</Label>
                  <p id="generatedUuidDisplay" className="text-xs font-mono break-all mt-1 text-foreground">{generatedUuid}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/10 min-h-[250px]">
              <QrCode className="h-20 w-20 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {state.error && state.message !== 'Server configuration error.' || (analysisResult && analysisResult.suggestedAction === 'refuse') 
                  ? "QR code cannot be displayed." 
                  : state.message === 'Server configuration error.' && !generatedQrCodeDataUrl
                  ? "QR code cannot be displayed."
                  : "QR code will appear here after generation."}
              </p>
            </div>
          )}

          {state.message === 'Server configuration error.' && state.error && !generatedQrCodeDataUrl && (
            <Alert variant="destructive" className="mt-0 mb-4"> 
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs sm:text-sm">Advanced</TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs sm:text-sm">Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="appearance" className="pt-3 lg:pt-4">
              <div className="space-y-3 lg:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrlInput">Logo URL (Optional)</Label>
                  <Input 
                    id="logoUrlInput" 
                    // name="logoUrl" // Not part of form submission for now
                    type="url" 
                    placeholder="https://example.com/logo.png" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">Embed a logo in the center (feature coming soon).</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="advanced" className="pt-3 lg:pt-4">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <Label htmlFor="singleUseSwitch" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Single Use QR</Label>
                  <Switch id="singleUseSwitch" name="singleUse" />
                </div>
                 <p className="text-xs text-muted-foreground pl-3">Feature coming soon.</p>
              </div>
            </TabsContent>
            <TabsContent value="analysis" className="pt-3 lg:pt-4">
              {analysisResult && currentDataTypeProcessed === 'url' ? (
                <Card className={`border-2 ${getAnalysisResultColor(analysisResult.suggestedAction)} bg-muted/10`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      {getAnalysisResultIcon(analysisResult.suggestedAction)}
                      <span className="ml-2">Destination Analysis</span>
                    </CardTitle>
                    <CardDescription>
                      Suggested Action: <strong className={`font-semibold ${
                        analysisResult.suggestedAction === 'allow' ? 'text-green-600' :
                        analysisResult.suggestedAction === 'rewrite' ? 'text-yellow-600' :
                        analysisResult.suggestedAction === 'refuse' ? 'text-red-600' : 'text-foreground'
                      }`}>{analysisResult.suggestedAction.toUpperCase()}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="contentSummaryDisplay" className="font-semibold text-sm">Content Summary</Label>
                      <Textarea id="contentSummaryDisplay" value={analysisResult.contentSummary} readOnly className="mt-1 min-h-[60px] text-xs bg-background"/>
                    </div>
                    <div>
                      <Label htmlFor="safetyAssessmentDisplay" className="font-semibold text-sm">Safety Assessment</Label>
                      <Textarea id="safetyAssessmentDisplay" value={analysisResult.safetyAssessment} readOnly className="mt-1 min-h-[80px] text-xs bg-background"/>
                    </div>
                  </CardContent>
                </Card>
              ) : currentDataTypeProcessed === 'text' ? (
                 <div className="text-center py-6 text-muted-foreground">
                  <Info className="mx-auto h-8 w-8 mb-2" />
                  <p>AI Analysis is not applicable for text content.</p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Info className="mx-auto h-8 w-8 mb-2" />
                  <p>AI analysis results for URLs will appear here after submission.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:gap-2 pt-4 lg:pt-6">
          <Button 
            type="button" // Important: prevent form submission
            variant="outline" 
            className="w-full sm:w-auto" 
            disabled={!generatedQrCodeDataUrl}
            onClick={() => handleDownload('png')}
          >
            <FileImage className="mr-2 h-4 w-4" /> Export PNG
          </Button>
          <Button 
            type="button" // Important: prevent form submission
            variant="outline" 
            className="w-full sm:w-auto" 
            disabled={!generatedQrCodeDataUrl}
            onClick={() => handleDownload('pdf')}
          >
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </CardFooter>
      </Card>
      
      {state.error && state.message !== 'Server configuration error.' && !state.fieldErrors && !generatedQrCodeDataUrl && (
         <Alert variant="destructive" className="md:col-span-2 shadow-md mt-4">
          <ShieldX className="h-5 w-5" />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription>
            {state.message || state.error}
            {analysisResult && analysisResult.suggestedAction === 'refuse' && (
              <>
                <br /> Based on the AI analysis, this URL is not recommended for QR code generation.
                Reason: {analysisResult.safetyAssessment}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      {state.message === 'Server configuration error.' && state.error && !state.fieldErrors && !generatedQrCodeDataUrl && (
         <Alert variant="destructive" className="md:col-span-2 shadow-md mt-4">
          <ShieldX className="h-5 w-5" />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription>
            {state.message}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
