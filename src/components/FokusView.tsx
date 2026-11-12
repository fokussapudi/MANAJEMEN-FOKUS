import React, { useState, useRef } from 'react';
import { ExpedisiRow, AgendaItem, OrganizationProfile } from '../types';
import { initialFokusStats, initialExpedisiRows, initialAgendaList } from '../data/initialData';
import {
  FileText, Plus, Search, Upload, Trash2, Calendar, FileSpreadsheet, Download, Printer, Edit3,
  CheckCircle2, XCircle, CheckSquare, Square, Filter, Clock, Sparkles
} from 'lucide-react';
import { PrintModal } from './PrintModal';
import { Pagination } from './Pagination';
import { downloadCsvTemplate, exportToExcel, parseExcelFile } from '../utils/excelUtils';
import { matchesYear, formatGregorianIndo } from '../utils/filterUtils';

interface FokusViewProps {
  expedisi?: ExpedisiRow[];
  setExpedisi?: React.Dispatch<React.SetStateAction<ExpedisiRow[]>>;
  agendaList?: AgendaItem[];
  setAgendaList?: React.Dispatch<React.SetStateAction<AgendaItem[]>>;
  onNotify: (title: string, message: string) => void;
  selectedYear?: string;
  orgProfile?: OrganizationProfile;
  logoUrl?: string;
}

