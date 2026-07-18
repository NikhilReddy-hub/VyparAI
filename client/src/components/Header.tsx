'use client';

import React, { useState } from 'react';
import { useVyaparStore } from '@/lib/store';
import { Search, Bell, Mic, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onVoiceSummaryTrigger: () => void;
  onAIChatOpen: () => void;
}

export default function Header({ onVoiceSummaryTrigger, onAIChatOpen }: HeaderProps) {
  const { notifications, clearNotifications } = useVyaparStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Sample global search indexing
  const items = [
    { name: 'Johabir Organic Rice', type: 'Product', path: '/inventory' },
    { name: 'Assam CTC Tea Premium', type: 'Product', path: '/inventory' },
    { name: 'Rimpi Boruah', type: 'Customer', path: '/customers' },
    { name: 'Rahul Phukan', type: 'Customer', path: '/customers' },
    { name: 'Jitul Gogoi', type: 'Staff', path: '/staff' },
    { name: 'Invoice INV-202607-048', type: 'Invoice', path: '/sales' },
  ];

  const filtered = searchVal 
    ? items.filter(i => i.name.toLowerCase().includes(searchVal.toLowerCase()))
    : [];

  return (
    <header className="h-16 border-b glass flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search Input (Raycast-like search bar) */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products, customers, invoices... (Press ⌘K)"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full pl-10 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-muted-foreground transition-all"
        />

        {/* Global Search Popover */}
        {searchVal && (
          <div className="absolute top-12 left-0 w-full bg-neutral-950/95 border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-md">
            <span className="text-[10px] text-muted-foreground font-mono uppercase px-3 py-1 block">Search Results</span>
            <div className="space-y-0.5 mt-1">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.path}
                    onClick={() => setSearchVal('')}
                    className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl transition-all"
                  >
                    <span className="text-sm text-white font-medium">{item.name}</span>
                    <span className="text-[10px] text-indigo-400 border border-indigo-400/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      {item.type}
                    </span>
                  </a>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No matching results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-4">
        {/* Voice Dashboard (Speech Synthesis Trigger) */}
        <button
          onClick={onVoiceSummaryTrigger}
          className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 text-muted-foreground hover:text-white flex items-center justify-center transition-all cursor-pointer group"
          title="Voice Dashboard Briefing"
        >
          <Mic className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
        </button>

        {/* AI Growth Ticker quick toggle */}
        <button
          onClick={onAIChatOpen}
          className="h-9 px-3 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 hover:text-white hover:border-indigo-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Growth Coach</span>
        </button>

        {/* Notification Bell */}
        <div className="relative group">
          <button className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-muted-foreground hover:text-white flex items-center justify-center transition-all cursor-pointer">
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="absolute right-0 top-11 w-80 bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-md opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-xs font-semibold text-white">Smart Alerts</span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <div key={idx} className="flex gap-2.5 p-2 hover:bg-white/5 rounded-xl transition-all">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-neutral-300 leading-relaxed">{notif}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground gap-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>No new alerts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
