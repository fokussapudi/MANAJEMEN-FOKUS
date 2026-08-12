import React, { useState, useRef } from 'react';
import { SahmasyRow } from '../types';
import { 
  CreditCard, 
  Printer, 
  CheckSquare, 
  Square, 
  Search, 
  Download,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Layers
} from 'lucide-react';

interface KtaViewProps {
  sahmasy: SahmasyRow[];
  onNotify: (title: string, message: string) => void;
}

export const KtaView: React.FC<KtaViewProps> = ({ sahmasy, onNotify }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const filteredMembers = sahmasy.filter(m => 
    m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nis.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const selectedMembers = sahmasy.filter(m => selectedIds.includes(m.id));

  // Chunk array into groups of 3 members per page (max 3 rows of cards per A4 page)
  const chunkedMembers = selectedMembers.reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / 3);
    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, [] as SahmasyRow[][]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="bg-emerald-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-400 text-emerald-950 rounded-2xl shadow-lg">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-200">CETAK KARTU TANDA ANGGOTA (KTA)</h2>
              <p className="text-emerald-100 text-xs mt-1">Format Standar 55x85mm • Sinkron Sensus Database • Layout A4 Ready</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-emerald-800/50 hover:bg-emerald-700/50 border border-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              {selectedIds.length === filteredMembers.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span>{selectedIds.length === filteredMembers.length ? 'Batal Semua' : 'Pilih Semua'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold hover:bg-amber-300 transition shadow-lg flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {selectedIds.length} Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari anggota berdasarkan nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-emerald-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Terpilih</p>
            <p className="text-2xl font-bold text-emerald-900">{selectedIds.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Member Selection List */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 border-b border-emerald-50 bg-emerald-50/30">
          <h3 className="font-serif font-bold text-emerald-950 text-sm">Pilih Anggota untuk Dicetak</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-900 text-white font-bold">
                <th className="p-4 text-center w-12">PILIH</th>
                <th className="p-4">FOTO</th>
                <th className="p-4">NIS / NAMA</th>
                <th className="p-4">TEMPAT, TANGGAL LAHIR</th>
                <th className="p-4">ALAMAT / DESA</th>
                <th className="p-4">TIPE</th>
                <th className="p-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-emerald-500 italic">
                    Data tidak ditemukan...
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr 
                    key={m.id} 
                    className={`hover:bg-emerald-50/50 transition-colors cursor-pointer ${selectedIds.includes(m.id) ? 'bg-amber-50/50' : ''}`}
                    onClick={() => toggleSelect(m.id)}
                  >
                    <td className="p-4 text-center">
                      <div className={`w-5 h-5 mx-auto rounded border-2 flex items-center justify-center transition-colors ${
                        selectedIds.includes(m.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-emerald-200 bg-white'
                      }`}>
                        {selectedIds.includes(m.id) && <CheckSquare className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 overflow-hidden">
                        {m.fotoUrl ? (
                          <img src={m.fotoUrl} alt={m.nama} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-emerald-950">{m.nama}</p>
                      <p className="text-[10px] text-emerald-600 font-mono tracking-tighter">{m.nis}</p>
                    </td>
                    <td className="p-4 text-emerald-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{m.ttl || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-emerald-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{m.desa}, {m.kecamatan}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        m.tipe.includes('putra') ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {m.tipe.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedIds([m.id]);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition"
                        title="Cetak Satuan"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Section */}
      <div className="hidden print:block print-area print:bg-white print:z-[9999] overflow-visible">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              background: white !important;
            }
            .print-page {
              display: flex;
              flex-wrap: wrap;
              gap: 15mm;
              page-break-after: always;
              width: 100%;
              justify-content: center;
              align-content: flex-start;
            }
            .kta-card {
              width: 55mm;
              height: 85mm;
              border: 0.1mm solid #eee;
              position: relative;
              overflow: hidden;
              box-sizing: border-box;
              flex: 0 0 auto;
            }
          }
        `}</style>

        {chunkedMembers.map((chunk, pageIndex) => (
          <div key={pageIndex} className="print-page">
            {chunk.map((member) => (
              <React.Fragment key={member.id}>
              {/* Card Front */}
              <div className="kta-card flex flex-col bg-[#064E3B] text-white font-sans relative">
                {/* Background Pattern / Shapes */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full -ml-20 -mb-20"></div>
                </div>

                {/* Header with Logo */}
                <div className="relative z-10 pt-4 flex flex-col items-center">
                  <div className="bg-white p-1 rounded-full w-10 h-10 mb-1 border-2 border-amber-400">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-[7px] font-bold text-center leading-tight tracking-wider uppercase text-amber-200">
                    Forum Komunikasi Santri Pulau Sapudi
                  </h4>
                  <div className="w-8 h-0.5 bg-amber-400 mt-1"></div>
                </div>

                {/* Photo Area */}
                <div className="relative z-10 flex flex-col items-center mt-3">
                  <div className="w-24 h-28 bg-white border-2 border-white rounded shadow-md overflow-hidden bg-center bg-cover">
                    {member.fotoUrl ? (
                      <img src={member.fotoUrl} alt={member.nama} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-100 bg-emerald-800">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Info */}
                <div className="relative z-10 mt-3 px-2 text-center flex flex-col items-center space-y-1.5">
                  <div className="bg-white text-emerald-900 w-full py-1.5 rounded-sm shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase leading-none">{member.nama}</p>
                  </div>
                  <div className="bg-white text-emerald-800 w-full py-1.5 rounded-sm shadow-sm">
                    <p className="text-[8px] font-bold leading-none">{member.ttl || 'Sumenep, 01 Januari 2000'}</p>
                  </div>
                  <div className="bg-white text-emerald-800 w-full py-1.5 rounded-sm shadow-sm">
                    <p className="text-[9px] font-bold uppercase leading-none">Sekretaris Umum</p>
                  </div>
                </div>

                {/* Bottom QR Code */}
                <div className="mt-auto mb-4 flex flex-col items-center relative z-10">
                   <div className="w-16 h-16 bg-white p-1 rounded shadow-sm">
                      {/* Placeholder QR */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${member.nis}`} 
                        alt="QR Code" 
                        className="w-full h-full"
                      />
                   </div>
                </div>
                
                {/* Footer Stripe */}
                <div className="h-2 bg-amber-400 w-full mt-auto"></div>
              </div>

              {/* Card Back */}
              <div className="kta-card flex flex-col bg-[#F4F1EA] text-emerald-950 font-sans relative border-emerald-200">
                 {/* Header HILYAQIS */}
                 <div className="pt-6 flex flex-col items-center">
                    <h2 className="text-2xl font-serif font-black tracking-[0.2em] text-[#064E3B] opacity-80">HILYAQIS</h2>
                 </div>

                 {/* Icons Grid */}
                 <div className="grid grid-cols-4 gap-1 px-3 mt-3">
                    {[
                      { ar: "اسلاما", id: "Pasrah", tr: "Ngestowaghi" },
                      { ar: "يقين", id: "Yakin", tr: "Percaya" },
                      { ar: "علم", id: "Ilmu", tr: "Ngerte" },
                      { ar: "حلم", id: "Hilam", tr: "Naghen" }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white border border-emerald-100 p-1 flex flex-col items-center text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                        <span className="text-[10px] font-bold text-emerald-800">{item.ar}</span>
                        <span className="text-[5px] font-bold uppercase text-emerald-600 mt-0.5">{item.id}</span>
                        <span className="text-[4px] italic text-emerald-400 scale-90">{item.tr}</span>
                      </div>
                    ))}
                 </div>

                 {/* Rules List */}
                 <div className="mt-4 px-4 space-y-2">
                    {[
                      "Pemegang KTA Adalah Santri PPWS dan Aktif di Organisasi FOKUS Pulau Sapudi",
                      "Kartu ini tidak dapat dipindah tangankan",
                      "Pemegang KTA Tunduk dan Patuh pada Peraturan Serta Undang - Undang PPWS dan FOKUS Pulau Sapudi",
                      "KTA Berlaku selama Satu Tahun ( Memperbaharui Saat Daftar Ulang ) dan non Aktif Setelah berstatus Sahmasy",
                      "Apabila Menemukan Kartu ini Mohon diserahkan Ke Pengurus Sahmasy Terdekat/Sekretariat Sahmasy di Ponpes S2 Zainur Ridla Nonggunong"
                    ].map((text, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-1 h-1 bg-emerald-800 rounded-full mt-1.5 shrink-0"></div>
                        <p className="text-[5.5px] font-medium leading-tight text-emerald-900">{text}</p>
                      </div>
                    ))}
                 </div>

                 {/* Footer Status */}
                 <div className="mt-auto bg-[#064E3B] py-1.5 text-center">
                    <p className="text-[7px] font-bold text-amber-200 tracking-wider">
                      Berlaku : Selama Menjadi Pengurus Aktif
                    </p>
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
