import React, { useState } from 'react';
import { UserAccount, RolePermission, TabType } from '../types';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Sliders, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Eye, 
  EyeOff,
  Plus, 
  Sparkles, 
  ShieldAlert, 
  Key, 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Trophy, 
  BookmarkCheck, 
  Music, 
  Wallet, 
  Cloud, 
  User, 
  RefreshCw 
} from 'lucide-react';

interface RoleManagementViewProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  rolePermissions: RolePermission[];
  setRolePermissions: React.Dispatch<React.SetStateAction<RolePermission[]>>;
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onNotify: (title: string, message: string) => void;
}

export const ALL_TAB_MODULES: { id: TabType; label: string; icon: any; category: string }[] = [
  { id: 'dashboard', label: 'Dashboard & Statistik', icon: LayoutDashboard, category: 'Utama' },
  { id: 'fokus', label: 'A. FOKUS & Expedisi Surat', icon: FileText, category: 'Sekretariat' },
  { id: 'pengajian', label: 'B. Pengajian (Undangan)', icon: BookOpen, category: 'Sekretariat' },
  { id: 'perlombaan', label: 'C. Perlombaan & Piagam', icon: Trophy, category: 'Panitia' },
  { id: 'khotmil', label: 'D. Khotmil Qur\'an', icon: BookmarkCheck, category: 'Ibadah' },
  { id: 'hadrah', label: 'E. Jam\'iyatul Hadrah', icon: Music, category: 'Seni' },
  { id: 'bendahara', label: 'F. Bendahara & Kas Realtime', icon: Wallet, category: 'Keuangan' },
  { id: 'sensus', label: 'G. Sensus Database Anggota', icon: Users, category: 'Database' },
  { id: 'google_sync', label: 'Integrasi Google Drive & Sheets', icon: Cloud, category: 'Sistem' },
  { id: 'role_management', label: 'H. Role & Manajemen Admin', icon: ShieldCheck, category: 'Super Admin' },
];

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  users,
  setUsers,
  rolePermissions,
  setRolePermissions,
  currentUser,
  onSwitchUser,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles' | 'guide'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal State for User
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Eye Peek Password States
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  const toggleShowPassword = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Form Fields for User
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('pengurus');
  const [formJabatan, setFormJabatan] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [useCustomTabs, setUseCustomTabs] = useState(false);
  const [formCustomTabs, setFormCustomTabs] = useState<TabType[]>(['dashboard']);

  // Modal State for New Role
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleTabs, setNewRoleTabs] = useState<TabType[]>(['dashboard']);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Open User Modal (Add / Edit)
  const handleOpenUserModal = (user?: UserAccount) => {
    setShowModalPassword(false);
    if (user) {
      setEditingUser(user);
      setFormName(user.name);
      setFormUsername(user.username);
      setFormPassword(user.encryptedPassword || 'admin123');
      setFormRole(user.role);
      setFormJabatan(user.jabatan);
      setFormFotoUrl(user.fotoUrl || '');
      setFormIsActive(user.isActive !== false);
      if (user.customAllowedTabs) {
        setUseCustomTabs(true);
        setFormCustomTabs(user.customAllowedTabs);
      } else {
        setUseCustomTabs(false);
        const perm = rolePermissions.find(r => r.roleId === user.role);
        setFormCustomTabs(perm ? perm.allowedTabs : ['dashboard']);
      }
    } else {
      setEditingUser(null);
      setFormName('');
      setFormUsername('');
      setFormPassword('123456');
      setFormRole('pengurus');
      setFormJabatan('');
      setFormFotoUrl('');
      setFormIsActive(true);
      setUseCustomTabs(false);
      const perm = rolePermissions.find(r => r.roleId === 'pengurus');
      setFormCustomTabs(perm ? perm.allowedTabs : ['dashboard']);
    }
    setShowUserModal(true);
  };

  // Toggle Custom Tab Checkbox in User Modal
  const handleToggleUserCustomTab = (tabId: TabType) => {
    if (formCustomTabs.includes(tabId)) {
      if (formCustomTabs.length === 1) {
        alert('Pengguna wajib memiliki minimal 1 akses menu (Dashboard).');
        return;
      }
      setFormCustomTabs(formCustomTabs.filter(t => t !== tabId));
    } else {
      setFormCustomTabs([...formCustomTabs, tabId]);
    }
  };

  // Save User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername || !formJabatan) {
      alert('Mohon lengkapi Nama, Username, dan Jabatan.');
      return;
    }

    if (editingUser) {
      const updated = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: formName,
            username: formUsername,
            role: formRole,
            jabatan: formJabatan,
            encryptedPassword: formPassword || u.encryptedPassword || '123456',
            fotoUrl: formFotoUrl || u.fotoUrl,
            isActive: formIsActive,
            customAllowedTabs: useCustomTabs ? formCustomTabs : undefined
          };
        }
        return u;
      });
      setUsers(updated);
      onNotify('Pengguna Diperbarui', `Akun ${formName} berhasil diperbarui.`);
    } else {
      // Check username exists
      if (users.some(u => u.username.toLowerCase() === formUsername.toLowerCase())) {
        alert('Username sudah digunakan oleh akun lain.');
        return;
      }
      const newUser: UserAccount = {
        id: 'usr-' + Date.now(),
        name: formName,
        username: formUsername,
        role: formRole,
        jabatan: formJabatan,
        encryptedPassword: formPassword || '123456',
        fotoUrl: formFotoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        isActive: formIsActive,
        customAllowedTabs: useCustomTabs ? formCustomTabs : undefined
      };
      setUsers([newUser, ...users]);
      onNotify('Pengguna Baru Ditambahkan', `Akun pengguna ${formName} (${formRole.toUpperCase()}) telah berhasil dibuat.`);
    }
    setShowUserModal(false);
  };

  // Delete User
  const handleDeleteUser = (id: string, name: string) => {
    if (id === '1' || id === currentUser.id) {
      alert('Akun Super Admin Utama tidak dapat dihapus.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${name}"?`)) {
      setUsers(users.filter(u => u.id !== id));
      onNotify('Pengguna Dihapus', `Akun ${name} telah dihapus dari sistem.`);
    }
  };

  // Toggle Active Status
  const handleToggleUserActive = (id: string) => {
    if (id === '1') {
      alert('Akun Super Admin Utama tidak dapat dinonaktifkan.');
      return;
    }
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
    onNotify('Status Akun Diubah', 'Status keaktifan pengguna berhasil diperbarui.');
  };

  // Toggle Role Permission Matrix Checkbox
  const handleToggleRoleTab = (roleId: string, tabId: TabType) => {
    if (roleId === 'admin' && tabId === 'role_management') {
      alert('Role Super Admin wajib mempertahankan akses menu Role Management.');
      return;
    }

    setRolePermissions(rolePermissions.map(r => {
      if (r.roleId === roleId) {
        const hasTab = r.allowedTabs.includes(tabId);
        if (hasTab) {
          if (r.allowedTabs.length === 1) {
            alert('Setiap role wajib memiliki minimal 1 hak akses menu.');
            return r;
          }
          return { ...r, allowedTabs: r.allowedTabs.filter(t => t !== tabId) };
        } else {
          return { ...r, allowedTabs: [...r.allowedTabs, tabId] };
        }
      }
      return r;
    }));
  };

  // Save Role Matrix Notification
  const handleSaveRoleMatrix = () => {
    onNotify('Otorisasi Role Disimpan', 'Matriks hak akses tampilan per role berhasil diperbarui & berlaku secara real-time.');
  };

  // Create New Role
  const handleSaveNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId || !newRoleName) {
      alert('Mohon isi ID Role dan Nama Role.');
      return;
    }
    const cleanId = newRoleId.toLowerCase().replace(/\s+/g, '_');
    if (rolePermissions.some(r => r.roleId === cleanId)) {
      alert('ID Role ini sudah ada.');
      return;
    }

    const newRole: RolePermission = {
      roleId: cleanId,
      roleName: newRoleName,
      description: newRoleDesc || 'Role kustom pengurus organisasi.',
      allowedTabs: newRoleTabs
    };

    setRolePermissions([...rolePermissions, newRole]);
    setShowRoleModal(false);
    setNewRoleId('');
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleTabs(['dashboard']);
    onNotify('Role Baru Dibuat', `Role "${newRoleName}" berhasil dibuat dan siap diberikan ke pengguna.`);
  };

  return (
    <div className="space-[#2D3A3A] space-y-6">
      
      {/* Header Banner - Super Admin Controls */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent)] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400/60 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-bold uppercase tracking-wider">
                  SUPER ADMIN OTORISASI PUSAT
                </span>
                <span className="text-[10px] text-emerald-300 bg-emerald-800/60 px-2 py-0.5 rounded-full border border-emerald-700">
                  Akses Bertingkat Real-Time
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-amber-100 mt-1">
                Role & Manajemen Akses Pengguna
              </h2>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl leading-relaxed">
                Kelola akun admin/user, tingkatkan keamanan organisasi, dan sesuaikan hak akses tampilan menu secara spesifik sesuai tugas & fungsi masing-masing pengurus.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenUserModal()}
              className="px-4 py-2.5 bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition shadow-lg flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pengguna Baru</span>
            </button>
            <button
              onClick={() => setShowRoleModal(true)}
              className="px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 font-bold text-xs rounded-xl border border-emerald-600 transition flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Buat Role Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/60 text-xs">
          <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800/80">
            <p className="text-[10px] text-emerald-300">Total Akun Terdaftar</p>
            <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">{users.length} User</p>
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800/80">
            <p className="text-[10px] text-emerald-300">Total Kategori Role</p>
            <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">{rolePermissions.length} Role</p>
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800/80">
            <p className="text-[10px] text-emerald-300">Pengguna Aktif</p>
            <p className="text-lg font-bold font-mono text-emerald-300 mt-0.5">{users.filter(u => u.isActive !== false).length} Aktif</p>
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800/80">
            <p className="text-[10px] text-emerald-300">Total Modul Tampilan</p>
            <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">{ALL_TAB_MODULES.length} Menu</p>
          </div>
        </div>
      </div>

      {/* Main Sub Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-emerald-200 pb-2">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'bg-emerald-900 text-amber-200 shadow-md'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Daftar Akun Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'roles'
              ? 'bg-emerald-900 text-amber-200 shadow-md'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Matriks Hak Akses Per Role ({rolePermissions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'guide'
              ? 'bg-emerald-900 text-amber-200 shadow-md'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Simulasi & Panduan Akses</span>
        </button>
      </div>

      {/* SUB TAB 1: USER ACCOUNTS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-4">
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
              <input
                type="text"
                placeholder="Cari nama, username, jabatan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-emerald-800 font-semibold whitespace-nowrap">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="p-1.5 text-xs bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950 focus:outline-none"
              >
                <option value="all">Semua Role Pengurus</option>
                {rolePermissions.map(r => (
                  <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of Users */}
          <div className="overflow-x-auto rounded-2xl border border-emerald-100 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-900 text-amber-200 font-bold">
                  <th className="p-3 w-10 text-center">NO</th>
                  <th className="p-3">PENGGUNA / NAMA</th>
                  <th className="p-3">USERNAME & JABATAN</th>
                  <th className="p-3">KATA SANDI</th>
                  <th className="p-3">ROLE PERMISSION</th>
                  <th className="p-3 text-center">AKSES MENU</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3 text-center w-36">AKSI SUPER ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-950">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-emerald-600">
                      Tidak ada pengguna yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const roleInfo = rolePermissions.find(r => r.roleId === u.role);
                    const isSelf = currentUser.id === u.id;
                    const effectiveAllowedTabs = u.customAllowedTabs || (roleInfo ? roleInfo.allowedTabs : ['dashboard']);

                    return (
                      <tr key={u.id} className={`hover:bg-emerald-50/60 transition ${isSelf ? 'bg-amber-50/50 font-medium' : ''}`}>
                        <td className="p-3 text-center font-bold text-emerald-700">{idx + 1}</td>
                        
                        {/* Avatar & Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {u.fotoUrl ? (
                              <img src={u.fotoUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover border-2 border-emerald-300 shadow-sm shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center font-bold text-emerald-800 text-xs shrink-0">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-emerald-950">{u.name}</p>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-bold rounded">Anda</span>
                                )}
                              </div>
                              <p className="text-[10px] text-emerald-600 font-mono">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Username & Jabatan */}
                        <td className="p-3">
                          <p className="font-mono font-bold text-emerald-900">@{u.username}</p>
                          <p className="text-[11px] text-emerald-700">{u.jabatan}</p>
                        </td>

                        {/* Password with Fitur Mata Intip */}
                        <td className="p-3">
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/80">
                            <span className="font-mono text-xs font-bold text-emerald-950 min-w-[70px]">
                              {visiblePasswords[u.id] ? (u.encryptedPassword || '123456') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(u.id)}
                              className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 rounded-lg transition shrink-0"
                              title={visiblePasswords[u.id] ? "Sembunyikan Kata Sandi" : "Fitur Mata Intip (Tampilkan Sandi)"}
                            >
                              {visiblePasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-800" />}
                            </button>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {roleInfo ? roleInfo.roleName : u.role}
                          </span>
                        </td>

                        {/* Allowed Menus Count & Custom Tag */}
                        <td className="p-3 text-center">
                          <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                            {effectiveAllowedTabs.length} / {ALL_TAB_MODULES.length} Menu
                          </span>
                          {u.customAllowedTabs && (
                            <p className="text-[9px] text-amber-700 font-bold mt-0.5">Kustom Khusus</p>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleUserActive(u.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition ${
                              u.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {u.isActive !== false ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span>Non-Aktif</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Simulasi Login / Switch View */}
                            <button
                              onClick={() => {
                                onSwitchUser(u);
                                onNotify('Simulasi Pengguna', `Tampilan dialihkan sebagai ${u.name} (${u.role.toUpperCase()}).`);
                              }}
                              className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition"
                              title={`Uji Simulasi Tampilan sebagai ${u.name}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenUserModal(u)}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition"
                              title="Edit Pengguna & Hak Akses Menu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 2: ROLE PERMISSIONS MATRIX */}
      {activeSubTab === 'roles' && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs">
            <div>
              <h3 className="font-bold text-amber-950 flex items-center gap-2 text-sm">
                <Sliders className="w-4 h-4 text-amber-600" />
                Matriks Pengaturan Tampilan & Hak Akses Per Role
              </h3>
              <p className="text-amber-800 mt-0.5">
                Centang atau hilangkan centang pada modul menu di bawah untuk mengizinkan atau membatasi apa yang dapat dilihat & diakses oleh masing-masing Role secara real-time.
              </p>
            </div>
            <button
              onClick={handleSaveRoleMatrix}
              className="px-4 py-2 bg-emerald-900 text-amber-200 font-bold rounded-xl hover:bg-emerald-800 transition shrink-0 shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Simpan Perubahan Otorisasi</span>
            </button>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto rounded-2xl border border-emerald-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-950 text-white">
                  <th className="p-3 min-w-[180px]">KATEGORI ROLE / JABATAN</th>
                  {ALL_TAB_MODULES.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <th key={tab.id} className="p-2.5 text-center min-w-[110px] border-l border-emerald-800/60">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Icon className="w-4 h-4 text-amber-300" />
                          <span className="text-[10px] font-bold leading-tight tracking-tight text-emerald-100">{tab.label}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 text-emerald-950">
                {rolePermissions.map(role => (
                  <tr key={role.roleId} className="hover:bg-emerald-50/50 transition">
                    
                    {/* Role Description Header */}
                    <td className="p-3.5 bg-emerald-50/40">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-950 text-xs">{role.roleName}</span>
                        {role.isSuperAdmin && (
                          <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-bold rounded">Pusat</span>
                        )}
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-0.5 line-clamp-2">{role.description}</p>
                      <p className="text-[9px] font-mono text-emerald-500 mt-1">ID: {role.roleId}</p>
                    </td>

                    {/* Module Checkboxes */}
                    {ALL_TAB_MODULES.map(tab => {
                      const isChecked = role.allowedTabs.includes(tab.id);
                      return (
                        <td key={tab.id} className="p-2.5 text-center border-l border-emerald-100">
                          <button
                            type="button"
                            onClick={() => handleToggleRoleTab(role.roleId, tab.id)}
                            className={`p-2 rounded-xl border transition flex items-center justify-center mx-auto ${
                              isChecked
                                ? 'bg-emerald-800 text-amber-300 border-emerald-700 shadow-sm hover:bg-emerald-700'
                                : 'bg-gray-50 text-gray-300 border-gray-200 hover:border-emerald-300 hover:text-emerald-500'
                            }`}
                            title={`Klik untuk ${isChecked ? 'mencabut' : 'memberikan'} akses ${tab.label} untuk role ${role.roleName}`}
                          >
                            {isChecked ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 opacity-40" />}
                          </button>
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 3: GUIDE & SIMULATOR */}
      {activeSubTab === 'guide' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-6">
          <div className="border-b border-emerald-100 pb-4">
            <h3 className="text-base font-serif font-bold text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Panduan & Pengujian Simulasi Tampilan Berdasarkan Role
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Sebagai Super Admin, Anda dapat menguji secara langsung bagaimana antarmuka pengguna tampak di masing-masing Role Pengurus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => {
              const roleInfo = rolePermissions.find(r => r.roleId === u.role);
              const allowed = u.customAllowedTabs || (roleInfo ? roleInfo.allowedTabs : []);
              return (
                <div key={u.id} className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      {u.fotoUrl ? (
                        <img src={u.fotoUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center font-bold text-emerald-800">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-emerald-950">{u.name}</h4>
                        <p className="text-[10px] text-emerald-700">{u.jabatan}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.2 bg-emerald-900 text-amber-200 text-[9px] font-bold rounded uppercase">
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-1">
                      <p className="text-[10px] font-bold text-emerald-900">Akses Menu Terbuka ({allowed.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {allowed.map(tabId => {
                          const tabObj = ALL_TAB_MODULES.find(t => t.id === tabId);
                          return (
                            <span key={tabId} className="px-1.5 py-0.5 bg-white border border-emerald-200 rounded text-[9px] font-semibold text-emerald-800">
                              {tabObj ? tabObj.label : tabId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSwitchUser(u);
                      onNotify('Simulasi Beralih', `Sekarang melihat sistem sebagai ${u.name}`);
                    }}
                    className="w-full py-2 bg-emerald-900 text-amber-200 text-xs font-bold rounded-xl hover:bg-emerald-800 transition flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Uji Tampilan Role Ini</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT USER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h3 className="font-serif font-bold text-emerald-950 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <span>{editingUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna & Otorisasi Baru'}</span>
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Nama Lengkap Pengurus</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Ust. H. Abdullah Faqih"
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="Contoh: faqih99"
                    className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Kata Sandi (Password)</label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="Kata sandi..."
                      className="w-full p-2 pr-9 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 hover:text-emerald-800"
                      title={showModalPassword ? "Sembunyikan Kata Sandi" : "Fitur Mata Intip (Tampilkan Sandi)"}
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Role / Otorisasi</label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl font-bold text-emerald-900"
                  >
                    {rolePermissions.map(r => (
                      <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Jabatan Resmi</label>
                  <input
                    type="text"
                    required
                    value={formJabatan}
                    onChange={e => setFormJabatan(e.target.value)}
                    placeholder="Contoh: Koordinator Perlombaan"
                    className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Link Foto Profil (Opsional)</label>
                <input
                  type="url"
                  value={formFotoUrl}
                  onChange={e => setFormFotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkActive"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-500"
                />
                <label htmlFor="chkActive" className="font-bold text-emerald-950">
                  Akun dalam Status Aktif (Bisa Digunakan Login)
                </label>
              </div>

              {/* Custom Access Rights Toggle */}
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-600" />
                    Pengecualian Akses Kustom Per Pengguna
                  </span>
                  <input
                    type="checkbox"
                    checked={useCustomTabs}
                    onChange={e => setUseCustomTabs(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                </div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  Aktifkan jika ingin memberikan kombinasi akses menu khusus secara individu yang berbeda dari standar Role.
                </p>

                {useCustomTabs && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-amber-200">
                    {ALL_TAB_MODULES.map(tab => {
                      const isChecked = formCustomTabs.includes(tab.id);
                      return (
                        <label key={tab.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-amber-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleUserCustomTab(tab.id)}
                            className="w-3.5 h-3.5 text-emerald-800"
                          />
                          <span className="text-[10px] font-semibold text-emerald-950">{tab.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-100">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-900 text-amber-200 font-bold rounded-xl hover:bg-emerald-800">
                  Simpan Pengguna
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT ROLE BARU */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h3 className="font-serif font-bold text-emerald-950 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Buat Kategori Role Baru</span>
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">ID Role (Singkat, tanpa spasi)</label>
                <input
                  type="text"
                  required
                  value={newRoleId}
                  onChange={e => setNewRoleId(e.target.value)}
                  placeholder="Contoh: logistik, konsumsi, publikasi"
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Nama Role / Kategori</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="Contoh: Tim Logistik & Konsumsi"
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Deskripsi Tugas Role</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Jelaskan wewenang dan tugas umum role ini..."
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Pilih Default Modul Menu Terbuka</label>
                <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                  {ALL_TAB_MODULES.map(tab => {
                    const isChecked = newRoleTabs.includes(tab.id);
                    return (
                      <label key={tab.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-emerald-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewRoleTabs(newRoleTabs.filter(t => t !== tab.id));
                            } else {
                              setNewRoleTabs([...newRoleTabs, tab.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 text-emerald-800"
                        />
                        <span className="text-[10px] font-semibold text-emerald-950">{tab.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-100">
                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-900 text-amber-200 font-bold rounded-xl hover:bg-emerald-800">
                  Buat Role Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
