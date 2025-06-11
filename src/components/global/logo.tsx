import { QrCode } from 'lucide-react';
import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'lg' ? 'h-10 w-10' : size === 'md' ? 'h-8 w-8' : 'h-6 w-6';
  const textSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl';

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <QrCode className={`${iconSize} text-primary group-hover:text-accent transition-colors`} />
      <span className={`font-bold ${textSize} text-foreground group-hover:text-primary transition-colors`}>
        CodeSafe QR
      </span>
    </Link>
  );
}
