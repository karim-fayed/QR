import { Logo } from "@/components/global/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <main className="w-full max-w-md">
        {children}
      </main>
       <footer className="py-6 text-center text-muted-foreground text-sm mt-auto">
        © {new Date().getFullYear()} CodeSafe QR. All rights reserved.
      </footer>
    </div>
  );
}
