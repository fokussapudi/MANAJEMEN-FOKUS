import React, { useState } from 'react';
import { UserAccount, RolePermission } from '../types';
import { initialUsers, initialRolePermissions } from '../data/initialData';
import { PermanentImage } from './PermanentImage';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Users, 
  KeyRound, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: UserAccount) => void;
  users?: UserAccount[];
  rolePermissions?: RolePermission[];
  logoutNotice?: string | null;
  logoUrl?: string;
  orgName?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  onLogin, 
  users, 
  rolePermissions,
  logoutNotice,
  logoUrl,
  orgName
}) => {
  const userList = users && users.length > 0 ? users : initialUsers;
  const permissionsList = rolePermissions && rolePermissions.length > 0 ? rolePermissions : initialRolePermissions;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRegisteredList, setShowRegisteredList] = useState(true);

  // Look for registered account as user types
  const matchedUser = userList.find(
    u => u.username.trim().toLowerCase() === username.trim().toLowerCase()
  );

  const matchedRoleInfo = matchedUser 
    ? permissionsList.find(r => r.roleId === matchedUser.role)
    : null;

  const handleSelectAccount = (acc: UserAccount) => {
    setUsername(acc.username);
    setPassword('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const found = userList.find(u => u.username.trim().toLowerCase() === cleanUsername);

    if (!found) {
      setError('Akses Ditolak: Username tidak terdaftar dalam sistem. Hanya Admin dan Pengurus resmi yang terdaftar pada aplikasi yang diizinkan masuk.');
      return;
    }

    if (found.isActive === false) {
      setError('Akses Dinonaktifkan: Akun Anda dinonaktifkan oleh Super Admin. Mohon hubungi Administrator pusat.');
      return;
    }

    if (found.encryptedPassword && found.encryptedPassword !== password) {
      setError('Kata sandi (password) salah. Silakan periksa kembali kata sandi akun Anda.');
      return;
    }

    // Success - log in with exact registered user profile
    onLogin(found);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in zoom-in duration-300 my-6">
        
        {/* Header Emerald Islamic Theme */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white text-center relative shadow-md">
          <div className="absolute top-2 right-3 text-amber-300/40 text-2xl font-serif">✦</div>
          <div className="absolute bottom-2 left-3 text-amber-300/40 text-2xl font-serif">✦</div>
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 border-2 border-amber-400 shadow-inner overflow-hidden p-0.5">
            <PermanentImage src={logoUrl || "/logo.png"} fallbackSrc="/logo.png" alt="Logo Fokus Sapudi" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide font-serif text-amber-200 uppercase">
            {orgName || 'MANAJEMEN FOKUS SAPUDI'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Sistem Autentikasi & Otorisasi Hak Akses Berbasis Role Terdaftar
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {logoutNotice && (
            <div className="p-3 text-xs bg-amber-50 text-amber-900 font-medium rounded-xl border border-amber-300 flex items-start gap-2 shadow-sm">
              <span className="text-amber-600 font-bold shrink-0">⏱️</span>
              <span>{logoutNotice}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium flex items-start gap-2.5 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Quick Account Select / Hint Accordion */}
          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-bold text-emerald-950">
                  Daftar Akun Admin & Pengurus Terdaftar ({userList.length} Akun)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisteredList(!showRegisteredList)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition"
              >
                <span>{showRegisteredList ? 'Sembunyikan' : 'Lihat Akun'}</span>
                {showRegisteredList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showRegisteredList && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {userList.map(u => {
                  const isSelected = username.trim().toLowerCase() === u.username.toLowerCase();
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectAccount(u)}
                      className={`text-left p-2 rounded-xl text-xs transition border flex items-center gap-2.5 ${
                        isSelected 
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-amber-400/60' 
                          : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100/70'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-800 text-amber-200'
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold truncate text-[11px]">{u.name}</p>
                          {u.isActive === false && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded">Nonaktif</span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-amber-200' : 'text-emerald-700'}`}>
                          @{u.username} • <span className="font-medium">{u.role}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Username Akun Terdaftar</span>
                {matchedUser && (
                  <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 normal-case bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Terverifikasi: {matchedUser.role.toUpperCase()}</span>
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-700">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-emerald-50/40 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none text-emerald-950 font-semibold placeholder:text-emerald-800/40"
                  placeholder="Contoh: admin, sekretaris, bendahara, dll..."
                  autoComplete="username"
                />
              </div>
              {matchedUser && (
                <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950">{matchedUser.name}</span>
                    <span className="text-emerald-700 block text-[10px]">{matchedUser.jabatan}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-amber-200 text-[10px] font-bold uppercase tracking-wider">
                    {matchedUser.role}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-700">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  className="w-full pl-10 pr-12 py-2.5 text-xs sm:text-sm bg-emerald-50/40 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none text-emerald-950 font-semibold placeholder:text-emerald-800/40"
                  placeholder="Masukkan kata sandi akun..."
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-700 hover:text-emerald-950 transition"
                  title={showPassword ? "Sembunyikan Kata Sandi" : "Fitur Mata Intip (Tampilkan Sandi)"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Klik ikon mata intip untuk melihat karakter kata sandi saat mengetik.</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-amber-200 font-bold rounded-xl shadow-lg transition transform active:scale-98 text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Masuk Sistem Terotorisasi</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        </div>

        <div className="bg-emerald-50 px-6 py-3 text-center text-[11px] text-emerald-800 border-t border-emerald-100 flex items-center justify-center gap-2">
          <KeyRound className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Hanya akun yang terdaftar oleh Administrator yang dapat mengakses sistem ini.</span>
        </div>
      </div>
    </div>
  );
};

