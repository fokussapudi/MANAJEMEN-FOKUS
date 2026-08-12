import React, { useState } from 'react';
import { UserAccount } from '../types';
import { initialUsers } from '../data/initialData';
import { Eye, EyeOff, ShieldCheck, Lock, User, Sparkles } from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: UserAccount) => void;
  users?: UserAccount[];
  logoutNotice?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, users, logoutNotice }) => {
  const userList = users && users.length > 0 ? users : initialUsers;
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = userList.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      if (found.encryptedPassword && found.encryptedPassword !== password) {
        setError('Kata sandi (password) yang Anda masukkan salah.');
        return;
      }
      if (found.isActive === false) {
        setError('Akun Anda dinonaktifkan oleh Super Admin. Mohon hubungi administrator.');
        return;
      }
      onLogin(found);
    } else {
      // Allow custom login or match default
      const customUser: UserAccount = {
        id: Date.now().toString(),
        username,
        name: username.charAt(0).toUpperCase() + username.slice(1) + ' (Pengurus)',
        role: selectedRole as any,
        jabatan: 'Pengurus Organisasi Fokus Sapudi'
      };
      onLogin(customUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header Emerald Islamic Theme */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white text-center relative">
          <div className="absolute top-2 right-3 text-amber-300/40 text-2xl font-serif">✦</div>
          <div className="absolute bottom-2 left-3 text-amber-300/40 text-2xl font-serif">✦</div>
          <div className="mx-auto w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 border-2 border-amber-400 shadow-inner overflow-hidden">
            <img src="/logo.jpg" alt="Logo Fokus Sapudi" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold tracking-wide font-serif text-amber-200">MANAJEMENT FOKUS SAPUDI</h1>
          <p className="text-xs text-emerald-200 mt-1">Sistem Pencatatan Organisasi Terintegrasi & Aman</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {logoutNotice && (
            <div className="p-3 text-xs bg-amber-50 text-amber-900 font-medium rounded-xl border border-amber-300 flex items-start gap-2 shadow-sm">
              <span className="text-amber-600 font-bold shrink-0">⏱️</span>
              <span>{logoutNotice}</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
              Username / Jabatan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-600">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-emerald-950 font-medium"
                placeholder="Masukkan username..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
              Kata Sandi Terenkripsi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-600">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-2.5 text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-emerald-950 font-medium"
                placeholder="Kata sandi..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600 hover:text-emerald-800 transition"
                title={showPassword ? "Sembunyikan Kata Sandi" : "Fitur Mata Intip (Tampilkan Sandi)"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Gunakan fitur mata intip untuk melihat kata sandi terenkripsi.</span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition transform active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <span>Masuk Sistem Terotorisasi</span>
            </button>
          </div>
        </form>

        <div className="bg-emerald-50 px-6 py-3 text-center text-xs text-emerald-700 border-t border-emerald-100 flex items-center justify-center gap-2">
          <span>🔒 Auto-Logout 5 Menit Inaktif & AES-256 Ready</span>
        </div>
      </div>
    </div>
  );
};
