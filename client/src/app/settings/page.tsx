'use client';

import React from 'react';
import { useVyaparStore } from '@/lib/store';
import { Settings, Shield, CreditCard, Sparkles, Sliders, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useVyaparStore();

  const handleSave = () => {
    toast.success('Configuration options updated.');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System configuration</h2>
        <p className="text-xs text-muted-foreground">Modify local rules and business preferences</p>
      </div>

      <div className="glass p-6 rounded-2xl border-white/5 space-y-6">
        
        {/* Profile */}
        <div className="flex gap-4 items-center pb-6 border-b border-white/5">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="Profile Avatar"
            className="h-16 w-16 rounded-2xl object-cover border border-white/10"
          />
          <div>
            <h4 className="text-sm font-semibold text-white">{user?.name || 'Nayan Jyoti Sharma'}</h4>
            <p className="text-xs text-muted-foreground">{user?.email || 'owner@vyapar.ai'}</p>
            <span className="text-[9px] uppercase font-mono bg-white/10 px-2 py-0.5 rounded text-indigo-300 mt-1.5 inline-block">
              System Role: {user?.role || 'owner'}
            </span>
          </div>
        </div>

        {/* GST Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Business Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">Store Trade Name</label>
              <input
                type="text"
                defaultValue="Sharma General Stores"
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-white outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">GSTIN Identification</label>
              <input
                type="text"
                defaultValue="18AABCS9812A1Z1"
                className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Premium billing tier */}
        <div className="p-4 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold">VyaparAI Enterprise OS Active</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Premium subscription billing: ₹999/month (Next billing Aug 18, 2026)</p>
          </div>
          <button 
            onClick={() => toast.success('Subscription plan is managed by owner.')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Manage
          </button>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
}
