import React, { useState, useEffect } from 'react';
import { UserAccount, NotificationItem, TabType } from '../types';
import { 
  Bell, 
  Shield, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Calendar,
  Building2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { subscribeDbSyncStatus, DbSyncStatus, forceRefreshAllCollections } from '../firebase';
import { PermanentImage } from './PermanentImage';

interface NavbarProps {
  currentUser: UserAccount;
  onLogout: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  remainingSeconds?: number;
  onToggleSidebarMobile?: () => void;
  onNotify?: (title: string, message: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  logoUrl?: string;
  orgName?: string;
  onSelectTab?: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications,
  onMarkNotificationsRead,
  remainingSeconds,
  onNotify,
  selectedYear,
  onYearChange,
  logoUrl,
  orgName,
  onSelectTab
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbSyncStatus>('connected');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeDbSyncStatus((status) => {
      setDbStatus(status);
    });
    return unsub;
  }, []);

  const handleManualDbRefresh = async () => {
    setIsManualRefreshing(true);
    const ok = await forceRefreshAllCollections();
    setTimeout(() => {
      setIsManualRefreshing(false);
      if (ok && onNotify) {
        onNotify('Database Server Pusat', 'Data terbaru berhasil disinkronkan langsung dari Server Database Terpusat Fokus Sapudi.');
      }
    }, 400);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (secs?: number) => {
    if (secs === undefined) return '05:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-40 border-b border-emerald-800">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div 
            onClick={() => onSelectTab && onSelectTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
            title="Kembali ke Dashboard Utama"
          >
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center border-2 border-amber-400 shadow-inner overflow-hidden p-0.5 shrink-0 transition-transform group-hover:scale-105">
              <PermanentImage src={logoUrl || "/logo.png"} fallbackSrc="/logo.png" alt="Logo Fokus Sapudi" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-serif tracking-wide text-amber-200 leading-tight uppercase group-hover:text-amber-300 transition-colors">
                {orgName || 'MANAJEMEN FOKUS SAPUDI'}
              </h1>
              <p className="text-[10px] text-emerald-300 hidden sm:block">
                Forum Komunikasi Santri Pulau Sapudi
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Button: Profil & Custom Logo */}
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('profil_organisasi')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-emerald-950 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all border border-amber-300 active:scale-95"
                title="Buka Pengaturan Profil Organisasi & Ganti Custom Logo"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-900" />
                <span className="hidden xs:inline">Profil & Logo</span>
              </button>
            )}

            {/* Year Period Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 bg-emerald-950/80 rounded-xl border border-emerald-700/70 shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-amber-100 focus:outline-none cursor-pointer pr-1 border-none outline-none"
                title="Filter Periode Tahun Data Organisasi"
              >
                <option value="Semua" className="bg-emerald-900 text-white font-sans">Semua Periode</option>
                <option value="2026" className="bg-emerald-900 text-white font-sans">2026 / 1447 H</option>
                <option value="2025" className="bg-emerald-900 text-white font-sans">2025 / 1446 H</option>
                <option value="2024" className="bg-emerald-900 text-white font-sans">2024 / 1445 H</option>
              </select>
            </div>

            {/* Real-time Central Server Database Multi-Device Status & 1-Tap Refresh Button */}
            <div className="flex items-center bg-emerald-950/80 rounded-xl p-1 border border-emerald-700/70 shadow-inner">
              <button
                onClick={handleManualDbRefresh}
                disabled={isManualRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition hover:bg-emerald-800/80 text-emerald-100"
                title="Database Server Pusat Bersama: Sinkron otomatis seketika di seluruh HP, Laptop, dan Akun berbeda."
              >
                <Database className={`w-3.5 h-3.5 ${dbStatus === 'connected' ? 'text-emerald-400' : dbStatus === 'syncing' ? 'text-amber-400' : 'text-red-400'}`} />
                <span className="hidden md:inline text-[11px]">
                  {dbStatus === 'connected' ? 'Server Pusat Aktif' : dbStatus === 'syncing' ? 'Menyinkronkan...' : 'Offline'}
                </span>
                <RefreshCw className={`w-3 h-3 text-amber-300 ${isManualRefreshing || dbStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Auto-Logout Inactivity Timer Badge */}
            <div 
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 text-amber-300 border border-emerald-700/80 shadow-inner"
              title="Sistem akan otomatis keluar jika tidak ada aktivitas pengguna selama 5 menit"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Inaktif: {formatTime(remainingSeconds)}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotif(!showNotif);
                  setShowProfile(false);
                  if (!showNotif) onMarkNotificationsRead();
                }}
                className="p-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 hover:text-white transition relative"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-emerald-950 font-bold rounded-full text-[10px] flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-emerald-950 rounded-2xl shadow-2xl border border-emerald-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-emerald-900 text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-200">Notifikasi Sistem Organisasi</span>
                    <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full text-emerald-200">{notifications.length} Pesan</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-emerald-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-emerald-600">Belum ada notifikasi baru.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-emerald-50/50 transition flex items-start gap-3">
                          <div className="mt-0.5 text-emerald-600">
                            {n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-emerald-950">{n.title}</p>
                            <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-emerald-500 mt-1">{n.timestamp}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotif(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 transition border border-emerald-700"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs shadow">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left pr-1">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-300 font-medium uppercase tracking-wide">{currentUser.role}</p>
                </div>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-emerald-950 rounded-2xl shadow-2xl border border-emerald-100 z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="border-b border-emerald-100 pb-3 mb-3">
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Pengguna Aktif</p>
                    <p className="text-sm font-bold text-emerald-950 mt-0.5">{currentUser.name}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{currentUser.jabatan}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <Shield className="w-3 h-3 text-emerald-700" />
                      <span>Hak Akses: {currentUser.role.toUpperCase()}</span>
                    </div>
                  </div>

                  {onSelectTab && (
                    <div className="space-y-1.5 mb-3 border-b border-emerald-100 pb-3">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          onSelectTab('profil_organisasi');
                        }}
                        className="w-full flex items-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold transition text-left"
                      >
                        <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Profil Organisasi & Logo</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowProfile(false);
                            onSelectTab('role_management');
                          }}
                          className="w-full flex items-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-semibold transition text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Role & Manajemen Admin</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={onLogout}
                    className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition border border-red-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

