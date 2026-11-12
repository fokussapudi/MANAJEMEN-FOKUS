/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  UserAccount, RolePermission, NotificationItem, SahmasyRow, TabType,
  ExpedisiRow, AgendaItem, LombaRow, KhotmilJadwalRow, KhotmilAbsenRow, HadrahJadwalRow, IuranRow, TanggunganRow, DonaturRow, TransactionRecord,
  OrganizationProfile
} from './types';
import { 
  initialUsers, initialRolePermissions, initialNotifications, initialSahmasyRows,
  initialExpedisiRows, initialAgendaList, initialLombaRows, initialKhotmilJadwal, initialKhotmilAbsen, initialHadrahJadwal, initialIuranRows, initialTanggunganRows, initialDonaturRows,
  initialOrganizationProfile
} from './data/initialData';
import { syncCollection, saveDoc, saveCollection, forceRefreshAllCollections } from './firebase';
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
import { RoleManagementView } from './components/RoleManagementView';
import { OrganizationProfileView } from './components/OrganizationProfileView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  const [users, setUsersState] = useState<UserAccount[]>(initialUsers);
  const [rolePermissions, setRolePermissionsState] = useState<RolePermission[]>(initialRolePermissions);
  
  // Load session from storage or require login
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedSession = localStorage.getItem('fokus_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const match = initialUsers.find(u => u.id === parsed.id || u.username.toLowerCase() === parsed.username?.toLowerCase()) || parsed;
        if (match && match.isActive !== false) {
          return match;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved user session', e);
    }
    return null; // Require login with registered credentials
  });

  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    try {
      const savedTab = localStorage.getItem('fokus_current_tab');
      if (savedTab) return savedTab as TabType;
    } catch {}
    return 'dashboard';
  });
  const [notifications, setNotificationsState] = useState<NotificationItem[]>(initialNotifications);
  const [sahmasy, setSahmasyState] = useState<SahmasyRow[]>(initialSahmasyRows);
  const [expedisi, setExpedisiState] = useState<ExpedisiRow[]>(initialExpedisiRows);
  const [agendaList, setAgendaListState] = useState<AgendaItem[]>(initialAgendaList);
  const [lombaList, setLombaListState] = useState<LombaRow[]>(initialLombaRows);
  const [khotmilJadwal, setKhotmilJadwalState] = useState<KhotmilJadwalRow[]>(initialKhotmilJadwal);
  const [khotmilAbsen, setKhotmilAbsenState] = useState<KhotmilAbsenRow[]>(initialKhotmilAbsen);
  const [hadrahJadwal, setHadrahJadwalState] = useState<HadrahJadwalRow[]>(initialHadrahJadwal);
  const [iuranList, setIuranListState] = useState<IuranRow[]>(initialIuranRows);
  const [tanggunganList, setTanggunganListState] = useState<TanggunganRow[]>(initialTanggunganRows);
  const [donaturList, setDonaturListState] = useState<DonaturRow[]>(initialDonaturRows);
  const [transactions, setTransactionsState] = useState<TransactionRecord[]>([]);
  const [orgProfile, setOrgProfileState] = useState<OrganizationProfile>(() => {
    try {
      const cached = localStorage.getItem('fokus_v3_organizationProfile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          const profile = { ...initialOrganizationProfile, ...parsed[0] };
          const customLogo = localStorage.getItem('fokus_custom_logo');
          if (customLogo && (!profile.logoUrl || profile.logoUrl === '/logo.png')) {
            profile.logoUrl = customLogo;
          }
          return profile;
        }
      }
      const customLogo = localStorage.getItem('fokus_custom_logo');
      if (customLogo) {
        return { ...initialOrganizationProfile, logoUrl: customLogo };
      }
    } catch {}
    return initialOrganizationProfile;
  });
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<string>('Semua');

  // Sync current user state when users collection changes in real-time
  useEffect(() => {
    if (currentUser) {
      const liveUser = users.find(u => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase());
      if (liveUser) {
        if (liveUser.isActive === false) {
          setCurrentUser(null);
          localStorage.removeItem('fokus_auth_session');
          setLogoutNotice('Akun Anda telah dinonaktifkan oleh Super Admin.');
        } else if (
          liveUser.role !== currentUser.role || 
          liveUser.name !== currentUser.name ||
          liveUser.jabatan !== currentUser.jabatan ||
          JSON.stringify(liveUser.customAllowedTabs) !== JSON.stringify(currentUser.customAllowedTabs)
        ) {
          setCurrentUser(liveUser);
        }
      }
    }
  }, [users]);

  // Real-time synchronization listeners via Firebase Firestore for ALL modules
  useEffect(() => {
    const unsubSahmasy = syncCollection<SahmasyRow>('sahmasy', initialSahmasyRows, setSahmasyState);
    const unsubUsers = syncCollection<UserAccount>('users', initialUsers, setUsersState);
    const unsubRoles = syncCollection<RolePermission>('rolePermissions', initialRolePermissions, setRolePermissionsState);
    const unsubNotifs = syncCollection<NotificationItem>('notifications', initialNotifications, setNotificationsState);
    const unsubExp = syncCollection<ExpedisiRow>('expedisi', initialExpedisiRows, setExpedisiState);
    const unsubAgenda = syncCollection<AgendaItem>('agenda', initialAgendaList, setAgendaListState);
    const unsubLomba = syncCollection<LombaRow>('lomba', initialLombaRows, setLombaListState);
    const unsubKj = syncCollection<KhotmilJadwalRow>('khotmilJadwal', initialKhotmilJadwal, setKhotmilJadwalState);
    const unsubKa = syncCollection<KhotmilAbsenRow>('khotmilAbsen', initialKhotmilAbsen, setKhotmilAbsenState);
    const unsubHj = syncCollection<HadrahJadwalRow>('hadrahJadwal', initialHadrahJadwal, setHadrahJadwalState);
    const unsubIuran = syncCollection<IuranRow>('iuran', initialIuranRows, setIuranListState);
    const unsubTang = syncCollection<TanggunganRow>('tanggungan', initialTanggunganRows, setTanggunganListState);
    const unsubDon = syncCollection<DonaturRow>('donatur', initialDonaturRows, setDonaturListState);
    const unsubTrans = syncCollection<TransactionRecord>('transactions', [], setTransactionsState);
    const unsubProfile = syncCollection<OrganizationProfile>('organizationProfile', [initialOrganizationProfile], (items) => {
      if (items && items.length > 0) {
        const item = { ...initialOrganizationProfile, ...items[0] };
        try {
          const customLogo = localStorage.getItem('fokus_custom_logo');
          if (customLogo && (!item.logoUrl || item.logoUrl === '/logo.png')) {
            item.logoUrl = customLogo;
          }
        } catch {}
        setOrgProfileState(item);
      }
    });

    return () => {
      unsubSahmasy();
      unsubUsers();
      unsubRoles();
      unsubNotifs();
      unsubExp();
      unsubAgenda();
      unsubLomba();
      unsubKj();
      unsubKa();
      unsubHj();
      unsubIuran();
      unsubTang();
      unsubDon();
      unsubTrans();
      unsubProfile();
    };
  }, []);

  const setOrgProfile = (profile: OrganizationProfile) => {
    const cleanProfile: OrganizationProfile = {
      ...profile,
      id: profile.id || 'fokus_sapudi_main_profile',
      updatedAt: new Date().toISOString()
    };
    setOrgProfileState(cleanProfile);
    try {
      localStorage.setItem('fokus_v3_organizationProfile', JSON.stringify([cleanProfile]));
      if (cleanProfile.logoUrl) {
        localStorage.setItem('fokus_custom_logo', cleanProfile.logoUrl);
      }
    } catch {}
    saveCollection('organizationProfile', [cleanProfile]);
    handleAddNotification('Profil Organisasi Diperbarui', 'Logo kustom dan profil organisasi berhasil disimpan secara permanen dan disinkronkan ke seluruh tampilan.');
  };

  // Synchronized Setters
  const setSahmasy = (updater: React.SetStateAction<SahmasyRow[]>) => {
    setSahmasyState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      
      // Auto synchronize sensus members with Bendahara iuran table and persist asynchronously outside render
      setTimeout(() => {
        saveCollection('sahmasy', next);
        setIuranListState((prevIuran) => {
          const syncedIuran = [...prevIuran];
          let changed = false;

          next.forEach((member) => {
            if (!member.nama && !member.nis) return;

            const existingIdx = syncedIuran.findIndex(
              (u) =>
                (u.nis && member.nis && u.nis.trim().toLowerCase() === member.nis.trim().toLowerCase()) ||
                (u.nama && member.nama && u.nama.trim().toLowerCase() === member.nama.trim().toLowerCase())
            );

            if (existingIdx >= 0) {
              const cur = syncedIuran[existingIdx];
              const updatedAsrama = member.alamat || (member.desa ? `Desa ${member.desa}` : cur.asrama);
              if (
                cur.nis !== member.nis ||
                cur.nama !== member.nama ||
                cur.asrama !== updatedAsrama ||
                cur.noHandphone !== member.noHandphone ||
                cur.tipe !== member.tipe
              ) {
                syncedIuran[existingIdx] = {
                  ...cur,
                  nis: member.nis || cur.nis,
                  nama: member.nama || cur.nama,
                  asrama: updatedAsrama,
                  noHandphone: member.noHandphone || cur.noHandphone,
                  tipe: member.tipe || cur.tipe,
                };
                changed = true;
              }
            } else {
              // Member from sensus doesn't exist in iuran yet -> auto-register
              const defaultNominal = member.tipe?.includes('santri') ? 30000 : 50000;
              syncedIuran.push({
                id: `iuran-sync-${member.id}`,
                no: syncedIuran.length + 1,
                nis: member.nis || '',
                nama: member.nama,
                asrama: member.alamat || (member.desa ? `Desa ${member.desa}` : 'Sapudi'),
                noHandphone: member.noHandphone || '',
                tipe: member.tipe || 'putra',
                nominalPerBulan: defaultNominal,
                jenisIuran: 'Iuran Wajib Rutin 9 Bulan',
                dzulqodah: false,
                dzulhijjah: false,
                muharrom: false,
                shofar: false,
                robiulAwwal: false,
                robiusTsani: false,
                jumadilUla: false,
                jumadilAkhir: false,
                rojab: false,
                keterangan: 'Tersinkron Otomatis Sensus',
                tanggalBayar: '11 Agustus 2026',
                penerima: 'H. Moh. Hasan',
                tahun: member.tahunMasuk || '2026',
              });
              changed = true;
            }
          });

          if (changed) {
            saveCollection('iuran', syncedIuran);
          }
          return changed ? syncedIuran : prevIuran;
        });
      }, 0);

      return next;
    });
  };

  const setUsers = (updater: React.SetStateAction<UserAccount[]>) => {
    setUsersState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('users', next), 0);
      return next;
    });
  };

  const setRolePermissions = (updater: React.SetStateAction<RolePermission[]>) => {
    setRolePermissionsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('rolePermissions', next), 0);
      return next;
    });
  };

  const setExpedisi = (updater: React.SetStateAction<ExpedisiRow[]>) => {
    setExpedisiState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('expedisi', next), 0);
      return next;
    });
  };

  const setAgendaList = (updater: React.SetStateAction<AgendaItem[]>) => {
    setAgendaListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('agenda', next), 0);
      return next;
    });
  };

  const setLombaList = (updater: React.SetStateAction<LombaRow[]>) => {
    setLombaListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('lomba', next), 0);
      return next;
    });
  };

  const setKhotmilJadwal = (updater: React.SetStateAction<KhotmilJadwalRow[]>) => {
    setKhotmilJadwalState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('khotmilJadwal', next), 0);
      return next;
    });
  };

  const setKhotmilAbsen = (updater: React.SetStateAction<KhotmilAbsenRow[]>) => {
    setKhotmilAbsenState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('khotmilAbsen', next), 0);
      return next;
    });
  };

  const setHadrahJadwal = (updater: React.SetStateAction<HadrahJadwalRow[]>) => {
    setHadrahJadwalState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('hadrahJadwal', next), 0);
      return next;
    });
  };

  const setIuranList = (updater: React.SetStateAction<IuranRow[]>) => {
    setIuranListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('iuran', next), 0);
      return next;
    });
  };

  const setTanggunganList = (updater: React.SetStateAction<TanggunganRow[]>) => {
    setTanggunganListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('tanggungan', next), 0);
      return next;
    });
  };

  const setDonaturList = (updater: React.SetStateAction<DonaturRow[]>) => {
    setDonaturListState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('donatur', next), 0);
      return next;
    });
  };

  const setTransactions = (updater: React.SetStateAction<TransactionRecord[]>) => {
    setTransactionsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => saveCollection('transactions', next), 0);
      return next;
    });
  };

  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  // Synchronize current session permanently to localStorage
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('fokus_auth_session', JSON.stringify({
          id: currentUser.id,
          username: currentUser.username,
          role: currentUser.role,
          name: currentUser.name,
          jabatan: currentUser.jabatan
        }));
      } catch (e) {
        console.warn('Failed to persist user session', e);
      }
    }
  }, [currentUser]);

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    try {
      localStorage.setItem('fokus_current_tab', tab);
    } catch {}
  };

  // Compute allowed tabs for current logged in user
  const rolePerm = currentUser ? rolePermissions.find(r => r.roleId === currentUser.role) : null;
  const rawAllowedTabs: TabType[] = currentUser?.customAllowedTabs || rolePerm?.allowedTabs || ['dashboard'];
  // Guarantee 'profil_organisasi' is always accessible to all users, and 'role_management' to admins
  const allowedTabs: TabType[] = Array.from(new Set([
    ...rawAllowedTabs,
    'profil_organisasi' as TabType,
    ...(currentUser?.role === 'admin' ? ['role_management' as TabType] : [])
  ]));

  const handleAddNotification = (title: string, message: string) => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      timestamp: 'Baru saja',
      type: 'success',
      read: false
    };
    saveDoc('notifications', newNotif);
  };

  const handleMarkNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveCollection('notifications', updated);
  };

  const handleTriggerSync = async () => {
    setIsSynced(false);
    await forceRefreshAllCollections();
    setTimeout(() => {
      setIsSynced(true);
      handleAddNotification('Sinkronisasi Cloud Berhasil', 'Seluruh data berhasil disinkronkan langsung dari Cloud Firestore.');
    }, 600);
  };

  if (!currentUser) {
    return (
      <LoginModal
        users={users}
        rolePermissions={rolePermissions}
        logoutNotice={logoutNotice}
        logoUrl={orgProfile.logoUrl || '/logo.png'}
        orgName={orgProfile.namaOrganisasi || 'MANAJEMEN FOKUS SAPUDI'}
        onLogin={(user) => {
          setLogoutNotice(null);
          setCurrentUser(user);
          try {
            localStorage.setItem('fokus_auth_session', JSON.stringify({ id: user.id, username: user.username }));
          } catch (e) {
            console.warn('Failed to save user session', e);
          }
          // If current tab is not allowed for this user role, reset to dashboard
          const userRolePerm = rolePermissions.find(r => r.roleId === user.role);
          const userAllowed = user.customAllowedTabs || userRolePerm?.allowedTabs || ['dashboard'];
          if (!userAllowed.includes(currentTab)) {
            setCurrentTab('dashboard');
          }
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
          try {
            localStorage.removeItem('fokus_auth_session');
          } catch (e) {
            console.warn('Failed to clear user session', e);
          }
        }}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onNotify={handleAddNotification}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        logoUrl={orgProfile.logoUrl || '/logo.png'}
        orgName={orgProfile.namaOrganisasi || 'MANAJEMEN FOKUS SAPUDI'}
        onSelectTab={handleSelectTab}
      />

      {/* Main Container - Full Screen Desktop Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto p-3 sm:p-5 lg:p-6 xl:p-8 gap-4 sm:gap-6 min-h-0">
        
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          allowedTabs={allowedTabs}
          logoUrl={orgProfile.logoUrl || '/logo.png'}
          orgName={orgProfile.namaOrganisasi || 'MANAJEMEN FOKUS SAPUDI'}
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
                onClick={() => handleSelectTab('dashboard')}
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
                  selectedYear={selectedYear}
                  agendaList={agendaList}
                  iuranList={iuranList}
                  donaturList={donaturList}
                  tanggunganList={tanggunganList}
                  khotmilJadwal={khotmilJadwal}
                  hadrahJadwal={hadrahJadwal}
                  orgProfile={orgProfile}
                />
              )}
              {currentTab === 'fokus' && (
                <FokusView
                  expedisi={expedisi}
                  setExpedisi={setExpedisi}
                  agendaList={agendaList}
                  setAgendaList={setAgendaList}
                  onNotify={handleAddNotification}
                  selectedYear={selectedYear}
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                />
              )}
              {currentTab === 'pengajian' && (
                <PengajianView
                  expedisi={expedisi}
                  setExpedisi={setExpedisi}
                  onNotify={handleAddNotification}
                  selectedYear={selectedYear}
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                />
              )}
              {currentTab === 'perlombaan' && (
                <PerlombaanView
                  lombaList={lombaList}
                  setLombaList={setLombaList}
                  onNotify={handleAddNotification}
                  selectedYear={selectedYear}
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                />
              )}
              {currentTab === 'khotmil' && (
                <KhotmilQuranView
                  jadwal={khotmilJadwal}
                  setJadwal={setKhotmilJadwal}
                  absen={khotmilAbsen}
                  setAbsen={setKhotmilAbsen}
                  onNotify={handleAddNotification}
                  selectedYear={selectedYear}
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                />
              )}
              {currentTab === 'hadrah' && (
                <JamiyatulHadrahView
                  jadwal={hadrahJadwal}
                  setJadwal={setHadrahJadwal}
                  onNotify={handleAddNotification}
                  selectedYear={selectedYear}
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                />
              )}
              {currentTab === 'bendahara' && (
                <BendaharaView
                  sahmasy={sahmasy}
                  iuranList={iuranList}
                  setIuranList={setIuranList}
                  tanggunganList={tanggunganList}
                  setTanggunganList={setTanggunganList}
                  donaturList={donaturList}
                  setDonaturList={setDonaturList}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  onNotify={handleAddNotification}
                  selectedYear={selectedYear}
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                />
              )}
              {currentTab === 'sensus' && (
                <SensusView 
                  sahmasy={sahmasy} 
                  setSahmasy={setSahmasy} 
                  iuranList={iuranList}
                  setIuranList={setIuranList}
                  onNotify={handleAddNotification} 
                  selectedYear={selectedYear} 
                  orgProfile={orgProfile}
                  logoUrl={orgProfile.logoUrl}
                  onNavigateTab={(tab) => setCurrentTab(tab as any)}
                />
              )}
              {currentTab === 'kta' && <KtaView sahmasy={sahmasy} onNotify={handleAddNotification} selectedYear={selectedYear} logoUrl={orgProfile.logoUrl} orgProfile={orgProfile} />}
              {currentTab === 'profil_organisasi' && (
                <OrganizationProfileView
                  profile={orgProfile}
                  onSaveProfile={setOrgProfile}
                  currentUser={currentUser}
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

