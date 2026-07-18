'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVyaparStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const token = useVyaparStore((state) => state.token);

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-2">
        <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground font-mono">Redirecting to VyaparAI...</span>
      </div>
    </div>
  );
}
