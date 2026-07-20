'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { ShieldCheck, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useVyaparStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Signing in...');

  const prefill = (role: 'owner' | 'manager' | 'staff') => {
    if (role === 'owner') { setEmail('owner@vyapar.ai'); setPassword('password123'); }
    else if (role === 'manager') { setEmail('manager@vyapar.ai'); setPassword('password123'); }
    else { setEmail('jitul@vyapar.ai'); setPassword('password123'); }
    toast.success(`Prefilled ${role} credentials`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your credentials.'); return; }

    setLoading(true);
    setLoadingMsg('Signing in...');

    const t1 = setTimeout(() => setLoadingMsg('Connecting to server...'), 4000);
    const t2 = setTimeout(() => setLoadingMsg('Almost there, hang tight...'), 15000);

    try {
      const res = await vyaparApi.login({ email, password });
      clearTimeout(t1); clearTimeout(t2);

      if (res.success) {
        setAuth(res.token, res.user);
        toast.success(`Welcome back, ${res.user.name}!`);
        router.push('/dashboard');
      } else {
        toast.error(res.message || 'Invalid credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      clearTimeout(t1); clearTimeout(t2);
      setLoading(false);

      // 401 = wrong password, not a network error
      if (err?.response?.status === 401) {
        toast.error('Invalid email or password.');
        return;
      }

      // Network/timeout — fall back to preview mode
      const roleFromEmail = email.includes('manager') ? 'manager'
        : email.includes('jitul') || email.includes('staff') ? 'staff' : 'owner';

      const dummyUsers: Record<string, any> = {
        owner:   { id: 'dummy-owner',   name: 'Nayan Jyoti Sharma', email, role: 'owner',   permissions: { canManageInventory: true,  canManageSales: true,  canViewAnalytics: true,  canManageStaff: true,  canManageCustomers: true,  canViewFinancials: true,  canExportData: true  } },
        manager: { id: 'dummy-manager', name: 'Pranab Das',          email, role: 'manager', permissions: { canManageInventory: true,  canManageSales: true,  canViewAnalytics: true,  canManageStaff: false, canManageCustomers: true,  canViewFinancials: false, canExportData: true  } },
        staff:   { id: 'dummy-staff',   name: 'Jitul Gogoi',         email, role: 'staff',   permissions: { canManageInventory: true,  canManageSales: true,  canViewAnalytics: false, canManageStaff: false, canManageCustomers: true,  canViewFinancials: false, canExportData: false } },
      };

      setAuth('preview-token', dummyUsers[roleFromEmail]);
      toast('Preview Mode — server offline', { icon: '⚠️' });
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-950 px-4">
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="w-full max-w-md glass p-8 rounded-3xl space-y-6 relative border border-white/5 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-500/20">VA</div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-4">VyaparAI Operating System</h2>
          <p className="text-xs text-muted-foreground">Manage inventory, intelligence & cash flow</p>
        </div>

        {/* Quick Profiles */}
        <div className="bg-white/5 p-2 rounded-2xl border border-white/5 space-y-2">
          <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase flex items-center gap-1 px-1">
            <Sparkles className="h-3 w-3" /> Quick Showcase Profiles
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['owner', 'manager', 'staff'] as const).map((r) => (
              <button key={r} onClick={() => prefill(r)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/5 text-[10px] font-semibold text-white transition-all capitalize cursor-pointer">
                {r.charAt(0).toUpperCase() + r.slice(1)} Profile
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Business Email</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="owner@vyapar.ai" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all" />
            </div>
          </div>

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
                <span>Enter Business OS</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground">
          New business?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Create your account →
          </Link>
        </p>
      </div>
    </div>
  );
}
