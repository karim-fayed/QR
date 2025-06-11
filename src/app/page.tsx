
import { Header } from '@/components/global/header';
import { QrCodeGenerator } from '@/components/features/qr-code-generator';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

export default function HomePage() {
  // Freemium Model Placeholder: Determine if ads should be shown
  const showAds = true; // This would depend on user authentication and subscription status

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Secure & Smart QR Codes
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Generate encrypted, tamper-proof QR codes with advanced AI analysis. Ensure your links are safe and your data is protected.
          </p>
        </section>
        
        {showAds && (
          <Alert className="mb-8 bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300">
            <Info className="h-5 w-5" />
            <AlertTitle>Advertisement</AlertTitle>
            <AlertDescription>
              This is a placeholder for an ad. Upgrade to a premium plan to remove ads and unlock more features!
            </AlertDescription>
          </Alert>
        )}
        
        <Separator className="my-8" />

        <QrCodeGenerator /> {/* Public generator, does not save to DB */}
        
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} CodeSafe QR. All rights reserved.
      </footer>
    </div>
  );
}
