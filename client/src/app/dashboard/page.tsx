'use client';

import React, { useEffect, useState } from 'react';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { 
  TrendingUp, Users, AlertTriangle, IndianRupee, Heart, 
  ChevronRight, Calendar, ArrowUpRight, Volume2, Sparkles, Filter, CheckCircle2
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useVyaparStore();
  const [healthData, setHealthData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimelineTab, setActiveTimelineTab] = useState<'all' | 'sales' | 'alerts'>('all');
  const [selectedScore, setSelectedScore] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [healthRes, statsRes, invoicesRes] = await Promise.all([
          vyaparApi.getDailyHealth(),
          vyaparApi.getTodayStats(),
          vyaparApi.getInvoices()
        ]);

        if (healthRes.success) setHealthData(healthRes.data);
        if (statsRes.success) setStats(statsRes.data);

        // Build mock activities from invoice data and custom items for timeline
        const acts = [
          { type: 'sale', title: 'Johabir Rice sold to Rimpi', description: 'INV-202607-048, 5 bags', amount: 2900, time: '10 mins ago' },
          { type: 'stock', title: 'Mustard Oil stock updated', description: 'Supplier delivered 50 liters', time: '1 hour ago' },
          { type: 'staff', title: 'Jitul Gogoi checked in', description: 'Verified within geofence boundaries', time: '2 hours ago' },
          { type: 'alert', title: 'Til Pitha running low', description: 'Current stock: 8 packets left', time: '3 hours ago', isAlert: true }
        ];
        setTimeline(acts);
      } catch (err) {
        toast.error('Failed to load real-time business health data.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Recharts simulation data showing sales cycles with Bihu festival peak
  const chartData = [
    { name: 'Jan', Sales: 38000, Profit: 10000 },
    { name: 'Feb', Sales: 42000, Profit: 12000 },
    { name: 'Mar', Sales: 40000, Profit: 11000 },
    { name: 'Apr (Bihu)', Sales: 98000, Profit: 28000 }, // Spring Festival Peak
    { name: 'May', Sales: 52000, Profit: 16000 },
    { name: 'Jun', Sales: 49000, Profit: 14000 },
    { name: 'Jul', Sales: 62000, Profit: 19500 },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
          <div className="h-28 bg-white/5 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-80 bg-white/5 rounded-2xl" />
          <div className="h-80 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "Today's Revenue", value: stats?.revenue || 4550, icon: IndianRupee, change: "+12.4% vs yesterday", color: "text-emerald-400" },
    { title: "Net Profit Margin", value: stats?.profit || 1200, icon: TrendingUp, change: "26.4% avg margin", color: "text-indigo-400" },
    { title: "Pending Ledger Payments", value: stats?.pending || 12000, icon: Users, change: "From 3 customers", color: "text-amber-400" },
    { title: "Stockout Alerts", value: healthData?.metrics?.lowStockCount || 2, icon: AlertTriangle, change: "Requires prompt restock", color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sharma General Stores</h2>
          <p className="text-xs text-muted-foreground">Digital Twin Shop Dashboard • Guwahati, Assam</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Last sync: Just now</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass p-5 rounded-2xl hover:border-white/20 hover:scale-[1.01] transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">{kpi.title}</span>
                <div className={`p-2 rounded-xl bg-white/5 ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">
                {kpi.title.includes('Revenue') || kpi.title.includes('Profit') || kpi.title.includes('Ledger') 
                  ? formatINR(kpi.value) 
                  : kpi.value
                }
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <span>{kpi.change}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Health Score & Graph section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Business Health Score (Radial Gauge & AI Narrative) */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl" />
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Daily Health Index</h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
                Verified OS Score
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="flex justify-center items-center py-4">
              <div className="relative h-32 w-32 flex items-center justify-center">
                {/* SVG Radial Progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="rgba(255,255,255,0.03)" fill="transparent" />
                  <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="url(#healthGrad)" strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * (healthData?.overallScore || 93)) / 100} strokeLinecap="round" fill="transparent" />
                  <defs>
                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-white font-mono">{healthData?.overallScore || 93}%</span>
                  <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest mt-0.5">HEALTHY</p>
                </div>
              </div>
            </div>

            {/* Micro Breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
              <div 
                onClick={() => setSelectedScore({
                  title: 'Inventory Score',
                  score: healthData?.scores?.inventory?.score || 95,
                  details: healthData?.scores?.inventory?.details || 'Deducted for low & dead stocks.',
                  formula: '100 - (LowStockRatio * 60) - (DeadStockRatio * 40)',
                  variables: `Active count: 5. Low stock: 2. Dead stock: 1.`
                })}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/25 hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-muted-foreground block font-mono text-[9px] uppercase">Inventory</span>
                <span className="font-bold text-white text-xs mt-0.5 block">{healthData?.scores?.inventory?.score || 95}%</span>
              </div>

              <div 
                onClick={() => setSelectedScore({
                  title: 'Cash Flow Score',
                  score: healthData?.scores?.cashFlow?.score || 82,
                  details: healthData?.scores?.cashFlow?.details || 'Computed from credit ledger balances.',
                  formula: '100 - Math.min(80, (PendingPayments / 25000) * 100)',
                  variables: `Outstanding ledger: ₹12,000.`
                })}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/25 hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-muted-foreground block font-mono text-[9px] uppercase">Cash Flow</span>
                <span className="font-bold text-amber-400 text-xs mt-0.5 block">{healthData?.scores?.cashFlow?.score || 82}%</span>
              </div>

              <div 
                onClick={() => setSelectedScore({
                  title: 'Staff Score',
                  score: healthData?.scores?.staffProductivity?.score || 96,
                  details: healthData?.scores?.staffProductivity?.details || 'Check-in counts vs shifts.',
                  formula: '(ShiftAttendanceRatio * 60) + (AvgSalesScore * 40)',
                  variables: `Shifts completed today: 2/2. Performance avg: 90%.`
                })}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/25 hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-muted-foreground block font-mono text-[9px] uppercase">Staff KPI</span>
                <span className="font-bold text-indigo-400 text-xs mt-0.5 block">{healthData?.scores?.staffProductivity?.score || 96}%</span>
              </div>

              <div 
                onClick={() => setSelectedScore({
                  title: 'Customer Score',
                  score: healthData?.scores?.customerSatisfaction?.score || 90,
                  details: healthData?.scores?.customerSatisfaction?.details || 'Ratio of repeat customers vs risk segments.',
                  formula: '(RepeatPurchaserRatio * 70) + (CustomerRiskAvg * 30)',
                  variables: `Repeat buyers ratio: 60%. Risk profiles: 1.`
                })}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/25 hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-muted-foreground block font-mono text-[9px] uppercase">Customers</span>
                <span className="font-bold text-purple-400 text-xs mt-0.5 block">{healthData?.scores?.customerSatisfaction?.score || 90}%</span>
              </div>
            </div>
          </div>

          {/* AI Narrative morning suggestions */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-bounce" />
              Growth Coach Briefing
            </span>
            <ul className="space-y-1.5">
              {healthData?.suggestions?.slice(0, 3).map((sug: string, i: number) => (
                <li key={i} className="text-[10px] text-neutral-300 leading-normal flex items-start gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sales Performance Area Graph */}
        <div className="glass p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Revenue Stream</h3>
              <p className="text-[10px] text-muted-foreground">Cyclic analysis including festival demands</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Monthly Revenue
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                Net Profit
              </span>
            </div>
          </div>

          <div className="h-44 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#52525b" />
                <YAxis stroke="#52525b" />
                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Area type="monotone" dataKey="Sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Profit" stroke="#a855f7" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Timeline & Low Stock list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Smart Owner Timeline */}
        <div className="glass p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Smart Owner Timeline</h3>
                <p className="text-[10px] text-muted-foreground">Every activity updating in real-time</p>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTimelineTab('all')}
                  className={`text-[9px] font-mono uppercase px-2 py-1 rounded-lg transition-all ${
                    activeTimelineTab === 'all' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTimelineTab('sales')}
                  className={`text-[9px] font-mono uppercase px-2 py-1 rounded-lg transition-all ${
                    activeTimelineTab === 'sales' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Sales
                </button>
                <button
                  onClick={() => setActiveTimelineTab('alerts')}
                  className={`text-[9px] font-mono uppercase px-2 py-1 rounded-lg transition-all ${
                    activeTimelineTab === 'alerts' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  Alerts
                </button>
              </div>
            </div>

            <div className="space-y-3.5 mt-2">
              {timeline
                .filter(item => {
                  if (activeTimelineTab === 'sales') return item.type === 'sale';
                  if (activeTimelineTab === 'alerts') return item.isAlert;
                  return true;
                })
                .map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-2.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      item.isAlert 
                        ? 'bg-red-500/10 text-red-400' 
                        : item.type === 'sale' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {item.isAlert ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                        <span className="text-[9px] text-muted-foreground font-mono">{item.time}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{item.description}</p>
                    </div>
                    {item.amount && (
                      <span className="text-xs font-mono font-bold text-white shrink-0">
                        {formatINR(item.amount)}
                      </span>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider mb-4">Stock warnings</h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-red-950/15 border border-red-500/10">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-white">Johabir Organic Rice</span>
                  <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full font-mono">2 bags left</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                  Demand forecast increases due to festival week. Expected stockout in 48 hours.
                </p>
                <div className="mt-2.5 flex justify-between items-center text-[9px] font-mono">
                  <span className="text-indigo-400">AI Confidence: 87%</span>
                  <span className="text-muted-foreground">Reorder target: 50 bags</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/10 border border-amber-500/10">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-white">Til Pitha packets</span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full font-mono">8 packets left</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                  CTC tea combo sales accelerated pitha stock reduction.
                </p>
              </div>
            </div>
          </div>

          <a 
            href="/inventory" 
            className="w-full mt-4 flex items-center justify-between text-[11px] text-indigo-400 hover:text-white font-semibold transition-all hover:underline"
          >
            <span>Procure Inventory</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

      </div>

      {/* Deterministic Score Calculation Popover Overlay */}
      {selectedScore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-widest">{selectedScore.title} Details</span>
              <button 
                onClick={() => setSelectedScore(null)}
                className="text-xs text-muted-foreground hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs leading-normal">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-muted-foreground">Index Value:</span>
                <span className="font-extrabold text-indigo-400 font-mono text-sm">{selectedScore.score}%</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Calculation Formula</span>
                <p className="font-mono bg-neutral-950 p-2 rounded-xl text-neutral-300 text-[10px] break-all">{selectedScore.formula}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Active Variables</span>
                <p className="text-neutral-300 text-[10px]">{selectedScore.variables}</p>
              </div>

              <div className="space-y-1 border-t border-white/5 pt-2 mt-2">
                <span className="text-[10px] text-indigo-300 uppercase font-bold">Health Audit Summary</span>
                <p className="text-neutral-400 text-[10px] leading-relaxed">{selectedScore.details}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedScore(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              Acknowledge Audit
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
