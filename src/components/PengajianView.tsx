import React, { useState, useRef } from 'react';
import { ExpedisiRow, OrganizationProfile } from '../types';
import { initialExpedisiRows } from '../data/initialData';
import {
  BookOpen, Plus, Search, Trash2, Upload, Download, FileSpreadsheet, Printer, Edit3
} from 'lucide-react';
import { PrintModal } from './PrintModal';
import { Pagination } from './Pagination';
import { downloadCsvTemplate, exportToExcel, parseExcelFile } from '../utils/excelUtils';
import { matchesYear } from '../utils/filterUtils';

interface PengajianViewProps {
  expedisi?: ExpedisiRow[];
  setExpedisi?: React.Dispatch<React.SetStateAction<ExpedisiRow[]>>;
  onNotify: (title: string, message: string) => void;
  selectedYear?: string;
  orgProfile?: OrganizationProfile;
  logoUrl?: string;
}

export const PengajianView: React.FC<PengajianViewProps> = ({ 
  expedisi: propExpedisi, 
  setExpedisi: propSetExpedisi, 
  onNotify, 
  selectedYear = 'Semua',
  orgProfile,
  logoUrl
}) => {
  const [localExpedisi, setLocalExpedisi] = useState<ExpedisiRow[]>(initialExpedisiRows);
  const expedisi = propExpedisi || localExpedisi;
  const setExpedisi = propSetExpedisi || setLocalExpedisi;
  const [activeTab, setActiveTab] = useState<'undangan_vip' | 'undangan_umum'>('undangan_vip');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpedisiRow | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState('');
  const [newInstansi, setNewInstansi] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newHp, setNewHp] = useState('');
  const [newKet, setNewKet] = useState('');
  const [newBerkas, setNewBerkas] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = expedisi.filter(item =>
    item.kategoriExpedisi === activeTab &&
    matchesYear(item, selectedYear) &&
    (item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.instansiJabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.alamat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNewName('');
    setNewInstansi('');
    setNewAlamat('');
    setNewHp('');
    setNewKet('');
    setNewBerkas('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: ExpedisiRow) => {
    setEditingItem(item);
    setNewName(item.nama);
    setNewInstansi(item.instansiJabatan);
    setNewAlamat(item.alamat);
    setNewHp(item.noHandphone);
    setNewKet(item.keterangan);
    setNewBerkas(item.berkasUrl || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setExpedisi(expedisi.map(item => item.id === editingItem.id ? {
        ...item,
        nama: newName,
        instansiJabatan: newInstansi,
        alamat: newAlamat,
        noHandphone: newHp,
        keterangan: newKet,
        berkasUrl: newBerkas || item.berkasUrl
      } : item));
      setShowAddModal(false);
      onNotify('Undangan Pengajian Diperbarui', `Data expedisi ${newName} berhasil diperbarui.`);
    } else {
      const newItem: ExpedisiRow = {
        id: 'pengajian-' + Date.now(),
        kategoriExpedisi: activeTab,
        no: expedisi.filter(e => e.kategoriExpedisi === activeTab).length + 1,
        nama: newName,
        instansiJabatan: newInstansi,
        alamat: newAlamat,
        noHandphone: newHp,
        keterangan: newKet,
        berkasUrl: newBerkas || 'undangan_berkas_' + Date.now() + '.pdf',
        tahun: selectedYear !== 'Semua' ? selectedYear : '2026'
      };
      setExpedisi([newItem, ...expedisi]);
      setShowAddModal(false);
      setNewName('');
      setNewInstansi('');
      setNewAlamat('');
      setNewHp('');
      setNewKet('');
      setNewBerkas('');
      onNotify('Undangan Pengajian Ditambahkan', `Data expedisi ${activeTab === 'undangan_vip' ? 'VIP' : 'Umum'} berhasil disimpan.`);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data expedisi pengajian ini?')) {
      setExpedisi(expedisi.filter(item => item.id !== id));
      onNotify('Berhasil Dihapus', 'Data expedisi pengajian telah dihapus.');
    }
  };

  // Excel Handlers
  const handleDownloadTemplate = () => {
    const headers = ['NO', 'NAMA PENERIMA', 'INSTANSI / JABATAN', 'ALAMAT', 'NO HANDPHONE', 'KETERANGAN'];
    downloadCsvTemplate(`Pengajian_${activeTab}`, headers, sample);
    onNotify('Template Didownload', 'Template Excel expedisi pengajian berhasil diunduh.');
  };

  const handleExportExcel = () => {
    const headers = ['NO', 'NAMA PENERIMA', 'INSTANSI / JABATAN', 'ALAMAT LENGKAP', 'NO HANDPHONE / WA', 'KETERANGAN STATUS'];
    const rows = filtered.map((item, idx) => [
      idx + 1,
      item.nama,
      item.instansiJabatan,
      item.alamat,
      item.noHandphone,
      item.keterangan
    ]);
    exportToExcel(
      `Expedisi_Pengajian_${activeTab}`,
      headers,
      rows,
      {
        title: `ORGANISASI FOKUS SAPUDI - EXPEDISI PENGAJIAN (${activeTab === 'undangan_vip' ? 'UNDANGAN VIP' : 'UNDANGAN UMUM'})`,
        subtitle: 'Daftar Distribusi Surat Undangan & Konfirmasi Kehadiran Tokoh / Jamaah',
        sheetName: activeTab === 'undangan_vip' ? 'Undangan VIP' : 'Undangan Umum'
      }
    );
    onNotify('Export Excel Berhasil', 'Data expedisi pengajian berhasil diexport ke Excel (.xlsx).');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (dataRows) => {
        const newItems: ExpedisiRow[] = [];
        dataRows.forEach((cols, idx) => {
          if (cols.length >= 2) {
            const hasNoCol = !isNaN(Number(cols[0]));
            const offset = hasNoCol ? 1 : 0;
            newItems.push({
              id: 'imp-pengajian-' + Date.now() + '-' + idx,
              kategoriExpedisi: activeTab,
              no: expedisi.length + idx + 1,
              nama: cols[offset] || 'Penerima Undangan',
              instansiJabatan: cols[offset + 1] || 'Tokoh / Jamaah',
              alamat: cols[offset + 2] || 'Sapudi',
              noHandphone: cols[offset + 3] || '-',
              keterangan: cols[offset + 4] || 'Konfirmasi',
              berkasUrl: 'berkas_import.pdf'
            });
          }
        });
        setExpedisi([...newItems, ...expedisi]);
        onNotify('Import Berhasil', `${newItems.length} undangan pengajian berhasil di-import dari Excel.`);
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

      {/* Module Title Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Modul B
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            PENGAJIAN: Expedisi Undangan VIP & Umum
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Pengelolaan distribusi surat undangan pengajian akbar untuk tokoh penting (VIP) dan jamaah umum secara terstruktur.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambah Undangan</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Download Template Format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Import Data Excel"
          >
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Export Data ke Excel"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2.5 bg-teal-900 hover:bg-teal-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-emerald-100 bg-teal-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-base">TABEL EXPEDISI PENGAJIAN</h3>
            <p className="text-xs text-teal-200">Daftar penerima undangan VIP dan umum kegiatan pengajian organisasi</p>
          </div>
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-300">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari penerima / alamat..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-teal-800/80 border border-teal-700 rounded-xl text-white placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex bg-emerald-50/60 p-2 border-b border-emerald-100 gap-1">
          {[
            { id: 'undangan_vip', label: 'Expedisi Undangan VIP' },
            { id: 'undangan_umum', label: 'Expedisi Undangan Umum' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-teal-900 text-amber-200 shadow-sm'
                  : 'text-emerald-900 hover:bg-teal-100/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                <th className="p-3 text-center w-12">NO</th>
                <th className="p-3">NAMA</th>
                <th className="p-3">INSTANSI / JABATAN</th>
                <th className="p-3">ALAMAT</th>
                <th className="p-3">NO. HANDPHONE</th>
                <th className="p-3">KETERANGAN</th>
                <th className="p-3 text-center">BERKAS</th>
                <th className="p-3 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-emerald-900">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-emerald-600">
                    Tidak ada data undangan pengajian dalam kategori ini.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-teal-700">{globalIndex}</td>
                      <td className="p-3 font-semibold text-emerald-950">{item.nama}</td>
                      <td className="p-3 text-emerald-800">{item.instansiJabatan}</td>
                      <td className="p-3 text-emerald-700">{item.alamat}</td>
                      <td className="p-3 font-mono text-emerald-800">{item.noHandphone}</td>
                      <td className="p-3 text-emerald-700">{item.keterangan}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-lg text-[10px] font-medium">
                          <Upload className="w-3 h-3 text-teal-600" />
                          <span>{item.berkasUrl || 'Upload'}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition inline-block"
                          title="Edit Data Expedisi Undangan"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="undangan"
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden p-6">
            <h3 className="text-base font-serif font-bold text-emerald-950 mb-4">
              {editingItem ? 'Edit Undangan Pengajian' : `Tambah Undangan Pengajian (${activeTab === 'undangan_vip' ? 'VIP' : 'Umum'})`}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="Nama tokoh / jamaah..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Instansi / Jabatan</label>
                <input
                  type="text"
                  required
                  value={newInstansi}
                  onChange={e => setNewInstansi(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="Jabatan / Tokoh Masyarakat..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Alamat</label>
                <input
                  type="text"
                  required
                  value={newAlamat}
                  onChange={e => setNewAlamat(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="Alamat lengkap..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">No. Handphone</label>
                <input
                  type="text"
                  required
                  value={newHp}
                  onChange={e => setNewHp(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  value={newKet}
                  onChange={e => setNewKet(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="Konfirmasi kehadiran..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Upload Berkas / Undangan (Opsional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setNewBerkas(file.name);
                  }}
                  className="w-full text-xs text-emerald-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-900 hover:file:bg-teal-200 cursor-pointer"
                />
                {newBerkas && (
                  <p className="text-[11px] text-teal-700 mt-1">Berkas terpilih: <strong>{newBerkas}</strong></p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Undangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print PDF Modal */}
      {showPrintModal && (
        <PrintModal 
          title={`Lembar Expedisi Pengajian - ${activeTab.toUpperCase()}`} 
          onClose={() => setShowPrintModal(false)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="space-y-4 font-sans text-xs">
            {/* Official Kop Surat */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-900">
              <div className="w-14 h-14 bg-white rounded-full border border-amber-400 overflow-hidden shrink-0 shadow-xs p-0.5">
                <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 text-center pr-6">
                <h2 className="text-sm sm:text-base font-serif font-bold text-emerald-950 uppercase tracking-wide">
                  {orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI (FOKUS) SAPUDI'}
                </h2>
                <p className="text-[10px] text-emerald-800 mt-0.5 font-sans">
                  {orgProfile?.alamatSekretariat || 'Pulau Sapudi, Kab. Sumenep, Jawa Timur'} | Telp/WA: {orgProfile?.noTelepon || '+62 812-3456-7890'}
                </p>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-base font-serif font-bold text-emerald-950 uppercase">
                DAFTAR EXPEDISI PENGAJIAN {activeTab.replace(/_/g, ' ').toUpperCase()}
              </h2>
            </div>
            <div className="border-t border-b border-emerald-200 py-3 text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 font-bold text-emerald-950">
                    <th className="pb-2 text-center w-8">NO</th>
                    <th className="pb-2">NAMA</th>
                    <th className="pb-2">INSTANSI / JABATAN</th>
                    <th className="pb-2">ALAMAT</th>
                    <th className="pb-2">NO HP</th>
                    <th className="pb-2">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filtered.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 text-center font-bold text-teal-800">{idx + 1}</td>
                      <td className="py-2 font-bold text-emerald-950">{item.nama}</td>
                      <td className="py-2 text-emerald-800">{item.instansiJabatan}</td>
                      <td className="py-2 text-emerald-700">{item.alamat}</td>
                      <td className="py-2 font-mono text-emerald-800">{item.noHandphone}</td>
                      <td className="py-2 text-emerald-700">{item.keterangan}</td>
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
