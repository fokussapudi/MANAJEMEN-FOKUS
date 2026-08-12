import React from 'react';
import { initialFokusStats } from '../data/initialData';
import { SahmasyRow, TabType, UserAccount } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { FileText, Calendar, CheckCircle, Users, Trophy, Wallet, ArrowUpRight, ShieldCheck, BookOpen, BookmarkCheck, Music } from 'lucide-react';

interface DashboardViewProps {
  sahmasy: SahmasyRow[];
  onNavigate: (tab: TabType) => void;
  currentUser?: UserAccount;
  allowedTabs?: TabType[];
}

const pieData = [
  { name: 'Kegiatan Terlaksana', value: 31, color: '#047857' },
  { name: 'Belum Terlaksana', value: 9, color: '#d97706' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ sahmasy, onNavigate, currentUser, allowedTabs }) => {
  const putraCount = sahmasy.filter(s => s.tipe === 'putra').length;
  const putriCount = sahmasy.filter(s => s.tipe === 'putri').length;
  const santriPutraCount = sahmasy.filter(s => s.tipe === 'santri_putra').length;
  const santriPutriCount = sahmasy.filter(s => s.tipe === 'santri_putri').length;
  const totalAnggota = sahmasy.length;

  const isTabAllowed = (tab: TabType) => !allowedTabs || allowedTabs.includes(tab);

  const activityData = [
    { name: 'Panitia Lokal', count: 2 },
    { name: 'Aktivis Putra', count: 2 },
    { name: 'Aktivis Putri', count: 4 },
    { name: 'Rapat Fokus', count: 2 },
    { name: 'Sahmasy Putra', count: putraCount },
    { name: 'Sahmasy Putri', count: putriCount },
    { name: 'Santri Putra', count: santriPutraCount },
    { name: 'Santri Putri', count: santriPutriCount },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center border-2 border-amber-400 shadow-xl overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="Logo Fokus Sapudi" className="w-full h-full object-cover" />
          </div>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-200 text-xs font-semibold mb-3 border border-emerald-700">
              <span>✨ Sistem Manajemen Organisasi Terpadu</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-100 tracking-wide">
              MANAJEMENT FOKUS SAPUDI
            </h2>
            <p className="text-emerald-100 text-sm md:text-base mt-2 leading-relaxed">
              Pusat administrasi, pengkajian, perlombaan, khotmil qur'an, jam'iyatul hadrah, keuangan bendahara, sensus database, dan otorisasi manajemen admin/user bertingkat.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {isTabAllowed('fokus') && (
                <button
                  onClick={() => onNavigate('fokus')}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2"
                >
                  <span>Kelola Administrasi & FOKUS</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
              {isTabAllowed('bendahara') && (
                <button
                  onClick={() => onNavigate('bendahara')}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm border border-emerald-600 transition flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-amber-300" />
                  <span>Laporan Kas & Bendahara</span>
                </button>
              )}
              {isTabAllowed('role_management') && (
                <button
                  onClick={() => onNavigate('role_management')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Role & Management Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Administrasi Surat</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-950">{initialFokusStats.jumlahTotal}</span>
              <span className="text-xs text-emerald-700">Total ({initialFokusStats.suratMasuk} Masuk, {initialFokusStats.suratKeluar} Keluar)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Rencana Kegiatan</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-950">{initialFokusStats.rencanaKegiatanTotal}</span>
              <span className="text-xs text-emerald-700">Frekuensi Rapat: {initialFokusStats.frekuensiRapat}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Kegiatan Terlaksana</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-950">{initialFokusStats.kegiatanTerlaksana}</span>
              <span className="text-xs text-amber-600 font-medium">({initialFokusStats.kegiatanBelumTerlaksana} Tertunda)</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => isTabAllowed('sensus') && onNavigate('sensus')}
          className={`bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center space-x-4 ${isTabAllowed('sensus') ? 'cursor-pointer hover:border-emerald-300' : ''} transition`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Database Anggota</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-950">{totalAnggota}</span>
              <span className="text-[11px] text-emerald-700">(P: {putraCount}, Pi: {putriCount}, S.Putra: {santriPutraCount}, S.Putri: {santriPutriCount})</span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Rencana Kegiatan Per Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-emerald-950 font-serif">Grafik Distribusi Rencana Kegiatan FOKUS</h3>
              <p className="text-xs text-emerald-600">Frekuensi rapat dan panitia di setiap divisi organisasi</p>
            </div>
            {isTabAllowed('fokus') && (
              <button
                onClick={() => onNavigate('fokus')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
              >
                Lihat Detail
              </button>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 10, fill: '#065f46' }} />
                <YAxis tick={{ fontSize: 11, fill: '#065f46' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#065f46', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#047857" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Kegiatan */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-emerald-950 font-serif">Status Pelaksanaan Kegiatan</h3>
            <p className="text-xs text-emerald-600">Perbandingan kegiatan terlaksana vs belum terlaksana</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-emerald-50 text-center">
            <p className="text-xs text-emerald-700 font-medium">Total Rencana: 40 Kegiatan Fokus</p>
          </div>
        </div>

      </div>

      {/* Quick Access Module Cards */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
        <h3 className="text-base font-bold text-emerald-950 font-serif mb-4">Modul Utama Sesuai Otorisasi Tugas Anda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {isTabAllowed('fokus') && (
            <div 
              onClick={() => onNavigate('fokus')}
              className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-emerald-800 text-white rounded-xl group-hover:scale-110 transition"><FileText className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-full">58 Surat</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">A. FOKUS & Expedisi Rapat</h4>
              <p className="text-xs text-emerald-700 mt-1">Administrasi, rapat pra/pasca, panitia lokal & sahmasy.</p>
            </div>
          )}

          {isTabAllowed('perlombaan') && (
            <div 
              onClick={() => onNavigate('perlombaan')}
              className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-teal-800 text-white rounded-xl group-hover:scale-110 transition"><Trophy className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-200/60 px-2 py-0.5 rounded-full">4 Kategori</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">C. Perlombaan & Piagam</h4>
              <p className="text-xs text-emerald-700 mt-1">Penilaian lomba, upload berkas, dan cetak piagam A4.</p>
            </div>
          )}

          {isTabAllowed('bendahara') && (
            <div 
              onClick={() => onNavigate('bendahara')}
              className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-amber-700 text-white rounded-xl group-hover:scale-110 transition"><Wallet className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">Live Kas</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">F. Bendahara & Iuran</h4>
              <p className="text-xs text-emerald-700 mt-1">Iuran aktivis putra/putri, tanggungan, donatur, rekap kas.</p>
            </div>
          )}

          {isTabAllowed('sensus') && (
            <div 
              onClick={() => onNavigate('sensus')}
              className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-emerald-900 text-white rounded-xl group-hover:scale-110 transition"><Users className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-full">Database</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">G. Sensus Database Anggota</h4>
              <p className="text-xs text-emerald-700 mt-1">Pendataan Sahmasy Putra/Putri, Santri Aktif & Cetak KTA.</p>
            </div>
          )}

          {isTabAllowed('role_management') && (
            <div 
              onClick={() => onNavigate('role_management')}
              className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-amber-600 text-white rounded-xl group-hover:scale-110 transition"><ShieldCheck className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full">Super Admin</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">H. Role & Management Admin</h4>
              <p className="text-xs text-amber-900 mt-1">Atur pengguna, kata sandi, dan matriks hak akses per role.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

