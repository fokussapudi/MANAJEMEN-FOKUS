import React, { useState, useRef } from 'react';
import { HadrahJadwalRow } from '../types';
import { initialHadrahJadwal } from '../data/initialData';
import {
  Music, Printer, Plus, Trash2, Download, Upload, FileSpreadsheet, FileText, Edit3, X, Mail
} from 'lucide-react';
import { PrintModal } from './PrintModal';
import { exportToExcel, downloadCsvTemplate, parseExcelFile } from '../utils/excelUtils';

interface JamiyatulHadrahViewProps {
  onNotify: (title: string, message: string) => void;
}

export const JamiyatulHadrahView: React.FC<JamiyatulHadrahViewProps> = ({ onNotify }) => {
  const [jadwal, setJadwal] = useState<HadrahJadwalRow[]>(initialHadrahJadwal);
  const [showPrintAll, setShowPrintAll] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<HadrahJadwalRow | null>(null);
  const [selectedSatuan, setSelectedSatuan] = useState<HadrahJadwalRow | null>(null);

  // Custom Signature State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sign1Title, setSign1Title] = useState("Pimpinan Jam'iyatul Hadrah");
  const [sign1Name, setSign1Name] = useState('BADRUTTAMAM');
  const [sign2Title, setSign2Title] = useState('Ketua FOKUS Sapudi');
  const [sign2Name, setSign2Name] = useState('UST. ZAINAL ABIDIN');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hari, setHari] = useState('');
  const [pengundang, setPengundang] = useState('');
  const [tuanRumah, setTuanRumah] = useState('');
  const [alamat, setAlamat] = useState('');
  const [hp, setHp] = useState('');
  const [infaq, setInfaq] = useState('500000');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setHari('');
    setPengundang('');
    setTuanRumah('');
    setAlamat('');
    setHp('');
    setInfaq('500000');
    setShowAdd(true);
  };

  const handleOpenEdit = (item: HadrahJadwalRow) => {
    setEditingItem(item);
    setHari(item.hariTanggal);
    setPengundang(item.pengundang);
    setTuanRumah(item.tuanRumah);
    setAlamat(item.alamat);
    setHp(item.noHandphone);
    setInfaq(String(item.infaq));
    setShowAdd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setJadwal(jadwal.map(item => item.id === editingItem.id ? {
        ...item,
        hariTanggal: hari,
        pengundang,
        tuanRumah,
        alamat,
        noHandphone: hp,
        infaq: Number(infaq) || 0
      } : item));
      setShowAdd(false);
      onNotify('Data Diperbarui', 'Data jadwal undangan hadrah berhasil diperbarui.');
    } else {
      const newItem: HadrahJadwalRow = {
        id: 'hadrah-' + Date.now(),
        no: jadwal.length + 1,
        hariTanggal: hari,
        pengundang,
        tuanRumah,
        alamat,
        noHandphone: hp,
        infaq: Number(infaq) || 0
      };
      setJadwal([newItem, ...jadwal]);
      setShowAdd(false);
      setHari('');
      setPengundang('');
      setTuanRumah('');
      setAlamat('');
      setHp('');
      onNotify('Jadwal Hadrah Ditambahkan', 'Jadwal undangan jam\'iyatul hadrah berhasil disimpan.');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal undangan hadrah ini?')) {
      setJadwal(jadwal.filter(j => j.id !== id));
      onNotify('Jadwal Dihapus', 'Data jadwal undangan hadrah berhasil dihapus.');
    }
  };

  // Excel Handlers
  const handleDownloadTemplate = () => {
    const headers = ['NO', 'HARI / TANGGAL', 'PENGUNDANG', 'TUAN RUMAH', 'ALAMAT', 'NO HANDPHONE', 'INFAQ (RP)'];
    const sample = [1, 'Sabtu, 15 Syawal 1447 H', 'Takmir Masjid Al-Hikmah', 'H. Abdurrahman', 'Gayam Sapudi', '081234567890', 500000];
    downloadCsvTemplate('Jamiyatul_Hadrah_Jadwal', headers, sample);
    onNotify('Template Didownload', 'Template Excel jadwal hadrah berhasil diunduh.');
  };

  const handleExportExcel = () => {
    const headers = ['NO', 'HARI / TANGGAL', 'PENGUNDANG', 'TUAN RUMAH', 'ALAMAT', 'NO HANDPHONE', 'INFAQ (RP)'];
    const rows = jadwal.map((item, idx) => [
      idx + 1,
      item.hariTanggal,
      item.pengundang,
      item.tuanRumah,
      item.alamat,
      item.noHandphone,
      item.infaq
    ]);
    exportToExcel('Jadwal_Jamiyatul_Hadrah', headers, rows);
    onNotify('Export Excel Berhasil', 'Data jadwal hadrah berhasil diexport ke Excel.');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (dataRows) => {
        const newItems: HadrahJadwalRow[] = [];
        dataRows.forEach((cols, idx) => {
          if (cols.length >= 2) {
            const hasNoCol = !isNaN(Number(cols[0]));
            const offset = hasNoCol ? 1 : 0;
            newItems.push({
              id: 'imp-h-' + Date.now() + '-' + idx,
              no: jadwal.length + idx + 1,
              hariTanggal: cols[offset] || 'Syawal 1447 H',
              pengundang: cols[offset + 1] || 'Pengundang',
              tuanRumah: cols[offset + 2] || 'Tuan Rumah',
              alamat: cols[offset + 3] || 'Sapudi',
              noHandphone: cols[offset + 4] || '-',
              infaq: Number(cols[offset + 5]?.replace(/[^0-9]/g, '')) || 500000
            });
          }
        });
        setJadwal([...newItems, ...jadwal]);
        onNotify('Import Berhasil', `${newItems.length} jadwal hadrah berhasil di-import dari Excel.`);
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
          <span className="text-xs font-bold text-teal-800 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Modul E
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            JAM'IYATUL HADRAH: Jadwal Undangan Tampil
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Pengelolaan jadwal undangan, pengundang, tuan rumah, infaq, serta pencetakan lembar jadwal acara satuan & rekapitulasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambah Jadwal</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Download Template Format Excel (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Import Data dari File Excel / CSV"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Export Data ke File Excel"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowSignatureModal(true)}
            className="px-3.5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-amber-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow border border-emerald-800"
            title="Atur Nama & Jabatan Penandatangan Dokumen Cetak"
          >
            <Edit3 className="w-4 h-4 text-amber-300" />
            <span>Atur Penandatangan</span>
          </button>

          <button
            onClick={() => setShowPrintAll(true)}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak Semua Jadwal</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-emerald-100 bg-teal-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-base">JADWAL UNDANGAN JAM'IYATUL HADRAH FOKUS</h3>
            <p className="text-xs text-teal-200">Daftar pengundang, tuan rumah, lokasi, nomor HP, infaq & cetak lembar acara satuan</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                <th className="p-3 text-center w-12">NO</th>
                <th className="p-3">HARI / TANGGAL</th>
                <th className="p-3">PENGUNDANG</th>
                <th className="p-3">TUAN RUMAH</th>
                <th className="p-3">ALAMAT</th>
                <th className="p-3">NO. HANDPHONE</th>
                <th className="p-3 text-right">INFAQ (RP.)</th>
                <th className="p-3 text-center w-28">AKSI & CETAK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-emerald-900">
              {jadwal.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-emerald-600">
                    Belum ada data jadwal undangan jam'iyatul hadrah.
                  </td>
                </tr>
              ) : (
                jadwal.map((item, index) => (
                  <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                    <td className="p-3 text-center font-bold text-teal-700">{index + 1}</td>
                    <td className="p-3 font-semibold text-emerald-950">{item.hariTanggal}</td>
                    <td className="p-3 text-emerald-900 font-bold">{item.pengundang}</td>
                    <td className="p-3 text-emerald-800">{item.tuanRumah}</td>
                    <td className="p-3 text-emerald-700">{item.alamat}</td>
                    <td className="p-3 font-mono text-emerald-800">{item.noHandphone}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-800">
                      Rp {item.infaq.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSatuan(item)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg transition inline-flex items-center gap-1 font-bold text-[11px]"
                        title="Cetak Lembar Jadwal Acara Hadrah Satuan untuk Pengundang"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-800" />
                        <span>Cetak Acara</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition inline-flex items-center gap-1 font-bold text-[11px]"
                        title="Edit Data Jadwal"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-block"
                        title="Hapus Data"
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

      {/* Modal Add / Edit Jadwal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden p-6">
            <h3 className="text-base font-serif font-bold text-emerald-950 mb-4">
              {editingItem ? "Edit Data Jadwal Undangan Hadrah" : "Tambah Jadwal Undangan Hadrah"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Hari / Tanggal</label>
                <input
                  type="text"
                  required
                  value={hari}
                  onChange={e => setHari(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  placeholder="Contoh: Sabtu, 10 Syawal 1447 H"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Pengundang / Organisasi</label>
                <input
                  type="text"
                  required
                  value={pengundang}
                  onChange={e => setPengundang(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  placeholder="Contoh: Takmir Masjid Al-Akbar"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Tuan Rumah / Shohibul Bait</label>
                <input
                  type="text"
                  required
                  value={tuanRumah}
                  onChange={e => setTuanRumah(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  placeholder="Contoh: H. Moh. Hasan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Alamat Lokasi</label>
                <input
                  type="text"
                  required
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  placeholder="Contoh: Gayam Sapudi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">No. Handphone (WhatsApp)</label>
                <input
                  type="text"
                  required
                  value={hp}
                  onChange={e => setHp(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Infaq (Rp)</label>
                <input
                  type="number"
                  required
                  value={infaq}
                  onChange={e => setInfaq(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl"
                  placeholder="500000"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="px-5 py-2 bg-teal-800 text-white rounded-xl text-xs font-semibold">
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Penandatangan Dokumen */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-5">
            <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-emerald-950">
                    Pengaturan Penandatangan Dokumen Hadrah
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Atur nama dan jabatan penandatangan yang tampil pada lembar jadwal acara cetak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-2 hover:bg-emerald-50 text-emerald-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSignatureModal(false);
                onNotify('Pengaturan Disimpan', 'Penandatangan dokumen cetak hadrah berhasil diperbarui.');
              }}
              className="space-y-4 text-xs text-emerald-950"
            >
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                <p className="font-bold text-emerald-900 text-xs">✍️ Penandatangan 1 (Sisi Kiri)</p>
                <div>
                  <label className="block text-[11px] text-emerald-800 font-medium mb-1">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={sign1Title}
                    onChange={(e) => setSign1Title(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-800 font-medium mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={sign1Name}
                    onChange={(e) => setSign1Name(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <p className="font-bold text-amber-950 text-xs">✍️ Penandatangan 2 (Sisi Kanan)</p>
                <div>
                  <label className="block text-[11px] text-amber-900 font-medium mb-1">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={sign2Title}
                    onChange={(e) => setSign2Title(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-900 font-medium mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={sign2Name}
                    onChange={(e) => setSign2Name(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-900 text-amber-300 rounded-xl font-bold hover:bg-emerald-800 transition shadow"
                >
                  Simpan & Terapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Single Lembar Jadwal Acara Hadrah Satuan */}
      {selectedSatuan && (
        <PrintModal
          title={`Lembar Jadwal Acara Hadrah - ${selectedSatuan.pengundang}`}
          onClose={() => setSelectedSatuan(null)}
        >
          <div className="p-6 bg-white text-emerald-950 font-serif border border-emerald-200 rounded-2xl shadow-sm space-y-5 text-xs max-w-2xl mx-auto">
            {/* Kop Surat Header */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-900">
              <div className="w-16 h-16 bg-white rounded-full border-2 border-amber-400 overflow-hidden shrink-0 shadow-xs">
                <img src="/logo.jpg" alt="Logo Fokus" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center pr-10">
                <h2 className="text-base font-bold text-emerald-950 uppercase tracking-wide">
                  FORUM KOMUNIKASI SANTRI (FOKUS)
                </h2>
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mt-0.5">
                  JAM'IYATUL HADRAH FOKUS SAPUDI
                </h3>
                <p className="text-[10px] font-sans text-emerald-800 mt-1">
                  Sekretariat Utama: Pulau Sapudi, Kab. Sumenep, Jawa Timur | Telp/WA: {selectedSatuan.noHandphone !== '-' ? selectedSatuan.noHandphone : '0812-3456-7890'}
                </p>
              </div>
            </div>

            {/* Judul Lembar Acara */}
            <div className="text-center space-y-1 font-sans pt-1">
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider underline">
                LEMBAR JADWAL ACARA TAMPIL JAM'IYATUL HADRAH
              </h3>
              <p className="text-[11px] font-mono text-emerald-800">
                No. Dokumen: 045/HADRAH/FOKUS-SPD/IV/2026
              </p>
            </div>

            {/* Informasi Pengundang & Lokasi */}
            <div className="font-sans text-xs space-y-1 bg-teal-50/60 p-3 rounded-xl border border-teal-100">
              <p className="text-teal-800 text-[11px] font-semibold uppercase tracking-wider">Pengundang / Lokasi Tuan Rumah:</p>
              <p className="font-bold text-sm text-emerald-950">
                <span className="text-teal-900">{selectedSatuan.pengundang}</span> &mdash; <span className="uppercase">{selectedSatuan.tuanRumah}</span>
              </p>
              <p className="text-emerald-800">Wilayah / Alamat: <span className="font-semibold">{selectedSatuan.alamat}</span></p>
            </div>

            {/* Rincian Acara Hadrah */}
            <div className="my-3 p-4 bg-amber-50/60 border-l-4 border-amber-500 rounded-r-xl font-sans text-xs space-y-2.5">
              <h4 className="font-bold text-emerald-900 border-b border-amber-200 pb-1 uppercase tracking-wider text-[11px]">
                RINCIAN PELAKSANAAN UNDANGAN HADRAH
              </h4>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Hari / Tanggal</span>
                <span className="col-span-8 font-semibold text-emerald-950">: {selectedSatuan.hariTanggal}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Pengundang / Acara</span>
                <span className="col-span-8 font-bold text-emerald-950">: {selectedSatuan.pengundang}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Tuan Rumah / Shohibul Bait</span>
                <span className="col-span-8 font-bold text-emerald-950">: {selectedSatuan.tuanRumah}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Alamat Lengkap</span>
                <span className="col-span-8 text-emerald-900">: {selectedSatuan.alamat}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Kontak Person / HP</span>
                <span className="col-span-8 font-mono text-emerald-900">: {selectedSatuan.noHandphone}</span>
              </div>
            </div>

            {/* Ketentuan Penampilan Hadrah */}
            <div className="space-y-2 leading-relaxed font-sans text-xs bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-950 text-[11px]">KETENTUAN PELAKSANAAN PENAMPILAN HADRAH:</p>
              <ul className="list-disc list-inside space-y-1 text-emerald-900 text-[11px]">
                <li>Tim Hadrah siap di lokasi 30 menit sebelum pembacaan sholawat dimulai.</li>
                <li>Shohibul Bait / Pengundang memfasilitasi area khusus tim hadrah beserta perlengkapan sound system.</li>
                <li>Menjaga kekhusyukan dan kelancaran rangkaian acara marhabanan sholawat.</li>
              </ul>
            </div>

            {/* Tanda Tangan & Pengesahan */}
            <div className="flex justify-between items-center pt-6 font-sans text-xs border-t border-emerald-100">
              <div className="text-center space-y-12 min-w-32">
                <p className="font-semibold text-emerald-900">{sign1Title}</p>
                <p className="font-bold underline text-emerald-950 uppercase">({sign1Name})</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500 overflow-hidden shadow-xs mx-auto mb-1">
                  <img src="/logo.jpg" alt="Stempel Fokus" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest">STEMPEL RESMI</p>
              </div>

              <div className="text-center space-y-12 min-w-32">
                <p className="font-semibold text-emerald-900">{sign2Title}</p>
                <p className="font-bold underline text-emerald-950 uppercase">({sign2Name})</p>
              </div>
            </div>
          </div>
        </PrintModal>
      )}

      {/* Print All Jadwal Modal */}
      {showPrintAll && (
        <PrintModal title="Jadwal Resmi Jam'iyatul Hadrah" onClose={() => setShowPrintAll(false)}>
          <div className="text-center space-y-4">
            <h2 className="text-xl font-serif font-bold text-emerald-950">JADWAL UNDANGAN JAM'IYATUL HADRAH FOKUS</h2>
            <div className="border-t border-b border-emerald-200 py-4 my-4 text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 text-emerald-900">
                    <th className="pb-2">No</th>
                    <th className="pb-2">Hari / Tanggal</th>
                    <th className="pb-2">Pengundang</th>
                    <th className="pb-2">Tuan Rumah</th>
                    <th className="pb-2">Alamat</th>
                    <th className="pb-2 text-right">Infaq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {jadwal.map((j, i) => (
                    <tr key={j.id}>
                      <td className="py-2">{i + 1}</td>
                      <td className="py-2 font-semibold">{j.hariTanggal}</td>
                      <td className="py-2">{j.pengundang}</td>
                      <td className="py-2">{j.tuanRumah}</td>
                      <td className="py-2">{j.alamat}</td>
                      <td className="py-2 text-right font-mono">Rp {j.infaq.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-6 text-xs text-emerald-900 font-sans">
              <div className="text-center space-y-12 min-w-32">
                <p className="font-semibold text-emerald-900">{sign1Title}</p>
                <p className="font-bold underline text-emerald-950 uppercase">({sign1Name})</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-amber-500 overflow-hidden shadow-xs mx-auto mb-0.5">
                  <img src="/logo.jpg" alt="Stempel Fokus" className="w-full h-full object-cover" />
                </div>
                <p className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest">STEMPEL RESMI</p>
              </div>

              <div className="text-center space-y-12 min-w-32">
                <p className="font-semibold text-emerald-900">{sign2Title}</p>
                <p className="font-bold underline text-emerald-950 uppercase">({sign2Name})</p>
              </div>
            </div>
          </div>
        </PrintModal>
      )}
    </div>
  );
};
