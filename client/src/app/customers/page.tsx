'use client';

import React, { useEffect, useState } from 'react';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { 
  Users, UserCheck, MessageSquare, AlertTriangle, Sparkles, 
  Search, ShieldAlert, Award, Plus, Calendar, ArrowRight, TrendingUp
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // AI score result states
  const [scores, setScores] = useState<any>({});
  const [calculating, setCalculating] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      const res = await vyaparApi.getCustomers();
      if (res.success) {
        setCustomers(res.data);
      }
    } catch {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const calculateAIScore = async (id: string) => {
    setCalculating(id);
    toast('Calculating churn probability...', { icon: '🔮' });
    try {
      const res = await vyaparApi.getCustomerScore(id);
      if (res.success) {
        setScores((prev: any) => ({ ...prev, [id]: res.prediction }));
        toast.success('AI credit & churn prediction finished!');
      }
    } catch {
      toast.error('Could not run prediction. Please try again in a few seconds.');
    } finally {
      setCalculating(null);
    }
  };

  const handleWhatsAppReminder = async (id: string) => {
    try {
      const res = await vyaparApi.getWhatsAppReminder(id);
      if (res.success && res.link) {
        window.open(res.link, '_blank');
        toast.success('Opening WhatsApp reminder draft!');
      }
    } catch {
      toast.error('Could not create draft link.');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Header and buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer CRM Operating Center</h2>
          <p className="text-xs text-muted-foreground">AI lifetime value & risk recovery</p>
        </div>
        <button className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Overview Stats banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Total Directory</span>
            <h4 className="text-2xl font-bold text-white mt-1 font-mono">{customers.length} Accounts</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Outstanding Ledger Credit</span>
            <h4 className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              {formatINR(customers.reduce((s, c) => s + c.outstandingBalance, 0))}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="glass p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Loyalty Reserves</span>
            <h4 className="text-2xl font-bold text-white mt-1 font-mono">
              {customers.reduce((s, c) => s + c.loyaltyPoints, 0)} points
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers by mobile phone, customer name, outstanding credit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-muted-foreground transition-all"
        />
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c, idx) => (
          <div key={idx} className="glass p-5 rounded-2xl flex flex-col justify-between border-white/5 space-y-4 relative overflow-hidden group hover:border-white/15 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center font-bold text-indigo-300">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                  <span className="text-[10px] text-muted-foreground font-mono">{c.phone}</span>
                </div>
              </div>

              {/* Outstanding balance tag */}
              {c.outstandingBalance > 0 && (
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full font-mono">
                  Dues {formatINR(c.outstandingBalance)}
                </span>
              )}
            </div>

            {/* AI Churn Score & Credit Rating */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-wider">
                <span className="text-indigo-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  AI CRM Health Score
                </span>
                {scores[c._id] ? (
                  <span className="text-white font-bold">{scores[c._id].aiScore}/100</span>
                ) : (
                  <span className="text-muted-foreground">Uncalculated</span>
                )}
              </div>

              {scores[c._id] ? (
                <div className="space-y-1.5">
                  {/* Custom progress bars */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        scores[c._id].churnProbability > 50 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${scores[c._id].aiScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">Churn Probability:</span>
                    <span className={`font-bold ${
                      scores[c._id].churnProbability > 50 ? 'text-red-400' : 'text-emerald-400'
                    }`}>{scores[c._id].churnProbability}%</span>
                  </div>
                  <p className="text-[9px] text-indigo-300 leading-normal border-t border-white/5 pt-1.5">
                    💡 Suggestion: {scores[c._id].suggestedOffer || 'Keep outstanding payments below limits.'}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => calculateAIScore(c._id)}
                  disabled={calculating === c._id}
                  className="w-full py-1 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 text-indigo-300 rounded-lg text-[10px] font-semibold tracking-wide uppercase transition-all font-mono cursor-pointer"
                >
                  {calculating === c._id ? 'Analyzing...' : 'Predict churn & recovery'}
                </button>
              )}
            </div>

            {/* Actions triggers */}
            <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[10px] font-mono">
              <span className="text-muted-foreground flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                {c.loyaltyPoints || 0} pts
              </span>
              
              {c.outstandingBalance > 0 && (
                <button
                  onClick={() => handleWhatsAppReminder(c._id)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-white transition-all cursor-pointer font-semibold"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp recovery</span>
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
