import React, { useState } from 'react';
import { UserAccount, NotificationItem } from '../types';
import { Bell, Cloud, CloudCheck, Shield, LogOut, Menu, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount;
  onLogout: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  isSynced: boolean;
  onTriggerSync: () => void;
  remainingSeconds?: number;
  onToggleSidebarMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications,
  onMarkNotificationsRead,
  isSynced,
  onTriggerSync,
  remainingSeconds
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (secs?: number) => {
    if (secs === undefined) return '05:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-40 border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-amber-400 shadow-inner overflow-hidden">
              <img src="/logo.jpg" alt="Logo Fokus Sapudi" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-serif tracking-wide text-amber-200">
                MANAJEMENT FOKUS SAPUDI
              </h1>
              <p className="text-[10px] text-emerald-300 hidden sm:block">
                Sistem Otorisasi Bertingkat & Integrasi Google Drive Real-time
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            
            {/* Auto-Logout Inactivity Timer Badge */}
            <div 
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/80 text-amber-300 border border-emerald-700/80 shadow-inner"
              title="Sistem akan otomatis keluar jika tidak ada aktivitas pengguna selama 5 menit"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Inaktif: {formatTime(remainingSeconds)}</span>
            </div>

            {/* Google Sync Badge */}
            <button
              onClick={onTriggerSync}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isSynced 
                  ? 'bg-emerald-800/80 text-emerald-200 border border-emerald-700 hover:bg-emerald-700' 
                  : 'bg-amber-600/30 text-amber-200 border border-amber-500/50 hover:bg-amber-600/50'
              }`}
              title="Sinkronisasi Google Drive & Sheets"
            >
              <Cloud className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{isSynced ? 'Drive Terhubung' : 'Sinkronisasi...'}</span>
            </button>

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
