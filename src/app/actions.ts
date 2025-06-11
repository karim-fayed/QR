
// 'use server';
'use server';

import { analyzeQrDestination as analyzeQrDestinationFlow, type AnalyzeQrDestinationInput, type AnalyzeQrDestinationOutput } from '@/ai/flows/analyze-qr-destination';
import { z } from 'zod';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Schema for general QR data input (used by public generator)
const QrDataInputSchema = z.object({
  destinationUrl: z.string().min(1, { message: "Content cannot be empty." }),
  dataType: z.enum(['url', 'text'], { required_error: "Data type is required." }),
  qrName: z.string().optional(), // For public, name is optional and not saved unless authenticated
});

// Schema for QR data input when saving to Firestore (used by authenticated generator)
const SaveQrDataInputSchema = z.object({
  userId: z.string().min(1, {message: "User ID is required."}),
  destinationUrl: z.string().min(1, { message: "Content cannot be empty." }),
  dataType: z.enum(['url', 'text'], { required_error: "Data type is required." }),
  qrName: z.string().min(1, {message: "QR Code name is required for saved codes."}),
});


export interface QrGenerationResult {
  message: string;
  analysis?: AnalyzeQrDestinationOutput;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  qrCodeDataUrl?: string;
  uuid?: string;
  shortId?: string;
  dataTypeProcessed?: 'url' | 'text';
  originalContent?: string; // Added to ensure original content is part of the result
}


// AES-256-GCM encryption helper
async function encryptData(text: string, keyBase64: string): Promise<string | null> {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    if (key.length !== 32) {
      console.error('Invalid AES key length. Must be 256-bit (32 bytes).');
      return null;
    }
    const iv = crypto.randomBytes(12); // GCM recommended IV size is 12 bytes
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}$${authTag.toString('base64')}$${encryptedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

// HMAC-SHA256 generation helper
function generateHmac(data: string, keyBase64: string): string | null {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data, 'utf8'); 
    return hmac.digest('base64');
  } catch (error) {
    console.error('HMAC generation failed:', error);
    return null;
  }
}

