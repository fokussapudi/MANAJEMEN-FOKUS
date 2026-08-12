import React, { useState, useRef } from 'react';
import { LombaRow } from '../types';
import { initialLombaRows } from '../data/initialData';
import { Trophy, Plus, Search, Trash2, Printer, Award, Edit3, Settings2, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { PrintModal } from './PrintModal';
import { downloadCsvTemplate, exportToExcel, parseExcelFile } from '../utils/excelUtils';

interface PerlombaanViewProps {
  onNotify: (title: string, message: string) => void;
}

export const PerlombaanView: React.FC<PerlombaanViewProps> = ({ onNotify }) => {
  const [lombaList, setLombaList] = useState<LombaRow[]>(initialLombaRows);
  const [activeTab, setActiveTab] = useState<'lomba_1' | 'lomba_2' | 'lomba_3' | 'lomba_4' | 'piagam'>('lomba_1');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintListModal, setShowPrintListModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add participant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [jenisLombaInput, setJenisLombaInput] = useState<LombaRow['jenisLomba']>('Lomba Tartil Tingkat Anak-Anak');
  const [tingkat, setTingkat] = useState('Kabupaten / Se-Sapudi');
  const [namaPeserta, setNamaPeserta] = useState('');
  const [binBinti, setBinBinti] = useState('');
  const [utusan, setUtusan] = useState('');
  const [pengasuh, setPengasuh] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHandphone, setNoHandphone] = useState('');

  // Score & Juara Modal state
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [col1, setCol1] = useState('');
  const [col2, setCol2] = useState('');
  const [col3, setCol3] = useState('');
  const [juara, setJuara] = useState('Juara I');

  // Fully Customizable Piagam State
  const [selectedPiagam, setSelectedPiagam] = useState<LombaRow | null>(null);
  const [piagamHeader, setPiagamHeader] = useState('PANITIA ORGANISASI MANAJEMEN FOKUS SAPUDI');
  const [piagamNo, setPiagamNo] = useState('No. 042/FOKUS-SPD/IV/2026');
  const [piagamTitle, setPiagamTitle] = useState('PIAGAM PENGHARGAAN');
  const [piagamSubTitle, setPiagamSubTitle] = useState('Diberikan Dengan Hormat Kepada:');
  const [piagamDesc, setPiagamDesc] = useState('Atas prestasi dan partisipasi gemilang sebagai predikat di bawah ini dalam ajang kompetisi resmi.');
  const [piagamLocationDate, setPiagamLocationDate] = useState('Sapudi, 15 Ramadhan 1447 H');
  const [piagamSign1Title, setPiagamSign1Title] = useState('Ketua Panitia Fokus');
  const [piagamSign1Name, setPiagamSign1Name] = useState('AHMAD FAUZI');
  const [piagamSign2Title, setPiagamSign2Title] = useState('Dewan Pembina');
  const [piagamSign2Name, setPiagamSign2Name] = useState('KYAI KHOLIL');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  const competitionTabs = [
    { id: 'lomba_1', name: 'Lomba Tartil Tingkat Anak-Anak', fullName: 'Lomba Tartil Tingkat Anak-Anak', col1: 'Fashohah', col2: 'Tajwid', col3: 'Irama' },
    { id: 'lomba_2', name: 'Lomba Sholat Munfarid Tingkat Anak-Anak', fullName: 'Lomba Sholat Munfarid Tingkat Anak-Anak', col1: 'Gerakan', col2: 'Bacaan', col3: 'Thumakninah' },
    { id: 'lomba_3', name: 'Lomba Siroh Nabawiyah', fullName: 'Lomba Siroh Nabawiyah', col1: 'Hafalan', col2: 'Pemahaman', col3: 'Ekspresi' },
    { id: 'lomba_4', name: 'Festival Hadroh Tingkat Umum', fullName: 'Festival Hadroh Tingkat Umum', col1: 'Vocal', col2: 'Pukulan', col3: 'Adab & Penampilan' },
  ];

  const currentCompMeta = competitionTabs.find(t => t.id === activeTab);

  const filtered = lombaList.filter(item => {
    const matchesSearch = item.namaPeserta.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.utusan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.pengasuh.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'piagam') {
      return matchesSearch;
    }
    return item.jenisLomba === currentCompMeta?.fullName && matchesSearch;
  });

  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingParticipantId(null);
    setJenisLombaInput('Lomba Tartil Tingkat Anak-Anak');
    setTingkat('Kabupaten / Se-Sapudi');
    setNamaPeserta('');
    setBinBinti('');
    setUtusan('');
    setPengasuh('');
    setAlamat('');
    setNoHandphone('');
    setShowAddModal(true);
  };

  const openEditModal = (item: LombaRow) => {
    setEditingParticipantId(item.id);
    setJenisLombaInput(item.jenisLomba);
    setTingkat(item.tingkat);
    setNamaPeserta(item.namaPeserta);
    setBinBinti(item.binBinti === '-' ? '' : item.binBinti);
    setUtusan(item.utusan);
    setPengasuh(item.pengasuh === '-' ? '' : item.pengasuh);
    setAlamat(item.alamat === 'Sapudi' ? '' : item.alamat);
    setNoHandphone(item.noHandphone === '-' ? '' : item.noHandphone);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPeserta || !utusan) {
      onNotify('Form Belum Lengkap', 'Nama peserta dan utusan wajib diisi.');
      return;
    }

    if (editingParticipantId) {
      setLombaList(lombaList.map(item => {
        if (item.id === editingParticipantId) {
          return {
            ...item,
            jenisLomba: jenisLombaInput,
            tingkat: tingkat || 'Se-Sapudi',
            namaPeserta,
            binBinti: binBinti || '-',
            utusan,
            pengasuh: pengasuh || '-',
            alamat: alamat || 'Sapudi',
            noHandphone: noHandphone || '-'
          };
        }
        return item;
      }));
      onNotify('Peserta Lomba Diperbarui', `Data peserta ${namaPeserta} berhasil diperbarui.`);
    } else {
      const newRow: LombaRow = {
        id: 'lomba-' + Date.now(),
        jenisLomba: jenisLombaInput,
        tingkat: tingkat || 'Se-Sapudi',
        no: lombaList.filter(l => l.jenisLomba === jenisLombaInput).length + 1,
        namaPeserta,
        binBinti: binBinti || '-',
        utusan,
        pengasuh: pengasuh || '-',
        alamat: alamat || 'Sapudi',
        noHandphone: noHandphone || '-',
        col1: '-',
        col2: '-',
        col3: '-',
        juara: 'Belum Ditentukan',
        berkasUrl: 'berkas_lomba.pdf'
      };
      setLombaList([newRow, ...lombaList]);
      onNotify('Peserta Lomba Didaftarkan', `Peserta ${newRow.namaPeserta} berhasil ditambahkan ke daftar.`);
    }

    setShowAddModal(false);
    setEditingParticipantId(null);
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) {
      onNotify('Pilih Peserta', 'Silakan pilih peserta yang akan diberi nilai & predikat juara.');
      return;
    }

    setLombaList(lombaList.map(item => {
      if (item.id === selectedParticipantId) {
        return {
          ...item,
          col1: col1 || item.col1,
          col2: col2 || item.col2,
          col3: col3 || item.col3,
          juara: juara || item.juara
        };
      }
      return item;
    }));

    setShowScoreModal(false);
    setSelectedParticipantId('');
    setCol1('');
    setCol2('');
    setCol3('');
    onNotify('Penilaian & Juara Disimpan', 'Nilai dan predikat juara peserta berhasil diperbarui.');
  };

  const openScoreModalForParticipant = (item: LombaRow) => {
    setSelectedParticipantId(item.id);
    setCol1(item.col1 === '-' ? '' : item.col1);
    setCol2(item.col2 === '-' ? '' : item.col2);
    setCol3(item.col3 === '-' ? '' : item.col3);
    setJuara(item.juara === 'Belum Ditentukan' ? 'Juara I' : item.juara);
    setShowScoreModal(true);
  };

  const openPiagamModal = (item: LombaRow) => {
    setSelectedPiagam(item);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus peserta perlombaan ini?')) {
      setLombaList(lombaList.filter(item => item.id !== id));
      onNotify('Data Dihapus', 'Data peserta lomba telah dihapus.');
    }
  };

  // Excel Handlers
  const handleDownloadTemplate = () => {
    const headers = ['NO', 'NAMA PESERTA', 'BIN / BINTI', 'UTUSAN', 'PENGASUH', 'ALAMAT', 'NO HANDPHONE', 'JENIS LOMBA', 'TINGKAT'];
    const sample = [1, 'Muhammad Ilham', 'H. Ahmad', 'Ranting Dungkek', 'KH. Kholil', 'Sapudi', '081234567890', 'Lomba Tartil Tingkat Anak-Anak', 'Se-Sapudi'];
    downloadCsvTemplate(`Template_Peserta_Perlombaan`, headers, sample);
    onNotify('Template Didownload', 'Template Excel peserta lomba berhasil diunduh.');
  };

  const handleExportExcel = () => {
    const headers = ['NO', 'NAMA PESERTA', 'BIN / BINTI', 'UTUSAN', 'PENGASUH', 'ALAMAT', 'NO HANDPHONE', 'JENIS LOMBA', 'TINGKAT', 'JUARA'];
    const rows = filtered.map((item, idx) => [
      idx + 1,
      item.namaPeserta,
      item.binBinti,
      item.utusan,
      item.pengasuh,
      item.alamat,
      item.noHandphone,
      item.jenisLomba,
      item.tingkat,
      item.juara
    ]);
    exportToExcel(`Data_Perlombaan_${activeTab}`, headers, rows);
    onNotify('Export Excel Berhasil', 'Data peserta lomba berhasil diexport.');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (dataRows) => {
        const newItems: LombaRow[] = [];
        dataRows.forEach((cols, idx) => {
          if (cols.length >= 2) {
            const hasNoCol = !isNaN(Number(cols[0]));
            const offset = hasNoCol ? 1 : 0;
            newItems.push({
              id: 'imp-lomba-' + Date.now() + '-' + idx,
              no: lombaList.length + idx + 1,
              namaPeserta: cols[offset] || 'Peserta',
              binBinti: cols[offset + 1] || '-',
              utusan: cols[offset + 2] || 'Utusan',
              pengasuh: cols[offset + 3] || '-',
              alamat: cols[offset + 4] || 'Sapudi',
              noHandphone: cols[offset + 5] || '-',
              jenisLomba: (cols[offset + 6] as any) || currentCompMeta?.fullName || 'Lomba Tartil Tingkat Anak-Anak',
              tingkat: cols[offset + 7] || 'Se-Sapudi',
              col1: '-',
              col2: '-',
              col3: '-',
              juara: 'Belum Ditentukan',
              berkasUrl: 'berkas_import.pdf'
            });
          }
        });
        setLombaList([...newItems, ...lombaList]);
        onNotify('Import Berhasil', `${newItems.length} peserta lomba berhasil di-import dari Excel.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      (err) => onNotify('Import Gagal', err)
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".csv, .txt, .xlsx, .xls"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Modul C
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            PERLOMBAAN: Pendaftaran, Penilaian & Kustom Piagam A4
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Manajemen pendaftaran, penilaian juri, serta penerbitan piagam penghargaan berformat A4 dengan kustomisasi isi penuh.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAddModal}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambah Peserta</span>
          </button>
          <button
            onClick={() => {
              setSelectedParticipantId(lombaList[0]?.id || '');
              setShowScoreModal(true);
            }}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Trophy className="w-4 h-4 text-amber-200" />
            <span>Input Nilai</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200"
            title="Download Template Format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            <span>Template Excel</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200"
            title="Import Data Excel"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200"
            title="Export Data ke Excel"
          >
            <Download className="w-4 h-4 text-amber-700" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowPrintListModal(true)}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {competitionTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between ${
              activeTab === tab.id
                ? 'bg-emerald-900 text-white border-emerald-950 shadow-md'
                : 'bg-white hover:bg-emerald-50/50 text-emerald-950 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Trophy className={`w-5 h-5 ${activeTab === tab.id ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-emerald-800 text-amber-200' : 'bg-emerald-100 text-emerald-800'}`}>
                {lombaList.filter(l => l.jenisLomba === tab.fullName).length}
              </span>
            </div>
            <p className="text-xs font-bold leading-relaxed">{tab.name}</p>
          </button>
        ))}

        {/* Piagam Tab */}
        <button
          onClick={() => setActiveTab('piagam')}
          className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between ${
            activeTab === 'piagam'
              ? 'bg-amber-900 text-white border-amber-950 shadow-md'
              : 'bg-white hover:bg-amber-50/50 text-amber-950 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Award className={`w-5 h-5 ${activeTab === 'piagam' ? 'text-amber-300' : 'text-amber-700'}`} />
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'piagam' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
              Cetak A4
            </span>
          </div>
          <p className="text-xs font-bold leading-relaxed">Menu Cetak Piagam</p>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-base">
              {activeTab === 'piagam' ? 'DAFTAR PESERTA & KUSTOM CETAK PIAGAM PENGHARGAAN' : currentCompMeta?.fullName.toUpperCase()}
            </h3>
            <p className="text-xs text-emerald-200">
              {activeTab === 'piagam' ? 'Pilih peserta di bawah untuk membuka editor kustom dan menerbitkan piagam berformat A4' : `Tabel penilaian dan data peserta ${currentCompMeta?.name}`}
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama peserta / utusan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-emerald-800/80 border border-emerald-700 rounded-xl text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                <th className="p-3 text-center w-12">NO</th>
                <th className="p-3">JENIS & TINGKAT</th>
                <th className="p-3">NAMA PESERTA / BIN</th>
                <th className="p-3">UTUSAN & PENGASUH</th>
                <th className="p-3">ALAMAT & HP</th>
                {activeTab !== 'piagam' && currentCompMeta && (
                  <>
                    <th className="p-3 text-center">{currentCompMeta.col1}</th>
                    <th className="p-3 text-center">{currentCompMeta.col2}</th>
                    <th className="p-3 text-center">{currentCompMeta.col3}</th>
                  </>
                )}
                <th className="p-3 text-center">PREDIKAT / JUARA</th>
                <th className="p-3 text-center">AKSI / KUSTOM PIAGAM A4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-emerald-900">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-emerald-600">
                    Belum ada data peserta perlombaan. Silakan klik tombol "Tambah Peserta Lomba".
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                    <td className="p-3 text-center font-bold text-emerald-700">{index + 1}</td>
                    <td className="p-3">
                      <p className="font-semibold text-emerald-950">{item.jenisLomba}</p>
                      <p className="text-[10px] text-emerald-600">Tingkat: {item.tingkat}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-emerald-950">{item.namaPeserta}</p>
                      <p className="text-[10px] text-emerald-600">Bin/Binti: {item.binBinti}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-emerald-900">{item.utusan}</p>
                      <p className="text-[10px] text-emerald-600">Pengasuh: {item.pengasuh}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-emerald-900">{item.alamat}</p>
                      <p className="text-[10px] font-mono text-emerald-700">{item.noHandphone}</p>
                    </td>
                    {activeTab !== 'piagam' && (
                      <>
                        <td className="p-3 text-center font-semibold bg-emerald-50/40">{item.col1}</td>
                        <td className="p-3 text-center font-semibold bg-emerald-50/40">{item.col2}</td>
                        <td className="p-3 text-center font-semibold bg-emerald-50/40">{item.col3}</td>
                      </>
                    )}
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        item.juara === 'Belum Ditentukan' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {item.juara}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg transition inline-block"
                        title="Edit Data Peserta"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openScoreModalForParticipant(item)}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition inline-block"
                        title="Beri Nilai & Juara"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openPiagamModal(item)}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1.5 shadow"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-200" />
                        <span>Kustom & Cetak Piagam</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-block"
                        title="Hapus Peserta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-emerald-100">
              <h3 className="font-serif font-bold text-emerald-950 text-base">
                {editingParticipantId ? 'EDIT DATA PESERTA LOMBA' : 'FORM TAMBAH PESERTA LOMBA'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-emerald-700 font-bold text-lg">×</button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Pilih Cabang Perlombaan</label>
                <select
                  value={jenisLombaInput}
                  onChange={e => setJenisLombaInput(e.target.value as any)}
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Lomba Tartil Tingkat Anak-Anak">Lomba Tartil Tingkat Anak-Anak</option>
                  <option value="Lomba Sholat Munfarid Tingkat Anak-Anak">Lomba Sholat Munfarid Tingkat Anak-Anak</option>
                  <option value="Lomba Siroh Nabawiyah">Lomba Siroh Nabawiyah</option>
                  <option value="Festival Hadroh Tingkat Umum">Festival Hadroh Tingkat Umum</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nama Peserta</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Fauzan"
                    value={namaPeserta}
                    onChange={e => setNamaPeserta(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Bin / Binti</label>
                  <input
                    type="text"
                    placeholder="Contoh: H. Abdullah"
                    value={binBinti}
                    onChange={e => setBinBinti(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Utusan / Lembaga</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ranting Gayam"
                    value={utusan}
                    onChange={e => setUtusan(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nama Pengasuh / Pembimbing</label>
                  <input
                    type="text"
                    placeholder="Contoh: KH. Kholil"
                    value={pengasuh}
                    onChange={e => setPengasuh(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Tingkat Lomba</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kabupaten / Se-Sapudi"
                    value={tingkat}
                    onChange={e => setTingkat(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">No. Handphone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={noHandphone}
                    onChange={e => setNoHandphone(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Dusun, Desa, Kecamatan"
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-white rounded-xl font-semibold hover:bg-emerald-800 transition shadow"
                >
                  {editingParticipantId ? 'Simpan Perubahan' : 'Daftarkan Peserta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score & Juara Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-emerald-100">
              <h3 className="font-serif font-bold text-emerald-950 text-base">INPUT NILAI & PREDIKAT JUARA</h3>
              <button onClick={() => setShowScoreModal(false)} className="text-emerald-700 font-bold text-lg">×</button>
            </div>
            
            <form onSubmit={handleScoreSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Pilih Peserta Terdaftar</label>
                <select
                  value={selectedParticipantId}
                  onChange={e => {
                    setSelectedParticipantId(e.target.value);
                    const found = lombaList.find(l => l.id === e.target.value);
                    if (found) {
                      setCol1(found.col1 === '-' ? '' : found.col1);
                      setCol2(found.col2 === '-' ? '' : found.col2);
                      setCol3(found.col3 === '-' ? '' : found.col3);
                      setJuara(found.juara === 'Belum Ditentukan' ? 'Juara I' : found.juara);
                    }
                  }}
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {lombaList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.namaPeserta} — ({item.utusan}) [{item.jenisLomba}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nilai / Kolom 1</label>
                  <input
                    type="text"
                    placeholder="92"
                    value={col1}
                    onChange={e => setCol1(e.target.value)}
                    className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nilai / Kolom 2</label>
                  <input
                    type="text"
                    placeholder="90"
                    value={col2}
                    onChange={e => setCol2(e.target.value)}
                    className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nilai / Kolom 3</label>
                  <input
                    type="text"
                    placeholder="95"
                    value={col3}
                    onChange={e => setCol3(e.target.value)}
                    className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-center font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-semibold text-emerald-900">Predikat / Juara</label>
                  <span className="text-[10px] text-emerald-600">Pilih atau ketik manual</span>
                </div>
                <div className="space-y-2">
                  <select
                    value={['Juara I', 'Juara II', 'Juara III', 'Juara Harapan I', 'Juara Harapan II', 'Juara Harapan III', 'Juara Favorit', 'Juara Umum I', 'Peserta Terbaik'].includes(juara) ? juara : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') {
                        setJuara(e.target.value);
                      } else {
                        setJuara('');
                      }
                    }}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-bold text-amber-900"
                  >
                    <option value="Juara I">Juara I</option>
                    <option value="Juara II">Juara II</option>
                    <option value="Juara III">Juara III</option>
                    <option value="Juara Harapan I">Juara Harapan I</option>
                    <option value="Juara Harapan II">Juara Harapan II</option>
                    <option value="Juara Harapan III">Juara Harapan III</option>
                    <option value="Juara Favorit">Juara Favorit</option>
                    <option value="Juara Umum I">Juara Umum I</option>
                    <option value="Peserta Terbaik">Peserta Terbaik (Partisipasi)</option>
                    <option value="custom">✏️ Ketik Manual Custom...</option>
                  </select>

                  {(!['Juara I', 'Juara II', 'Juara III', 'Juara Harapan I', 'Juara Harapan II', 'Juara Harapan III', 'Juara Favorit', 'Juara Umum I', 'Peserta Terbaik'].includes(juara)) && (
                    <input
                      type="text"
                      placeholder="Masukkan predikat custom..."
                      value={juara}
                      onChange={e => setJuara(e.target.value)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-emerald-950 font-bold focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition shadow"
                >
                  Simpan Nilai & Juara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLY CUSTOMIZABLE A4 PIAGAM MODAL & EDITOR */}
      {selectedPiagam && (
        <PrintModal title={`Kustomisasi & Cetak Piagam A4 - ${selectedPiagam.namaPeserta}`} onClose={() => setSelectedPiagam(null)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-6xl mx-auto">
            
            {/* Left: Customization Form controls */}
            <div className="lg:col-span-5 bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 space-y-3 text-xs shadow-inner">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 text-emerald-950 font-bold">
                <Settings2 className="w-4 h-4 text-amber-700" />
                <span>Panel Kustomisasi Isi Piagam A4</span>
              </div>

              {/* Upload Custom Certificate Design Background */}
              <div className="p-3 bg-white border border-amber-300 rounded-xl shadow-sm">
                <label className="block font-bold text-amber-900 mb-1">Upload Gambar Desain Piagam Sendiri</label>
                <p className="text-[10px] text-gray-600 mb-2">Pilih file gambar desain Anda (JPG/PNG). Aplikasi otomatis mencocokkan isi piagam di atas desain Anda.</p>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setCustomBgImage(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                  />
                  {customBgImage && (
                    <button
                      type="button"
                      onClick={() => setCustomBgImage(null)}
                      className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition shrink-0"
                      title="Hapus Desain Kustom"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>



              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Header Instansi / Yayasan</label>
                <input
                  type="text"
                  value={piagamHeader}
                  onChange={e => setPiagamHeader(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Nomor Piagam / Sertifikat</label>
                <input
                  type="text"
                  value={piagamNo}
                  onChange={e => setPiagamNo(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Judul Utama</label>
                  <input
                    type="text"
                    value={piagamTitle}
                    onChange={e => setPiagamTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Sub Judul / Pengantar</label>
                  <input
                    type="text"
                    value={piagamSubTitle}
                    onChange={e => setPiagamSubTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nama Peserta</label>
                  <input
                    type="text"
                    value={selectedPiagam.namaPeserta}
                    onChange={e => setSelectedPiagam({ ...selectedPiagam, namaPeserta: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Bin / Binti</label>
                  <input
                    type="text"
                    value={selectedPiagam.binBinti}
                    onChange={e => setSelectedPiagam({ ...selectedPiagam, binBinti: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Utusan / Lembaga</label>
                  <input
                    type="text"
                    value={selectedPiagam.utusan}
                    onChange={e => setSelectedPiagam({ ...selectedPiagam, utusan: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Predikat / Juara</label>
                  <input
                    type="text"
                    value={selectedPiagam.juara}
                    onChange={e => setSelectedPiagam({ ...selectedPiagam, juara: e.target.value })}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Cabang Lomba & Tingkat</label>
                <input
                  type="text"
                  value={selectedPiagam.jenisLomba}
                  onChange={e => setSelectedPiagam({ ...selectedPiagam, jenisLomba: e.target.value as any })}
                  className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950 mb-1.5"
                />
                <input
                  type="text"
                  value={selectedPiagam.tingkat}
                  onChange={e => setSelectedPiagam({ ...selectedPiagam, tingkat: e.target.value })}
                  className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                  placeholder="Tingkat Lomba"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Deskripsi / Kalimat Penghargaan</label>
                <textarea
                  rows={2}
                  value={piagamDesc}
                  onChange={e => setPiagamDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Tempat & Tanggal Terbit</label>
                  <input
                    type="text"
                    value={piagamLocationDate}
                    onChange={e => setPiagamLocationDate(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Jabatan TTD 1</label>
                  <input
                    type="text"
                    value={piagamSign1Title}
                    onChange={e => setPiagamSign1Title(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950 mb-1"
                  />
                  <input
                    type="text"
                    value={piagamSign1Name}
                    onChange={e => setPiagamSign1Name(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Jabatan & Nama TTD 2</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={piagamSign2Title}
                    onChange={e => setPiagamSign2Title(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-medium text-emerald-950"
                  />
                  <input
                    type="text"
                    value={piagamSign2Name}
                    onChange={e => setPiagamSign2Name(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-amber-200" />
                  <span>Cetak Dokumen A4 Presisi</span>
                </button>
              </div>
            </div>

            {/* Right: Precise A4 Landscape Printable Certificate Preview matching the reference design */}
            <div 
              className="lg:col-span-7 bg-white rounded-2xl shadow-xl border border-amber-400/60 relative overflow-hidden text-center flex flex-col justify-between transition-all duration-300 print-certificate-container aspect-[1.414/1] max-w-4xl mx-auto p-4 sm:p-6"
              style={customBgImage ? { backgroundImage: `url(${customBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {/* Left & Right Decorative Curved Waves (Only if no custom background uploaded) */}
              {!customBgImage && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -left-12 -top-12 w-40 h-56 bg-amber-500 rounded-full opacity-90 transform rotate-45"></div>
                    <div className="absolute -left-16 top-10 w-44 h-72 bg-emerald-700 rounded-full opacity-95 transform rotate-12"></div>
                    <div className="absolute -left-20 bottom-0 w-48 h-80 bg-emerald-900 rounded-full opacity-100"></div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -right-12 -top-12 w-40 h-56 bg-amber-500 rounded-full opacity-90 transform -rotate-45"></div>
                    <div className="absolute -right-16 top-10 w-44 h-72 bg-emerald-700 rounded-full opacity-95 transform -rotate-12"></div>
                    <div className="absolute -right-20 bottom-0 w-48 h-80 bg-emerald-900 rounded-full opacity-100"></div>
                  </div>

                  {/* Inner Gold Frame Border */}
                  <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-500/80 pointer-events-none rounded-xl z-10"></div>
                </>
              )}

              {/* Certificate Header */}
              <div className="relative z-20 pt-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-amber-400 overflow-hidden shrink-0 shadow-xs">
                    <img src="/logo.jpg" alt="Logo Fokus" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[7px] sm:text-[8px] font-bold tracking-[0.15em] text-emerald-950 uppercase">{piagamHeader}</p>
                </div>
                <div className="flex justify-between items-center px-8 text-[5px] sm:text-[6px] text-emerald-800 font-mono tracking-widest">
                  <span>{piagamNo}</span>
                  <span>{piagamLocationDate}</span>
                </div>
                
                <h1 className="text-base sm:text-xl font-serif font-extrabold text-emerald-950 mt-1 tracking-wider uppercase">
                  {piagamTitle}
                </h1>

                <p className="text-[6px] sm:text-[7px] font-semibold tracking-wider text-emerald-900 uppercase mt-0.5">
                  {piagamSubTitle}
                </p>
              </div>

              {/* Recipient Details */}
              <div className="relative z-25 py-1">
                <div className="max-w-md mx-auto">
                  <h2 className="text-base sm:text-xl font-serif font-bold text-emerald-950 tracking-wide pb-0.5 italic">
                    {selectedPiagam.namaPeserta}
                  </h2>
                  <div className="w-36 sm:w-48 h-0.5 bg-gradient-to-r from-transparent via-emerald-800 to-transparent mx-auto mt-0.5 mb-1"></div>
                </div>

                <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-[8px] sm:text-[9px] font-semibold tracking-wide">
                  Bin/Binti: <span className="font-bold">{selectedPiagam.binBinti}</span> &nbsp;|&nbsp; Utusan: <span className="font-bold">{selectedPiagam.utusan}</span>
                </div>

                <p className="text-[8px] sm:text-[9px] text-emerald-900 max-w-md mx-auto leading-relaxed mt-1 px-4 font-medium">
                  {piagamDesc}
                </p>

                <div className="mt-1 inline-block px-2.5 py-0.5 rounded-lg bg-amber-100/90 border border-amber-400 text-amber-950 font-bold text-[8px] sm:text-[8.5px] shadow-xs tracking-wide">
                  {selectedPiagam.juara} — {selectedPiagam.jenisLomba} ({selectedPiagam.tingkat})
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="relative z-20 pb-1 flex justify-between items-end px-4 sm:px-6 text-[9px]">
                <div className="text-center max-w-[120px] sm:max-w-[160px]">
                  <div className="h-5 sm:h-6"></div>
                  <p className="font-bold text-emerald-950 underline decoration-amber-600 text-[10px] tracking-wider">({piagamSign1Name})</p>
                  <p className="text-emerald-800 font-medium text-[8px] mt-0.5 leading-tight">{piagamSign1Title}</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-500 flex items-center justify-center bg-white shadow-md relative overflow-hidden">
                    <img src="/logo.jpg" alt="Stempel Logo Fokus" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="text-center max-w-[120px] sm:max-w-[160px]">
                  <div className="h-5 sm:h-6"></div>
                  <p className="font-bold text-emerald-950 underline decoration-amber-600 text-[10px] tracking-wider">({piagamSign2Name})</p>
                  <p className="text-emerald-800 font-medium text-[8px] mt-0.5 leading-tight">{piagamSign2Title}</p>
                </div>
              </div>

            </div>

          </div>
        </PrintModal>
      )}

      {/* Print List PDF Modal */}
      {showPrintListModal && (
        <PrintModal title={`Daftar Peserta & Nilai Perlombaan - ${activeTab.toUpperCase()}`} onClose={() => setShowPrintListModal(false)}>
          <div className="text-center space-y-4 font-sans text-xs">
            <h2 className="text-base font-serif font-bold text-emerald-950 uppercase">
              REKAPITULASI DATA PESERTA PERLOMBAAN {activeTab.toUpperCase()}
            </h2>
            <div className="border-t border-b border-emerald-200 py-3 text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 font-bold text-emerald-950">
                    <th className="pb-2 text-center w-8">NO</th>
                    <th className="pb-2">NAMA PESERTA</th>
                    <th className="pb-2">UTUSAN</th>
                    <th className="pb-2">ALAMAT</th>
                    <th className="pb-2">JENIS LOMBA</th>
                    <th className="pb-2 text-center">PREDIKAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filtered.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 text-center font-bold text-amber-800">{idx + 1}</td>
                      <td className="py-2 font-bold text-emerald-950">{item.namaPeserta} ({item.binBinti})</td>
                      <td className="py-2 text-emerald-800">{item.utusan}</td>
                      <td className="py-2 text-emerald-700">{item.alamat}</td>
                      <td className="py-2 text-emerald-800">{item.jenisLomba}</td>
                      <td className="py-2 text-center font-bold text-amber-900">{item.juara}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PrintModal>
      )}

    </div>
  );
};
