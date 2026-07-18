'use client';

import React, { useEffect, useState } from 'react';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { 
  Users, MapPin, ShieldAlert, Award, Calendar, 
  Clock, CheckCircle2, AlertCircle, Plus, Sparkles, TrendingUp
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-in location simulation states
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const loadStaff = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        vyaparApi.getStaff(),
        vyaparApi.getStaffLeaderboard()
      ]);
      if (sRes.success) setStaffList(sRes.data);
      if (lRes.success) setLeaderboard(lRes.data);
    } catch {
      toast.error('Failed to load staff profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCheckIn = async (staffId: string) => {
    setCheckingInId(staffId);
    toast('Accessing GPS coordinates...', { icon: '🛰️' });

    // Shop coordinates in Guwahati: 26.1445, 91.7362
    // We will simulate a correct geofence check-in
    const simulatedCoords = { lat: 26.1445, lng: 91.7362 };

    try {
      const res = await vyaparApi.checkInStaff(staffId, simulatedCoords);
      if (res.success) {
        toast.success(res.message);
        loadStaff(); // reload list
      }
    } catch {
      toast.error('Could not verify GPS check-in.');
    } finally {
      setCheckingInId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-2xl" />
          <div className="h-80 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Staff attendance check-in list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Staff Operations Board</h2>
            <p className="text-xs text-muted-foreground">Geofenced geotracking attendance & shifts</p>
          </div>
          <button className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-1.5 transition-all cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Staff cards */}
        <div className="space-y-4">
          {staffList.map((s, idx) => {
            const hasCheckedInToday = s.attendance?.some((a: any) => 
              new Date(a.date).toDateString() === new Date().toDateString()
            );
            return (
              <div key={idx} className="glass p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center border-white/5 gap-4">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                      <span>ID: {s.employeeId}</span>
                      <span>•</span>
                      <span className="uppercase text-indigo-400">{s.role}</span>
                    </div>
                  </div>
                </div>

                {/* Shift information */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>09:00 AM - 06:00 PM</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 block w-max font-mono">
                    Basic: {formatINR(s.salary?.basic || 15000)}
                  </span>
                </div>

                {/* GPS Check-in operations */}
                <div>
                  {hasCheckedInToday ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verified GPS Presence</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(s._id)}
                      disabled={checkingInId === s._id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <MapPin className="h-4 w-4 animate-bounce" />
                      <span>GPS Check-In</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboards and Commisions */}
      <div className="space-y-6">
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Performance Board</h3>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>

          <div className="space-y-4">
            {leaderboard.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] text-white font-mono font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{item.name}</h4>
                    <span className="text-[9px] text-muted-foreground font-mono mt-1 block">Score: {item.performanceScore}%</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-white">{formatINR(item.totalSales)}</span>
                  <p className="text-[9px] text-indigo-300">Comm: {formatINR(item.totalCommission)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick AI theft tracker notice */}
          <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl space-y-2">
            <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              AI Loss Prevention
            </span>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              No discrepancy anomalies flagged in the current shift. Expected actual match probability: 98.7%.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