// --- Common QR Processing Logic (Encryption, Signing, Image Generation) ---
async function processAndGenerateQr(
  dataToProcess: string, 
  dataType: 'url' | 'text', 
  uuid: string, 
  shortId: string,
  aesKeyBase64: string,
  hmacKeyBase64: string
): Promise<{ qrCodeDataUrl?: string, encryptedPayloadString?: string, error?: string }> {
  
  const payloadToEncrypt = JSON.stringify({
    content: dataToProcess,
    type: dataType,
    uuid: uuid,
    shortId: shortId,
    timestamp: Date.now() 
  });

  const encryptedPayload = await encryptData(payloadToEncrypt, aesKeyBase64);
  if (!encryptedPayload) {
    return { error: 'Could not encrypt data for QR code. Please try again.' };
  }

  const hmacSignature = generateHmac(encryptedPayload, hmacKeyBase64);
  if (!hmacSignature) {
    return { error: 'Could not sign data for QR code. Please try again.' };
  }
  
  const qrDataString = `${encryptedPayload}$${hmacSignature}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });
    return { qrCodeDataUrl, encryptedPayloadString: qrDataString };
  } catch (qrError: any) {
      console.error('Error generating QR code image:', qrError);
      return { error: `Could not generate QR code image: ${qrError.message || 'Unknown QR generation error.'}`};
  }
}

// --- PUBLIC QR Code Generation (No Database Save) ---
export async function analyzeUrl(prevState: any, formData: FormData): Promise<QrGenerationResult> {
  const validatedFields = QrDataInputSchema.safeParse({
    destinationUrl: formData.get('destinationUrl'),
    dataType: formData.get('dataType'),
    qrName: formData.get('qrName'), // Optional for public
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      error: 'Invalid data provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { destinationUrl, dataType } = validatedFields.data;
  const newUuid = crypto.randomUUID();
  const shortId = newUuid.substring(0, 6).toUpperCase();

  const aesKeyBase64 = process.env.AES_ENCRYPTION_KEY;
  const hmacKeyBase64 = process.env.HMAC_SECRET_KEY;

  if (!aesKeyBase64 || aesKeyBase64 === "your_strong_base64_encoded_aes_256_key_here" ||
      !hmacKeyBase64 || hmacKeyBase64 === "your_strong_base64_encoded_hmac_secret_key_here") {
    console.error("AES_ENCRYPTION_KEY or HMAC_SECRET_KEY is not set or is using placeholder values.");
    return { 
        message: 'Server configuration error.', 
        error: 'Encryption/signing keys not configured. Please contact support.',
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
    };
  }
  try {
    Buffer.from(aesKeyBase64, 'base64');
    Buffer.from(hmacKeyBase64, 'base64');
  } catch (e) {
    console.error('Error decoding AES or HMAC key from base64:', e);
    return { 
        message: 'Server configuration error.', 
        error: 'Invalid encryption/signing key format. Please contact support.',
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
    };
  }

  let analysisResult: AnalyzeQrDestinationOutput | undefined = undefined;
  let proceedToQrGeneration = false;
  let successMessage = '';
  let finalErrorMessage: string | undefined = undefined;
  let dataToProcess = destinationUrl;

  if (dataType === 'url') {
    const urlCheck = z.string().url({ message: "The provided URL is invalid." }).safeParse(destinationUrl);
    if (!urlCheck.success) {
      return {
        message: 'Validation failed for URL.',
        error: 'Invalid URL format.',
        fieldErrors: { destinationUrl: urlCheck.error.flatten().fieldErrors._errors },
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
      };
    }

    const aiInput: AnalyzeQrDestinationInput = { destinationUrl };
    try {
      const result = await analyzeQrDestinationFlow(aiInput);
      analysisResult = result;
      if (result.suggestedAction === 'allow' || result.suggestedAction === 'rewrite') {
        proceedToQrGeneration = true;
        successMessage = 'AI analysis complete. Secure QR Code generated.';
      } else {
        finalErrorMessage = 'AI analysis complete. QR Code generation refused based on AI assessment.';
      }
    } catch (aiError: any) {
      console.error('Error analyzing QR destination:', aiError);
      finalErrorMessage = `Could not analyze the URL: ${aiError.message || 'AI service error.'}`;
    }
  } else { 
    proceedToQrGeneration = true;
    successMessage = 'Secure QR Code generated for your text content.';
  }

  if (finalErrorMessage) {
    return {
      message: 'Operation failed.',
      error: finalErrorMessage,
      analysis: analysisResult,
      dataTypeProcessed: dataType,
      originalContent: destinationUrl,
    };
  }

  if (proceedToQrGeneration) {
    const qrProcessResult = await processAndGenerateQr(dataToProcess, dataType, newUuid, shortId, aesKeyBase64, hmacKeyBase64);

    if (qrProcessResult.error || !qrProcessResult.qrCodeDataUrl) {
       return { 
          message: 'Operation failed.', 
          error: qrProcessResult.error || 'Could not generate QR code image.', 
          analysis: analysisResult,
          dataTypeProcessed: dataType,
          originalContent: destinationUrl,
      };
    }
    
    return { 
      message: successMessage, 
      analysis: analysisResult, 
      qrCodeDataUrl: qrProcessResult.qrCodeDataUrl,
      uuid: newUuid,
      shortId: shortId,
      dataTypeProcessed: dataType,
      originalContent: destinationUrl,
    };

  } else {
     return { 
        message: 'QR Code generation was not performed.', 
        error: 'Could not proceed with QR code generation.',
        analysis: analysisResult, 
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
    };
  }
}


// --- AUTHENTICATED QR Code Generation (Saves to Firestore) ---
export async function createAndSaveQrCode(prevState: any, formData: FormData): Promise<QrGenerationResult> {
  const validatedFields = SaveQrDataInputSchema.safeParse({
    userId: formData.get('userId'),
    destinationUrl: formData.get('destinationUrl'),
    dataType: formData.get('dataType'),
    qrName: formData.get('qrName'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed for saving QR code.',
      error: 'Invalid data provided for authenticated user.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { userId, destinationUrl, dataType, qrName } = validatedFields.data;
  const newUuid = crypto.randomUUID();
  const shortId = newUuid.substring(0, 6).toUpperCase();

  const aesKeyBase64 = process.env.AES_ENCRYPTION_KEY;
  const hmacKeyBase64 = process.env.HMAC_SECRET_KEY;

  if (!aesKeyBase64 || aesKeyBase64 === "your_strong_base64_encoded_aes_256_key_here" ||
      !hmacKeyBase64 || hmacKeyBase64 === "your_strong_base64_encoded_hmac_secret_key_here") {
    console.error("AES_ENCRYPTION_KEY or HMAC_SECRET_KEY is not set or is using placeholder values.");
    return { 
        message: 'Server configuration error.', 
        error: 'Encryption/signing keys not configured. Please contact support.',
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
    };
  }
   try {
    Buffer.from(aesKeyBase64, 'base64');
    Buffer.from(hmacKeyBase64, 'base64');
  } catch (e) {
    console.error('Error decoding AES or HMAC key from base64:', e);
    return { 
        message: 'Server configuration error.', 
        error: 'Invalid encryption/signing key format. Please contact support.',
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
    };
  }


  let analysisResult: AnalyzeQrDestinationOutput | undefined = undefined;
  let proceedToQrGeneration = false;
  let successMessage = '';
  let finalErrorMessage: string | undefined = undefined;
  let dataToProcess = destinationUrl;

  if (dataType === 'url') {
    const urlCheck = z.string().url({ message: "The provided URL is invalid." }).safeParse(destinationUrl);
    if (!urlCheck.success) {
      return {
        message: 'Validation failed for URL.',
        error: 'Invalid URL format.',
        fieldErrors: { destinationUrl: urlCheck.error.flatten().fieldErrors._errors },
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
      };
    }
    const aiInput: AnalyzeQrDestinationInput = { destinationUrl };
    try {
      const result = await analyzeQrDestinationFlow(aiInput);
      analysisResult = result;
      if (result.suggestedAction === 'allow' || result.suggestedAction === 'rewrite') {
        proceedToQrGeneration = true;
        // Message will be set after DB save
      } else {
        finalErrorMessage = 'AI analysis complete. QR Code generation and saving refused based on AI assessment.';
      }
    } catch (aiError: any) {
      console.error('Error analyzing QR destination:', aiError);
      finalErrorMessage = `Could not analyze the URL: ${aiError.message || 'AI service error.'}`;
    }
  } else { 
    proceedToQrGeneration = true;
    // Message will be set after DB save
  }

  if (finalErrorMessage) {
    return {
      message: 'Operation failed.',
      error: finalErrorMessage,
      analysis: analysisResult,
      dataTypeProcessed: dataType,
      originalContent: destinationUrl,
    };
  }

  if (proceedToQrGeneration) {
    const qrProcessResult = await processAndGenerateQr(dataToProcess, dataType, newUuid, shortId, aesKeyBase64, hmacKeyBase64);

    if (qrProcessResult.error || !qrProcessResult.qrCodeDataUrl || !qrProcessResult.encryptedPayloadString) {
       return { 
          message: 'Operation failed during QR processing.', 
          error: qrProcessResult.error || 'Could not generate QR code image or encrypted payload.', 
          analysis: analysisResult,
          dataTypeProcessed: dataType,
          originalContent: destinationUrl,
      };
    }
    
    // Save to Firestore
    try {
      await addDoc(collection(db, "qrcodes"), {
        userId,
        name: qrName,
        shortId,
        uuid: newUuid,
        originalContent: dataToProcess,
        dataType,
        encryptedPayload: qrProcessResult.encryptedPayloadString, // Save the full IV$AuthTag$EncData$HMAC string
        qrCodeDataUrl: qrProcessResult.qrCodeDataUrl, // For quick display if needed, though can be regenerated
        createdAt: serverTimestamp(),
        status: "Active", // Default status
        scans: 0, // Initial scan count
      });
      successMessage = dataType === 'url' 
        ? 'AI analysis complete. Secure QR Code generated and saved.' 
        : 'Secure QR Code generated and saved for your text content.';
      
      return { 
        message: successMessage, 
        analysis: analysisResult, 
        qrCodeDataUrl: qrProcessResult.qrCodeDataUrl,
        uuid: newUuid,
        shortId: shortId,
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
      };
    } catch (dbError: any) {
      console.error("Error saving QR code to Firestore:", dbError);
      return {
        message: 'Operation failed.',
        error: `QR code generated but could not be saved to database: ${dbError.message || 'Firestore error.'}`,
        analysis: analysisResult,
        qrCodeDataUrl: qrProcessResult.qrCodeDataUrl, // Still return generated QR if DB fails
        uuid: newUuid,
        shortId: shortId,
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
      }
    }

  } else {
     return { 
        message: 'QR Code generation was not performed.', 
        error: 'Could not proceed with QR code generation and saving.',
        analysis: analysisResult, 
        dataTypeProcessed: dataType,
        originalContent: destinationUrl,
    };
  }
}


// --- QR Code Verification Logic ---

export interface VerifyQrResult {
  success: boolean;
  message: string;
  decryptedContent?: {
    content: string;
    type: 'url' | 'text';
    uuid: string;
    shortId: string;
    timestamp: number;
  } | string; 
  error?: string;
  uuid?: string; 
  shortId?: string;
  contentType?: 'url' | 'text';
  timestamp?: number;
}

// Helper function to decrypt data
async function decryptData(encryptedPayloadString: string, keyBase64: string): Promise<string | null> {
  try {
    const parts = encryptedPayloadString.split('$');
    if (parts.length !== 3) { // IV, AuthTag, EncryptedData
      console.error('Invalid encrypted payload format for decryption. Expected IV$AuthTag$EncryptedData.');
      return null;
    }
    const [ivBase64, authTagBase64, encryptedDataB64] = parts;

    const key = Buffer.from(keyBase64, 'base64');
    if (key.length !== 32) {
      console.error('Invalid AES key length. Must be 256-bit (32 bytes).');
      return null;
    }
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encryptedData = Buffer.from(encryptedDataB64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decryptedBuffer.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    return null; 
  }
}

const VerifyQrInputSchema = z.object({
  qrData: z.string().min(1, { message: "QR data cannot be empty." }),
});

const shortIdRegex = /^[A-Z0-9]{6}$/;

export async function decryptAndVerifyQrData(prevState: any, formData: FormData): Promise<VerifyQrResult> {
  const validatedFields = VerifyQrInputSchema.safeParse({
    qrData: formData.get('qrData'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed for QR data.',
      error: 'Invalid QR data provided.',
    };
  }

  const { qrData } = validatedFields.data;

  if (shortIdRegex.test(qrData)) {
    // TODO: Implement database lookup for short ID
    // For now, inform the user this isn't fully implemented for decryption path
    return {
      success: false,
      message: `Verifying by Short ID (${qrData}) is not fully implemented.`,
      error: 'This feature requires database integration to retrieve the full QR data. Please paste the complete QR data string for decryption.',
      shortId: qrData,
    };
  }


  const aesKeyBase64 = process.env.AES_ENCRYPTION_KEY;
  const hmacKeyBase64 = process.env.HMAC_SECRET_KEY;

  if (!aesKeyBase64 || aesKeyBase64 === "your_strong_base64_encoded_aes_256_key_here" ||
      !hmacKeyBase64 || hmacKeyBase64 === "your_strong_base64_encoded_hmac_secret_key_here") {
    console.error("Server-side keys for decryption/verification are not configured properly.");
    return {
      success: false,
      message: 'Verification failed due to server configuration error.',
      error: 'Server keys not configured.',
    };
  }
  
  try {
      Buffer.from(aesKeyBase64, 'base64');
      Buffer.from(hmacKeyBase64, 'base64');
  } catch (e) {
      console.error('Error decoding server-side AES or HMAC key from base64:', e);
      return {
          success: false,
          message: 'Verification failed due to server configuration error.',
          error: 'Invalid server key format.',
      };
  }

  const parts = qrData.split('$');
  // Expected format: IV$AuthTag$EncryptedData$HMACSignature
  // So, after splitting by '$', we should have 4 parts for the full string.
  // The encryptedPayloadString for HMAC calculation is IV$AuthTag$EncryptedData (first 3 parts)
  if (parts.length !== 4) {
    return {
      success: false,
      message: 'Invalid QR code structure.',
      error: 'QR data format is incorrect. Expected IV$AuthTag$EncryptedData$HMACSignature.',
    };
  }

  const [ivBase64, authTagBase64, encryptedDataB64, hmacSignatureFromQr] = parts;
  const encryptedPayloadForHmac = `${ivBase64}$${authTagBase64}$${encryptedDataB64}`;
  // The string for decryption does not include the HMAC, so it's also these first 3 parts.
  const encryptedPayloadForDecryption = encryptedPayloadForHmac;


  const calculatedHmac = generateHmac(encryptedPayloadForHmac, hmacKeyBase64);
  if (!calculatedHmac) {
    return {
      success: false,
      message: 'HMAC generation failed during verification.',
      error: 'Could not calculate HMAC for verification.',
    };
  }

  let uuidFromPayload, shortIdFromPayloadFromPeek;
  if (calculatedHmac !== hmacSignatureFromQr) {
    try {
        // Try to decrypt even if HMAC fails, just to extract ShortID/UUID for logging if possible
        const quickPeek = await decryptData(encryptedPayloadForDecryption, aesKeyBase64);
        if (quickPeek) {
            const parsedQuickPeek = JSON.parse(quickPeek);
            uuidFromPayload = parsedQuickPeek.uuid;
            shortIdFromPayloadFromPeek = parsedQuickPeek.shortId;
        }
    } catch { /* ignore if cannot peek */ }

    return {
      success: false,
      message: 'QR Code Verification Failed: Data Tampered.',
      error: 'HMAC signature mismatch. The QR code data may have been altered.',
      uuid: uuidFromPayload,
      shortId: shortIdFromPayloadFromPeek,
    };
  }

  const decryptedJsonString = await decryptData(encryptedPayloadForDecryption, aesKeyBase64);

  if (!decryptedJsonString) {
    return {
      success: false,
      message: 'QR Code Verification Failed: Decryption Error.',
      error: 'Could not decrypt the QR code data. The key might be incorrect or data corrupted.',
    };
  }

  try {
    const decryptedContent = JSON.parse(decryptedJsonString) as {
      content: string;
      type: 'url' | 'text';
      uuid: string;
      shortId: string;
      timestamp: number;
    };

    return {
      success: true,
      message: 'QR Code Verified & Decrypted Successfully.',
      decryptedContent,
      uuid: decryptedContent.uuid,
      shortId: decryptedContent.shortId,
      contentType: decryptedContent.type,
      timestamp: decryptedContent.timestamp,
    };
  } catch (e) {
    console.error("Error parsing decrypted JSON:", e);
    return {
      success: false,
      message: 'QR Code Verification Failed: Invalid Decrypted Content.',
      error: 'Decrypted data is not in the expected JSON format.',
      decryptedContent: decryptedJsonString, 
    };
  }
}
