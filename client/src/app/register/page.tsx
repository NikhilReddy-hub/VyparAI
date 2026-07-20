'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { ShieldCheck, UserCheck, KeyRound, Phone, Sparkles, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type ServerStatus = 'checking' | 'online' | 'offline' | 'waking';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useVyaparStore((state) => state.setAuth);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'owner',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

  // Pre-warm: ping Render until it wakes up — retry every 15s
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const ping = async () => {
      if (cancelled) return;
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // Strip /api suffix to get base URL
      const BASE = API.replace(/\/api$/, '');
      try {
        // Try /api/health first, fall back to root /
        const ctrl = new AbortController();
        const killTimer = setTimeout(() => ctrl.abort(), 15000); // 15s per attempt
        const res = await fetch(`${BASE}/api/health`, { signal: ctrl.signal }).catch(() =>
          fetch(BASE, { signal: ctrl.signal })
        );
        clearTimeout(killTimer);
        if (!cancelled && res.ok) {
          setServerStatus('online');
          return; // success — stop retrying
        }
      } catch {
        // still sleeping — retry
      }
      if (!cancelled) {
        setServerStatus('waking');
        retryTimer = setTimeout(ping, 8000); // retry in 8s
      }
    };

    setServerStatus('checking');
    setTimeout(() => { if (!cancelled) setServerStatus('waking'); }, 3000);
    ping();
    return () => { cancelled = true; clearTimeout(retryTimer); };
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    // Show helpful messages during Render cold start wait
    setLoadingMsg('Connecting to server...');
    const msgTimer1 = setTimeout(() => setLoadingMsg('Server waking up — this can take ~30s on free tier...'), 5000);
    const msgTimer2 = setTimeout(() => setLoadingMsg('Almost there — still waiting for server...'), 20000);

    try {
      const res = await vyaparApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      clearTimeout(msgTimer1); clearTimeout(msgTimer2);

      if (res.success) {
        setAuth(res.token, res.user);
        toast.success(`Welcome to VyaparAI, ${res.user.name || form.name}! 🎉`);
        router.push('/dashboard');
      } else {
        toast.error(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      clearTimeout(msgTimer1); clearTimeout(msgTimer2);
      if (err?.response?.status === 400) {
        toast.error(err.response.data?.message || 'Email already registered.');
      } else if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        toast.error('Server is still starting up. Click again to retry.');
      } else {
        toast.error('Could not reach server. Please try again.');
        console.error('Register error:', err.message);
      }
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-950 px-4 py-8">
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="w-full max-w-md glass p-8 rounded-3xl space-y-6 relative border border-white/5 shadow-2xl">
        {/* Back link */}
        <Link href="/login" className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors w-fit">
          <ArrowLeft className="h-3 w-3" /> Back to Login
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-500/20">VA</div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-4">Create Your Business Account</h2>
          <p className="text-xs text-muted-foreground">Set up VyaparAI for your store in 60 seconds</p>
        </div>

        {/* Server Status */}
        {(() => {
          const cfg = {
            checking: { dot: 'bg-yellow-400', label: 'Connecting to server...', color: 'text-yellow-400' },
            waking:   { dot: 'bg-orange-400 animate-pulse', label: 'Server waking up — wait for green before registering', color: 'text-orange-400' },
            online:   { dot: 'bg-emerald-400', label: 'Server online — ready to register', color: 'text-emerald-400' },
            offline:  { dot: 'bg-red-400', label: 'Server offline', color: 'text-red-400' },
          }[serverStatus];
          return (
            <div className="flex items-center justify-center gap-2">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              <span className={`text-[10px] font-mono ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })()}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Your Full Name *</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Nayan Jyoti Sharma" value={form.name} onChange={set('name')} required
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="tel" placeholder="9864012345" value={form.phone} onChange={set('phone')} required
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Business Email *</label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="you@yourbusiness.com" value={form.email} onChange={set('email')} required
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all" />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Your Role</label>
            <select value={form.role} onChange={set('role')}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white outline-none transition-all cursor-pointer">
              <option value="owner">👑 Owner</option>
              <option value="manager">👔 Manager</option>
              <option value="staff">👷 Staff</option>
            </select>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Password *</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="password" placeholder="Min. 6 chars" value={form.password} onChange={set('password')} required
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Confirm *</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="password" placeholder="Repeat" value={form.confirmPassword} onChange={set('confirmPassword')} required
                  className={`w-full pl-10 pr-4 py-2.5 bg-neutral-900 border rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500/50'}`} />
              </div>
            </div>
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-[10px] text-red-400">Passwords do not match</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white font-semibold text-xs shadow-xl shadow-indigo-600/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{loadingMsg}</span>
              </span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Create Account & Launch OS</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
