'use client';

import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, TrendingUp, Sparkles, Download, FileSpreadsheet, FileText, ChevronRight, Calendar } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);

  const revenueData = [
    { name: 'Feb', Sales: 42000, Purchases: 28000, Profit: 14000 },
    { name: 'Mar', Sales: 40000, Purchases: 31000, Profit: 9000 },
    { name: 'Apr (Bihu)', Sales: 98000, Purchases: 55000, Profit: 43000 },
    { name: 'May', Sales: 52000, Purchases: 36000, Profit: 16000 },
    { name: 'Jun', Sales: 49000, Purchases: 32000, Profit: 17000 },
    { name: 'Jul', Sales: 62000, Purchases: 41000, Profit: 21000 },
  ];

  const productPerformance = [
    { name: 'Assam Gold Tea', Sales: 450, Value: 81000 },
    { name: 'Johabir Rice', Sales: 280, Value: 162400 },
    { name: 'Mustard Oil', Sales: 310, Value: 51150 },
    { name: 'Bhut Jolokia Pickle', Sales: 90, Value: 13500 },
    { name: 'Til Pitha Packets', Sales: 180, Value: 14400 },
  ];

  const exportExcel = () => {
    toast.success('Excel Sheet exported to downloads!');
  };

  const exportPDF = () => {
    toast.success('PDF report exported to downloads!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Business Intelligence Ledger</h2>
          <p className="text-xs text-muted-foreground">Historical transaction logs & cash reserves</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={exportPDF}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Grid layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI Growth planner card */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="space-y-4">
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-bounce" />
              AI Growth Coach Planner
            </span>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] text-muted-foreground font-mono">COMBO OPPORTUNITY</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Launch: Rice + Oil Bundle</h4>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                  Correlated checkout profiles suggest a 15% increase in basket size when bundled together.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] text-muted-foreground font-mono">SUPPLIER NEGOTIATION</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Tea cases price is above market avg</h4>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                  Dibrugarh syndicate quoted ₹120/kg. Market standard is ₹110/kg. Suggested negotiation counter: ₹112/kg.
                </p>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <span>Unlock growth dashboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Multi area chart Sales vs Purchases */}
        <div className="glass p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Gross Sales vs Purchase Expenses</h3>
            <p className="text-[10px] text-muted-foreground">Historical procurement and cash flows</p>
          </div>
          <div className="h-60 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#52525b" />
                <YAxis stroke="#52525b" />
                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Legend />
                <Area type="monotone" dataKey="Sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Purchases" stroke="#f43f5e" fillOpacity={1} fill="url(#colorPurchases)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Product performance ranking */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Product Performance Matrix</h3>
          <p className="text-[10px] text-muted-foreground">Volume sales vs net yield</p>
        </div>
        <div className="h-60 w-full text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" stroke="#52525b" />
              <YAxis stroke="#52525b" />
              <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }} />
              <Legend />
              <Bar dataKey="Sales" fill="#818cf8" radius={[4, 4, 0, 0]} name="Units Sold" />
              <Bar dataKey="Value" fill="#c084fc" radius={[4, 4, 0, 0]} name="Yield (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
