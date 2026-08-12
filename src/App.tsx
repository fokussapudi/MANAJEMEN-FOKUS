/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, RolePermission, NotificationItem, SahmasyRow, TabType } from './types';
import { initialUsers, initialRolePermissions, initialNotifications, initialSahmasyRows } from './data/initialData';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FokusView } from './components/FokusView';
import { PengajianView } from './components/PengajianView';
import { PerlombaanView } from './components/PerlombaanView';
import { KhotmilQuranView } from './components/KhotmilQuranView';
import { JamiyatulHadrahView } from './components/JamiyatulHadrahView';
import { BendaharaView } from './components/BendaharaView';
import { SensusView } from './components/SensusView';
import { KtaView } from './components/KtaView';
import { GoogleIntegrationView } from './components/GoogleIntegrationView';
import { RoleManagementView } from './components/RoleManagementView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(users[0]);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [sahmasy, setSahmasy] = useState<SahmasyRow[]>(initialSahmasyRows);
  const [isSynced, setIsSynced] = useState<boolean>(true);

  // Inactivity Auto-Logout State (5 Minutes = 300 Seconds)
  const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentUser) return;

    lastActivityRef.current = Date.now();
    setRemainingSeconds(300);

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'wheel'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remainingMs = Math.max(0, INACTIVITY_LIMIT_MS - elapsed);
      const secs = Math.ceil(remainingMs / 1000);

      setRemainingSeconds(secs);

      if (remainingMs <= 0) {
        clearInterval(interval);
        setCurrentUser(null);
        setLogoutNotice('Anda telah otomatis keluar dari aplikasi karena tidak ada aktivitas selama 5 menit.');
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [currentUser]);

  // Compute allowed tabs for current logged in user
  const rolePerm = currentUser ? rolePermissions.find(r => r.roleId === currentUser.role) : null;
  const allowedTabs: TabType[] = currentUser?.customAllowedTabs || rolePerm?.allowedTabs || ['dashboard'];

  const handleAddNotification = (title: string, message: string) => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      timestamp: 'Baru saja',
      type: 'success',
      read: false
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleTriggerSync = () => {
    setIsSynced(false);
    setTimeout(() => {
      setIsSynced(true);
    }, 1000);
  };

  if (!currentUser) {
    return (
      <LoginModal
        users={users}
        logoutNotice={logoutNotice}
        onLogin={(user) => {
          setLogoutNotice(null);
          setCurrentUser(user);
        }}
      />
    );
  }

  const isTabAccessible = allowedTabs.includes(currentTab);

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#2D3A3A] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={() => {
          setLogoutNotice(null);
          setCurrentUser(null);
        }}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        isSynced={isSynced}
        onTriggerSync={handleTriggerSync}
        remainingSeconds={remainingSeconds}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          allowedTabs={allowedTabs}
        />

        {/* Dynamic Content View */}
        <main className="flex-1 min-w-0">
          {!isTabAccessible ? (
            <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center space-y-4 my-8">
              <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto border-2 border-red-300">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-red-950">Akses Terbatas / Dibatasi Super Admin</h3>
              <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
                Role Anda ({currentUser.role.toUpperCase()} - {currentUser.jabatan}) saat ini belum memiliki wewenang untuk membuka modul ini. Silakan hubungi Super Admin untuk penyesuaian hak akses.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-5 py-2.5 bg-emerald-900 text-amber-200 font-bold text-xs rounded-xl hover:bg-emerald-800 transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dashboard Utama</span>
              </button>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  sahmasy={sahmasy}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  currentUser={currentUser}
                  allowedTabs={allowedTabs}
                />
              )}
              {currentTab === 'fokus' && <FokusView onNotify={handleAddNotification} />}
              {currentTab === 'pengajian' && <PengajianView onNotify={handleAddNotification} />}
              {currentTab === 'perlombaan' && <PerlombaanView onNotify={handleAddNotification} />}
              {currentTab === 'khotmil' && <KhotmilQuranView onNotify={handleAddNotification} />}
              {currentTab === 'hadrah' && <JamiyatulHadrahView onNotify={handleAddNotification} />}
              {currentTab === 'bendahara' && <BendaharaView sahmasy={sahmasy} onNotify={handleAddNotification} />}
              {currentTab === 'sensus' && <SensusView sahmasy={sahmasy} setSahmasy={setSahmasy} onNotify={handleAddNotification} />}
              {currentTab === 'kta' && <KtaView sahmasy={sahmasy} onNotify={handleAddNotification} />}
              {currentTab === 'google_sync' && (
                <GoogleIntegrationView
                  isSynced={isSynced}
                  onTriggerSync={handleTriggerSync}
                  onNotify={handleAddNotification}
                />
              )}
              {currentTab === 'role_management' && (
                <RoleManagementView
                  users={users}
                  setUsers={setUsers}
                  rolePermissions={rolePermissions}
                  setRolePermissions={setRolePermissions}
                  currentUser={currentUser}
                  onSwitchUser={(user) => setCurrentUser(user)}
                  onNotify={handleAddNotification}
                />
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}

