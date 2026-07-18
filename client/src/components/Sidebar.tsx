'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useVyaparStore } from '@/lib/store';
import { 
  LayoutDashboard, Package, Receipt, Users, ShieldAlert,
  Bot, BarChart3, Settings, LogOut, Radio, Wifi, WifiOff,
  Bell, CheckCircle2, AlertTriangle, AlertCircle, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SidebarProps {
  onAIChatOpen: () => void;
}

export default function Sidebar({ onAIChatOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isOffline, emergencyMode, syncQueue, setEmergencyMode, logout } = useVyaparStore();

  const handleEmergencyToggle = () => {
    const nextVal = !emergencyMode;
    setEmergencyMode(nextVal);
    if (nextVal) {
      toast('⚠️ EMERGENCY MODE ACTIVE: All actions are now local only.', {
        icon: '🚨',
        style: { background: '#1e1e24', color: '#f87171', border: '1px solid #7f1d1d' }
      });
    } else {
      toast.success('Online sync restored. Running sync queue...');
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['owner', 'manager', 'staff'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['owner', 'manager', 'staff'] },
    { name: 'Sales / Invoice', icon: Receipt, path: '/sales', roles: ['owner', 'manager', 'staff'] },
    { name: 'CRM / Customers', icon: Users, path: '/customers', roles: ['owner', 'manager', 'staff'] },
    { name: 'Staff Management', icon: ShieldAlert, path: '/staff', roles: ['owner', 'manager'] },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['owner', 'manager'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['owner', 'manager', 'staff'] },
  ];

  const allowedItems = navItems.filter(item => !user || item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Logged out successfully.');
  };

  return (
    <aside className={cn(
      "w-64 h-screen glass border-r flex flex-col justify-between p-4 sticky top-0 z-30 transition-all",
      emergencyMode && "border-red-950/40"
    )}>
      {/* Brand & Digital Twin Status */}
      <div>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            VA
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white leading-none">VyaparAI</h1>
            <span className="text-[10px] text-muted-foreground font-mono">Biz OS v1.0</span>
          </div>
        </div>

        {/* Sync / Offline Banner */}
        <div className={cn(
          "mb-6 p-3 rounded-xl flex items-center justify-between border transition-all",
          emergencyMode 
            ? "bg-red-950/20 border-red-500/20 text-red-400" 
            : isOffline 
            ? "bg-amber-950/20 border-amber-500/20 text-amber-400" 
            : "bg-emerald-950/10 border-emerald-500/10 text-emerald-400"
        )}>
          <div className="flex items-center gap-2">
            {emergencyMode ? (
              <Radio className="h-4 w-4 animate-pulse text-red-500" />
            ) : isOffline ? (
              <WifiOff className="h-4 w-4 text-amber-500" />
            ) : (
              <Wifi className="h-4 w-4 text-emerald-500" />
            )}
            <span className="text-[11px] font-medium font-mono">
              {emergencyMode ? 'EMERGENCY MODE' : isOffline ? 'OFFLINE MODE' : 'SYNCED'}
            </span>
          </div>
          {syncQueue.length > 0 && (
            <span className="text-[10px] bg-white/10 text-white font-mono px-2 py-0.5 rounded-full animate-bounce">
              {syncQueue.length} queue
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {allowedItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-white/10 text-white shadow-inner border border-white/5" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-all",
                  isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-indigo-400"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Assistant Call Button */}
        <button
          onClick={onAIChatOpen}
          className="w-full mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium glass-accent text-indigo-200 hover:text-white hover:border-indigo-400/40 transition-all cursor-pointer"
        >
          <Bot className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>Ask Business Brain</span>
        </button>
      </div>

      {/* User Info & Settings */}
      <div className="space-y-4">
        {/* Emergency Mode Switcher */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[11px] font-mono text-muted-foreground">Emergency Mode</span>
            <button
              onClick={handleEmergencyToggle}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                emergencyMode ? "bg-red-600" : "bg-neutral-800"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  emergencyMode ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Profile Card */}
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user.name}
              className="h-9 w-9 rounded-xl border border-white/10 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold text-white truncate leading-none mb-1">{user.name}</h2>
              <span className="text-[10px] text-muted-foreground font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-white/5 transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
