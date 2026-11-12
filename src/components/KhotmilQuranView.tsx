import React, { useState, useRef } from 'react';
import { KhotmilJadwalRow, KhotmilAbsenRow, OrganizationProfile } from '../types';
import { initialKhotmilJadwal, initialKhotmilAbsen } from '../data/initialData';
import {
  BookmarkCheck, Plus, Printer, Trash2, Calendar, Users, Search, Edit3,
  Download, Upload, FileSpreadsheet, FileText, CheckCircle2, X, Mail
} from 'lucide-react';
import { PrintModal } from './PrintModal';
import { Pagination } from './Pagination';
import { exportToExcel, downloadCsvTemplate, parseExcelFile, exportMultiSheetWorkbook } from '../utils/excelUtils';

import { matchesYear, formatGregorianIndo } from '../utils/filterUtils';

interface KhotmilQuranViewProps {
  jadwal?: KhotmilJadwalRow[];
  setJadwal?: React.Dispatch<React.SetStateAction<KhotmilJadwalRow[]>>;
  absen?: KhotmilAbsenRow[];
  setAbsen?: React.Dispatch<React.SetStateAction<KhotmilAbsenRow[]>>;
  onNotify: (title: string, message: string) => void;
  selectedYear?: string;
  orgProfile?: OrganizationProfile;
  logoUrl?: string;
}

