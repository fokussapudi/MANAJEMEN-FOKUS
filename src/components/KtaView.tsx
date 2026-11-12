import React, { useState, useRef } from 'react';
import { SahmasyRow, OrganizationProfile } from '../types';
import { 
  CreditCard, 
  Printer, 
  CheckSquare, 
  Square, 
  Search, 
  Eye,
  User, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Settings2, 
  RotateCw,
  QrCode,
  Award,
  Layers,
  FileCheck2
} from 'lucide-react';
import { Pagination } from './Pagination';
import { PermanentImage } from './PermanentImage';
import { matchesYear } from '../utils/filterUtils';

interface KtaViewProps {
  sahmasy: SahmasyRow[];
  onNotify: (title: string, message: string) => void;
  selectedYear?: string;
  logoUrl?: string;
  orgProfile?: OrganizationProfile;
}

// Geometric Islamic Arabesque SVG Pattern
const IslamicGeometricPattern: React.FC<{ opacity?: number; color?: string }> = ({ 
  opacity = 0.12, 
  color = '#ffffff' 
}) => (
  <svg 
    className="absolute inset-0 w-full h-full pointer-events-none" 
    xmlns="http://www.w3.org/2000/svg" 
    width="100%" 
    height="100%" 
    style={{ opacity }}
  >
    <defs>
      <pattern id="islamic-star-pattern" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M24 0 L48 24 L24 48 L0 24 Z" fill="none" stroke={color} strokeWidth="0.75" />
        <path d="M0 0 L24 24 L0 48 Z" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M48 0 L24 24 L48 48 Z" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="24" cy="24" r="7" fill="none" stroke={color} strokeWidth="0.75" />
        <circle cx="0" cy="0" r="7" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="48" cy="0" r="7" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="0" cy="48" r="7" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="48" cy="48" r="7" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M12 12 L36 12 L36 36 L12 36 Z" fill="none" stroke={color} strokeWidth="0.4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic-star-pattern)" />
  </svg>
);