export const FokusView: React.FC<FokusViewProps> = ({ 
  expedisi: propExpedisi, 
  setExpedisi: propSetExpedisi, 
  agendaList: propAgendaList, 
  setAgendaList: propSetAgendaList, 
  onNotify,
  selectedYear = 'Semua',
  orgProfile,
  logoUrl
}) => {
  const [stats, setStats] = useState(initialFokusStats);
  const [localExpedisi, setLocalExpedisi] = useState<ExpedisiRow[]>(initialExpedisiRows);
  const expedisi = propExpedisi || localExpedisi;
  const setExpedisi = propSetExpedisi || setLocalExpedisi;
  const [activeTab, setActiveTab] = useState<'rapat_pra_lokal' | 'rapat_pra_sahmasy' | 'opening_safari' | 'rapat_pasca_lokal' | 'rapat_pasca_sahmasy'>('rapat_pra_lokal');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrint, setShowPrint] = useState(false);

  // Agenda List State (40 items total)
  const [localAgendaList, setLocalAgendaList] = useState<AgendaItem[]>(initialAgendaList);
  const agendaList = propAgendaList || localAgendaList;
  const setAgendaList = propSetAgendaList || setLocalAgendaList;
  const [agendaFilterStatus, setAgendaFilterStatus] = useState<'semua' | 'terlaksana' | 'belum'>('semua');
  const [agendaFilterKategori, setAgendaFilterKategori] = useState<string>('semua');
  const [agendaSearch, setAgendaSearch] = useState('');
  const [showAgendaPrint, setShowAgendaPrint] = useState(false);

  // Agenda Modal State
  const [showAddAgendaModal, setShowAddAgendaModal] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
  const [agendaKategori, setAgendaKategori] = useState('Panitia Lokal');
  const [agendaNama, setAgendaNama] = useState('');
  const [agendaTanggal, setAgendaTanggal] = useState('');
  const [agendaPj, setAgendaPj] = useState('');
  const [agendaTerlaksana, setAgendaTerlaksana] = useState(false);
  const [agendaKet, setAgendaKet] = useState('');

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
    setAgendaTanggal(combined);
  };

  const handleDayChange = (dayVal: string) => {
    setSelDay(dayVal);
    let datePart = '';
    if (selDate) {
      const { dateFormatted } = formatGregorianIndo(selDate);
      datePart = dateFormatted;
    }
    const combined = `${dayVal ? `${dayVal}, ` : ''}${datePart}${selHijri ? ` / ${selHijri}` : ''}`;
    setAgendaTanggal(combined);
  };

  const handleHijriChange = (hijriVal: string) => {
    setSelHijri(hijriVal);
    let datePart = '';
    if (selDate) {
      const { dateFormatted } = formatGregorianIndo(selDate);
      datePart = dateFormatted;
    }
    const combined = `${selDay ? `${selDay}, ` : ''}${datePart}${hijriVal ? ` / ${hijriVal}` : ''}`;
    setAgendaTanggal(combined);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expedisi Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpedisiRow | null>(null);
  const [newName, setNewName] = useState('');
  const [newInstansi, setNewInstansi] = useState('');
  const [newAlamat, setNewAlamat] = useState('');
  const [newHp, setNewHp] = useState('');
  const [newKet, setNewKet] = useState('');
  const [newBerkas, setNewBerkas] = useState('');

  // Computed agenda totals
  const totalAgendaCount = agendaList.length;
  const totalTerlaksanaCount = agendaList.filter(a => a.terlaksana).length;
  const totalBelumTerlaksanaCount = agendaList.filter(a => !a.terlaksana).length;

  const categories = [
    'Panitia Lokal',
    'Aktivis Putra',
    'Aktivis Putri',
    'Rapat Pengurus Fokus',
    'Rapat Putra & Putri',
    'Rapat Fokus & Sahmasy',
    'Fokus & Panitia Lokal',
    'Rapat Lain-Lain'
  ];

  // Helper function to get counts per category
  const getCatCounts = (catName: string) => {
    const items = agendaList.filter(a => a.kategori === catName);
    const done = items.filter(a => a.terlaksana).length;
    return { total: items.length, done, pending: items.length - done };
  };

  // Toggle Terlaksana Checkbox
  const handleToggleTerlaksana = (id: string) => {
    const itemToToggle = agendaList.find(a => a.id === id);
    if (itemToToggle) {
      const nextState = !itemToToggle.terlaksana;
      setAgendaList(prev => prev.map(item => item.id === id ? { ...item, terlaksana: nextState } : item));
      onNotify(
        nextState ? 'Status Agenda Terlaksana (✔)' : 'Status Agenda Belum Terlaksana (☐)',
        `Agenda "${itemToToggle.namaKegiatan}" ditandai sebagai ${nextState ? 'TERLAKSANA' : 'BELUM TERLAKSANA'}.`
      );
    }
  };

  // Handle Agenda Submit
  const handleOpenAddAgenda = () => {
    setEditingAgenda(null);
    setAgendaKategori('Panitia Lokal');
    setAgendaNama('');
    setAgendaTanggal('');
    setAgendaPj('');
    setAgendaTerlaksana(false);
    setAgendaKet('');
    setFormTahun(selectedYear !== 'Semua' ? selectedYear : '2026');
    setSelDay('');
    setSelDate('');
    setSelHijri('');
    setShowAddAgendaModal(true);
  };

  const handleOpenEditAgenda = (item: AgendaItem) => {
    setEditingAgenda(item);
    setAgendaKategori(item.kategori);
    setAgendaNama(item.namaKegiatan);
    setAgendaTanggal(item.tanggalPelaksanaan);
    setAgendaPj(item.penanggungJawab);
    setAgendaTerlaksana(item.terlaksana);
    setAgendaKet(item.keterangan);
    setFormTahun(item.tahun || '2026');
    
    const parsed = parseHariTanggal(item.tanggalPelaksanaan);
    setSelDay(parsed.parsedDay);
    setSelHijri(parsed.parsedHijri);
    setSelDate('');
    setShowAddAgendaModal(true);
  };

  const handleSubmitAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgenda) {
      setAgendaList(agendaList.map(a => a.id === editingAgenda.id ? {
        ...a,
        kategori: agendaKategori,
        namaKegiatan: agendaNama,
        tanggalPelaksanaan: agendaTanggal,
        penanggungJawab: agendaPj,
        terlaksana: agendaTerlaksana,
        keterangan: agendaKet,
        tahun: formTahun
      } : a));
      setShowAddAgendaModal(false);
      onNotify('Agenda Diperbarui', `Rencana kegiatan "${agendaNama}" berhasil diperbarui.`);
    } else {
      const newItem: AgendaItem = {
        id: 'ag-' + Date.now(),
        no: agendaList.length + 1,
        kategori: agendaKategori,
        namaKegiatan: agendaNama,
        tanggalPelaksanaan: agendaTanggal || 'Terjadwal',
        penanggungJawab: agendaPj || 'Pengurus Fokus',
        terlaksana: agendaTerlaksana,
        keterangan: agendaKet || 'Direncana',
        tahun: formTahun
      };
      setAgendaList([...agendaList, newItem]);
      setShowAddAgendaModal(false);
      onNotify('Agenda Ditambahkan', `Rencana kegiatan "${agendaNama}" berhasil ditambahkan ke total agenda.`);
    }
  };

  const handleDeleteAgenda = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) {
      setAgendaList(agendaList.filter(a => a.id !== id));
      onNotify('Agenda Dihapus', 'Rencana kegiatan berhasil dihapus dari daftar.');
    }
  };

  // Filtered Agendas
  const [agendaPage, setAgendaPage] = useState(1);
  const [agendaPageSize, setAgendaPageSize] = useState(10);

  const filteredAgendas = agendaList.filter(item => {
    const matchesStatus =
      agendaFilterStatus === 'semua' ? true :
      agendaFilterStatus === 'terlaksana' ? item.terlaksana : !item.terlaksana;

    const matchesCategory =
      agendaFilterKategori === 'semua' ? true : item.kategori === agendaFilterKategori;

    const matchesSearch =
      item.namaKegiatan.toLowerCase().includes(agendaSearch.toLowerCase()) ||
      item.penanggungJawab.toLowerCase().includes(agendaSearch.toLowerCase()) ||
      item.kategori.toLowerCase().includes(agendaSearch.toLowerCase()) ||
      item.keterangan.toLowerCase().includes(agendaSearch.toLowerCase());

    const matchesYearFilter = matchesYear(item, selectedYear);

    return matchesStatus && matchesCategory && matchesSearch && matchesYearFilter;
  });

  const paginatedAgendas = filteredAgendas.slice((agendaPage - 1) * agendaPageSize, agendaPage * agendaPageSize);

  // Expedisi Filter
  const [expedisiPage, setExpedisiPage] = useState(1);
  const [expedisiPageSize, setExpedisiPageSize] = useState(10);

  const filteredExpedisi = expedisi.filter(item =>
    item.kategoriExpedisi === activeTab &&
    matchesYear(item, selectedYear) &&
    (item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.instansiJabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.alamat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedExpedisi = filteredExpedisi.slice((expedisiPage - 1) * expedisiPageSize, expedisiPage * expedisiPageSize);

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

  const handleSubmitExpedisi = (e: React.FormEvent) => {
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
      onNotify('Expedisi Diperbarui', `Data expedisi ${newName} berhasil diperbarui.`);
    } else {
      const newItem: ExpedisiRow = {
        id: 'exp-' + Date.now(),
        kategoriExpedisi: activeTab,
        no: expedisi.filter(e => e.kategoriExpedisi === activeTab).length + 1,
        nama: newName,
        instansiJabatan: newInstansi,
        alamat: newAlamat,
        noHandphone: newHp,
        keterangan: newKet,
        berkasUrl: newBerkas || 'berkas_upload_' + Date.now() + '.pdf',
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
      onNotify('Expedisi Ditambahkan', `Data expedisi untuk ${activeTab} berhasil ditambahkan.`);
    }
  };

  const handleDeleteExpedisi = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data expedisi ini?')) {
      setExpedisi(expedisi.filter(item => item.id !== id));
      onNotify('Data Dihapus', 'Data expedisi berhasil dihapus dari sistem.');
    }
  };

  // Excel handlers
  const handleDownloadTemplate = () => {
    const headers = ['NO', 'NAMA', 'INSTANSI / JABATAN', 'ALAMAT', 'NO HANDPHONE', 'KETERANGAN'];
    downloadCsvTemplate(`Fokus_Expedisi_${activeTab}`, headers, sample);
    onNotify('Template Didownload', 'Template Excel expedisi berhasil diunduh.');
  };

  const handleExportExcel = () => {
    const headers = ['NO', 'NAMA PENERIMA / INSTANSI', 'JABATAN', 'ALAMAT LENGKAP', 'NO HANDPHONE / WA', 'KETERANGAN STATUS'];
    const rows = filteredExpedisi.map((item, idx) => [
      idx + 1,
      item.nama,
      item.instansiJabatan,
      item.alamat,
      item.noHandphone,
      item.keterangan
    ]);
    exportToExcel(
      `Expedisi_${activeTab}`,
      headers,
      rows,
      {
        title: `ORGANISASI FOKUS SAPUDI - EXPEDISI SURAT (${activeTab.toUpperCase()})`,
        subtitle: 'Daftar Penerima Surat Dinas & Ekspedisi Pengurus FOKUS',
        sheetName: `Expedisi ${activeTab}`
      }
    );
    onNotify('Export Excel Berhasil', 'Data expedisi berhasil diexport ke Excel (.xlsx).');
  };

  const handleExportAgendaExcel = () => {
    const headers = ['NO', 'KATEGORI PROGRAM', 'NAMA RENCANA KEGIATAN', 'TANGGAL ESTIMASI', 'PENANGGUNG JAWAB', 'STATUS KETERCAPAIAN', 'KETERANGAN'];
    const rows = filteredAgendas.map((item, idx) => [
      idx + 1,
      item.kategori,
      item.namaKegiatan,
      item.tanggalPelaksanaan,
      item.penanggungJawab,
      item.terlaksana ? 'TERLAKSANA' : 'BELUM TERLAKSANA',
      item.keterangan
    ]);
    exportToExcel(
      `Rencana_Kegiatan_Fokus_40_Agenda`,
      headers,
      rows,
      {
        title: 'ORGANISASI FOKUS SAPUDI - MASTER 40 AGENDA KERJA & RENCANA KEGIATAN',
        subtitle: 'Matriks Rencana Program Kerja, Jadwal Pelaksanaan & Penanggung Jawab Bidang',
        sheetName: '40 Agenda Kerja'
      }
    );
    onNotify('Export Excel Agenda Berhasil', 'Data 40 Agenda Rencana Kegiatan berhasil diexport ke Excel (.xlsx).');
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
              id: 'imp-exp-' + Date.now() + '-' + idx,
              kategoriExpedisi: activeTab,
              no: expedisi.length + idx + 1,
              nama: cols[offset] || 'Undangan',
              instansiJabatan: cols[offset + 1] || 'Instansi',
              alamat: cols[offset + 2] || 'Sapudi',
              noHandphone: cols[offset + 3] || '-',
              keterangan: cols[offset + 4] || 'Hadir',
              berkasUrl: 'berkas_import.pdf'
            });
          }
        });
        setExpedisi([...newItems, ...expedisi]);
        onNotify('Import Berhasil', `${newItems.length} data expedisi berhasil di-import dari Excel.`);
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
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Modul A
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            FOKUS: Administrasi & Rencana Kegiatan
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Rekapitulasi surat masuk/keluar, frekuensi rapat, centang checklist status 40 agenda kegiatan, serta expedisi terpadu.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleOpenAddAgenda}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 text-emerald-950" />
            <span>Tambah Agenda Rencana</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambah Expedisi</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Download Template Format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Import Data Excel"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            title="Export Data Expedisi ke Excel"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export Expedisi</span>
          </button>

          <button
            onClick={() => setShowPrint(true)}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Surat Masuk</p>
          <p className="text-xl font-bold text-emerald-950 mt-1">{stats.suratMasuk} <span className="text-xs font-normal text-emerald-700">Berks</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Surat Keluar</p>
          <p className="text-xl font-bold text-emerald-950 mt-1">{stats.suratKeluar} <span className="text-xs font-normal text-emerald-700">Berks</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Surat</p>
          <p className="text-xl font-bold text-teal-800 mt-1">{stats.jumlahTotal} <span className="text-xs font-normal text-emerald-700">Arsip</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Frekuensi Rapat</p>
          <p className="text-xl font-bold text-emerald-900 mt-1">{stats.frekuensiRapat} <span className="text-xs font-normal text-emerald-700">Kali</span></p>
        </div>
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm border border-emerald-800">
          <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Terlaksana (✔)</p>
          <p className="text-2xl font-bold text-amber-200 mt-1">{totalTerlaksanaCount} <span className="text-xs font-normal text-emerald-200">Agenda</span></p>
        </div>
        <div className="bg-amber-500 text-emerald-950 p-4 rounded-2xl shadow-sm border border-amber-600">
          <p className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider">Belum Terlaksana (☐)</p>
          <p className="text-2xl font-bold text-emerald-950 mt-1">{totalBelumTerlaksanaCount} <span className="text-xs font-normal text-emerald-900">Agenda</span></p>
        </div>
      </div>

      {/* Rencana Kegiatan Summary Box (Breakdown per Category) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
          <div>
            <h3 className="text-sm md:text-base font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2 font-serif">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <span>Rencana Kegiatan & Rapat Pengurus Fokus (Total: {totalAgendaCount} Agenda)</span>
            </h3>
            <p className="text-xs text-emerald-600 mt-1">
              Gunakan centang pada tabel di bawah untuk memperbarui status pelaksanaan kegiatan secara langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Jumlah Terlaksana: {totalTerlaksanaCount}</span>
            </span>
            <span className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Jumlah Belum Terlaksana: {totalBelumTerlaksanaCount}</span>
            </span>
            <button
              onClick={() => setShowAgendaPrint(true)}
              className="px-3 py-1.5 bg-emerald-900 text-amber-300 hover:bg-emerald-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak 40 Agenda</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {categories.map((cat, idx) => {
            const counts = getCatCounts(cat);
            const isAllDone = counts.done === counts.total && counts.total > 0;
            return (
              <div
                key={idx}
                onClick={() => setAgendaFilterKategori(agendaFilterKategori === cat ? 'semua' : cat)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  agendaFilterKategori === cat
                    ? 'bg-emerald-900 text-white border-emerald-800 shadow-md ring-2 ring-amber-400'
                    : isAllDone
                    ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
                    : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`font-bold text-xs truncate ${agendaFilterKategori === cat ? 'text-amber-300' : 'text-emerald-950'}`}>{cat}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    agendaFilterKategori === cat ? 'bg-emerald-800 text-amber-200' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {counts.total} Agenda
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className={agendaFilterKategori === cat ? 'text-emerald-200' : 'text-emerald-800'}>
                    ✔ Terlaksana: <strong className={agendaFilterKategori === cat ? 'text-white' : 'text-emerald-950'}>{counts.done}</strong>
                  </span>
                  <span className={agendaFilterKategori === cat ? 'text-amber-300' : 'text-amber-800 font-semibold'}>
                    ☐ Belum: <strong className={agendaFilterKategori === cat ? 'text-amber-200' : 'text-amber-950'}>{counts.pending}</strong>
                  </span>
                </div>
                <div className="w-full bg-gray-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: counts.total > 0 ? `${(counts.done / counts.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive 40 Agenda Rencana Activities Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif font-bold text-amber-300 text-base md:text-lg uppercase">
                DAFTAR RENCANA KEGIATAN & RAPAT PENGURUS FOKUS (TOTAL: {totalAgendaCount} AGENDA)
              </h3>
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              Klik tombol centang di kolom pertama untuk menandai kegiatan <strong>Terlaksana</strong> (✔) atau <strong>Belum Terlaksana</strong> (☐).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportAgendaExcel}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-amber-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Agenda Excel</span>
            </button>
            <button
              onClick={handleOpenAddAgenda}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda Baru</span>
            </button>
          </div>
        </div>

        {/* Table Filters Toolbar */}
        <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 items-center">
            <button
              onClick={() => { setAgendaFilterStatus('semua'); setAgendaPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                agendaFilterStatus === 'semua'
                  ? 'bg-emerald-900 text-amber-300 shadow-sm'
                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Semua Agenda ({totalAgendaCount})
            </button>
            <button
              onClick={() => { setAgendaFilterStatus('terlaksana'); setAgendaPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                agendaFilterStatus === 'terlaksana'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terlaksana (✔ {totalTerlaksanaCount})</span>
            </button>
            <button
              onClick={() => { setAgendaFilterStatus('belum'); setAgendaPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                agendaFilterStatus === 'belum'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Belum Terlaksana (☐ {totalBelumTerlaksanaCount})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={agendaFilterKategori}
              onChange={e => {
                setAgendaFilterKategori(e.target.value);
                setAgendaPage(1);
              }}
              className="p-1.5 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="semua">-- Semua Kategori --</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <div className="relative flex-1 md:w-48">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-emerald-600">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari agenda..."
                value={agendaSearch}
                onChange={e => {
                  setAgendaSearch(e.target.value);
                  setAgendaPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-xl text-emerald-950 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Agenda Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-100/80 text-emerald-950 font-bold border-b border-emerald-200">
                <th className="p-3 text-center w-28">CENTANG STATUS</th>
                <th className="p-3 text-center w-12">NO</th>
                <th className="p-3">KATEGORI AGENDA</th>
                <th className="p-3">NAMA RENCANA KEGIATAN</th>
                <th className="p-3">TANGGAL PELAKSANAAN</th>
                <th className="p-3">PENANGGUNG JAWAB</th>
                <th className="p-3 text-center">STATUS</th>
                <th className="p-3">KETERANGAN</th>
                <th className="p-3 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-emerald-900">
              {filteredAgendas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-emerald-600">
                    Tidak ada agenda kegiatan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedAgendas.map((item, index) => {
                  const globalIdx = (agendaPage - 1) * agendaPageSize + index + 1;
                  return (
                    <tr
                      key={item.id}
                      className={`transition hover:bg-emerald-50/60 ${
                        item.terlaksana ? 'bg-emerald-50/20' : 'bg-amber-50/20'
                      }`}
                    >
                      {/* Centang Button Column */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleTerlaksana(item.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm mx-auto w-full ${
                            item.terlaksana
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                          }`}
                          title={item.terlaksana ? 'Klik untuk mengubah jadi Belum Terlaksana' : 'Klik untuk mengubah jadi Terlaksana'}
                        >
                          {item.terlaksana ? (
                            <>
                              <CheckSquare className="w-4 h-4 text-amber-300" />
                              <span>Terlaksana</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4 text-amber-800" />
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-center font-bold text-emerald-700">{globalIdx}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-950">{item.namaKegiatan}</td>
                      <td className="p-3 text-emerald-800 font-mono text-[11px]">{item.tanggalPelaksanaan}</td>
                      <td className="p-3 text-emerald-900 font-medium">{item.penanggungJawab}</td>
                      <td className="p-3 text-center">
                        {item.terlaksana ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Terlaksana</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Belum</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-emerald-700 text-[11px]">{item.keterangan}</td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditAgenda(item)}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition inline-block"
                          title="Edit Agenda"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-800" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-block"
                          title="Hapus Agenda"
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

        {/* Agenda Pagination */}
        <Pagination
          currentPage={agendaPage}
          totalItems={filteredAgendas.length}
          pageSize={agendaPageSize}
          onPageChange={setAgendaPage}
          onPageSizeChange={setAgendaPageSize}
          itemLabel="agenda"
        />
      </div>

      {/* Expedisi Tables Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-base">TABEL EXPEDISI RAPAT & ACARA</h3>
            <p className="text-xs text-emerald-200">Kelola daftar undangan, instansi, jabatan, no handphone, dan upload berkas</p>
          </div>

          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama / jabatan..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setExpedisiPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-emerald-800/80 border border-emerald-700 rounded-xl text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Tab Submenu */}
        <div className="flex overflow-x-auto bg-emerald-50/60 p-2 border-b border-emerald-100 gap-1">
          {[
            { id: 'rapat_pra_lokal', label: 'Rapat Pra Panitia Lokal' },
            { id: 'rapat_pra_sahmasy', label: 'Rapat Pra Sahmasy' },
            { id: 'opening_safari', label: 'Opening Safari Ramadlan' },
            { id: 'rapat_pasca_lokal', label: 'Rapat Pasca Panitia Lokal' },
            { id: 'rapat_pasca_sahmasy', label: 'Rapat Pasca Sahmasy' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setExpedisiPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-amber-200 shadow-sm'
                  : 'text-emerald-900 hover:bg-emerald-100/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Expedisi Table Content */}
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
              {filteredExpedisi.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-emerald-600">
                    Tidak ada data expedisi untuk kategori ini.
                  </td>
                </tr>
              ) : (
                paginatedExpedisi.map((item, index) => {
                  const globalExpIdx = (expedisiPage - 1) * expedisiPageSize + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-emerald-700">{globalExpIdx}</td>
                      <td className="p-3 font-semibold text-emerald-950">{item.nama}</td>
                      <td className="p-3 text-emerald-800">{item.instansiJabatan}</td>
                      <td className="p-3 text-emerald-700">{item.alamat}</td>
                      <td className="p-3 font-mono text-emerald-800">{item.noHandphone}</td>
                      <td className="p-3 text-emerald-700">{item.keterangan}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-medium">
                          <Upload className="w-3 h-3 text-emerald-600" />
                          <span>{item.berkasUrl || 'Upload'}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition inline-block"
                          title="Edit Data Expedisi"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-800" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpedisi(item.id)}
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

        {/* Expedisi Pagination */}
        <Pagination
          currentPage={expedisiPage}
          totalItems={filteredExpedisi.length}
          pageSize={expedisiPageSize}
          onPageChange={setExpedisiPage}
          onPageSizeChange={setExpedisiPageSize}
          itemLabel="expedisi"
        />
      </div>

      {/* Add / Edit Agenda Rencana Modal */}
      {showAddAgendaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden p-6">
            <h3 className="text-base font-serif font-bold text-emerald-950 mb-4">
              {editingAgenda ? 'Edit Agenda Rencana Kegiatan' : 'Tambah Agenda Rencana Baru'}
            </h3>
            <form onSubmit={handleSubmitAgenda} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Kategori Agenda</label>
                <select
                  value={agendaKategori}
                  onChange={e => setAgendaKategori(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Rencana Kegiatan</label>
                <input
                  type="text"
                  required
                  value={agendaNama}
                  onChange={e => setAgendaNama(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: Rapat Koordinasi Panitia Lokal Sesi II"
                />
              </div>

              <div className="space-y-2.5 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/70">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">Pilih Tanggal Masehi</label>
                  <input
                    type="date"
                    value={selDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Hari</label>
                    <select
                      value={selDay}
                      onChange={e => handleDayChange(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
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
                      className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer font-semibold text-emerald-950"
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
                    className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Contoh: 10 Syawal 1448 H"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Hasil Gabungan Hari / Tanggal (Otomatis)</label>
                  <input
                    type="text"
                    required
                    value={agendaTanggal}
                    onChange={e => setAgendaTanggal(e.target.value)}
                    className="w-full p-2.5 text-xs bg-emerald-100/50 border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Contoh: Sabtu, 10 Syawal 1448 H"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Penanggung Jawab</label>
                <input
                  type="text"
                  required
                  value={agendaPj}
                  onChange={e => setAgendaPj(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: Maz Syaiful"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="agendaTerlaksanaCheck"
                  checked={agendaTerlaksana}
                  onChange={e => setAgendaTerlaksana(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded border-emerald-300 focus:ring-emerald-600"
                />
                <label htmlFor="agendaTerlaksanaCheck" className="text-xs font-bold text-emerald-950 cursor-pointer">
                  Tandai sebagai Kegiatan Terlaksana (✔)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={agendaKet}
                  onChange={e => setAgendaKet(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: Selesai tepat waktu & SK disahkan"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAgendaModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  {editingAgenda ? 'Simpan Perubahan' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Expedisi Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden p-6">
            <h3 className="text-base font-serif font-bold text-emerald-950 mb-4">
              {editingItem ? 'Edit Data Expedisi' : 'Tambah Data Expedisi Baru'}
            </h3>
            <form onSubmit={handleSubmitExpedisi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: KH. Abdullah Faqih"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Instansi / Jabatan</label>
                <input
                  type="text"
                  required
                  value={newInstansi}
                  onChange={e => setNewInstansi(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: Ketua Panitia Lokal"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Alamat</label>
                <input
                  type="text"
                  required
                  value={newAlamat}
                  onChange={e => setNewAlamat(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: Dungkek Sumenep"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">No. Handphone (WhatsApp)</label>
                <input
                  type="text"
                  required
                  value={newHp}
                  onChange={e => setNewHp(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: 081231376394"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  value={newKet}
                  onChange={e => setNewKet(e.target.value)}
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="Contoh: Hadir & Siap Mendukung"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Upload Berkas / Dokumen (Opsional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setNewBerkas(file.name);
                  }}
                  className="w-full text-xs text-emerald-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200 cursor-pointer"
                />
                {newBerkas && (
                  <p className="text-[11px] text-emerald-700 mt-1">Berkas terpilih: <strong>{newBerkas}</strong></p>
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
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Expedisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print 40 Agenda Modal */}
      {showAgendaPrint && (
        <PrintModal 
          title="Rekapitulasi 40 Agenda Rencana Kegiatan & Rapat" 
          onClose={() => setShowAgendaPrint(false)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-900">
              <div className="w-14 h-14 bg-white rounded-full border border-amber-400 overflow-hidden shrink-0 shadow-xs p-0.5">
                <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 text-center pr-6">
                <h2 className="text-sm sm:text-base font-serif font-bold text-emerald-950 uppercase tracking-wide">
                  {orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI PULAU SAPUDI'}
                </h2>
                <p className="text-[10px] text-emerald-800 mt-0.5 font-sans">
                  {orgProfile?.alamatSekretariat || 'Jl. Sawah Seribu No. 01 Rt.01/Rw.01 Ds. Tarebung, Kec. Gayam Kab. Sumenep, Jawa Timur'} | Telp/WA: {orgProfile?.noTelepon || '+62 856-0674-7982'}
                </p>
              </div>
            </div>

            <div className="text-center border-b border-emerald-200 pb-3">
              <h2 className="text-base font-serif font-bold text-emerald-950 uppercase tracking-wider">
                REKAPITULASI RENCANA KEGIATAN & RAPAT PENGURUS
              </h2>
              <p className="text-xs text-emerald-700 mt-1">Total: {totalAgendaCount} Agenda | Terlaksana: {totalTerlaksanaCount} | Belum Terlaksana: {totalBelumTerlaksanaCount}</p>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-emerald-300 font-bold text-emerald-950 bg-emerald-50">
                  <th className="py-2 text-center w-8">NO</th>
                  <th className="py-2 text-left">KATEGORI</th>
                  <th className="py-2 text-left">NAMA KEGIATAN</th>
                  <th className="py-2 text-left">TANGGAL</th>
                  <th className="py-2 text-left">PENANGGUNG JAWAB</th>
                  <th className="py-2 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {agendaList.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2 text-center font-bold text-emerald-800">{idx + 1}</td>
                    <td className="py-2 font-semibold text-emerald-900">{item.kategori}</td>
                    <td className="py-2 font-bold text-emerald-950">{item.namaKegiatan}</td>
                    <td className="py-2 text-emerald-800 font-mono text-[11px]">{item.tanggalPelaksanaan}</td>
                    <td className="py-2 text-emerald-900">{item.penanggungJawab}</td>
                    <td className="py-2 text-center font-bold">
                      {item.terlaksana ? (
                        <span className="text-emerald-700">✔ TERLAKSANA</span>
                      ) : (
                        <span className="text-amber-700">☐ BELUM</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintModal>
      )}

      {/* Print Expedisi PDF Modal */}
      {showPrint && (
        <PrintModal 
          title={`Lembar Expedisi - ${activeTab.toUpperCase()}`} 
          onClose={() => setShowPrint(false)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-900">
              <div className="w-14 h-14 bg-white rounded-full border border-amber-400 overflow-hidden shrink-0 shadow-xs p-0.5">
                <img src={logoUrl || orgProfile?.logoUrl || '/logo.png'} alt="Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 text-center pr-6">
                <h2 className="text-sm sm:text-base font-serif font-bold text-emerald-950 uppercase tracking-wide">
                  {orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI PULAU SAPUDI'}
                </h2>
                <p className="text-[10px] text-emerald-800 mt-0.5 font-sans">
                  {orgProfile?.alamatSekretariat || 'Jl. Sawah Seribu No. 01 Rt.01/Rw.01 Ds. Tarebung, Kec. Gayam Kab. Sumenep, Jawa Timur'} | Telp/WA: {orgProfile?.noTelepon || '+62 856-0674-7982'}
                </p>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-base font-serif font-bold text-emerald-950 uppercase">
                REKAPITULASI EXPEDISI {activeTab.replace(/_/g, ' ').toUpperCase()}
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
                  {filteredExpedisi.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 text-center font-bold text-emerald-800">{idx + 1}</td>
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
