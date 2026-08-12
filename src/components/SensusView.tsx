import React, { useState, useRef } from 'react';
import { SahmasyRow } from '../types';
import { initialSahmasyRows } from '../data/initialData';
import { Users, Plus, Search, Trash2, Upload, FileText, FileSpreadsheet, Download, Printer, Edit3, Camera, Eye, X, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { PrintModal } from './PrintModal';
import { downloadCsvTemplate, exportToExcel, parseExcelFile } from '../utils/excelUtils';

interface SensusViewProps {
  sahmasy: SahmasyRow[];
  setSahmasy: React.Dispatch<React.SetStateAction<SahmasyRow[]>>;
  onNotify: (title: string, message: string) => void;
}

const PRESET_AVATARS = {
  putra: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  ],
  putri: [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  ]
};

export const SensusView: React.FC<SensusViewProps> = ({ sahmasy, setSahmasy, onNotify }) => {
  const [activeTipe, setActiveTipe] = useState<'putra' | 'putri' | 'santri_putra' | 'santri_putri'>('putra');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<SahmasyRow | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewMember, setPreviewMember] = useState<SahmasyRow | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [ttl, setTtl] = useState('');
  const [ayah, setAyah] = useState('');
  const [ibu, setIbu] = useState('');
  const [hp, setHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [berkas, setBerkas] = useState('');

  const filtered = sahmasy.filter(item =>
    item.tipe === activeTipe &&
    (item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.desa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNis('');
    setNama('');
    setNik('');
    setTtl('');
    setAyah('');
    setIbu('');
    setHp('');
    setAlamat('');
    setRtRw('');
    setDesa('');
    setKecamatan('');
    setFotoUrl('');
    setBerkas('');
    setShowAdd(true);
  };

  const handleOpenEditModal = (item: SahmasyRow) => {
    setEditingItem(item);
    setNis(item.nis);
    setNama(item.nama);
    setNik(item.nik);
    setTtl(item.ttl);
    setAyah(item.ayah);
    setIbu(item.ibu);
    setHp(item.noHandphone);
    setAlamat(item.alamat);
    setRtRw(item.rtRw);
    setDesa(item.desa);
    setKecamatan(item.kecamatan);
    setFotoUrl(item.fotoUrl || '');
    setBerkas(item.berkasUrl || '');
    setShowAdd(true);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar. Maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setSahmasy(sahmasy.map(item => item.id === editingItem.id ? {
        ...item,
        nis,
        nama,
        nik,
        ttl,
        ayah,
        ibu,
        noHandphone: hp,
        alamat,
        rtRw,
        desa,
        kecamatan,
        fotoUrl: fotoUrl || item.fotoUrl,
        berkasUrl: berkas || item.berkasUrl
      } : item));
      setShowAdd(false);
      onNotify('Data Sensus Diperbarui', `Data anggota ${nama} berhasil diperbarui.`);
    } else {
      const newItem: SahmasyRow = {
        id: 'shm-' + Date.now(),
        tipe: activeTipe,
        no: sahmasy.filter(s => s.tipe === activeTipe).length + 1,
        nis,
        nama,
        nik,
        ttl,
        ayah,
        ibu,
        noHandphone: hp,
        alamat,
        rtRw,
        desa,
        kecamatan,
        fotoUrl: fotoUrl || '',
        berkasUrl: berkas || ('dokumen_' + activeTipe + '_' + Date.now() + '.pdf')
      };
      setSahmasy([newItem, ...sahmasy]);
      setShowAdd(false);
      setNis('');
      setNama('');
      setNik('');
      setTtl('');
      setAyah('');
      setIbu('');
      setHp('');
      setAlamat('');
      setRtRw('');
      setDesa('');
      setKecamatan('');
      setFotoUrl('');
      setBerkas('');
      const tipeLabel = activeTipe === 'putra' ? 'Sahmasy Putra' : activeTipe === 'putri' ? 'Sahmasy Putri' : activeTipe === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri';
      onNotify('Data Sensus Disimpan', `Data ${tipeLabel} berhasil ditambahkan ke database.`);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data anggota ini?')) {
      setSahmasy(sahmasy.filter(s => s.id !== id));
      onNotify('Data Dihapus', 'Data anggota telah dihapus.');
    }
  };

  // Excel Handlers
  const handleDownloadTemplate = () => {
    const headers = ['NO', 'NIS', 'NIK', 'NAMA LENGKAP', 'TTL', 'AYAH', 'IBU', 'NO HANDPHONE', 'ALAMAT', 'RT RW', 'DESA', 'KECAMATAN', 'FOTO URL'];
    const sample = [1, '1029381', '3529081234560001', 'Ahmad Abdullah', 'Sumenep, 10 Mei 2003', 'H. Ali', 'Hj. Aminah', '081234567890', 'Dusun Gayam', '001/002', 'Gayam', 'Gayam', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'];
    downloadCsvTemplate(`Template_Sensus_${activeTipe}`, headers, sample);
    onNotify('Template Didownload', 'Template Excel sensus anggota berhasil diunduh.');
  };

  const handleExportExcel = () => {
    const headers = ['NO', 'NIS', 'NIK', 'NAMA LENGKAP', 'TTL', 'AYAH', 'IBU', 'NO HANDPHONE', 'ALAMAT', 'RT RW', 'DESA', 'KECAMATAN', 'FOTO URL'];
    const rows = filtered.map((item, idx) => [
      idx + 1, item.nis, item.nik, item.nama, item.ttl, item.ayah, item.ibu, item.noHandphone, item.alamat, item.rtRw, item.desa, item.kecamatan, item.fotoUrl || ''
    ]);
    exportToExcel(`Data_Sensus_${activeTipe}`, headers, rows);
    onNotify('Export Excel Berhasil', `Data sensus ${activeTipe} berhasil diexport.`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (dataRows) => {
        const newItems: SahmasyRow[] = [];
        dataRows.forEach((cols, idx) => {
          if (cols.length >= 2) {
            const hasNoCol = !isNaN(Number(cols[0]));
            const offset = hasNoCol ? 1 : 0;
            newItems.push({
              id: 'imp-shm-' + Date.now() + '-' + idx,
              tipe: activeTipe,
              no: sahmasy.length + idx + 1,
              nis: cols[offset] || '1000' + idx,
              nik: cols[offset + 1] || '3529000000',
              nama: cols[offset + 2] || 'Anggota Baru',
              ttl: cols[offset + 3] || 'Sumenep',
              ayah: cols[offset + 4] || '-',
              ibu: cols[offset + 5] || '-',
              noHandphone: cols[offset + 6] || '-',
              alamat: cols[offset + 7] || 'Gayam',
              rtRw: cols[offset + 8] || '001/001',
              desa: cols[offset + 9] || 'Gayam',
              kecamatan: cols[offset + 10] || 'Gayam',
              fotoUrl: cols[offset + 11] || '',
              berkasUrl: 'dokumen_import.pdf'
            });
          }
        });
        setSahmasy([...newItems, ...sahmasy]);
        onNotify('Import Berhasil', `${newItems.length} data sensus berhasil di-import dari Excel.`);
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
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Modul G
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            SENSUS DATABASE ANGGOTA: Sahmasy & Santri Aktif
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Pendataan lengkap NIS, NIK, Pas Foto Anggota, tempat tanggal lahir, orang tua, alamat, dan dokumen berkas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambah Anggota</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-emerald-200"
            title="Download Template Format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-emerald-200"
            title="Import Data Excel"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-emerald-200"
            title="Export Data ke Excel"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-base">DATABASE {activeTipe === 'putra' ? 'SAHMASY PUTRA' : activeTipe === 'putri' ? 'SAHMASY PUTRI' : activeTipe === 'santri_putra' ? 'SANTRI AKTIF PUTRA' : 'SANTRI AKTIF PUTRI'}</h3>
            <p className="text-xs text-emerald-200">Menampilkan pas foto & data terverifikasi sesuai kategori terpilih</p>
          </div>
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama / NIS / desa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-emerald-800/80 border border-emerald-700 rounded-xl text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex bg-emerald-50/60 p-2 border-b border-emerald-100 gap-2 flex-wrap">
          <button
            onClick={() => setActiveTipe('putra')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTipe === 'putra' ? 'bg-emerald-900 text-amber-200 shadow' : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Sahmasy Putra ({sahmasy.filter(s => s.tipe === 'putra').length})
          </button>
          <button
            onClick={() => setActiveTipe('putri')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTipe === 'putri' ? 'bg-emerald-900 text-amber-200 shadow' : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Sahmasy Putri ({sahmasy.filter(s => s.tipe === 'putri').length})
          </button>
          <button
            onClick={() => setActiveTipe('santri_putra')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTipe === 'santri_putra' ? 'bg-emerald-900 text-amber-200 shadow' : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Santri Aktif Putra ({sahmasy.filter(s => s.tipe === 'santri_putra').length})
          </button>
          <button
            onClick={() => setActiveTipe('santri_putri')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTipe === 'santri_putri' ? 'bg-emerald-900 text-amber-200 shadow' : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Santri Aktif Putri ({sahmasy.filter(s => s.tipe === 'santri_putri').length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                <th className="p-3 text-center w-10">NO</th>
                <th className="p-3 text-center w-16">FOTO</th>
                <th className="p-3">NIS / NIK</th>
                <th className="p-3">NAMA LENGKAP</th>
                <th className="p-3">TTL</th>
                <th className="p-3">AYAH & IBU</th>
                <th className="p-3">NO. HP</th>
                <th className="p-3">ALAMAT (RT/RW, DESA, KEC)</th>
                <th className="p-3 text-center">BERKAS</th>
                <th className="p-3 text-center w-16">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-emerald-900">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-emerald-600">
                    Tidak ada data Sahmasy {activeTipe}.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                    <td className="p-3 text-center font-bold text-emerald-700">{index + 1}</td>
                    
                    {/* Foto Column */}
                    <td className="p-2 text-center">
                      <div 
                        onClick={() => setPreviewMember(item)}
                        className="relative group inline-block cursor-pointer"
                        title="Klik untuk lihat Pas Foto & Kartu Anggota"
                      >
                        {item.fotoUrl ? (
                          <img
                            src={item.fotoUrl}
                            alt={item.nama}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 shadow-sm group-hover:scale-105 group-hover:border-amber-400 transition"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-sm group-hover:scale-105 group-hover:border-amber-400 transition">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-emerald-900 text-amber-300 p-0.5 rounded-full shadow border border-white opacity-0 group-hover:opacity-100 transition">
                          <Eye className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </td>

                    <td className="p-3">
                      <p className="font-mono font-bold text-emerald-950">{item.nis}</p>
                      <p className="text-[10px] font-mono text-emerald-600">{item.nik}</p>
                    </td>
                    <td className="p-3 font-bold text-emerald-950">
                      <div className="flex items-center gap-1.5">
                        <span>{item.nama}</span>
                        {item.fotoUrl && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">Foto ✓</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-emerald-800">{item.ttl}</td>
                    <td className="p-3 text-emerald-800">
                      <p>Ayah: {item.ayah}</p>
                      <p className="text-[10px] text-emerald-600">Ibu: {item.ibu}</p>
                    </td>
                    <td className="p-3 font-mono text-emerald-800">{item.noHandphone}</td>
                    <td className="p-3 text-emerald-700">
                      <p>{item.alamat}</p>
                      <p className="text-[10px] text-emerald-600">RT/RW {item.rtRw}, Desa {item.desa}, Kec. {item.kecamatan}</p>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-medium inline-flex items-center gap-1">
                        <Upload className="w-3 h-3 text-emerald-600" />
                        <span>PDF</span>
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition inline-block"
                        title="Edit Data Sensus Anggota"
                      >
                        <Edit3 className="w-4 h-4 text-emerald-800" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-block"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden p-6 my-8">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-100 pb-3">
              <h3 className="text-base font-serif font-bold text-emerald-950">
                {editingItem ? 'Edit Sensus Anggota' : `Tambah Sensus Sahmasy ${activeTipe === 'putra' ? 'Putra' : activeTipe === 'putri' ? 'Putri' : activeTipe === 'santri_putra' ? 'Santri Putra' : 'Santri Putri'}`}
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Photo Input & Preview Section */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Pas Foto Anggota (Foto Resmi)</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative shrink-0">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt="Preview Foto"
                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-600 shadow"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-200/80 border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center text-emerald-700 text-[10px]">
                        <User className="w-6 h-6 text-emerald-600" />
                        <span>Tanpa Foto</span>
                      </div>
                    )}
                    {fotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFotoUrl('')}
                        className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition text-[10px]"
                        title="Hapus foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Hidden Photo File Input */}
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-900 text-amber-200 text-xs font-semibold rounded-xl hover:bg-emerald-800 transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-300" />
                        <span>Upload Foto dari Perangkat</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-emerald-700">
                      Upload foto format JPG/PNG (Maks 5MB). Foto ini akan ditampilkan pada database & kartu anggota.
                    </p>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-emerald-800 font-semibold">Foto Contoh:</span>
                      {(activeTipe.includes('putri') ? PRESET_AVATARS.putri : PRESET_AVATARS.putra).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFotoUrl(url)}
                          className="w-6 h-6 rounded-full border border-emerald-400 overflow-hidden hover:scale-110 transition shadow-sm"
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct URL Option */}
                <div>
                  <input
                    type="url"
                    value={fotoUrl}
                    onChange={e => setFotoUrl(e.target.value)}
                    placeholder="Atau tempel Link URL Foto (https://...)"
                    className="w-full p-2 text-xs bg-white border border-emerald-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">NIS</label>
                  <input type="text" required value={nis} onChange={e => setNis(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="NIS..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">NIK</label>
                  <input type="text" required value={nik} onChange={e => setNik(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="352908..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Lengkap</label>
                <input type="text" required value={nama} onChange={e => setNama(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Nama lengkap..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Tempat, Tanggal Lahir (TTL)</label>
                <input type="text" required value={ttl} onChange={e => setTtl(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Sumenep, 12 Maret 2004" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Ayah</label>
                  <input type="text" required value={ayah} onChange={e => setAyah(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Nama ayah..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Ibu</label>
                  <input type="text" required value={ibu} onChange={e => setIbu(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Nama ibu..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">No. Handphone</label>
                  <input type="text" required value={hp} onChange={e => setHp(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">RT / RW</label>
                  <input type="text" required value={rtRw} onChange={e => setRtRw(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="001/002" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Alamat Jalan / Dusun</label>
                <input type="text" required value={alamat} onChange={e => setAlamat(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Jl. Raya Gayam..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Desa</label>
                  <input type="text" required value={desa} onChange={e => setDesa(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Gayam" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Kecamatan</label>
                  <input type="text" required value={kecamatan} onChange={e => setKecamatan(e.target.value)} className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" placeholder="Gayam" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Upload Berkas / Lampiran Sensus (Opsional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setBerkas(file.name);
                  }}
                  className="w-full text-xs text-emerald-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200 cursor-pointer"
                />
                {berkas && (
                  <p className="text-[11px] text-emerald-700 mt-1">Berkas terpilih: <strong>{berkas}</strong></p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-emerald-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-900 text-white rounded-xl text-xs font-semibold">
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Sahmasy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Photo Preview & ID Card Lightbox Modal */}
      {previewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-200 max-w-md w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setPreviewMember(null)}
              className="absolute top-4 right-4 p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-emerald-900 to-teal-900 p-4 rounded-2xl text-white shadow">
                <p className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">KARTU ANGGOTA RESMI SENSUS</p>
                <h3 className="font-serif font-bold text-lg text-white">MANAJEMEN FOKUS SAPUDI</h3>
                <p className="text-[10px] text-emerald-200">Sahmasy & Santri Aktif Sapudi</p>
              </div>

              {/* Large Pas Foto Display */}
              <div className="flex justify-center my-4">
                {previewMember.fotoUrl ? (
                  <img
                    src={previewMember.fotoUrl}
                    alt={previewMember.nama}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-amber-400 shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-emerald-100 border-4 border-emerald-300 flex flex-col items-center justify-center text-emerald-800">
                    <User className="w-12 h-12 text-emerald-700" />
                    <span className="text-[10px] font-semibold mt-1">Belum Ada Foto</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-serif font-bold text-emerald-950">{previewMember.nama}</h4>
                <p className="text-xs font-mono font-bold text-emerald-700">NIS: {previewMember.nis} | NIK: {previewMember.nik}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase border border-emerald-200">
                  {previewMember.tipe.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-2xl text-left text-xs space-y-1.5 border border-emerald-100">
                <p><strong className="text-emerald-950">TTL:</strong> {previewMember.ttl}</p>
                <p><strong className="text-emerald-950">Ayah / Ibu:</strong> {previewMember.ayah} / {previewMember.ibu}</p>
                <p><strong className="text-emerald-950">No. HP:</strong> {previewMember.noHandphone}</p>
                <p><strong className="text-emerald-950">Alamat:</strong> {previewMember.alamat}, RT/RW {previewMember.rtRw}, Desa {previewMember.desa}, Kec. {previewMember.kecamatan}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    handleOpenEditModal(previewMember);
                    setPreviewMember(null);
                  }}
                  className="w-full py-2 bg-emerald-900 text-amber-200 rounded-xl text-xs font-bold hover:bg-emerald-800 transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Ubah Pas Foto / Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print PDF Modal */}
      {showPrintModal && (
        <PrintModal title={`Database Sensus - ${activeTipe.toUpperCase()}`} onClose={() => setShowPrintModal(false)}>
          <div className="text-center space-y-4 font-sans text-xs">
            <h2 className="text-base font-serif font-bold text-emerald-950 uppercase">
              REKAPITULASI SENSUS ANGGOTA {activeTipe.replace('_', ' ').toUpperCase()}
            </h2>
            <div className="border-t border-b border-emerald-200 py-3 text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 font-bold text-emerald-950">
                    <th className="pb-2 text-center w-8">NO</th>
                    <th className="pb-2 text-center w-12">FOTO</th>
                    <th className="pb-2">NIS / NIK</th>
                    <th className="pb-2">NAMA LENGKAP</th>
                    <th className="pb-2">TTL</th>
                    <th className="pb-2">AYAH / IBU</th>
                    <th className="pb-2">ALAMAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filtered.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 text-center font-bold text-emerald-800">{idx + 1}</td>
                      <td className="py-2 text-center">
                        {item.fotoUrl ? (
                          <img src={item.fotoUrl} alt={item.nama} className="w-8 h-8 rounded-full object-cover mx-auto border border-emerald-300" />
                        ) : (
                          <span className="text-[10px] text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 font-mono text-emerald-950">{item.nis}</td>
                      <td className="py-2 font-bold text-emerald-950">{item.nama}</td>
                      <td className="py-2 text-emerald-800">{item.ttl}</td>
                      <td className="py-2 text-emerald-800">{item.ayah} / {item.ibu}</td>
                      <td className="py-2 text-emerald-700">{item.alamat}, Desa {item.desa}</td>
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

