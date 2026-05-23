'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Critical Error</h1>
          <p className="text-muted-foreground mb-6">
            {error.message || 'A critical error occurred.'}
          </p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </body>
    </html>
  );
}
