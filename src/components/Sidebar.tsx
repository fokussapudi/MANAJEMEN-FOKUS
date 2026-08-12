import React from 'react';
import { TabType } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Trophy, 
  BookmarkCheck, 
  Music, 
  Wallet, 
  Users, 
  Cloud, 
  ShieldCheck,
  ChevronRight 
} from 'lucide-react';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  allowedTabs?: TabType[];
}

interface NavItem {
  id: TabType;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard & Statistik', icon: LayoutDashboard },
  { id: 'fokus', label: 'A. FOKUS & Expedisi', badge: '58', icon: FileText },
  { id: 'pengajian', label: 'B. Pengajian (Undangan)', icon: BookOpen },
  { id: 'perlombaan', label: 'C. Perlombaan & Piagam', badge: '4 Kategori', icon: Trophy },
  { id: 'khotmil', label: 'D. Khotmil Qur\'an', icon: BookmarkCheck },
  { id: 'hadrah', label: 'E. Jam\'iyatul Hadrah', icon: Music },
  { id: 'bendahara', label: 'F. Bendahara & Kas', badge: 'Realtime', icon: Wallet },
  { id: 'sensus', label: 'G. Sensus Database Anggota', badge: 'Sahmasy', icon: Users },
  { id: 'kta', label: 'H. Cetak KTA Digital', badge: '55x85mm', icon: FileText },
  { id: 'google_sync', label: 'Integrasi Google Drive & Sheets', badge: 'Live', icon: Cloud },
  { id: 'role_management', label: 'I. Role & Management Admin', badge: 'Super Admin', icon: ShieldCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, allowedTabs }) => {
  const navItems = allowedTabs 
    ? allNavItems.filter(item => allowedTabs.includes(item.id))
    : allNavItems;

  return (
    <aside className="w-full lg:w-72 bg-gradient-to-b from-[#064E3B] to-[#043A2C] text-white flex flex-col rounded-3xl shadow-lg border border-emerald-800/40 overflow-hidden shrink-0">
      <div className="p-6 border-b border-emerald-800/60 hidden lg:block bg-[#054233]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-emerald-700 overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="Logo Fokus" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-amber-200 font-serif text-lg font-bold tracking-wide leading-tight">MANAJEMEN<br/>FOKUS SAPUDI</h1>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-200 font-medium">System Secured</span>
          </div>
          <span className="text-[9px] bg-emerald-950/80 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-700">
            {navItems.length} Modul
          </span>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-x-auto lg:overflow-y-auto flex lg:flex-col flex-row gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all shrink-0 group ${
                isActive
                  ? 'bg-emerald-950/80 text-white border-l-4 border-amber-400 font-semibold shadow-md backdrop-blur-sm translate-x-0.5'
                  : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-800/30 text-emerald-300 group-hover:bg-emerald-800/60'}`}>
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-left font-medium tracking-tight">{item.label}</span>
              </div>
              
              <div className="hidden lg:flex items-center space-x-1.5">
                {item.badge && (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-wider ${
                    isActive ? 'bg-amber-400 text-emerald-950 shadow-sm' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-amber-300 translate-x-0.5' : 'text-emerald-400/50 group-hover:translate-x-0.5'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 bg-emerald-950/60 border-t border-emerald-800/50 text-emerald-200 text-[11px] hidden lg:flex items-center justify-between backdrop-blur-sm">
        <span className="font-medium text-emerald-300">Google Drive Sync</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-900 text-amber-300 font-bold border border-emerald-700/50">Online</span>
      </div>
    </aside>
  );
};

