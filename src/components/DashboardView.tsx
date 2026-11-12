import React from 'react';
import { 
  initialFokusStats, 
  initialAgendaList, 
  initialIuranRows, 
  initialDonaturRows, 
  initialTanggunganRows, 
  initialHadrahJadwal, 
  initialKhotmilJadwal 
} from '../data/initialData';
import { 
  SahmasyRow, TabType, UserAccount, AgendaItem, IuranRow, 
  DonaturRow, TanggunganRow, KhotmilJadwalRow, HadrahJadwalRow,
  OrganizationProfile
} from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { FileText, Calendar, CheckCircle, Users, Trophy, Wallet, ArrowUpRight, ShieldCheck, BookOpen, BookmarkCheck, Music, Building2, Sparkles, CreditCard } from 'lucide-react';
import { PermanentImage } from './PermanentImage';

interface DashboardViewProps {
  sahmasy: SahmasyRow[];
  onNavigate: (tab: TabType) => void;
  currentUser?: UserAccount;
  allowedTabs?: TabType[];
  selectedYear?: string;
  agendaList?: AgendaItem[];
  iuranList?: IuranRow[];
  donaturList?: DonaturRow[];
  tanggunganList?: TanggunganRow[];
  khotmilJadwal?: KhotmilJadwalRow[];
  hadrahJadwal?: HadrahJadwalRow[];
  orgProfile?: OrganizationProfile;
}

