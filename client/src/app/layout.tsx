'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AIChatModal from '@/components/AIChatModal';
import { Toaster } from 'react-hot-toast';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, WifiOff, Volume2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import '@/app/globals.css';

// Create Query Client
const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, isOffline, setOfflineStatus, syncQueue, emergencyMode } = useVyaparStore();
  const [chatOpen, setChatOpen] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(false);
      toast.success('Internet connection restored!');
      vyaparApi.syncQueueExecutor();
    };

    const handleOffline = () => {
      setOfflineStatus(true);
      toast.error('Connection lost. Operating in local-first backup mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOfflineStatus(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trigger sync queue on load or change
  useEffect(() => {
    if (!isOffline && !emergencyMode && syncQueue.length > 0) {
      vyaparApi.syncQueueExecutor();
    }
  }, [isOffline, emergencyMode, syncQueue.length]);

  // Auth Guard — public routes don't require a token
  const publicRoutes = ['/login', '/register'];
  useEffect(() => {
    if (!token && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [token, pathname]);

  // AI Voice Dashboard Call Handler (synthesizing sound)
  const triggerVoiceBriefing = async () => {
    toast('Generating voice call summary...', { icon: '🎙️' });
    try {
      const res = await vyaparApi.getVoiceCallSummary();
      if (res.success && res.text) {
        // Read out loud using SpeechSynthesis
        const speech = new SpeechSynthesisUtterance(res.text);
        speech.lang = 'en-IN';
        speech.rate = 1.0;
        speech.pitch = 1.0;
        window.speechSynthesis.speak(speech);
        toast.success('Voicing daily summary!');
      }
    } catch {
      toast.error('Voice synthesis failed.');
    }
  };

  const isPublicPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-neutral-950 text-white selection:bg-indigo-500 selection:text-white">
        <QueryClientProvider client={queryClient}>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'glass text-white border-white/5',
              style: {
                background: '#0c0c0e',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontSize: '13px'
              }
            }}
          />
          {isPublicPage ? (
            <main>{children}</main>
          ) : (
            <div className="flex min-h-screen">
              <Sidebar onAIChatOpen={() => setChatOpen(true)} />
              <div className="flex-1 flex flex-col min-w-0">
                <Header 
                  onVoiceSummaryTrigger={triggerVoiceBriefing} 
                  onAIChatOpen={() => setChatOpen(true)} 
                />
                <main className="flex-1 p-6 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          )}

          {/* AI Decision Chat Assist */}
          <AIChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