export const KtaView: React.FC<KtaViewProps> = ({ 
  sahmasy, 
  onNotify, 
  selectedYear = 'Semua',
  logoUrl,
  orgProfile 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Preview Modal States
  const [previewMember, setPreviewMember] = useState<SahmasyRow | null>(null);
  const [previewSide, setPreviewSide] = useState<'both' | 'front' | 'back'>('both');
  const [customJabatan, setCustomJabatan] = useState('Sekretaris Umum');
  const [customMasaBerlaku, setCustomMasaBerlaku] = useState('Selama Menjadi Pengurus Aktif');
  const [showQr, setShowQr] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const getMemberJabatan = (m: SahmasyRow) => {
    if (m.jabatan && m.jabatan.trim() !== '') {
      return m.jabatan;
    }
    if (m.tipe === 'putra') return 'Anggota Sahmasy Putra';
    if (m.tipe === 'putri') return 'Anggota Sahmasy Putri';
    if (m.tipe === 'santri_putra') return 'Santri Aktif Putra';
    if (m.tipe === 'santri_putri') return 'Santri Aktif Putri';
    return 'Anggota FOKUS';
  };

  const filteredMembers = sahmasy.filter(m => 
    matchesYear(m, selectedYear) &&
    (m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.desa.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (m.jabatan && m.jabatan.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => m.id));
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      onNotify('Peringatan', 'Silakan pilih setidaknya satu anggota untuk dicetak.');
      return;
    }
    window.print();
  };

  const handleOpenPreview = (member: SahmasyRow) => {
    setPreviewMember(member);
    setCustomJabatan(getMemberJabatan(member));
  };

  const handlePrevPreview = () => {
    if (!previewMember) return;
    const currentIndex = filteredMembers.findIndex(m => m.id === previewMember.id);
    const prev = currentIndex > 0 ? filteredMembers[currentIndex - 1] : filteredMembers[filteredMembers.length - 1];
    setPreviewMember(prev);
    setCustomJabatan(getMemberJabatan(prev));
  };

  const handleNextPreview = () => {
    if (!previewMember) return;
    const currentIndex = filteredMembers.findIndex(m => m.id === previewMember.id);
    const next = currentIndex < filteredMembers.length - 1 ? filteredMembers[currentIndex + 1] : filteredMembers[0];
    setPreviewMember(next);
    setCustomJabatan(getMemberJabatan(next));
  };

  const selectedMembers = sahmasy.filter(m => selectedIds.includes(m.id));

  // Chunk array into groups of 3 members per page (max 3 rows of front+back cards per A4 page)
  const chunkedMembers = (selectedMembers.length > 0 ? selectedMembers : (previewMember ? [previewMember] : [])).reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / 3);
    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, [] as SahmasyRow[][]);

  // ============================================================================
  // CARD FRONT RENDERER (55 x 85 mm Ratio 1:1.545)
  // Exact match to uploaded KTA_DEPAN:
  // Dark Teal background with geometric pattern, top white arched contour curves,
  // circular FOKUS logo, Arabic Calligraphy, Subtitle, White bordered photo,
  // 3 floating white cards (Nama, TTL, Jabatan), centered QR Code, gold bottom line.
  // ============================================================================
  const renderCardFront = (member: SahmasyRow, isModal = false) => {
    return (
      <div 
        className="w-[300px] h-[464px] rounded-2xl flex flex-col justify-between relative overflow-hidden text-white select-none bg-[#114440] shadow-2xl transition-all border border-emerald-800/40"
        style={{
          boxShadow: isModal ? '0 25px 45px -12px rgba(17, 68, 64, 0.5), 0 0 20px rgba(197, 160, 89, 0.25)' : 'none'
        }}
      >
        {/* Background Islamic Arabesque Geometric Pattern */}
        <IslamicGeometricPattern opacity={0.15} color="#A7F3D0" />

        {/* Top Arch SVG Dome with double curved white outline */}
        <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-10 -10 H310 V90 C225 155, 75 155, -10 90 Z" fill="#0C3431" />
            <path d="M-10 90 C75 155, 225 155, 310 90" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2" fill="none" />
            <path d="M-10 82 C75 147, 225 147, 310 82" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.2" fill="none" />
          </svg>
        </div>

        {/* Header Content: Logo + Arabic Calligraphy + Subtitle */}
        <div className="relative z-10 pt-2.5 px-3 flex flex-col items-center text-center">
          {/* Circular FOKUS Logo Badge */}
          <div className="w-11 h-11 rounded-full bg-white p-0.5 border-2 border-[#C5A059] shadow-md flex items-center justify-center mb-1">
            <img 
              src={logoUrl || orgProfile?.logoUrl || "/logo.png"} 
              alt="Logo FOKUS" 
              className="w-full h-full object-contain rounded-full" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Arabic Calligraphy Header */}
          <h3 className="font-serif text-[13px] font-bold text-white tracking-wide leading-tight drop-shadow-sm">
            المُنْتَدَى التَّوَاصُلِ لِلطُّلَّابِ
          </h3>

          {/* Subtitle */}
          <p className="text-[7.5px] font-extrabold uppercase text-white tracking-[0.08em] mt-0.5">
            FORUM KOMUNIKASI SANTRI PULAU SAPUDI
          </p>
        </div>

        {/* Pas Foto (Bulat Sempurna / Perfect Circle) */}
        <div className="relative z-10 flex flex-col items-center -mt-1">
          <div className="w-28 h-28 rounded-full aspect-square bg-[#0C3431] border-[3.5px] border-white shadow-xl overflow-hidden flex items-center justify-center">
            {member.fotoUrl ? (
              <PermanentImage src={member.fotoUrl} alt={member.nama} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="flex flex-col items-center justify-center text-emerald-200">
                <User className="w-12 h-12 text-emerald-300" />
                <span className="text-[7.5px] mt-0.5 font-semibold text-emerald-300">FOTO</span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Stacked Floating White Cards */}
        <div className="relative z-10 px-5 space-y-1.5">
          {/* Card 1: Nama Lengkap */}
          <div className="bg-white rounded-lg py-1.5 px-2 text-center shadow-md border-t border-b border-gray-100">
            <h2 className="text-[#114440] font-black text-[13px] tracking-wide uppercase leading-tight line-clamp-1">
              {member.nama}
            </h2>
          </div>

          {/* Card 2: Tempat, Tanggal Lahir */}
          <div className="bg-white rounded-lg py-1 px-2 text-center shadow-md border-t border-b border-gray-100">
            <p className="text-[#114440] font-bold text-[11.5px] leading-tight line-clamp-1">
              {member.ttl || (member.desa ? `${member.desa}, -` : 'Sumenep, -')}
            </p>
          </div>

          {/* Card 3: Jabatan / Posisi Sensus */}
          <div className="bg-white rounded-lg py-1 px-2 text-center shadow-md border-t border-b border-gray-100">
            <p className="text-[#114440] font-bold text-[11.5px] leading-tight line-clamp-1">
              {isModal ? (customJabatan || getMemberJabatan(member)) : getMemberJabatan(member)}
            </p>
          </div>
        </div>

        {/* Bottom QR Code & NIS Number */}
        <div className="relative z-10 flex flex-col items-center justify-center pb-2.5 pt-0.5">
          {showQr && (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white p-1 rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(member.nis)}`} 
                  alt={`QR NIS ${member.nis}`} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-200 tracking-wider mt-1 drop-shadow-xs">
                {member.nis}
              </span>
            </div>
          )}
        </div>

        {/* Metallic Gold Bottom Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#C5A059]"></div>
      </div>
    );
  };

  // ============================================================================
  // CARD BACK RENDERER (55 x 85 mm Ratio 1:1.545)
  // Exact match to uploaded KTA_BACK:
  // Light textured background, "H I L Y A Q I S" title with spaced letters,
  // 4 white elevated boxes with Arabic & Indonesian/Madurese character definitions,
  // 5 bulleted rules/conditions.
  // ============================================================================
  const renderCardBack = (member: SahmasyRow, isModal = false) => {
    return (
      <div 
        className="w-[300px] h-[464px] rounded-2xl flex flex-col justify-between relative overflow-hidden select-none bg-[#E7ECE9] shadow-2xl transition-all border border-gray-300"
        style={{
          boxShadow: isModal ? '0 25px 45px -12px rgba(17, 68, 64, 0.3), 0 0 20px rgba(0, 0, 0, 0.08)' : 'none'
        }}
      >
        {/* Subtle Watermark Islamic Arabic Motifs */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center">
          <img src={logoUrl || orgProfile?.logoUrl || "/logo.png"} alt="Watermark" className="w-56 h-56 object-contain rounded-full" referrerPolicy="no-referrer" />
        </div>
        <IslamicGeometricPattern opacity={0.05} color="#114440" />

        {/* Top Header: H I L Y A Q I S */}
        <div className="relative z-10 pt-4 text-center">
          <h1 
            className="text-[26px] font-black text-[#1F4D49] tracking-[0.38em] pl-2 font-sans"
            style={{
              textShadow: '0 2px 4px rgba(31, 77, 73, 0.25)'
            }}
          >
            HILYAQIS
          </h1>
        </div>

        {/* 4 Elevated White Character Boxes */}
        <div className="relative z-10 grid grid-cols-4 gap-1.5 px-3 -mt-1">
          {/* 1. Islaman */}
          <div className="bg-white rounded-md p-1 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <span className="font-serif font-bold text-[11px] text-[#1F4D49] leading-tight">إِسْلَامًا</span>
            <span className="text-[7.5px] font-bold text-gray-700 leading-tight mt-0.5">Pasrah</span>
            <span className="text-[5.5px] text-gray-500 italic leading-tight">"Ngestowaghi Papakon"</span>
          </div>

          {/* 2. Yaqinan */}
          <div className="bg-white rounded-md p-1 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <span className="font-serif font-bold text-[11px] text-[#1F4D49] leading-tight">يَقِينًا</span>
            <span className="text-[7.5px] font-bold text-gray-700 leading-tight mt-0.5">Yaqin</span>
            <span className="text-[5.5px] text-gray-500 italic leading-tight">"Percaya Sepenuh Hati"</span>
          </div>

          {/* 3. Ilman */}
          <div className="bg-white rounded-md p-1 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <span className="font-serif font-bold text-[11px] text-[#1F4D49] leading-tight">عِلْمًا</span>
            <span className="text-[7.5px] font-bold text-gray-700 leading-tight mt-0.5">Mengetahui</span>
            <span className="text-[5.5px] text-gray-500 italic leading-tight">"Ngarte"</span>
          </div>

          {/* 4. Hilman */}
          <div className="bg-white rounded-md p-1 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <span className="font-serif font-bold text-[11px] text-[#1F4D49] leading-tight">حِلْمًا</span>
            <span className="text-[7.5px] font-bold text-gray-700 leading-tight mt-0.5">Mudah Memaafkan</span>
            <span className="text-[5.5px] text-gray-500 italic leading-tight">"Naghen Ta' Dhusonan"</span>
          </div>
        </div>

        {/* 5 Bullet Points */}
        <div className="relative z-10 px-4 py-2 space-y-3 pb-6">
          {[
            "Pemegang KTA Adalah Santri PPWS dan Aktif di Organisasi FOKUS Pulau Sapudi",
            "Kartu ini tidak dapat dipindah tangankan",
            "Pemegang KTA Tunduk dan Patuh pada Peraturan Serta Undang - Undang PPWS dan FOKUS Pulau Sapudi",
            "KTA Berlaku selama Satu Tahun ( Memperbaharui Saat Daftar Ulang ) dan non Aktif Setelah berstatus Sahmasy",
            "Apabila Menemukan Kartu ini Mohon diserahkan Ke Pengurus Sahmasy Terdekat/Sekretariat Sahmasy di Ponpes S2 Zainur Ridla Nonggunong"
          ].map((text, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F4D49] shrink-0 mt-1"></span>
              <p className="text-[8.5px] font-bold text-[#1F4D49] leading-[1.35]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="bg-[#114440] rounded-3xl p-6 text-white shadow-xl border border-emerald-700 relative overflow-hidden">
        <IslamicGeometricPattern opacity={0.1} color="#A7F3D0" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-[#C5A059] text-[#114440] rounded-2xl shadow-lg">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-200">CETAK KARTU TANDA ANGGOTA (KTA)</h2>
              <p className="text-emerald-100 text-xs mt-1">
                Format Resmi 55x85 mm • Desain Asli Sesuai Contoh • Depan & Belakang (HILYAQIS) • Siap Cetak A4
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {filteredMembers.length > 0 && (
              <button
                onClick={() => handleOpenPreview(filteredMembers[0])}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-emerald-600 shadow-sm"
              >
                <Eye className="w-4 h-4 text-amber-300" />
                <span>Pratinjau Desain KTA</span>
              </button>
            )}
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-[#0C3431] hover:bg-emerald-900 border border-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              {selectedIds.length === filteredMembers.length ? <CheckSquare className="w-4 h-4 text-amber-300" /> : <Square className="w-4 h-4" />}
              <span>{selectedIds.length === filteredMembers.length ? 'Batal Semua' : 'Pilih Semua'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-[#C5A059] text-[#114440] rounded-xl text-xs font-bold hover:bg-amber-300 transition shadow-lg flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {selectedIds.length > 0 ? `${selectedIds.length} Kartu` : 'Semua'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari anggota berdasarkan nama, NIS, atau desa..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-emerald-200 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs md:text-sm text-emerald-950"
          />
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Kartu Dipilih</p>
            <p className="text-2xl font-bold text-emerald-950">
              {selectedIds.length} <span className="text-xs font-normal text-emerald-600">/ {filteredMembers.length} anggota</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Member Selection List */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 border-b border-emerald-50 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-emerald-950 text-sm">Daftar Anggota & Santri untuk Cetak KTA</h3>
            <p className="text-xs text-emerald-700">Pilih baris anggota untuk mencetak KTA secara massal atau klik tombol "Preview" untuk pratinjau desain resmi.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold self-start sm:self-auto">
            {filteredMembers.length} Data Tersedia
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#114440] text-white font-bold">
                <th className="p-3.5 text-center w-12">PILIH</th>
                <th className="p-3.5 text-center w-14">FOTO</th>
                <th className="p-3.5">NIS & NIK</th>
                <th className="p-3.5">NAMA LENGKAP</th>
                <th className="p-3.5">TEMPAT, TANGGAL LAHIR</th>
                <th className="p-3.5">ALAMAT / DESA</th>
                <th className="p-3.5">KATEGORI</th>
                <th className="p-3.5 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-emerald-500 italic">
                    Data tidak ditemukan...
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => (
                  <tr 
                    key={m.id} 
                    className={`hover:bg-emerald-50/60 transition-colors cursor-pointer ${selectedIds.includes(m.id) ? 'bg-amber-50/60' : ''}`}
                    onClick={() => toggleSelect(m.id)}
                  >
                    <td className="p-3 text-center">
                      <div className={`w-5 h-5 mx-auto rounded border-2 flex items-center justify-center transition-colors ${
                        selectedIds.includes(m.id) ? 'bg-[#114440] border-[#114440] text-white' : 'border-emerald-300 bg-white'
                      }`}>
                        {selectedIds.includes(m.id) && <CheckSquare className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-10 h-10 mx-auto rounded bg-emerald-100 border border-emerald-300 overflow-hidden shadow-2xs flex items-center justify-center">
                        {m.fotoUrl ? (
                          <PermanentImage src={m.fotoUrl} alt={m.nama} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-mono font-bold text-emerald-950">{m.nis}</p>
                      <p className="text-[10px] text-emerald-600 font-mono">{m.nik || '-'}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-emerald-950 text-sm">{m.nama}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100/90 text-[#114440] rounded font-semibold text-[10.5px] border border-emerald-200">
                        {getMemberJabatan(m)}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{m.ttl || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Desa {m.desa}, Kec. {m.kecamatan}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.tipe.includes('putra') ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {m.tipe.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(m)}
                          className="px-2.5 py-1.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded-lg transition font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                          title="Pratinjau KTA Depan & Belakang"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIds([m.id]);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="p-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg transition shadow-2xs"
                          title="Cetak KTA Satuan"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-800" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="anggota"
        />
      </div>

      {/* ========================================================================= */}
      {/* KTA LIVE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#114440] text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-emerald-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#C5A059] text-[#114440] rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-amber-200 text-base">
                    PRATINJAU DESAIN KTA RESMI FOKUS
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    {previewMember.nama} • NIS: {previewMember.nis} • {previewMember.desa}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedIds([previewMember.id]);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="px-4 py-2 bg-[#C5A059] hover:bg-amber-300 text-[#114440] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kartu Ini</span>
                </button>
                <button
                  onClick={() => setPreviewMember(null)}
                  className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Toolbar & Customization */}
            <div className="bg-emerald-50/90 border-b border-emerald-100 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Member Navigation */}
              <div className="flex items-center gap-2">
                <span className="text-emerald-900 font-semibold">Navigasi:</span>
                <button
                  onClick={handlePrevPreview}
                  className="p-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold transition flex items-center gap-1"
                  title="Anggota Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={handleNextPreview}
                  className="p-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold transition flex items-center gap-1"
                  title="Anggota Selanjutnya"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View Switcher: Both, Front, Back */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-emerald-200">
                <button
                  onClick={() => setPreviewSide('both')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    previewSide === 'both' ? 'bg-[#114440] text-amber-200 shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  Depan & Belakang
                </button>
                <button
                  onClick={() => setPreviewSide('front')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    previewSide === 'front' ? 'bg-[#114440] text-amber-200 shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  Depan Saja
                </button>
                <button
                  onClick={() => setPreviewSide('back')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    previewSide === 'back' ? 'bg-[#114440] text-amber-200 shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  Belakang Saja
                </button>
              </div>
            </div>

            {/* Customization Details Bar */}
            <div className="bg-white border-b border-emerald-100 px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                  Jabatan / Posisi di Kartu:
                </label>
                <input
                  type="text"
                  value={customJabatan}
                  onChange={(e) => setCustomJabatan(e.target.value)}
                  placeholder="Contoh: Sekretaris Umum"
                  className="w-full px-3 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-emerald-950 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 bg-emerald-50/60 p-2 border border-emerald-200 rounded-xl w-full cursor-pointer hover:bg-emerald-50 transition">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-emerald-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-emerald-900">Tampilkan QR Code NIS</span>
                </label>
              </div>
            </div>

            {/* Modal Body with Cards Preview */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-100/70 flex items-center justify-center min-h-[500px]">
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {/* Front Side */}
                {(previewSide === 'both' || previewSide === 'front') && (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                    <span className="px-3 py-1 bg-[#114440] text-amber-200 rounded-full font-bold text-xs shadow-xs">
                      Tampak Depan (Sisi 1)
                    </span>
                    {renderCardFront(previewMember, true)}
                  </div>
                )}

                {/* Back Side */}
                {(previewSide === 'both' || previewSide === 'back') && (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                    <span className="px-3 py-1 bg-[#214D4B] text-emerald-100 rounded-full font-bold text-xs shadow-xs">
                      Tampak Belakang (HILYAQIS)
                    </span>
                    {renderCardBack(previewMember, true)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-emerald-50 px-6 py-3.5 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-800 shrink-0">
              <span className="font-medium">
                Ukuran Standar ID Card: <strong className="font-bold">55 x 85 mm</strong> (Rasio 1:1.545) • Skala Cetak HD Siap Pakai
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMember(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
                >
                  Tutup Preview
                </button>
                <button
                  onClick={() => {
                    setSelectedIds([previewMember.id]);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="px-5 py-2 bg-[#114440] hover:bg-emerald-950 text-amber-300 rounded-xl font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak A4 Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN PRINT SECTION (A4 Page Layout - High Quality CSS) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print-area print:bg-white print:z-[9999] overflow-visible">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            html, body {
              background: white !important;
              color: black !important;
              font-family: Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-page {
              display: flex;
              flex-wrap: wrap;
              gap: 8mm 12mm;
              page-break-after: always;
              width: 100%;
              justify-content: center;
              align-content: flex-start;
              padding-top: 5mm;
            }
            .kta-card-print {
              width: 55mm;
              height: 85mm;
              border: 0.2mm solid #d1d5db;
              border-radius: 2.5mm;
              position: relative;
              overflow: hidden;
              box-sizing: border-box;
              flex: 0 0 auto;
              page-break-inside: avoid;
            }
          }
        `}</style>

        {chunkedMembers.map((chunk, pageIndex) => (
          <div key={pageIndex} className="print-page">
            {chunk.map((member) => (
              <React.Fragment key={member.id}>
                {/* Print Card Front (55mm x 85mm) */}
                <div className="kta-card-print flex flex-col justify-between p-2 bg-[#114440] text-white relative">
                  {/* Decorative Islamic Star Pattern */}
                  <IslamicGeometricPattern opacity={0.15} color="#A7F3D0" />

                  {/* Arched SVG Top */}
                  <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M-10 -10 H310 V90 C225 155, 75 155, -10 90 Z" fill="#0C3431" />
                      <path d="M-10 90 C75 155, 225 155, 310 90" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="3" fill="none" />
                    </svg>
                  </div>

                  {/* Header */}
                  <div className="relative z-10 text-center flex flex-col items-center pt-0.5">
                    <div className="w-6 h-6 rounded-full bg-white p-0.5 border border-[#C5A059] shadow-xs flex items-center justify-center">
                      <img src={logoUrl || orgProfile?.logoUrl || "/logo.png"} alt="Logo Fokus" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
                    </div>
                    <h4 className="text-[6.5px] font-bold uppercase text-white font-serif leading-none mt-0.5">
                      المُنْتَدَى التَّوَاصُلِ لِلطُّلَّابِ
                    </h4>
                    <p className="text-[4.5px] font-bold text-white uppercase tracking-wider leading-none mt-0.5">
                      FORUM KOMUNIKASI SANTRI PULAU SAPUDI
                    </p>
                  </div>

                  {/* Photo (Bulat Sempurna / Perfect Circle) */}
                  <div className="relative z-10 flex flex-col items-center my-0.5">
                    <div className="w-14 h-14 rounded-full aspect-square bg-[#0C3431] border-2 border-white overflow-hidden flex items-center justify-center shadow-xs">
                      {member.fotoUrl ? (
                        <PermanentImage src={member.fotoUrl} alt={member.nama} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-7 h-7 text-emerald-200" />
                      )}
                    </div>
                  </div>

                  {/* 3 Floating Text Cards */}
                  <div className="relative z-10 space-y-0.5 px-1">
                    <div className="bg-white text-[#114440] py-0.5 px-1 rounded shadow-xs text-center">
                      <p className="text-[7px] font-black uppercase truncate">{member.nama}</p>
                    </div>

                    <div className="bg-white text-[#114440] py-0.5 px-1 rounded shadow-xs text-center">
                      <p className="text-[6px] font-bold truncate">
                        {member.ttl || (member.desa ? `${member.desa}, -` : 'Sumenep, -')}
                      </p>
                    </div>

                    <div className="bg-white text-[#114440] py-0.5 px-1 rounded shadow-xs text-center">
                      <p className="text-[6px] font-bold truncate">
                        {getMemberJabatan(member)}
                      </p>
                    </div>
                  </div>

                  {/* QR Code & NIS */}
                  <div className="relative z-10 flex flex-col items-center justify-center pb-0.5 pt-0.5">
                    {showQr && (
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 bg-white p-0.5 rounded shadow-xs flex items-center justify-center">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(member.nis)}`} 
                            alt="QR" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[4.5px] font-mono font-bold text-amber-200 mt-0.5 leading-none">
                          {member.nis}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Gold Bottom Stripe */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C5A059]"></div>
                </div>

                {/* Print Card Back (55mm x 85mm) */}
                <div className="kta-card-print flex flex-col justify-between p-1.5 bg-[#E7ECE9] text-[#1F4D49] relative">
                  <IslamicGeometricPattern opacity={0.05} color="#114440" />

                  {/* Header HILYAQIS */}
                  <div className="relative z-10 text-center pt-0.5">
                    <h2 className="text-[14px] font-sans font-black tracking-[0.3em] pl-1 text-[#1F4D49] leading-none">
                      HILYAQIS
                    </h2>
                  </div>

                  {/* 4 Pillars */}
                  <div className="relative z-10 grid grid-cols-4 gap-0.5 px-0.5 my-0.5">
                    {[
                      { ar: "إِسْلَامًا", id: "Pasrah", tr: '"Ngestowaghi Papakon"' },
                      { ar: "يَقِينًا", id: "Yaqin", tr: '"Percaya Sepenuh Hati"' },
                      { ar: "عِلْمًا", id: "Mengetahui", tr: '"Ngarte"' },
                      { ar: "حِلْمًا", id: "Mudah Memaafkan", tr: '"Naghen Ta\' Dhusonan"' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded p-0.5 flex flex-col items-center text-center shadow-xs">
                        <span className="text-[5.5px] font-serif font-bold text-[#1F4D49] leading-none">{item.ar}</span>
                        <span className="text-[4px] font-bold text-gray-700 mt-0.5 leading-none">{item.id}</span>
                        <span className="text-[3.5px] italic text-gray-500 leading-none">{item.tr}</span>
                      </div>
                    ))}
                  </div>

                  {/* 5 Rules */}
                  <div className="relative z-10 px-1 space-y-1.5 my-0.5 pb-1">
                    {[
                      "Pemegang KTA Adalah Santri PPWS dan Aktif di Organisasi FOKUS Pulau Sapudi",
                      "Kartu ini tidak dapat dipindah tangankan",
                      "Pemegang KTA Tunduk dan Patuh pada Peraturan Serta Undang - Undang PPWS dan FOKUS Pulau Sapudi",
                      "KTA Berlaku selama Satu Tahun ( Memperbaharui Saat Daftar Ulang ) dan non Aktif Setelah berstatus Sahmasy",
                      "Apabila Menemukan Kartu ini Mohon diserahkan Ke Pengurus Sahmasy Terdekat/Sekretariat Sahmasy di Ponpes S2 Zainur Ridla Nonggunong"
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span className="w-1 h-1 rounded-full bg-[#1F4D49] shrink-0 mt-0.5"></span>
                        <span className="text-[4.5px] font-bold leading-tight text-[#1F4D49]">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