export const KhotmilQuranView: React.FC<KhotmilQuranViewProps> = ({ 
  jadwal: propJadwal, 
  setJadwal: propSetJadwal, 
  absen: propAbsen, 
  setAbsen: propSetAbsen, 
  onNotify,
  selectedYear = 'Semua',
  orgProfile,
  logoUrl
}) => {
  const [localJadwal, setLocalJadwal] = useState<KhotmilJadwalRow[]>(initialKhotmilJadwal);
  const jadwal = propJadwal || localJadwal;
  const setJadwal = propSetJadwal || setLocalJadwal;

  const [localAbsen, setLocalAbsen] = useState<KhotmilAbsenRow[]>(initialKhotmilAbsen);
  const absen = propAbsen || localAbsen;
  const setAbsen = propSetAbsen || setLocalAbsen;
  const [activeSubTab, setActiveSubTab] = useState<'jadwal' | 'absen'>('jadwal');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showPrintJadwal, setShowPrintJadwal] = useState(false);
  const [showPrintAbsen, setShowPrintAbsen] = useState(false);
  const [selectedUndangan, setSelectedUndangan] = useState<KhotmilJadwalRow | null>(null);

  // File input ref for Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Modal States for Jadwal Wajib
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [editingJadwalId, setEditingJadwalId] = useState<string | null>(null);
  const [jadwalHariTanggal, setJadwalHariTanggal] = useState('');
  const [jadwalTuanRumah, setJadwalTuanRumah] = useState('');
  const [jadwalAlamat, setJadwalAlamat] = useState('');
  const [jadwalNoHp, setJadwalNoHp] = useState('');
  const [jadwalInfaq, setJadwalInfaq] = useState<number | string>(500000);

  const [formTahun, setFormTahun] = useState('2026');
  const [selDay, setSelDay] = useState('');
  const [selDate, setSelDate] = useState('');
  const [selHijri, setSelHijri] = useState('');

  const parseHariTanggal = (str: string) => {
    let parsedDay = '';
    let parsedHijri = '';
    
    const parts = str.split(',');
    if (parts.length > 0) {
      const possibleDay = parts[0].trim();
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      if (days.includes(possibleDay)) {
        parsedDay = possibleDay;
      }
      
      if (parts.length > 1) {
        const dateAndHijri = parts[1].split('/');
        if (dateAndHijri.length > 1) {
          parsedHijri = dateAndHijri[1].trim();
        } else {
          const text = parts[1].trim();
          if (text.endsWith('H') || text.includes('H')) {
            parsedHijri = text;
          }
        }
      }
    }
    return { parsedDay, parsedHijri };
  };

  const handleDateChange = (dateVal: string) => {
    setSelDate(dateVal);
    const { dayName, dateFormatted } = formatGregorianIndo(dateVal);
    let dayToUse = dayName || selDay;
    if (dayName) setSelDay(dayName);
    
    const combined = `${dayToUse ? `${dayToUse}, ` : ''}${dateFormatted}${selHijri ? ` / ${selHijri}` : ''}`;
    setJadwalHariTanggal(combined);
  };

  const handleDayChange = (dayVal: string) => {
    setSelDay(dayVal);
    let datePart = '';
    if (selDate) {
      const { dateFormatted } = formatGregorianIndo(selDate);
      datePart = dateFormatted;
    }
    const combined = `${dayVal ? `${dayVal}, ` : ''}${datePart}${selHijri ? ` / ${selHijri}` : ''}`;
    setJadwalHariTanggal(combined);
  };

  const handleHijriChange = (hijriVal: string) => {
    setSelHijri(hijriVal);
    let datePart = '';
    if (selDate) {
      const { dateFormatted } = formatGregorianIndo(selDate);
      datePart = dateFormatted;
    }
    const combined = `${selDay ? `${selDay}, ` : ''}${datePart}${hijriVal ? ` / ${hijriVal}` : ''}`;
    setJadwalHariTanggal(combined);
  };

  // Form Modal States for Absensi Kehadiran
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [editingAbsenId, setEditingAbsenId] = useState<string | null>(null);
  const [absenNis, setAbsenNis] = useState('');
  const [absenNama, setAbsenNama] = useState('');
  const [absenAlamat, setAbsenAlamat] = useState('');
  const [absenJuz, setAbsenJuz] = useState('Juz 1 & 2');
  const [absenKet, setAbsenKet] = useState('Hadir / Alpa');

  // Custom Signatures State & Modal
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sign1Title, setSign1Title] = useState('Koordinator Khotmil Qur\'an');
  const [sign1Name, setSign1Name] = useState('Ust. Rifqi Rahmatul Akbar');
  const [sign2Title, setSign2Title] = useState('Ketua FOKUS Pulau Sapudi');
  const [sign2Name, setSign2Name] = useState('Ust. Subairi, S.Ag');

  // Pagination States
  const [jadwalPage, setJadwalPage] = useState(1);
  const [jadwalPageSize, setJadwalPageSize] = useState(10);
  const [absenPage, setAbsenPage] = useState(1);
  const [absenPageSize, setAbsenPageSize] = useState(10);

  // Search Filter
  const filteredJadwal = jadwal.filter(item =>
    matchesYear(item, selectedYear) &&
    (item.hariTanggal.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.tuanRumah.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.noHandphone.includes(searchTerm))
  );

  const paginatedJadwal = filteredJadwal.slice((jadwalPage - 1) * jadwalPageSize, jadwalPage * jadwalPageSize);

  const filteredAbsen = absen.filter(item =>
    matchesYear(item, selectedYear) &&
    (item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.juzAlQuran.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedAbsen = filteredAbsen.slice((absenPage - 1) * absenPageSize, absenPage * absenPageSize);

  // Total Infaq
  const totalInfaq = filteredJadwal.reduce((acc, curr) => acc + (Number(curr.infaq) || 0), 0);

  // --- HANDLERS JADWAL ---
  const openAddJadwalModal = () => {
    setEditingJadwalId(null);
    setJadwalHariTanggal('');
    setJadwalTuanRumah('');
    setJadwalAlamat('');
    setJadwalNoHp('');
    setJadwalInfaq(500000);
    setFormTahun(selectedYear !== 'Semua' ? selectedYear : '2026');
    setSelDay('');
    setSelDate('');
    setSelHijri('');
    setShowJadwalModal(true);
  };

  const openEditJadwalModal = (item: KhotmilJadwalRow) => {
    setEditingJadwalId(item.id);
    setJadwalHariTanggal(item.hariTanggal);
    setJadwalTuanRumah(item.tuanRumah);
    setJadwalAlamat(item.alamat);
    setJadwalNoHp(item.noHandphone);
    setJadwalInfaq(item.infaq);
    setFormTahun(item.tahun || '2026');
    
    const parsed = parseHariTanggal(item.hariTanggal);
    setSelDay(parsed.parsedDay);
    setSelHijri(parsed.parsedHijri);
    setSelDate('');
    setShowJadwalModal(true);
  };

  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalHariTanggal || !jadwalTuanRumah) {
      onNotify('Form Belum Lengkap', 'Hari/Tanggal dan Nama Tuan Rumah wajib diisi.');
      return;
    }

    const numInfaq = Number(jadwalInfaq) || 0;

    if (editingJadwalId) {
      setJadwal(jadwal.map(item => item.id === editingJadwalId ? {
        ...item,
        hariTanggal: jadwalHariTanggal,
        tuanRumah: jadwalTuanRumah,
        alamat: jadwalAlamat || 'Sapudi',
        noHandphone: jadwalNoHp || '-',
        infaq: numInfaq,
        tahun: formTahun
      } : item));
      onNotify('Jadwal Diperbarui', `Jadwal Khotmil Qur'an ${jadwalTuanRumah} berhasil diperbarui.`);
    } else {
      const newRow: KhotmilJadwalRow = {
        id: 'khotmil-j-' + Date.now(),
        no: jadwal.length + 1,
        hariTanggal: jadwalHariTanggal,
        tuanRumah: jadwalTuanRumah,
        alamat: jadwalAlamat || 'Sapudi',
        noHandphone: jadwalNoHp || '-',
        infaq: numInfaq,
        tahun: formTahun
      };
      setJadwal([newRow, ...jadwal]);
      onNotify('Jadwal Ditambahkan', `Jadwal Khotmil Qur'an ${jadwalTuanRumah} berhasil ditambahkan.`);
    }

    setShowJadwalModal(false);
  };

  const handleDeleteJadwal = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jadwal khotmil Qur'an di rumah ${name}?`)) {
      setJadwal(jadwal.filter(item => item.id !== id));
      onNotify('Jadwal Dihapus', `Jadwal khotmil di rumah ${name} telah dihapus.`);
    }
  };

  // --- HANDLERS ABSENSI ---
  const openAddAbsenModal = () => {
    setEditingAbsenId(null);
    setAbsenNis(`2026${String(absen.length + 1).padStart(3, '0')}`);
    setAbsenNama('');
    setAbsenAlamat('');
    setAbsenJuz('Juz 1 & 2');
    setAbsenKet('Hadir / Mutqin');
    setShowAbsenModal(true);
  };

  const openEditAbsenModal = (item: KhotmilAbsenRow) => {
    setEditingAbsenId(item.id);
    setAbsenNis(item.nis);
    setAbsenNama(item.nama);
    setAbsenAlamat(item.alamat);
    setAbsenJuz(item.juzAlQuran);
    setAbsenKet(item.keterangan);
    setShowAbsenModal(true);
  };

  const handleSaveAbsen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenNama || !absenNis) {
      onNotify('Form Belum Lengkap', 'NIS dan Nama Peserta wajib diisi.');
      return;
    }

    if (editingAbsenId) {
      setAbsen(absen.map(item => item.id === editingAbsenId ? {
        ...item,
        nis: absenNis,
        nama: absenNama,
        alamat: absenAlamat || 'Sapudi',
        juzAlQuran: absenJuz,
        keterangan: absenKet
      } : item));
      onNotify('Absensi Diperbarui', `Data peserta ${absenNama} berhasil diperbarui.`);
    } else {
      const newRow: KhotmilAbsenRow = {
        id: 'khotmil-a-' + Date.now(),
        no: absen.length + 1,
        nis: absenNis,
        nama: absenNama,
        alamat: absenAlamat || 'Sapudi',
        juzAlQuran: absenJuz,
        keterangan: absenKet
      };
      setAbsen([newRow, ...absen]);
      onNotify('Peserta Ditambahkan', `Peserta absensi ${absenNama} berhasil ditambahkan.`);
    }

    setShowAbsenModal(false);
  };

  const handleDeleteAbsen = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data absensi peserta ${name}?`)) {
      setAbsen(absen.filter(item => item.id !== id));
      onNotify('Peserta Dihapus', `Data peserta ${name} telah dihapus dari absensi.`);
    }
  };

  // --- EXCEL TEMPLATE, IMPORT & EXPORT (.XLSX) ---
  const handleDownloadTemplate = () => {
    if (activeSubTab === 'jadwal') {
      const headers = ['NO', 'HARI / TANGGAL', 'TUAN RUMAH', 'ALAMAT LENGKAP', 'NO. HANDPHONE', 'INFAQ (RP)'];
            downloadCsvTemplate('Template_Khotmil_Jadwal', headers, sample);
      onNotify('Template Terunduh', 'Template Excel (.xlsx) untuk Jadwal Khotmil Qur\'an berhasil diunduh.');
    } else {
      const headers = ['NO', 'NIS', 'NAMA PESERTA', 'ALAMAT LENGKAP', 'JUZ AL-QUR\'AN', 'KETERANGAN KEHADIRAN'];
      downloadCsvTemplate('Template_Khotmil_Absensi', headers, sample);
      onNotify('Template Terunduh', 'Template Excel (.xlsx) untuk Absensi Khotmil Qur\'an berhasil diunduh.');
    }
  };

  const handleExportExcel = () => {
    if (activeSubTab === 'jadwal') {
      const headers = ['NO', 'HARI / TANGGAL', 'TUAN RUMAH', 'ALAMAT LENGKAP', 'NO. HANDPHONE', 'INFAQ (RP)'];
      const rows = filteredJadwal.map((item, index) => [
        index + 1,
        item.hariTanggal,
        item.tuanRumah,
        item.alamat,
        item.noHandphone,
        item.infaq
      ]);

      exportToExcel(
        'Jadwal_Khotmil_Quran',
        headers,
        rows,
        {
          title: 'ORGANISASI FOKUS SAPUDI - JADWAL KHOTMIL QUR\'AN',
          subtitle: 'Daftar Rotasi Shohibul Bait & Infaq Khotmil Al-Qur\'an',
          sheetName: 'Jadwal Khotmil'
        }
      );
      onNotify('Export Excel Berhasil', 'Data jadwal khotmil berhasil diexport ke file Excel (.xlsx).');
    } else {
      const headers = ['NO', 'NIS', 'NAMA PESERTA', 'ALAMAT LENGKAP', 'JUZ AL-QUR\'AN', 'KETERANGAN'];
      const rows = filteredAbsen.map((item, index) => [
        index + 1,
        item.nis,
        item.nama,
        item.alamat,
        item.juzAlQuran,
        item.keterangan
      ]);

      exportToExcel(
        'Absensi_Khotmil_Quran',
        headers,
        rows,
        {
          title: 'ORGANISASI FOKUS SAPUDI - ABSENSI KHOTMIL QUR\'AN',
          subtitle: 'Rekap Pembagian 30 Juz & Kehadiran Anggota FOKUS',
          sheetName: 'Absensi Khotmil'
        }
      );
      onNotify('Export Excel Berhasil', 'Data absensi khotmil berhasil diexport ke file Excel (.xlsx).');
    }
  };

  const handleExportAllWorkbook = () => {
    const jadwalHeaders = ['NO', 'HARI / TANGGAL', 'TUAN RUMAH', 'ALAMAT LENGKAP', 'NO. HANDPHONE', 'INFAQ (RP)'];
    const jadwalRows = jadwal.map((item, idx) => [
      idx + 1,
      item.hariTanggal,
      item.tuanRumah,
      item.alamat,
      item.noHandphone,
      item.infaq
    ]);

    const absenHeaders = ['NO', 'NIS', 'NAMA PESERTA', 'ALAMAT LENGKAP', 'JUZ AL-QUR\'AN', 'KETERANGAN'];
    const absenRows = absen.map((item, idx) => [
      idx + 1,
      item.nis,
      item.nama,
      item.alamat,
      item.juzAlQuran,
      item.keterangan
    ]);

    exportMultiSheetWorkbook('Buku_Lengkap_Khotmil_Quran', [
      {
        sheetName: 'Jadwal Shohibul Bait',
        title: 'ORGANISASI FOKUS PULAU SAPUDI - JADWAL KHOTMIL QUR\'AN',
        subtitle: 'Daftar Rotasi Tuan Rumah Khotmil Al-Qur\'an',
        headers: jadwalHeaders,
        rows: jadwalRows
      },
      {
        sheetName: 'Absensi 30 Juz',
        title: 'ORGANISASI FOKUS PULAU SAPUDI - ABSENSI & PEMBAGIAN JUZ',
        subtitle: 'Rekap Pembaca 30 Juz Khotmil Al-Qur\'an FOKUS PULAU SAPUDI',
        headers: absenHeaders,
        rows: absenRows
      }
    ]);

    onNotify('Export Buku Lengkap Berhasil', 'Seluruh data Jadwal dan Absensi Khotmil berhasil diexport dalam satu berkas Excel (.xlsx).');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (dataRows) => {
        let count = 0;
        if (activeSubTab === 'jadwal') {
          const newRows: KhotmilJadwalRow[] = [];
          dataRows.forEach((cols, idx) => {
            if (cols.length >= 2) {
              const hasNoCol = !isNaN(Number(cols[0]));
              const offset = hasNoCol ? 1 : 0;

              const hariTanggal = cols[offset] || '15 Ramadhan 1447 H';
              const tuanRumah = cols[offset + 1] || 'H. Ahmad';
              const alamat = cols[offset + 2] || 'Sapudi';
              const noHandphone = cols[offset + 3] || '-';
              const infaqVal = cols[offset + 4] ? Number(cols[offset + 4].replace(/[^0-9]/g, '')) : 500000;

              newRows.push({
                id: 'imp-j-' + Date.now() + '-' + idx,
                no: jadwal.length + idx + 1,
                hariTanggal,
                tuanRumah,
                alamat,
                noHandphone,
                infaq: infaqVal || 500000
              });
              count++;
            }
          });
          setJadwal([...newRows, ...jadwal]);
          onNotify('Import Excel Berhasil', `${count} data jadwal khotmil berhasil di-import dari Excel.`);
        } else {
          const newRows: KhotmilAbsenRow[] = [];
          dataRows.forEach((cols, idx) => {
            if (cols.length >= 2) {
              const hasNoCol = !isNaN(Number(cols[0]));
              const offset = hasNoCol ? 1 : 0;

              const nis = cols[offset] || `2026${String(idx).padStart(3, '0')}`;
              const nama = cols[offset + 1] || 'Peserta';
              const alamat = cols[offset + 2] || 'Sapudi';
              const juzAlQuran = cols[offset + 3] || 'Juz ' + (idx % 30 + 1);
              const keterangan = cols[offset + 4] || 'Hadir / Alpa';

              newRows.push({
                id: 'imp-a-' + Date.now() + '-' + idx,
                no: absen.length + idx + 1,
                nis,
                nama,
                alamat,
                juzAlQuran,
                keterangan
              });
              count++;
            }
          });
          setAbsen([...newRows, ...absen]);
          onNotify('Import Excel Berhasil', `${count} data absensi khotmil berhasil di-import dari Excel.`);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      (err) => onNotify('Import Gagal', err)
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hidden File Input for Import */}
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
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Modul D
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            KHOTMIL QUR'AN: Jadwal Kegiatan Wajib & Absensi
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Pengelolaan jadwal khotmil qur'an wajib di rumah tuan rumah, infaq, absensi kehadiran, serta fitur input data, import & export Excel & PDF.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'jadwal' ? (
            <button
              onClick={openAddJadwalModal}
              className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Tambah Jadwal Wajib</span>
            </button>
          ) : (
            <button
              onClick={openAddAbsenModal}
              className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Tambah Absensi</span>
            </button>
          )}

          <button
            onClick={() => setShowSignatureModal(true)}
            className="px-3.5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow border border-emerald-800"
            title="Atur Nama & Jabatan Penandatangan Dokumen Cetak"
          >
            <Edit3 className="w-4 h-4 text-amber-300" />
            <span>Atur Penandatangan</span>
          </button>

          <button
            onClick={() => {
              if (activeSubTab === 'jadwal') setShowPrintJadwal(true);
              else setShowPrintAbsen(true);
            }}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow"
          >
            <Printer className="w-4 h-4 text-emerald-950" />
            <span>Cetak / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs and Search Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-emerald-50/80 p-1.5 rounded-2xl border border-emerald-100 gap-2 max-w-md w-full">
          <button
            onClick={() => {
              setActiveSubTab('jadwal');
              setJadwalPage(1);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'jadwal'
                ? 'bg-emerald-900 text-amber-200 shadow'
                : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal Kegiatan Wajib ({jadwal.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('absen');
              setAbsenPage(1);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeSubTab === 'absen'
                ? 'bg-emerald-900 text-amber-200 shadow'
                : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Absensi Kehadiran ({absen.length})</span>
          </button>
        </div>

        {/* Excel Import/Export & Template Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            title="Download Template Format Excel (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            title="Import Data dari File Excel (CSV)"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Export Tab Aktif ke File Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportAllWorkbook}
            className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Export Seluruh Jadwal & Absensi ke 1 File Excel (Multi-Sheet)"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Buku Lengkap (.xlsx)</span>
          </button>

          <div className="relative w-full sm:w-48">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-600">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setJadwalPage(1);
                setAbsenPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl text-emerald-950 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      {activeSubTab === 'jadwal' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-serif font-bold text-amber-200 text-base">JADWAL KEGIATAN WAJIB KHOTMIL QUR'AN</h3>
              <p className="text-xs text-emerald-200">Daftar tuan rumah, hari/tanggal, alamat, no hp, infaq, serta fitur edit & hapus</p>
            </div>
            <div className="bg-emerald-800/80 px-3 py-1.5 rounded-xl border border-emerald-700 text-xs font-mono font-bold text-amber-200">
              Total Infaq: Rp {totalInfaq.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-12">NO</th>
                  <th className="p-3">HARI / TANGGAL</th>
                  <th className="p-3 text-center">PERIODE</th>
                  <th className="p-3">TUAN RUMAH</th>
                  <th className="p-3">ALAMAT</th>
                  <th className="p-3">NO. HANDPHONE</th>
                  <th className="p-3 text-right">INFAQ (RP.)</th>
                  <th className="p-3 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {filteredJadwal.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-emerald-600">
                      Tidak ada data jadwal khotmil Qur'an yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedJadwal.map((item, index) => (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-emerald-700">{(jadwalPage - 1) * jadwalPageSize + index + 1}</td>
                      <td className="p-3 font-semibold text-emerald-950">{item.hariTanggal}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {item.tahun || '2026'}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-900 font-bold">{item.tuanRumah}</td>
                      <td className="p-3 text-emerald-700">{item.alamat}</td>
                      <td className="p-3 font-mono text-emerald-800">{item.noHandphone}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-900">Rp {item.infaq.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedUndangan(item)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition inline-block"
                          title="Cetak Lembar Jadwal Pelaksanaan (Tanpa Nominal Infaq)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditJadwalModal(item)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg transition inline-block"
                          title="Edit Jadwal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJadwal(item.id, item.tuanRumah)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition inline-block"
                          title="Hapus Jadwal"
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

          {/* Jadwal Pagination */}
          <Pagination
            currentPage={jadwalPage}
            totalItems={filteredJadwal.length}
            pageSize={jadwalPageSize}
            onPageChange={setJadwalPage}
            onPageSizeChange={setJadwalPageSize}
            itemLabel="jadwal"
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white">
            <h3 className="font-serif font-bold text-amber-200 text-base">ABSENSI KEHADIRAN KHOTMIL QUR'AN</h3>
            <p className="text-xs text-emerald-200">Daftar NIS, nama, alamat, juz Al-Qur'an, dan keterangan kehadiran</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-12">NO</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">NAMA PESERTA</th>
                  <th className="p-3">ALAMAT</th>
                  <th className="p-3">JUZ AL-QUR'AN</th>
                  <th className="p-3">KETERANGAN</th>
                  <th className="p-3 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {filteredAbsen.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-emerald-600">
                      Tidak ada data absensi peserta yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedAbsen.map((item, index) => (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-emerald-700">{(absenPage - 1) * absenPageSize + index + 1}</td>
                      <td className="p-3 font-mono font-bold text-emerald-950">{item.nis}</td>
                      <td className="p-3 font-semibold text-emerald-900">{item.nama}</td>
                      <td className="p-3 text-emerald-700">{item.alamat}</td>
                      <td className="p-3 font-semibold text-amber-800">{item.juzAlQuran}</td>
                      <td className="p-3 text-emerald-800 font-medium">{item.keterangan}</td>
                      <td className="p-3 text-center space-x-1">
                        <button
                          onClick={() => openEditAbsenModal(item)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg transition inline-block"
                          title="Edit Peserta Absen"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAbsen(item.id, item.nama)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition inline-block"
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

          {/* Absen Pagination */}
          <Pagination
            currentPage={absenPage}
            totalItems={filteredAbsen.length}
            pageSize={absenPageSize}
            onPageChange={setAbsenPage}
            onPageSizeChange={setAbsenPageSize}
            itemLabel="peserta"
          />
        </div>
      )}

      {/* --- FORM INPUT MODAL JADWAL --- */}
      {showJadwalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-emerald-100 pb-3 mb-4">
              <h3 className="font-serif font-bold text-emerald-950 text-base">
                {editingJadwalId ? 'EDIT JADWAL KHOTMIL QUR\'AN' : 'FORM TAMBAH JADWAL KHOTMIL QUR\'AN'}
              </h3>
              <button onClick={() => setShowJadwalModal(false)} className="text-emerald-700 font-bold text-lg hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-3 text-xs">
              <div className="space-y-2.5 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/70">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">Pilih Tanggal Masehi</label>
                  <input
                    type="date"
                    value={selDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Hari</label>
                    <select
                      value={selDay}
                      onChange={e => handleDayChange(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-700 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Pilih Hari --</option>
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Sabtu">Sabtu</option>
                      <option value="Minggu">Minggu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Periode Tahun</label>
                    <select
                      value={formTahun}
                      onChange={e => setFormTahun(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-700 focus:outline-none cursor-pointer font-semibold text-emerald-950"
                    >
                      <option value="2026">2026 / 1448 H</option>
                      <option value="2025">2025 / 1447 H</option>
                      <option value="2024">2024 / 1446 H</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">Tambahan Keterangan Hijriah (Opsional)</label>
                  <input
                    type="text"
                    value={selHijri}
                    onChange={e => handleHijriChange(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Contoh: 15 Syawal 1448 H"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Hasil Gabungan Hari / Tanggal (Otomatis)</label>
                  <input
                    type="text"
                    required
                    value={jadwalHariTanggal}
                    onChange={e => setJadwalHariTanggal(e.target.value)}
                    className="w-full p-2.5 text-xs bg-emerald-100/50 border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                    placeholder="Contoh: Sabtu, 10 Syawal 1447 H"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Nama Tuan Rumah *</label>
                <input
                  type="text"
                  required
                  value={jadwalTuanRumah}
                  onChange={e => setJadwalTuanRumah(e.target.value)}
                  placeholder="Contoh: Maz Syaiful"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Alamat Dusun / Desa</label>
                <input
                  type="text"
                  value={jadwalAlamat}
                  onChange={e => setJadwalAlamat(e.target.value)}
                  placeholder="Contoh: Tarebung Gayam Sumenep"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">No. Handphone / WhatsApp</label>
                <input
                  type="text"
                  value={jadwalNoHp}
                  onChange={e => setJadwalNoHp(e.target.value)}
                  placeholder="Contoh: 081231376394"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Infaq (Rp.)</label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={jadwalInfaq}
                  onChange={e => setJadwalInfaq(e.target.value)}
                  placeholder="500000"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowJadwalModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-white rounded-xl font-semibold hover:bg-emerald-800 transition shadow"
                >
                  {editingJadwalId ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM INPUT MODAL ABSENSI --- */}
      {showAbsenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-emerald-100 pb-3 mb-4">
              <h3 className="font-serif font-bold text-emerald-950 text-base">
                {editingAbsenId ? 'EDIT DATA ABSENSI PESERTA' : 'FORM TAMBAH ABSENSI PESERTA'}
              </h3>
              <button onClick={() => setShowAbsenModal(false)} className="text-emerald-700 font-bold text-lg hover:text-red-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAbsen} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">NIS Peserta *</label>
                <input
                  type="text"
                  required
                  value={absenNis}
                  onChange={e => setAbsenNis(e.target.value)}
                  placeholder="Contoh: 20260101"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Nama Lengkap Peserta *</label>
                <input
                  type="text"
                  required
                  value={absenNama}
                  onChange={e => setAbsenNama(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Alamat Dusun / Desa</label>
                <input
                  type="text"
                  value={absenAlamat}
                  onChange={e => setAbsenAlamat(e.target.value)}
                  placeholder="Contoh: Gayam Sapudi"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Juz Al-Qur'an Yang Dibaca</label>
                <input
                  type="text"
                  value={absenJuz}
                  onChange={e => setAbsenJuz(e.target.value)}
                  placeholder="Contoh: Juz 1 & 2 / Juz 30"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Keterangan Kehadiran</label>
                <input
                  type="text"
                  value={absenKet}
                  onChange={e => setAbsenKet(e.target.value)}
                  placeholder="Contoh: Hadir / Alpa, Izin, Sakit"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowAbsenModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-white rounded-xl font-semibold hover:bg-emerald-800 transition shadow"
                >
                  {editingAbsenId ? 'Simpan Perubahan' : 'Tambah Peserta'}
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
                    Pengaturan Penandatangan Dokumen
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Atur nama dan jabatan penandatangan yang tampil pada seluruh cetakan dokumen
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
                onNotify('Pengaturan Disimpan', 'Nama dan jabatan penandatangan dokumen berhasil diperbarui.');
              }}
              className="space-y-4 text-xs text-emerald-950"
            >
              {/* Penandatangan 1 */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <span>✍️ Penandatangan 1 (Sisi Kiri)</span>
                </p>
                <div>
                  <label className="block text-[11px] text-emerald-800 font-medium mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={sign1Title}
                    onChange={(e) => setSign1Title(e.target.value)}
                    placeholder="Contoh: Koordinator Khotmil Qur'an"
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-800 font-medium mb-1">
                    Nama Lengkap (Serta Gelar)
                  </label>
                  <input
                    type="text"
                    value={sign1Name}
                    onChange={(e) => setSign1Name(e.target.value)}
                    placeholder="Contoh: SYAIFUL ISLAM"
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Penandatangan 2 */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <p className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <span>✍️ Penandatangan 2 (Sisi Kanan)</span>
                </p>
                <div>
                  <label className="block text-[11px] text-amber-900 font-medium mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={sign2Title}
                    onChange={(e) => setSign2Title(e.target.value)}
                    placeholder="Contoh: Ketua FOKUS Pulau Sapudi"
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-900 font-medium mb-1">
                    Nama Lengkap (Serta Gelar)
                  </label>
                  <input
                    type="text"
                    value={sign2Name}
                    onChange={(e) => setSign2Name(e.target.value)}
                    placeholder="Contoh: Maz Syaiful"
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

      {/* Print Jadwal Modal */}
      {showPrintJadwal && (
        <PrintModal 
          title="Jadwal Resmi Kegiatan Wajib Khotmil Qur'an" 
          onClose={() => setShowPrintJadwal(false)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white rounded-full border border-amber-400 overflow-hidden shadow-xs">
                <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Logo Fokus" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-serif font-bold text-emerald-950">MANAJEMEN FOKUS SAPUDI</h2>
                <p className="text-xs font-bold text-emerald-800">JADWAL KEGIATAN WAJIB KHOTMIL QUR'AN</p>
              </div>
            </div>
            <p className="text-xs text-emerald-700">Tahun Anggaran / Periode Ramadhan 1448 H</p>

            <div className="border-t border-b border-emerald-200 py-4 my-4 text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 text-emerald-900">
                    <th className="pb-2 text-center">No</th>
                    <th className="pb-2">Hari / Tanggal</th>
                    <th className="pb-2">Tuan Rumah</th>
                    <th className="pb-2">Alamat</th>
                    <th className="pb-2">No. HP</th>
                    <th className="pb-2 text-right">Infaq (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredJadwal.map((j, i) => (
                    <tr key={j.id}>
                      <td className="py-2 text-center">{i + 1}</td>
                      <td className="py-2 font-semibold">{j.hariTanggal}</td>
                      <td className="py-2 font-bold text-emerald-950">{j.tuanRumah}</td>
                      <td className="py-2">{j.alamat}</td>
                      <td className="py-2 font-mono">{j.noHandphone}</td>
                      <td className="py-2 text-right font-mono">Rp {j.infaq.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-emerald-300 font-bold bg-emerald-50/50">
                    <td colSpan={5} className="py-2.5 text-right uppercase">Total Infaq Terkumpul:</td>
                    <td className="py-2.5 text-right font-mono">Rp {totalInfaq.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-6 text-xs text-emerald-900 font-sans">
              <div className="text-center space-y-12 min-w-32">
                <p className="font-semibold text-emerald-900">{sign1Title}</p>
                <p className="font-bold underline text-emerald-950 uppercase">({sign1Name})</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-amber-500 overflow-hidden shadow-xs mx-auto mb-0.5 bg-white">
                  <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Stempel Fokus" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
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

      {/* Print Absen Modal */}
      {showPrintAbsen && (
        <PrintModal 
          title="Lembar Absensi Kehadiran Khotmil Qur'an" 
          onClose={() => setShowPrintAbsen(false)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white rounded-full border border-amber-400 overflow-hidden shadow-xs">
                <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Logo Fokus" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-serif font-bold text-emerald-950">MANAJEMEN FOKUS SAPUDI</h2>
                <p className="text-xs font-bold text-emerald-800">LEMBAR ABSENSI KEHADIRAN KHOTMIL QUR'AN</p>
              </div>
            </div>
            <p className="text-xs text-emerald-700">Daftar Peserta Mutqin & Juz Al-Qur'an</p>

            <div className="border-t border-b border-emerald-200 py-4 my-4 text-left">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 text-emerald-900">
                    <th className="pb-2 text-center">No</th>
                    <th className="pb-2">NIS</th>
                    <th className="pb-2">Nama Peserta</th>
                    <th className="pb-2">Alamat</th>
                    <th className="pb-2">Juz Al-Qur'an</th>
                    <th className="pb-2">Paraf / Ket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredAbsen.map((a, i) => (
                    <tr key={a.id}>
                      <td className="py-2 text-center">{i + 1}</td>
                      <td className="py-2 font-mono">{a.nis}</td>
                      <td className="py-2 font-semibold">{a.nama}</td>
                      <td className="py-2">{a.alamat}</td>
                      <td className="py-2 text-amber-800 font-bold">{a.juzAlQuran}</td>
                      <td className="py-2">{a.keterangan || '.................'}</td>
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
                <div className="w-12 h-12 rounded-full border border-amber-500 overflow-hidden shadow-xs mx-auto mb-0.5 bg-white">
                  <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Stempel Fokus" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
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

      {/* Print Single Lembar Jadwal Pelaksanaan (Tanpa Nominal Infaq) */}
      {selectedUndangan && (
        <PrintModal
          title={`Lembar Jadwal Pelaksanaan - ${selectedUndangan.tuanRumah}`}
          onClose={() => setSelectedUndangan(null)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="p-6 bg-white text-emerald-950 font-serif border border-emerald-200 rounded-2xl shadow-sm space-y-5 text-xs max-w-2xl mx-auto">
            {/* Kop Surat Header */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-900">
              <div className="w-16 h-16 bg-white rounded-full border-2 border-amber-400 overflow-hidden shrink-0 shadow-xs">
                <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 text-center pr-10">
                <h2 className="text-base font-bold text-emerald-950 uppercase tracking-wide">
                  {orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI (FOKUS)'}
                </h2>
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mt-0.5">
                  LEMBAR RESMI KEGIATAN KHOTMIL QUR'AN
                </h3>
                <p className="text-[10px] font-sans text-emerald-800 mt-1">
                  Sekretariat: {orgProfile?.alamatSekretariat || 'Jl. Sawah Seribu No. 01 Ds. Tarebung, Kec. Gayam Kab. Sumenep, Jawa Timur'} | Telp/WA: {selectedUndangan.noHandphone !== '-' ? selectedUndangan.noHandphone : (orgProfile?.noTelepon || '0812-3137-6394')}
                </p>
              </div>
            </div>

            {/* Judul Lembar Jadwal */}
            <div className="text-center space-y-1 font-sans pt-1">
              <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider underline">
                LEMBAR JADWAL PELAKSANAAN KHOTMIL QUR'AN WAJIB
              </h3>
              <p className="text-[11px] font-mono text-emerald-800">
                No. Dokumen: 045/JDW/FOKUS-SPD/IV/2026
              </p>
            </div>

            {/* Informasi Tuan Rumah & Lokasi */}
            <div className="font-sans text-xs space-y-1 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <p className="text-emerald-800 text-[11px] font-semibold uppercase tracking-wider">Penerima / Lokasi Tuan Rumah:</p>
              <p className="font-bold text-sm text-emerald-950">Bapak / Ibu / Sdr. <span className="uppercase">{selectedUndangan.tuanRumah}</span></p>
              <p className="text-emerald-800">Wilayah: <span className="font-semibold">{selectedUndangan.alamat}</span></p>
            </div>

            {/* Rincian Jadwal Pelaksanaan (TANPA NOMINAL INFAQ) */}
            <div className="my-3 p-4 bg-amber-50/60 border-l-4 border-amber-500 rounded-r-xl font-sans text-xs space-y-2.5">
              <h4 className="font-bold text-emerald-900 border-b border-amber-200 pb-1 uppercase tracking-wider text-[11px]">
                RINCIAN PELAKSANAAN KEGIATAN
              </h4>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Hari / Tanggal</span>
                <span className="col-span-8 font-semibold text-emerald-950">: {selectedUndangan.hariTanggal}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Tuan Rumah / Tempat</span>
                <span className="col-span-8 font-bold text-emerald-950">: {selectedUndangan.tuanRumah}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Alamat Lokasi</span>
                <span className="col-span-8 text-emerald-900">: {selectedUndangan.alamat}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-bold text-emerald-900">Kontak Person / HP</span>
                <span className="col-span-8 font-mono text-emerald-900">: {selectedUndangan.noHandphone}</span>
              </div>
            </div>

            {/* Catatan Ketentuan Pelaksanaan */}
            <div className="space-y-2 leading-relaxed font-sans text-xs bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-950 text-[11px]">PETUNJUK & KETENTUAN PELAKSANAAN:</p>
              <ul className="list-disc list-inside space-y-1 text-emerald-900 text-[11px]">
                <li>Kegiatan Khotmil Qur'an dimulai tepat waktu sesuai dengan jadwal di atas.</li>
                <li>Seluruh santri dan jamaah pembaca diharapkan hadir sebelum acara dimulai dengan membawa Mushaf Al-Qur'an.</li>
                <li>Menjaga ketertiban, kekhusyukan, serta kebersihan lingkungan lokasi rumah shohibul bait.</li>
              </ul>
            </div>

            {/* Tanda Tangan & Pengesahan */}
            <div className="flex justify-between items-center pt-6 font-sans text-xs border-t border-emerald-100">
              <div className="text-center space-y-12 min-w-32">
                <p className="font-semibold text-emerald-900">{sign1Title}</p>
                <p className="font-bold underline text-emerald-950 uppercase">({sign1Name})</p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-full border-2 border-amber-500 overflow-hidden shadow-xs mx-auto mb-1 bg-white">
                  <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Stempel Fokus" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
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

    </div>
  );
};

