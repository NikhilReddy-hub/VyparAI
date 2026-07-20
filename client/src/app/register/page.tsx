'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { ShieldCheck, UserCheck, KeyRound, Phone, Sparkles, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useVyaparStore((state) => state.setAuth);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'owner',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Creating your account...');

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
    setLoadingMsg('Creating your account...');

    // Escalate the message if it takes longer (Render cold start)
    const t1 = setTimeout(() => setLoadingMsg('Connecting to server...'), 4000);
    const t2 = setTimeout(() => setLoadingMsg('Almost there, hang tight...'), 15000);

    try {
      const res = await vyaparApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      clearTimeout(t1); clearTimeout(t2);

      if (res.success) {
        setAuth(res.token, res.user);
        toast.success(`Welcome to VyaparAI, ${res.user.name || form.name}! 🎉`);
        router.push('/dashboard');
      } else {
        toast.error(res.message || 'Registration failed.');
        setLoading(false);
      }
    } catch (err: any) {
      clearTimeout(t1); clearTimeout(t2);
      setLoading(false);
      if (err?.response?.status === 400) {
        toast.error(err.response.data?.message || 'Email already registered.');
      } else if (err?.code === 'ECONNABORTED') {
        toast.error('Server took too long — please try again.');
      } else {
        toast.error('Could not connect. Please try again.');
      }
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
          <p className="text-xs text-muted-foreground">Set up VyaparAI for your store in seconds</p>
        </div>

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
                  className={`w-full pl-10 pr-4 py-2.5 bg-neutral-900 border rounded-xl text-xs text-white placeholder:text-muted-foreground outline-none transition-all ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500/50'
                  }`} />
              </div>
            </div>
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-[10px] text-red-400 -mt-2">Passwords do not match</p>
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