const pieData = [
  { name: 'Kegiatan Terlaksana', value: 31, color: '#047857' },
  { name: 'Belum Terlaksana', value: 9, color: '#d97706' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  sahmasy, 
  onNavigate, 
  currentUser, 
  allowedTabs,
  selectedYear = 'Semua',
  agendaList,
  iuranList,
  donaturList,
  tanggunganList,
  khotmilJadwal,
  hadrahJadwal,
  orgProfile
}) => {
  const isTabAllowed = (tab: TabType) => !allowedTabs || allowedTabs.includes(tab);

  // 1. DATA KEGIATAN ORGANISASI
  const targetAgenda = agendaList && agendaList.length > 0 ? agendaList : initialAgendaList;
  const filteredAgenda = targetAgenda.filter(item => {
    if (selectedYear === 'Semua') return true;
    return item.tahun === selectedYear;
  });
  const totalKegiatan = filteredAgenda.length;
  const terlaksanaCount = filteredAgenda.filter(a => a.terlaksana).length;
  const belumTerlaksanaCount = Math.max(0, totalKegiatan - terlaksanaCount);

  const kegiatanPieData = [
    { name: 'Terlaksana', value: terlaksanaCount > 0 ? terlaksanaCount : 31, color: '#047857' },
    { name: 'Belum Terlaksana', value: belumTerlaksanaCount > 0 ? belumTerlaksanaCount : 9, color: '#d97706' },
  ];

  // 2. DATA SENSUS ANGGOTA (Dinamis Sensus)
  const filteredSahmasy = sahmasy && sahmasy.length > 0 ? sahmasy : [];
  const targetSahmasy = filteredSahmasy.filter(item => {
    if (selectedYear === 'Semua') return true;
    return item.tahunMasuk === selectedYear;
  });
  const putraCount = targetSahmasy.filter(s => s.tipe === 'putra').length;
  const putriCount = targetSahmasy.filter(s => s.tipe === 'putri').length;
  const santriPutraCount = targetSahmasy.filter(s => s.tipe === 'santri_putra').length;
  const santriPutriCount = targetSahmasy.filter(s => s.tipe === 'santri_putri').length;
  const totalAnggota = targetSahmasy.length;

  const anggotaChartData = [
    { name: 'Putra', Jumlah: putraCount },
    { name: 'Putri', Jumlah: putriCount },
    { name: 'S. Putra', Jumlah: santriPutraCount },
    { name: 'S. Putri', Jumlah: santriPutriCount }
  ];

  // 3. DATA KEUANGAN ORGANISASI
  const targetIuran = iuranList && iuranList.length > 0 ? iuranList : initialIuranRows;
  const targetDonatur = donaturList && donaturList.length > 0 ? donaturList : initialDonaturRows;
  const targetTanggungan = tanggunganList && tanggunganList.length > 0 ? tanggunganList : initialTanggunganRows;
  const targetHadrah = hadrahJadwal && hadrahJadwal.length > 0 ? hadrahJadwal : initialHadrahJadwal;
  const targetKhotmil = khotmilJadwal && khotmilJadwal.length > 0 ? khotmilJadwal : initialKhotmilJadwal;

  const filteredIuran = targetIuran.filter(item => selectedYear === 'Semua' || item.tahun === selectedYear);
  const filteredDonatur = targetDonatur.filter(item => selectedYear === 'Semua' || item.tahun === selectedYear);
  const filteredTanggungan = targetTanggungan.filter(item => selectedYear === 'Semua' || item.tahun === selectedYear);
  const filteredHadrah = targetHadrah.filter(item => selectedYear === 'Semua' || item.tahun === selectedYear);
  const filteredKhotmil = targetKhotmil.filter(item => selectedYear === 'Semua' || item.tahun === selectedYear);

  // Calculate dynamic cash inputs
  const MONTH_KEYS = ['dzulqodah', 'dzulhijjah', 'muharrom', 'shofar', 'robiulAwwal', 'robiusTsani', 'jumadilUla', 'jumadilAkhir', 'rojab'];
  const totalIuranSum = filteredIuran.reduce((acc, item) => {
    const monthsCount = MONTH_KEYS.filter(m => item[m as keyof IuranRow] === true).length;
    const nominal = item.nominalPerBulan || 50000;
    return acc + (monthsCount * nominal);
  }, 0);

  const totalDonaturSum = filteredDonatur.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalHadrahSum = filteredHadrah.reduce((acc, curr) => acc + (curr.infaq || 0), 0);
  const totalKhotmilSum = filteredKhotmil.reduce((acc, curr) => acc + (curr.infaq || 0), 0);

  const totalPemasukan = totalIuranSum + totalDonaturSum + totalHadrahSum + totalKhotmilSum;
  const totalPengeluaran = filteredTanggungan.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalSaldo = totalPemasukan - totalPengeluaran;

  const keuanganChartData = [
    { name: 'Pemasukan', Nominal: totalPemasukan, fill: '#10b981' },
    { name: 'Pengeluaran', Nominal: totalPengeluaran, fill: '#ef4444' },
    { name: 'Saldo Kas', Nominal: Math.max(0, totalSaldo), fill: '#3b82f6' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center border-2 border-amber-400 shadow-xl overflow-hidden shrink-0 p-1">
            <PermanentImage src={orgProfile?.logoUrl || "/logo.png"} fallbackSrc="/logo.png" alt="Logo Fokus Sapudi" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-200 text-xs font-semibold mb-3 border border-emerald-700">
              <span>✨ Sistem Manajemen Organisasi Terpadu</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-100 tracking-wide uppercase">
              {orgProfile?.namaOrganisasi || 'MANAJEMEN FOKUS SAPUDI'}
            </h2>
            <p className="text-emerald-100 text-sm md:text-base mt-2 leading-relaxed">
              Pusat administrasi, pengkajian, perlombaan, khotmil qur'an, jam'iyatul hadrah, keuangan bendahara, sensus database, dan otorisasi manajemen admin/user bertingkat.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {isTabAllowed('profil_organisasi') && (
                <button
                  onClick={() => onNavigate('profil_organisasi')}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2 border border-amber-300"
                >
                  <Building2 className="w-4 h-4 text-emerald-900" />
                  <span>Profil & Custom Logo</span>
                </button>
              )}
              {isTabAllowed('fokus') && (
                <button
                  onClick={() => onNavigate('fokus')}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 border border-emerald-600"
                >
                  <span>Kelola Administrasi & FOKUS</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
              {isTabAllowed('bendahara') && (
                <button
                  onClick={() => onNavigate('bendahara')}
                  className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm border border-emerald-600 transition flex items-center gap-2"
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
        
        {/* Chart 1: Grafik Kegiatan */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-between h-96">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 font-serif">Grafik Kegiatan Organisasi</h3>
              <p className="text-[10px] text-emerald-600">Perbandingan program terlaksana vs rencana</p>
            </div>
            {isTabAllowed('fokus') && (
              <button
                onClick={() => onNavigate('fokus')}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 underline"
              >
                Kegiatan
              </button>
            )}
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kegiatanPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {kegiatanPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3.5 border-t border-emerald-50 text-center">
            <p className="text-xs text-emerald-800 font-semibold">Total: {totalKegiatan} Kegiatan Terdaftar</p>
          </div>
        </div>

        {/* Chart 2: Grafik Anggota */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-between h-96">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 font-serif">Grafik Sensus Anggota</h3>
              <p className="text-[10px] text-emerald-600">Distribusi kader & santri per kategori</p>
            </div>
            {isTabAllowed('sensus') && (
              <button
                onClick={() => onNavigate('sensus')}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 underline"
              >
                Sensus
              </button>
            )}
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anggotaChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#047857' }} />
                <YAxis tick={{ fontSize: 9, fill: '#047857' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#065f46', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '10px' }}
                />
                <Bar dataKey="Jumlah" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3.5 border-t border-emerald-50 text-center">
            <p className="text-xs text-emerald-800 font-semibold">Total: {totalAnggota} Anggota Aktif</p>
          </div>
        </div>

        {/* Chart 3: Grafik Keuangan Organisasi */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-between h-96">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 font-serif">Grafik Keuangan & Kas</h3>
              <p className="text-[10px] text-emerald-600">Akumulasi iuran, donasi, & pengeluaran</p>
            </div>
            {isTabAllowed('bendahara') && (
              <button
                onClick={() => onNavigate('bendahara')}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 underline"
              >
                Bendahara
              </button>
            )}
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keuanganChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#047857' }} />
                <YAxis tick={{ fontSize: 8, fill: '#047857' }} tickFormatter={(v) => `Rp${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Nominal']}
                  contentStyle={{ backgroundColor: '#111827', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '10px' }}
                />
                <Bar dataKey="Nominal" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3.5 border-t border-emerald-50 text-center">
            <p className="text-xs text-emerald-800 font-semibold text-emerald-950">
              Saldo Bersih: <span className="text-blue-600 font-bold">Rp {totalSaldo.toLocaleString('id-ID')}</span>
            </p>
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
              <h4 className="font-bold text-emerald-950 text-sm">FOKUS & Expedisi Rapat</h4>
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
              <h4 className="font-bold text-emerald-950 text-sm">Perlombaan & Piagam</h4>
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
              <h4 className="font-bold text-emerald-950 text-sm">Bendahara & Iuran</h4>
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
              <h4 className="font-bold text-emerald-950 text-sm">Sensus Database Anggota</h4>
              <p className="text-xs text-emerald-700 mt-1">Pendataan Sahmasy Putra/Putri, Santri Aktif & Cetak KTA.</p>
            </div>
          )}

          {isTabAllowed('kta') && (
            <div 
              onClick={() => onNavigate('kta')}
              className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-teal-900 text-white rounded-xl group-hover:scale-110 transition"><CreditCard className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-200/60 px-2 py-0.5 rounded-full">55x85mm</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">Cetak KTA Digital</h4>
              <p className="text-xs text-emerald-700 mt-1">Cetak Kartu Tanda Anggota santri dan aktivis resmi.</p>
            </div>
          )}

          {isTabAllowed('profil_organisasi') && (
            <div 
              onClick={() => onNavigate('profil_organisasi')}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200/80 border-2 border-amber-300 cursor-pointer transition group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-amber-500 text-emerald-950 rounded-xl group-hover:scale-110 transition shadow-sm"><Building2 className="w-5 h-5" /></span>
                <span className="text-[10px] font-bold text-emerald-950 bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400">Identitas & Logo</span>
              </div>
              <h4 className="font-bold text-emerald-950 text-sm">Profil & Custom Logo</h4>
              <p className="text-xs text-emerald-900 mt-1">Upload logo resmi, ubah nama lembaga, SK, stempel & profil pengurus.</p>
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
              <h4 className="font-bold text-emerald-950 text-sm">Role & Management Admin</h4>
              <p className="text-xs text-amber-900 mt-1">Atur pengguna, kata sandi, dan matriks hak akses per role.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

