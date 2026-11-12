import React, { useState, useRef, useEffect } from 'react';
import { toJpeg, toBlob } from 'html-to-image';
import { IuranRow, TanggunganRow, DonaturRow, SahmasyRow, TransactionRecord, OrganizationProfile } from '../types';
import { initialIuranRows, initialTanggunganRows, initialDonaturRows } from '../data/initialData';
import {
  Wallet, Plus, Printer, FileSpreadsheet,
  ArrowUpRight, ArrowDownRight, Download, Upload, RefreshCw, Send, MessageSquare,
  Phone, Edit3, Trash2, Search, X, UserCheck, Sliders, Settings, Tag, Layers, Check,
  Image as ImageIcon, Copy, Share2, Receipt, HeartHandshake, Sparkles, CheckCircle2
} from 'lucide-react';
import { PrintModal } from './PrintModal';
import { Pagination } from './Pagination';
import { downloadCsvTemplate, exportToExcel, parseExcelFile, exportMultiSheetWorkbook } from '../utils/excelUtils';
import { terbilang } from '../utils/numberUtils';
import { matchesYear, formatGregorianIndo } from '../utils/filterUtils';

interface BendaharaViewProps {
  sahmasy?: SahmasyRow[];
  iuranList?: IuranRow[];
  setIuranList?: React.Dispatch<React.SetStateAction<IuranRow[]>>;
  tanggunganList?: TanggunganRow[];
  setTanggunganList?: React.Dispatch<React.SetStateAction<TanggunganRow[]>>;
  donaturList?: DonaturRow[];
  setDonaturList?: React.Dispatch<React.SetStateAction<DonaturRow[]>>;
  transactions?: TransactionRecord[];
  setTransactions?: React.Dispatch<React.SetStateAction<TransactionRecord[]>>;
  onNotify: (title: string, message: string) => void;
  selectedYear?: string;
  orgProfile?: OrganizationProfile;
  logoUrl?: string;
}

export const BendaharaView: React.FC<BendaharaViewProps> = ({ 
  sahmasy = [], 
  iuranList: propIuranList, 
  setIuranList: propSetIuranList, 
  tanggunganList: propTanggunganList, 
  setTanggunganList: propSetTanggunganList, 
  donaturList: propDonaturList, 
  setDonaturList: propSetDonaturList, 
  transactions: propTransactions,
  setTransactions: propSetTransactions,
  onNotify,
  selectedYear = 'Semua',
  orgProfile,
  logoUrl
}) => {
  const [localIuranList, setLocalIuranList] = useState<IuranRow[]>(initialIuranRows);
  const iuranList = propIuranList || localIuranList;
  const setIuranList = propSetIuranList || setLocalIuranList;

  const [localTanggunganList, setLocalTanggunganList] = useState<TanggunganRow[]>(initialTanggunganRows);
  const tanggunganList = propTanggunganList || localTanggunganList;
  const setTanggunganList = propSetTanggunganList || setLocalTanggunganList;

  const [localDonaturList, setLocalDonaturList] = useState<DonaturRow[]>(initialDonaturRows);
  const donaturList = propDonaturList || localDonaturList;
  const setDonaturList = propSetDonaturList || setLocalDonaturList;

  const [localTransactions, setLocalTransactions] = useState<TransactionRecord[]>([]);
  const transactions = propTransactions || localTransactions;
  const setTransactions = propSetTransactions || setLocalTransactions;
  const [activeSubTab, setActiveSubTab] = useState<'iuran' | 'tanggungan' | 'donatur' | 'kas' | 'transaksi'>('iuran');
  
  // Saldo Awal State (Bisa custom dari nol & tersimpan di localStorage)
  const [saldoAwal, setSaldoAwal] = useState<number>(() => {
    const saved = localStorage.getItem('fokus_saldo_awal');
    if (saved !== null) {
      const parsed = Number(saved);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('fokus_saldo_awal', saldoAwal.toString());
  }, [saldoAwal]);

  // Modal States for Donatur & Tanggungan
  const [showDonaturModal, setShowDonaturModal] = useState(false);
  const [editingDonatur, setEditingDonatur] = useState<DonaturRow | null>(null);
  const [showTanggunganModal, setShowTanggunganModal] = useState(false);
  const [editingTanggungan, setEditingTanggungan] = useState<TanggunganRow | null>(null);

  // Filter & Search State
  const [iuranCategoryFilter, setIuranCategoryFilter] = useState<'all' | 'putra' | 'putri' | 'santri_putra' | 'santri_putri'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States for Bendahara Tables
  const [iuranPage, setIuranPage] = useState(1);
  const [iuranPageSize, setIuranPageSize] = useState(10);
  const [tanggunganPage, setTanggunganPage] = useState(1);
  const [tanggunganPageSize, setTanggunganPageSize] = useState(10);
  const [donaturPage, setDonaturPage] = useState(1);
  const [donaturPageSize, setDonaturPageSize] = useState(10);
  const [transaksiPage, setTransaksiPage] = useState(1);
  const [transaksiPageSize, setTransaksiPageSize] = useState(10);

  // Custom Iuran Settings Modal State
  const [showCustomIuranModal, setShowCustomIuranModal] = useState(false);
  const [customNominalPutra, setCustomNominalPutra] = useState<number>(50000);
  const [customNominalPutri, setCustomNominalPutri] = useState<number>(50000);
  const [customNominalSantriPutra, setCustomNominalSantriPutra] = useState<number>(30000);
  const [customNominalSantriPutri, setCustomNominalSantriPutri] = useState<number>(30000);
  
  // Custom Mass Apply State
  const [massTargetCategory, setMassTargetCategory] = useState<'all' | 'putra' | 'putri' | 'santri_putra' | 'santri_putri'>('all');
  const [massNominalValue, setMassNominalValue] = useState<number>(50000);
  const [massJenisIuranText, setMassJenisIuranText] = useState<string>('Iuran Wajib');

  // Form Input Modal State for Iuran
  const [showIuranModal, setShowIuranModal] = useState(false);
  const [editingIuran, setEditingIuran] = useState<IuranRow | null>(null);
  const [iuranModalMode, setIuranModalMode] = useState<'edit' | 'payment'>('payment');

  // Original Months State for tracking previous payments
  const [originalMonths, setOriginalMonths] = useState<{
    dzulqodah: boolean;
    dzulhijjah: boolean;
    muharrom: boolean;
    shofar: boolean;
    robiulAwwal: boolean;
    robiusTsani: boolean;
    jumadilUla: boolean;
    jumadilAkhir: boolean;
    rojab: boolean;
  }>({
    dzulqodah: false,
    dzulhijjah: false,
    muharrom: false,
    shofar: false,
    robiulAwwal: false,
    robiusTsani: false,
    jumadilUla: false,
    jumadilAkhir: false,
    rojab: false,
  });

  // Form Fields State
  const [selectedSensusId, setSelectedSensusId] = useState<string>('');
  const [sensusSearchQuery, setSensusSearchQuery] = useState<string>('');
  const [formNis, setFormNis] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formAsrama, setFormAsrama] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formTipe, setFormTipe] = useState<'putra' | 'putri' | 'santri_putra' | 'santri_putri'>('putra');
  const [formNominalBulan, setFormNominalBulan] = useState<number>(50000);
  const [formJenisIuran, setFormJenisIuran] = useState<string>('Iuran Wajib');
  const [formTanggalBayar, setFormTanggalBayar] = useState<string>('11 Agustus 2026');
  const [formPenerima, setFormPenerima] = useState<string>('Zeinol Hasan, S.Ag');
  const [formKeterangan, setFormKeterangan] = useState<string>('Lunas Periode Berjalan');

  // Form Fields for Donatur
  const [formDonaturHari, setFormDonaturHari] = useState<string>('');
  const [formDonaturAlamat, setFormDonaturAlamat] = useState<string>('');
  const [formDonaturNominal, setFormDonaturNominal] = useState<number>(100000);
  const [formDonaturNoHp, setFormDonaturNoHp] = useState<string>('');
  const [donaturAutoPrint, setDonaturAutoPrint] = useState<boolean>(true);
  const [printDonaturItem, setPrintDonaturItem] = useState<DonaturRow | null>(null);
  const [donaturWaPhone, setDonaturWaPhone] = useState<string>('');
  const [isGeneratingDonaturJpg, setIsGeneratingDonaturJpg] = useState<boolean>(false);
  const donaturReceiptCardRef = useRef<HTMLDivElement>(null);

  // Automated Date selection helpers for Bendahara
  const [payDate, setPayDate] = useState('');
  const [payDay, setPayDay] = useState('');
  const [payHijri, setPayHijri] = useState('');

  const [donDate, setDonDate] = useState('');
  const [donDay, setDonDay] = useState('');
  const [donHijri, setDonHijri] = useState('');
  const [donTahun, setDonTahun] = useState('2026');

  const parseHariTanggal = (str: string) => {
    let parsedDay = '';
    let parsedHijri = '';
    
    const parts = str.split(',');
    if (parts.length > 0) {
      const possibleDay = parts[0].trim();
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
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

  const handlePayDateChange = (dateVal: string) => {
    setPayDate(dateVal);
    const { dayName, dateFormatted } = formatGregorianIndo(dateVal);
    let dayToUse = dayName || payDay;
    if (dayName) setPayDay(dayName);
    
    const combined = `${dayToUse ? `${dayToUse}, ` : ''}${dateFormatted}${payHijri ? ` / ${payHijri}` : ''}`;
    setFormTanggalBayar(combined);
  };

  const handlePayDayChange = (dayVal: string) => {
    setPayDay(dayVal);
    let datePart = '';
    if (payDate) {
      const { dateFormatted } = formatGregorianIndo(payDate);
      datePart = dateFormatted;
    }
    const combined = `${dayVal ? `${dayVal}, ` : ''}${datePart}${payHijri ? ` / ${payHijri}` : ''}`;
    setFormTanggalBayar(combined);
  };

  const handlePayHijriChange = (hijriVal: string) => {
    setPayHijri(hijriVal);
    let datePart = '';
    if (payDate) {
      const { dateFormatted } = formatGregorianIndo(payDate);
      datePart = dateFormatted;
    }
    const combined = `${payDay ? `${payDay}, ` : ''}${datePart}${hijriVal ? ` / ${hijriVal}` : ''}`;
    setFormTanggalBayar(combined);
  };

  const handleDonDateChange = (dateVal: string) => {
    setDonDate(dateVal);
    const { dayName, dateFormatted } = formatGregorianIndo(dateVal);
    let dayToUse = dayName || donDay;
    if (dayName) setDonDay(dayName);
    
    const combined = `${dayToUse ? `${dayToUse}, ` : ''}${dateFormatted}${donHijri ? ` / ${donHijri}` : ''}`;
    setFormDonaturHari(combined);
  };

  const handleDonDayChange = (dayVal: string) => {
    setDonDay(dayVal);
    let datePart = '';
    if (donDate) {
      const { dateFormatted } = formatGregorianIndo(donDate);
      datePart = dateFormatted;
    }
    const combined = `${dayVal ? `${dayVal}, ` : ''}${datePart}${donHijri ? ` / ${donHijri}` : ''}`;
    setFormDonaturHari(combined);
  };

  const handleDonHijriChange = (hijriVal: string) => {
    setDonHijri(hijriVal);
    let datePart = '';
    if (donDate) {
      const { dateFormatted } = formatGregorianIndo(donDate);
      datePart = dateFormatted;
    }
    const combined = `${donDay ? `${donDay}, ` : ''}${datePart}${hijriVal ? ` / ${hijriVal}` : ''}`;
    setFormDonaturHari(combined);
  };

  // Form Fields for Tanggungan
  const [formTanggunganTahun, setFormTanggunganTahun] = useState<string>('');
  const [formTanggunganNominal, setFormTanggunganNominal] = useState<number>(0);
  const [formTanggunganTindak, setFormTanggunganTindak] = useState<string>('');

  // Preset Nominal Quick Chips
  const PRESET_NOMINALS = [10000, 15000, 20000, 25000, 30000, 35000, 50000, 75000, 100000];

  // 9 Month Checkboxes State
  const [formMonths, setFormMonths] = useState<{
    dzulqodah: boolean;
    dzulhijjah: boolean;
    muharrom: boolean;
    shofar: boolean;
    robiulAwwal: boolean;
    robiusTsani: boolean;
    jumadilUla: boolean;
    jumadilAkhir: boolean;
    rojab: boolean;
  }>({
    dzulqodah: true,
    dzulhijjah: true,
    muharrom: false,
    shofar: false,
    robiulAwwal: false,
    robiusTsani: false,
    jumadilUla: false,
    jumadilAkhir: false,
    rojab: false,
  });

  // Print Struk state
  const [printStrukItem, setPrintStrukItem] = useState<TransactionRecord | null>(null);
  const [waNumberInput, setWaNumberInput] = useState<string>('');
  const [printTagihanItem, setPrintTagihanItem] = useState<TanggunganRow | null>(null);
  const [showPrintRekapModal, setShowPrintRekapModal] = useState(false);

  // Struk Image Capture Ref & Loading State
  const strukCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingJpg, setIsGeneratingJpg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate Month Totals & Global Financial Metrics
  const MONTH_LIST = [
    { key: 'dzulqodah', label: "Dzulqo'dah" },
    { key: 'dzulhijjah', label: 'Dzulhijjah' },
    { key: 'muharrom', label: 'Muharrom' },
    { key: 'shofar', label: 'Shofar' },
    { key: 'robiulAwwal', label: 'Robiul Awwal' },
    { key: 'robiusTsani', label: 'Robiust Tsani' },
    { key: 'jumadilUla', label: 'Jumadil Ula' },
    { key: 'jumadilAkhir', label: 'Jumadil Akhir' },
  ] as const;

  // Calculate actual total iuran gathered
  const calculateRowTotal = (item: IuranRow) => {
    const monthsCount = MONTH_LIST.filter(m => item[m.key as keyof IuranRow] === true).length;
    const nominal = item.nominalPerBulan || 50000;
    return monthsCount * nominal;
  };

  const filteredIuranList = iuranList.filter(item => matchesYear(item, selectedYear));
  const filteredDonaturList = donaturList.filter(item => matchesYear(item, selectedYear));
  const filteredTanggunganList = tanggunganList.filter(item => matchesYear(item, selectedYear));
  const filteredTransactionsList = transactions.filter(item => matchesYear(item, selectedYear));

  const totalIuranSum = filteredIuranList.reduce((acc, item) => acc + calculateRowTotal(item), 0);
  const totalDonaturSum = filteredDonaturList.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalDebit = totalIuranSum + totalDonaturSum + saldoAwal;
  const totalKredit = filteredTanggunganList.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalSaldo = totalDebit - totalKredit;

  // Sync Sensus Database with Iuran List
  const handleSyncWithSensus = () => {
    if (!sahmasy || sahmasy.length === 0) {
      onNotify('Sensus Kosong', 'Tidak ada data anggota di Database Sensus untuk disinkronkan.');
      return;
    }

    let addedCount = 0;
    let updatedCount = 0;
    const updatedList = [...iuranList];

    sahmasy.forEach((member) => {
      const existingIndex = updatedList.findIndex(
        (u) => (u.nis && u.nis === member.nis) || (u.nama && u.nama.toLowerCase() === member.nama.toLowerCase())
      );

      // Determine default nominal based on custom settings
      const getNominal = (type?: string) => {
        if (type === 'putri') return customNominalPutri;
        if (type === 'santri_putra') return customNominalSantriPutra;
        if (type === 'santri_putri') return customNominalSantriPutri;
        return customNominalPutra;
      };

      if (existingIndex >= 0) {
        // Sync contact & category info
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          nis: member.nis || updatedList[existingIndex].nis,
          nama: member.nama || updatedList[existingIndex].nama,
          asrama: member.alamat || member.desa || updatedList[existingIndex].asrama,
          noHandphone: member.noHandphone || updatedList[existingIndex].noHandphone,
          tipe: member.tipe || updatedList[existingIndex].tipe,
        };
        updatedCount++;
      } else {
        // Add new member to iuran
        const newRow: IuranRow = {
          id: 'iuran-sync-' + member.id + '-' + Date.now(),
          no: updatedList.length + 1,
          nis: member.nis,
          nama: member.nama,
          asrama: member.alamat || (member.desa ? `Desa ${member.desa}` : 'Sapudi'),
          noHandphone: member.noHandphone || '',
          tipe: member.tipe || 'putra',
          nominalPerBulan: getNominal(member.tipe),
          jenisIuran: 'Iuran Wajib',
          dzulqodah: false,
          dzulhijjah: false,
          muharrom: false,
          shofar: false,
          robiulAwwal: false,
          robiusTsani: false,
          jumadilUla: false,
          jumadilAkhir: false,
          rojab: false,
          keterangan: 'Baru Disinkronkan Sensus',
          tanggalBayar: '11 Agustus 2026',
          penerima: 'Zeinol Hasan, S,Ag',
        };
        updatedList.push(newRow);
        addedCount++;
      }
    });

    setIuranList(updatedList);
    onNotify(
      'Sinkronisasi Sensus Berhasil',
      `Berhasil memperbarui ${updatedCount} anggota & menambahkan ${addedCount} anggota baru dari Database Sensus.`
    );
  };

  // Batch Apply Custom Nominal & Jenis Iuran to Members
  const handleMassApplyCustomNominal = () => {
    let affectedCount = 0;
    const updated = iuranList.map((item) => {
      const match =
        massTargetCategory === 'all' || item.tipe === massTargetCategory;
      if (match) {
        affectedCount++;
        return {
          ...item,
          nominalPerBulan: massNominalValue,
          jenisIuran: massJenisIuranText || item.jenisIuran || 'Iuran Wajib',
        };
      }
      return item;
    });

    setIuranList(updated);
    setShowCustomIuranModal(false);
    onNotify(
      'Kustom Iuran Diterapkan',
      `Berhasil memperbarui nominal ke Rp ${massNominalValue.toLocaleString('id-ID')} untuk ${affectedCount} anggota.`
    );
  };

  // Filtered Sensus Members for Auto-Fill Picker
  const filteredSensusList = sahmasy.filter((m) => {
    if (!sensusSearchQuery.trim()) return true;
    const q = sensusSearchQuery.toLowerCase();
    return (
      m.nama.toLowerCase().includes(q) ||
      (m.nis && m.nis.toLowerCase().includes(q)) ||
      (m.desa && m.desa.toLowerCase().includes(q)) ||
      (m.alamat && m.alamat.toLowerCase().includes(q)) ||
      (m.noHandphone && m.noHandphone.includes(q)) ||
      (m.tipe && m.tipe.toLowerCase().includes(q))
    );
  });

  // Open Form Modal for New / Edit
  const handleOpenIuranModal = (row?: IuranRow, mode: 'edit' | 'payment' = 'payment') => {
    setSensusSearchQuery('');
    setIuranModalMode(mode);
    if (row) {
      setEditingIuran(row);
      setSelectedSensusId('');
      setFormNis(row.nis);
      setFormNama(row.nama);
      setFormAsrama(row.asrama);
      setFormPhone(row.noHandphone || '');
      setFormTipe(row.tipe || 'putra');
      setFormNominalBulan(row.nominalPerBulan || 50000);
      setFormJenisIuran(row.jenisIuran || 'Iuran Wajib');
      setFormTanggalBayar(row.tanggalBayar || '11 Agustus 2026');
      setFormPenerima(row.penerima || 'Zeinol Hasan, S.Ag');
      setFormKeterangan(row.keterangan || 'Lunas Periode Berjalan');
      
      const parsed = parseHariTanggal(row.tanggalBayar || '11 Agustus 2026');
      setPayDay(parsed.parsedDay);
      setPayHijri(parsed.parsedHijri);
      setPayDate('');

      setFormMonths({
        dzulqodah: row.dzulqodah,
        dzulhijjah: row.dzulhijjah,
        muharrom: row.muharrom,
        shofar: row.shofar,
        robiulAwwal: row.robiulAwwal,
        robiusTsani: row.robiusTsani,
        jumadilUla: row.jumadilUla,
        jumadilAkhir: row.jumadilAkhir,
        rojab: row.rojab,
      });
      if (mode === 'payment') {
        setOriginalMonths({
          dzulqodah: row.dzulqodah,
          dzulhijjah: row.dzulhijjah,
          muharrom: row.muharrom,
          shofar: row.shofar,
          robiulAwwal: row.robiulAwwal,
          robiusTsani: row.robiusTsani,
          jumadilUla: row.jumadilUla,
          jumadilAkhir: row.jumadilAkhir,
          rojab: row.rojab,
        });
      } else {
        setOriginalMonths({
          dzulqodah: false,
          dzulhijjah: false,
          muharrom: false,
          shofar: false,
          robiulAwwal: false,
          robiusTsani: false,
          jumadilUla: false,
          jumadilAkhir: false,
          rojab: false,
        });
      }
    } else {
      setEditingIuran(null);
      setSelectedSensusId('');
      setFormNis('');
      setFormNama('');
      setFormAsrama('');
      setFormPhone('');
      setFormTipe('putra');
      setFormNominalBulan(customNominalPutra);
      setFormJenisIuran('Iuran Wajib');
      setFormTanggalBayar('11 Agustus 2026');
      setFormPenerima('Zeinol Hasan, S.Ag');
      setFormKeterangan('Lunas Periode Berjalan');
      setPayDay('');
      setPayHijri('');
      setPayDate('');
      setFormMonths({
        dzulqodah: true,
        dzulhijjah: true,
        muharrom: false,
        shofar: false,
        robiulAwwal: false,
        robiusTsani: false,
        jumadilUla: false,
        jumadilAkhir: false,
        rojab: false,
      });
      setOriginalMonths({
        dzulqodah: false,
        dzulhijjah: false,
        muharrom: false,
        shofar: false,
        robiulAwwal: false,
        robiusTsani: false,
        jumadilUla: false,
        jumadilAkhir: false,
        rojab: false,
      });
    }
    setShowIuranModal(true);
  };

  // Handle selecting member from Sensus Dropdown
  const handleSelectSensusMember = (sensusId: string) => {
    setSelectedSensusId(sensusId);
    const member = sahmasy.find((s) => s.id === sensusId);
    if (member) {
      // Check if this member already exists in the Iuran table
      const existingIuran = iuranList.find(i => i.nis === member.nis || i.nama === member.nama);
      
      if (existingIuran) {
        setEditingIuran(existingIuran);
        setFormNis(existingIuran.nis);
        setFormNama(existingIuran.nama);
        setFormAsrama(existingIuran.asrama);
        setFormPhone(existingIuran.noHandphone || member.noHandphone || '');
        setFormTipe(existingIuran.tipe || member.tipe || 'putra');
        setFormNominalBulan(existingIuran.nominalPerBulan || 50000);
        setFormJenisIuran(existingIuran.jenisIuran || 'Iuran Wajib Rutin 9 Bulan');
        setFormTanggalBayar(existingIuran.tanggalBayar || '11 Agustus 2026');
        setFormPenerima(existingIuran.penerima || 'H. Moh. Hasan');
        setFormKeterangan(existingIuran.keterangan || 'Lunas Periode Berjalan');
        
        const parsed = parseHariTanggal(existingIuran.tanggalBayar || '11 Agustus 2026');
        setPayDay(parsed.parsedDay);
        setPayHijri(parsed.parsedHijri);
        setPayDate('');

        setFormMonths({
          dzulqodah: existingIuran.dzulqodah,
          dzulhijjah: existingIuran.dzulhijjah,
          muharrom: existingIuran.muharrom,
          shofar: existingIuran.shofar,
          robiulAwwal: existingIuran.robiulAwwal,
          robiusTsani: existingIuran.robiusTsani,
          jumadilUla: existingIuran.jumadilUla,
          jumadilAkhir: existingIuran.jumadilAkhir,
          rojab: existingIuran.rojab,
        });
        if (iuranModalMode === 'payment') {
          setOriginalMonths({
            dzulqodah: existingIuran.dzulqodah,
            dzulhijjah: existingIuran.dzulhijjah,
            muharrom: existingIuran.muharrom,
            shofar: existingIuran.shofar,
            robiulAwwal: existingIuran.robiulAwwal,
            robiusTsani: existingIuran.robiusTsani,
            jumadilUla: existingIuran.jumadilUla,
            jumadilAkhir: existingIuran.jumadilAkhir,
            rojab: existingIuran.rojab,
          });
        }
        onNotify('Data Ditemukan', `Data iuran untuk ${member.nama} sudah ada. Melanjutkan sebagai mode angsuran/bayar.`);
      } else {
        setEditingIuran(null);
        setFormNis(member.nis);
        setFormNama(member.nama);
        setFormAsrama(member.alamat || (member.desa ? `Desa ${member.desa}` : 'Sapudi'));
        setFormPhone(member.noHandphone || '');
        setFormTipe(member.tipe || 'putra');
        if (member.tipe === 'putri') setFormNominalBulan(customNominalPutri);
        else if (member.tipe === 'santri_putra') setFormNominalBulan(customNominalSantriPutra);
        else if (member.tipe === 'santri_putri') setFormNominalBulan(customNominalSantriPutri);
        else setFormNominalBulan(customNominalPutra);
      }
    }
  };

  // Save Iuran Data
  const handleSaveIuran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      onNotify('Form Belum Lengkap', 'Nama anggota wajib diisi.');
      return;
    }

    const newlyPaidMonths = MONTH_LIST.filter(m => formMonths[m.key as keyof typeof formMonths] && !originalMonths[m.key as keyof typeof originalMonths]).map(m => m.label);
    let transactionToPrint: TransactionRecord | null = null;

    if (newlyPaidMonths.length > 0) {
      transactionToPrint = {
        id: 'TRX-' + Date.now().toString().slice(-6),
        iuranId: editingIuran ? editingIuran.id : '',
        nama: formNama,
        nis: formNis || `NIS-${Math.floor(1000 + Math.random() * 9000)}`,
        asrama: formAsrama || 'Sapudi',
        noHandphone: formPhone,
        tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        bulanDibayar: newlyPaidMonths,
        nominalTotal: newlyPaidMonths.length * formNominalBulan,
        tipe: formTipe,
        penerima: formPenerima,
        jenisIuran: formJenisIuran,
        keterangan: formKeterangan,
        tahun: selectedYear !== 'Semua' ? selectedYear : '2026'
      };
      setTransactions([transactionToPrint, ...transactions]);
    }

    if (editingIuran) {
      const updatedList = iuranList.map((item) => {
        if (item.id === editingIuran.id) {
          return {
            ...item,
            nis: formNis || item.nis,
            nama: formNama,
            asrama: formAsrama,
            noHandphone: formPhone,
            tipe: formTipe,
            nominalPerBulan: formNominalBulan,
            jenisIuran: formJenisIuran,
            tanggalBayar: formTanggalBayar,
            penerima: formPenerima,
            keterangan: formKeterangan,
            ...formMonths,
          };
        }
        return item;
      });
      setIuranList(updatedList);
      onNotify('Iuran Diperbarui', `Data Iuran untuk ${formNama} berhasil disimpan.`);
      
      if (transactionToPrint) {
        transactionToPrint.iuranId = editingIuran.id;
        setPrintStrukItem(transactionToPrint);
        setWaNumberInput(transactionToPrint.noHandphone || '081234567891');
      } else {
        setPrintStrukItem(null); // No new payments, don't show struk
      }
    } else {
      const newIuranId = 'iuran-' + Date.now();
      const newRow: IuranRow = {
        id: newIuranId,
        no: iuranList.length + 1,
        nis: formNis || `NIS-${Math.floor(1000 + Math.random() * 9000)}`,
        nama: formNama,
        asrama: formAsrama || 'Sapudi',
        noHandphone: formPhone,
        tipe: formTipe,
        nominalPerBulan: formNominalBulan,
        jenisIuran: formJenisIuran,
        tanggalBayar: formTanggalBayar,
        penerima: formPenerima,
        keterangan: formKeterangan,
        ...formMonths,
        tahun: selectedYear !== 'Semua' ? selectedYear : '2026'
      };
      setIuranList([newRow, ...iuranList]);
      onNotify('Iuran Ditambahkan', `Catatan iuran baru untuk ${formNama} berhasil ditambahkan.`);
      
      if (transactionToPrint) {
        transactionToPrint.iuranId = newIuranId;
        setPrintStrukItem(transactionToPrint);
        setWaNumberInput(transactionToPrint.noHandphone || '081234567891');
      }
    }

    setShowIuranModal(false);
  };

  // Delete Iuran Record
  const handleDeleteIuran = (id: string, nama: string) => {
    if (window.confirm(`Hapus data iuran untuk ${nama}?`)) {
      setIuranList(iuranList.filter((i) => i.id !== id));
      onNotify('Iuran Dihapus', `Data iuran ${nama} telah dihapus.`);
    }
  };

  const handleDeleteTransaction = (id: string, nama: string) => {
    if (window.confirm(`Hapus riwayat transaksi struk untuk ${nama}?`)) {
      setTransactions(transactions.filter((t) => t.id !== id));
      onNotify('Transaksi Dihapus', `Riwayat transaksi ${nama} telah dihapus.`);
    }
  };

  // Open Struk Modal & Pre-fill WA for Transaction History
  const handleOpenStruk = (item: TransactionRecord) => {
    setPrintStrukItem(item);
    setWaNumberInput(item.noHandphone || '081234567891');
  };

  // Download Struk DOM preview as JPG Image
  const handleDownloadStrukJpg = async () => {
    if (!strukCardRef.current) return;
    try {
      setIsGeneratingJpg(true);
      const dataUrl = await toJpeg(strukCardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      const memberName = printStrukItem ? printStrukItem.nama.replace(/\s+/g, '_') : 'Anggota';
      link.download = `Struk_Iuran_${memberName}_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      onNotify('Gambar JPG Berhasil Diunduh', `Gambar Struk Iuran untuk ${printStrukItem?.nama} telah didownload dalam format JPG.`);
    } catch (err) {
      console.error('Failed to capture JPG:', err);
      onNotify('Gagal Generate JPG', 'Terjadi kesalahan saat mengonversi desain struk ke gambar JPG.');
    } finally {
      setIsGeneratingJpg(false);
    }
  };

  // Copy Struk DOM preview as Image to Clipboard
  const handleCopyStrukImage = async () => {
    if (!strukCardRef.current) return;
    try {
      setIsGeneratingJpg(true);
      const blob = await toBlob(strukCardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        onNotify('Gambar Struk Tersalin!', 'Gambar Struk JPG/PNG berhasil disalin ke Clipboard. Silakan Paste (Ctrl + V) langsung di WhatsApp.');
      } else {
        onNotify('Salin Clipboard', 'Gunakan tombol Download Gambar JPG untuk mengunduh gambar secara langsung.');
      }
    } catch (err) {
      console.error('Clipboard copy error:', err);
      onNotify('Salin Gambar Gagal', 'Silakan gunakan tombol Download Gambar JPG untuk menyimpan struk.');
    } finally {
      setIsGeneratingJpg(false);
    }
  };

  // WhatsApp Struk Message Generator + Auto JPG Download & Copy
  const handleSendWhatsAppStruk = async () => {
    if (!printStrukItem) return;

    let phone = waNumberInput.replace(/\D/g, '');
    if (!phone) {
      onNotify('Nomor HP Kosong', 'Silakan masukkan nomor WhatsApp yang valid.');
      return;
    }
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }

    const paidMonths = printStrukItem.bulanDibayar;
    const unpaidMonths = MONTH_LIST.map(m => m.label).filter(m => !paidMonths.includes(m));
    const nominalPerMonth = printStrukItem.nominalTotal / (paidMonths.length || 1);
    const totalAmount = printStrukItem.nominalTotal;
    const wordsTerbilang = terbilang(totalAmount);

    // Auto download JPG image of Struk design first
    if (strukCardRef.current) {
      try {
        setIsGeneratingJpg(true);
        const dataUrl = await toJpeg(strukCardRef.current, {
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        const memberName = printStrukItem.nama.replace(/\s+/g, '_');
        link.download = `Struk_Iuran_${memberName}_${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();

        // Also attempt clipboard copy
        const blob = await toBlob(strukCardRef.current, {
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        }
      } catch (err) {
        console.error('Error generating JPG for WA:', err);
      } finally {
        setIsGeneratingJpg(false);
      }
    }

    const messageText = `
*STRUK RESMI PEMBAYARAN IURAN AKTIVIS*
*MANAJEMENT FOKUS PULAU SAPUDI*
====================================
*No. Struk:* ${printStrukItem.id.toUpperCase()}
*Jenis Iuran:* ${printStrukItem.jenisIuran || 'Iuran Wajib'}
*Tanggal Transaksi:* ${printStrukItem.tanggal}
*Penerima:* ${printStrukItem.penerima || 'Zeinol Hasan, S.Ag (Bendahara)'}
------------------------------------
*Nama Anggota:* ${printStrukItem.nama}
*NIS:* ${printStrukItem.nis}
*Kategori:* ${printStrukItem.tipe ? printStrukItem.tipe.toUpperCase().replace('_', ' ') : 'AKTIVIS'}
*Asrama / Alamat:* ${printStrukItem.asrama}
------------------------------------
*RINCIAN TRANSAKSI HARI INI (${paidMonths.length} Bulan):*
${paidMonths.length > 0 ? paidMonths.map((m) => `✅ ${m} (@ Rp ${nominalPerMonth.toLocaleString('id-ID')})`).join('\n') : '❌ Belum ada bulan lunas'}

*SISA TANGGUNGAN / BELUM LUNAS (${unpaidMonths.length} Bulan):*
${unpaidMonths.length > 0 ? unpaidMonths.map((m) => `❌ ${m}`).join(', ') : '✅ Seluruh tanggungan lunas'}
------------------------------------
*TOTAL DIBAYAR:* Rp ${totalAmount.toLocaleString('id-ID')}
*Terbilang:* ${wordsTerbilang}
*Status:* ${printStrukItem.keterangan || 'LUNAS RESMI'}
====================================
📸 *CATATAN:* Gambar JPG Struk Resmi di atas telah *OTOMATIS TERUNDUH & TERSALIN* ke Clipboard perangkat Anda.
👉 Silakan tekan *PASTE (Ctrl + V)* atau lampirkan foto Struk JPG di chat WhatsApp ini. Terima kasih!
`.trim();

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
    onNotify('Gambar JPG Diunduh & WA Terbuka', `File Gambar Struk JPG telah diunduh. Membuka WhatsApp untuk ${printStrukItem.nama} (${phone}).`);
  };

  const handleOpenDonaturModal = (row?: DonaturRow) => {
    if (row) {
      setEditingDonatur(row);
      setFormDonaturHari(row.hariTanggal);
      setFormNama(row.nama);
      setFormDonaturAlamat(row.alamat);
      setFormDonaturNominal(row.nominal);
      setFormPenerima(row.penerima);
      setFormKeterangan(row.keterangan);
      setFormDonaturNoHp(row.noHandphone || '');
      setDonTahun(row.tahun || (selectedYear !== 'Semua' ? selectedYear : '2026'));
      
      const parsed = parseHariTanggal(row.hariTanggal);
      setDonDay(parsed.parsedDay);
      setDonHijri(parsed.parsedHijri);
      setDonDate('');
      setDonaturAutoPrint(false);
    } else {
      setEditingDonatur(null);
      const todayISO = new Date().toISOString().split('T')[0];
      const { dayName, dateFormatted } = formatGregorianIndo(todayISO);
      setDonDate(todayISO);
      setDonDay(dayName || 'Rabu');
      setDonHijri('');
      setFormDonaturHari(dayName ? `${dayName}, ${dateFormatted}` : dateFormatted);
      setFormNama('');
      setFormDonaturAlamat('');
      setFormDonaturNoHp('');
      setFormDonaturNominal(100000);
      setFormPenerima('Zeinol Hasan, S.Ag (Bendahara)');
      setFormKeterangan('Wakaf Tunai Pembangunan');
      setDonTahun(selectedYear !== 'Semua' ? selectedYear : '2026');
      setDonaturAutoPrint(true);
    }
    setShowDonaturModal(true);
  };

  const handleSaveDonatur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || formDonaturNominal <= 0) {
      onNotify('Form Belum Lengkap', 'Nama Donatur dan Nominal sumbangan wajib diisi dengan benar.');
      return;
    }

    if (editingDonatur) {
      const updatedList = donaturList.map((item) =>
        item.id === editingDonatur.id
          ? {
               ...item,
               hariTanggal: formDonaturHari,
               nama: formNama,
               alamat: formDonaturAlamat,
               nominal: formDonaturNominal,
               penerima: formPenerima,
               keterangan: formKeterangan,
               tahun: donTahun,
               noHandphone: formDonaturNoHp,
             }
          : item
      );
      setDonaturList(updatedList);
      onNotify('Donatur Diperbarui', `Data Donatur ${formNama} berhasil diperbarui.`);
      if (donaturAutoPrint) {
        const itemToPrint = updatedList.find(x => x.id === editingDonatur.id);
        if (itemToPrint) {
          setPrintDonaturItem(itemToPrint);
          setDonaturWaPhone(itemToPrint.noHandphone || '');
        }
      }
    } else {
      const newDonatur: DonaturRow = {
        id: 'donatur-' + Date.now(),
        no: donaturList.length + 1,
        hariTanggal: formDonaturHari,
        nama: formNama,
        alamat: formDonaturAlamat,
        nominal: formDonaturNominal,
        penerima: formPenerima,
        keterangan: formKeterangan,
        tahun: donTahun,
        noHandphone: formDonaturNoHp
      };
      setDonaturList([newDonatur, ...donaturList]);
      onNotify('Donatur Ditambahkan', `Data Donatur ${formNama} berhasil disimpan.`);
      if (donaturAutoPrint) {
        setPrintDonaturItem(newDonatur);
        setDonaturWaPhone(formDonaturNoHp || '');
      }
    }
    setShowDonaturModal(false);
  };

  const handleDownloadDonaturJpg = async () => {
    if (!donaturReceiptCardRef.current || !printDonaturItem) return;
    setIsGeneratingDonaturJpg(true);
    try {
      const dataUrl = await toJpeg(donaturReceiptCardRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Tanda_Terima_Donatur_${printDonaturItem.nama.replace(/\s+/g, '_')}_${printDonaturItem.id}.jpg`;
      link.href = dataUrl;
      link.click();
      onNotify('Gambar JPG Diunduh', `Gambar Tanda Terima untuk ${printDonaturItem.nama} telah berhasil diunduh.`);
    } catch (err) {
      console.error(err);
      onNotify('Gagal Unduh Gambar', 'Terjadi kendala saat memproses gambar tanda terima.');
    } finally {
      setIsGeneratingDonaturJpg(false);
    }
  };

  const handleCopyDonaturImage = async () => {
    if (!donaturReceiptCardRef.current || !printDonaturItem) return;
    setIsGeneratingDonaturJpg(true);
    try {
      const blob = await toBlob(donaturReceiptCardRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        onNotify('Gambar Disalin ke Clipboard', 'Gambar tanda terima berhasil disalin. Silakan Paste (Ctrl+V) langsung di WhatsApp!');
      } else {
        throw new Error('Clipboard API tidak didukung');
      }
    } catch (err) {
      console.error(err);
      handleDownloadDonaturJpg();
      onNotify('Otomatis Diunduh', 'Browser Anda mengalihkan ke unduhan file gambar JPG.');
    } finally {
      setIsGeneratingDonaturJpg(false);
    }
  };

  const handleSendWhatsAppDonatur = async () => {
    if (!printDonaturItem) return;
    const phone = (donaturWaPhone || printDonaturItem.noHandphone || '').trim().replace(/[^0-9]/g, '');
    if (!phone) {
      onNotify('Nomor WA Belum Diisi', 'Silakan masukkan nomor WhatsApp donatur untuk mengirim tanda terima.');
      return;
    }

    if (donaturReceiptCardRef.current) {
      setIsGeneratingDonaturJpg(true);
      try {
        const dataUrl = await toJpeg(donaturReceiptCardRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `Tanda_Terima_Donatur_${printDonaturItem.nama.replace(/\s+/g, '_')}.jpg`;
        link.href = dataUrl;
        link.click();

        const blob = await toBlob(donaturReceiptCardRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        }
      } catch (err) {
        console.warn('Could not auto capture JPG:', err);
      } finally {
        setIsGeneratingDonaturJpg(false);
      }
    }

    const messageText = `
*TANDA TERIMA DONASI & WAKAF RESMI*
*FORUM KOMUNIKASI SANTRI PULAU SAPUDI*
====================================
*No. Tanda Terima:* ${printDonaturItem.id.toUpperCase()}
*Hari / Tanggal:* ${printDonaturItem.hariTanggal}
*Periode Tahun:* ${printDonaturItem.tahun || '2026'}
------------------------------------
*Nama Donatur:* ${printDonaturItem.nama}
*Alamat:* ${printDonaturItem.alamat || 'Sapudi'}
*No. Kontak:* ${printDonaturItem.noHandphone || '-'}
------------------------------------
*RINCIAN SUMBANGAN:*
*Peruntukan / Jenis Wakaf:* ${printDonaturItem.keterangan || 'Donasi / Wakaf Tunai Organisasi'}
*JUMLAH DONASI:* Rp ${printDonaturItem.nominal.toLocaleString('id-ID')}
*Terbilang:* ${terbilang(printDonaturItem.nominal)} Rupiah
*Diterima Oleh:* ${printDonaturItem.penerima || 'Zeinol Hasan, S.Ag (Bendahara)'}
====================================
Jazakumullah Khairan Katsiran atas infaq, shadaqah, dan wakaf yang telah disalurkan. Semoga menjadi amal jariyah yang mengalirkan pahala tiada henti serta membawa keberkahan bagi Bapak/Ibu dan keluarga. Aamiin ya Rabbal 'Alamin.

📸 *Lampiran Bukti:* Gambar Tanda Terima Resmi telah terunduh / tersalin ke clipboard perangkat Anda.
`.trim();

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
    onNotify('WhatsApp Terbuka', `Membuka WhatsApp untuk mengirim tanda terima donasi ke ${printDonaturItem.nama} (${phone}).`);
  };

  const handleDeleteDonatur = (id: string, nama: string) => {
    if (window.confirm(`Hapus data donatur ${nama}?`)) {
      setDonaturList(donaturList.filter((d) => d.id !== id));
      onNotify('Donatur Dihapus', `Data donatur ${nama} telah dihapus.`);
    }
  };

  const handleOpenTanggunganModal = (row?: TanggunganRow) => {
    if (row) {
      setEditingTanggungan(row);
      setFormTanggunganTahun(row.tahunAnggaran);
      setFormTanggunganNominal(row.nominal);
      setFormTanggunganTindak(row.tindakLanjut);
      setFormKeterangan(row.keterangan);
    } else {
      setEditingTanggungan(null);
      setFormTanggunganTahun('2026/2027');
      setFormTanggunganNominal(0);
      setFormTanggunganTindak('');
      setFormKeterangan('');
    }
    setShowTanggunganModal(true);
  };

  const handleSaveTanggungan = (e: React.FormEvent) => {
    e.preventDefault();
    if (formTanggunganNominal <= 0 || !formKeterangan.trim()) {
      onNotify('Form Belum Lengkap', 'Keterangan dan Nominal wajib diisi.');
      return;
    }

    if (editingTanggungan) {
      const updatedList = tanggunganList.map((item) =>
        item.id === editingTanggungan.id
          ? {
              ...item,
              tahunAnggaran: formTanggunganTahun,
              nominal: formTanggunganNominal,
              tindakLanjut: formTanggunganTindak,
              keterangan: formKeterangan,
            }
          : item
      );
      setTanggunganList(updatedList);
      onNotify('Pengeluaran Diperbarui', `Tanggungan organisasi berhasil diperbarui.`);
    } else {
      const newTanggungan: TanggunganRow = {
        id: 'tanggungan-' + Date.now(),
        no: tanggunganList.length + 1,
        tahunAnggaran: formTanggunganTahun || (selectedYear === '2026' ? '2026 / 1448 H' : selectedYear === '2025' ? '2025 / 1447 H' : selectedYear === '2024' ? '2024 / 1445 H' : '2026 / 1448 H'),
        nominal: formTanggunganNominal,
        tindakLanjut: formTanggunganTindak,
        keterangan: formKeterangan,
        tahun: selectedYear !== 'Semua' ? selectedYear : '2026'
      };
      setTanggunganList([newTanggungan, ...tanggunganList]);
      onNotify('Pengeluaran Ditambahkan', `Tanggungan organisasi berhasil disimpan.`);
    }
    setShowTanggunganModal(false);
  };

  const handleDeleteTanggungan = (id: string) => {
    if (window.confirm('Hapus data pengeluaran/tanggungan ini?')) {
      setTanggunganList(tanggunganList.filter((t) => t.id !== id));
      onNotify('Pengeluaran Dihapus', 'Data pengeluaran/tanggungan telah dihapus.');
    }
  };

  // Excel Handlers
  const handleDownloadTemplate = () => {
    if (activeSubTab === 'iuran') {
      const headers = ['NO', 'NIS', 'NAMA', 'ASRAMA', 'NO_HP', 'TIPE', 'NOMINAL_BULAN', 'JENIS_IURAN', 'DZULQODAH', 'DZULHIJJAH', 'MUHARROM', 'SHOFAR', 'ROBIUL AWWAL', 'ROBIUS TSANI', 'JUMADIL ULA', 'JUMADIL AKHIR'];
            downloadCsvTemplate('Template_Iuran_Aktivis', headers, sample);
    } else if (activeSubTab === 'donatur') {
      const headers = ['NO', 'HARI TANGGAL', 'NAMA DONATUR', 'ALAMAT', 'NOMINAL', 'PENERIMA', 'KETERANGAN'];
            downloadCsvTemplate('Template_Donatur', headers, sample);
    } else {
      const headers = ['NO', 'TAHUN ANGGARAN', 'NOMINAL', 'TINDAK LANJUT', 'KETERANGAN'];
            downloadCsvTemplate('Template_Tanggungan', headers, sample);
    }
    onNotify('Template Didownload', `Template Excel ${activeSubTab.toUpperCase()} berhasil diunduh.`);
  };

  const handleExportExcel = () => {
    if (activeSubTab === 'iuran') {
      const headers = ['NO', 'NIS', 'NAMA LENGKAP', 'ASRAMA / DESA', 'NO HP / WA', 'TIPE', 'JENIS IURAN', 'TOTAL DIBAYAR (RP)', 'DZULQODAH', 'DZULHIJJAH', 'MUHARROM', 'SHOFAR', 'ROBIUL AWWAL', 'ROBIUS TSANI', 'JUMADIL ULA', 'JUMADIL AKHIR', 'STATUS KETERANGAN'];
      const rows = iuranList.map((item, idx) => [
        idx + 1, item.nis, item.nama, item.asrama, item.noHandphone || '-', item.tipe || 'putra',
        item.jenisIuran || 'Iuran Wajib Rutin 9 Bulan',
        calculateRowTotal(item),
        item.dzulqodah ? 'LUNAS' : 'BELUM', item.dzulhijjah ? 'LUNAS' : 'BELUM',
        item.muharrom ? 'LUNAS' : 'BELUM', item.shofar ? 'LUNAS' : 'BELUM',
        item.robiulAwwal ? 'LUNAS' : 'BELUM', item.robiusTsani ? 'LUNAS' : 'BELUM',
        item.jumadilUla ? 'LUNAS' : 'BELUM', item.jumadilAkhir ? 'LUNAS' : 'BELUM',
        item.rojab ? 'LUNAS' : 'BELUM', item.keterangan || '-'
      ]);
      exportToExcel(
        'Rekap_Iuran_Bulanan_Bendahara',
        headers,
        rows,
        {
          title: 'ORGANISASI FOKUS SAPUDI - REKAP IURAN BULANAN 8 BULAN',
          subtitle: 'Laporan Pembayaran Iuran Rutin Periode Dzulqo\'dah - Jumadil Akhir',
          sheetName: 'Rekap Iuran Bulanan'
        }
      );
    } else if (activeSubTab === 'donatur') {
      const headers = ['NO', 'HARI & TANGGAL', 'NAMA DONATUR', 'ALAMAT LENGKAP', 'NOMINAL DONASI (RP)', 'PENERIMA', 'KETERANGAN'];
      const rows = donaturList.map((item, idx) => [
        idx + 1, item.hariTanggal, item.nama, item.alamat, item.nominal, item.penerima, item.keterangan
      ]);
      exportToExcel(
        'Daftar_Donatur_Wakaf_Fokus',
        headers,
        rows,
        {
          title: 'ORGANISASI FOKUS SAPUDI - DAFTAR DONATUR & WAKAF',
          subtitle: 'Rekapitulasi Sumbangan Dana dan Dermawan Organisasi',
          sheetName: 'Daftar Donatur'
        }
      );
    } else if (activeSubTab === 'tanggungan') {
      const headers = ['NO', 'TAHUN ANGGARAN', 'NOMINAL TANGGUNGAN (RP)', 'TINDAK LANJUT', 'KETERANGAN'];
      const rows = tanggunganList.map((item, idx) => [
        idx + 1, item.tahunAnggaran, item.nominal, item.tindakLanjut, item.keterangan
      ]);
      exportToExcel(
        'Laporan_Tanggungan_Organisasi',
        headers,
        rows,
        {
          title: 'ORGANISASI FOKUS SAPUDI - TANGGUNGAN ORGANISASI',
          subtitle: 'Rekapitulasi Pengeluaran / Tanggungan Beban Kerja Organisasi',
          sheetName: 'Tanggungan Organisasi'
        }
      );
    } else {
      const headers = ['NO', 'KATEGORI KAS & TRANSAKSI', 'NOMINAL RUPIAH (RP)', 'KETERANGAN STATUS'];
      const rows = [
        [1, 'Saldo Awal Kas Organisasi', saldoAwal, 'Kas Awal'],
        [2, 'Total Penerimaan Iuran Anggota', totalIuranSum, 'Debit Iuran Wajib'],
        [3, 'Total Penerimaan Donatur & Wakaf', totalDonaturSum, 'Debit Donatur'],
        [4, 'TOTAL KAS MASUK KOTOR (DEBIT)', totalDebit, 'Total Penerimaan Kas'],
        [5, 'TOTAL PENGELUARAN & TANGGUNGAN (KREDIT)', totalKredit, 'Total Belanja Organisasi'],
        [6, 'SISA SALDO KAS BERSIH (NETTO)', totalSaldo, 'Saldo Kas Riil']
      ];
      exportToExcel(
        'Rekap_Global_Kas_Bendahara',
        headers,
        rows,
        {
          title: 'ORGANISASI FOKUS SAPUDI - REKAPITULASI KAS GLOBAL BENDAHARA',
          subtitle: 'Ikhtisar Keuangan Penerimaan dan Pengeluaran Kas',
          sheetName: 'Kas Global'
        }
      );
    }
    onNotify('Export Excel Berhasil', `Data ${activeSubTab.toUpperCase()} berhasil diexport ke file Excel (.xlsx).`);
  };

  const handleExportAllWorkbook = () => {
    const iuranHeaders = ['NO', 'NIS', 'NAMA LENGKAP', 'ASRAMA / DESA', 'NO HP', 'TIPE', 'JENIS IURAN', 'TOTAL DIBAYAR (RP)', 'DZULQODAH', 'DZULHIJJAH', 'MUHARROM', 'SHOFAR', 'ROBIUL AWWAL', 'ROBIUS TSANI', 'JUMADIL ULA', 'JUMADIL AKHIR', 'STATUS'];
    const iuranRows = iuranList.map((item, idx) => [
      idx + 1, item.nis, item.nama, item.asrama, item.noHandphone || '-', item.tipe || 'putra',
      item.jenisIuran || 'Iuran Wajib Rutin 9 Bulan',
      calculateRowTotal(item),
      item.dzulqodah ? 'LUNAS' : 'BELUM', item.dzulhijjah ? 'LUNAS' : 'BELUM',
      item.muharrom ? 'LUNAS' : 'BELUM', item.shofar ? 'LUNAS' : 'BELUM',
      item.robiulAwwal ? 'LUNAS' : 'BELUM', item.robiusTsani ? 'LUNAS' : 'BELUM',
      item.jumadilUla ? 'LUNAS' : 'BELUM', item.jumadilAkhir ? 'LUNAS' : 'BELUM',
      item.rojab ? 'LUNAS' : 'BELUM', item.keterangan || '-'
    ]);

    const tanggunganHeaders = ['NO', 'TAHUN ANGGARAN', 'NOMINAL TANGGUNGAN (RP)', 'TINDAK LANJUT', 'KETERANGAN'];
    const tanggunganRows = tanggunganList.map((item, idx) => [
      idx + 1, item.tahunAnggaran, item.nominal, item.tindakLanjut, item.keterangan
    ]);

    const donaturHeaders = ['NO', 'HARI & TANGGAL', 'NAMA DONATUR', 'ALAMAT LENGKAP', 'NOMINAL DONASI (RP)', 'PENERIMA', 'KETERANGAN'];
    const donaturRows = donaturList.map((item, idx) => [
      idx + 1, item.hariTanggal, item.nama, item.alamat, item.nominal, item.penerima, item.keterangan
    ]);

    const kasHeaders = ['NO', 'POS ANGGARAN & KAS', 'NOMINAL (RP)', 'STATUS'];
    const kasRows = [
      [1, 'Saldo Awal Kas', saldoAwal, 'Kas Awal'],
      [2, 'Total Iuran Anggota', totalIuranSum, 'Debit Iuran'],
      [3, 'Total Donatur & Wakaf', totalDonaturSum, 'Debit Donatur'],
      [4, 'TOTAL KAS MASUK (DEBIT)', totalDebit, 'Total Masuk'],
      [5, 'TOTAL PENGELUARAN (KREDIT)', totalKredit, 'Total Keluar'],
      [6, 'SALDO KAS BERSIH', totalSaldo, 'Saldo Riil']
    ];

    exportMultiSheetWorkbook('Buku_Kas_Lengkap_Bendahara_Fokus', [
      {
        sheetName: 'Rekap Iuran 9 Bulan',
        title: 'ORGANISASI FOKUS SAPUDI - REKAP IURAN BULANAN',
        subtitle: 'Catatan Iuran Wajib (Dzulqo\'dah - Jumadil Akhir)',
        headers: iuranHeaders,
        rows: iuranRows
      },
      {
        sheetName: 'Tanggungan Beban Kas',
        title: 'ORGANISASI FOKUS SAPUDI - TANGGUNGAN ORGANISASI',
        subtitle: 'Daftar Tanggungan & Rencana Anggaran Pengeluaran',
        headers: tanggunganHeaders,
        rows: tanggunganRows
      },
      {
        sheetName: 'Daftar Donatur',
        title: 'ORGANISASI FOKUS SAPUDI - DAFTAR DONATUR & WAKAF',
        subtitle: 'Daftar Dermawan & Rekap Donasi Tunai',
        headers: donaturHeaders,
        rows: donaturRows
      },
      {
        sheetName: 'Ikhtisar Kas Global',
        title: 'ORGANISASI FOKUS SAPUDI - IKHTISAR KAS GLOBAL',
        subtitle: 'Rekapitulasi Arus Kas Bendahara',
        headers: kasHeaders,
        rows: kasRows
      }
    ]);

    onNotify('Buku Kas Lengkap Diexport', 'Seluruh tab (Iuran, Tanggungan, Donatur, Kas) berhasil diexport ke satu file Excel (.xlsx).');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseExcelFile(
      file,
      (dataRows) => {
        if (activeSubTab === 'donatur') {
          const newItems: DonaturRow[] = [];
          dataRows.forEach((cols, idx) => {
            if (cols.length >= 2) {
              const hasNoCol = !isNaN(Number(cols[0]));
              const offset = hasNoCol ? 1 : 0;
              newItems.push({
                id: 'imp-donatur-' + Date.now() + '-' + idx,
                no: donaturList.length + idx + 1,
                hariTanggal: cols[offset] || '17 Ramadhan 1448 H',
                nama: cols[offset + 1] || 'H. Donatur',
                alamat: cols[offset + 2] || 'Sapudi',
                nominal: Number(cols[offset + 3]) || 1000000,
                penerima: cols[offset + 4] || 'Bendahara',
                keterangan: cols[offset + 5] || 'Wakaf'
              });
            }
          });
          setDonaturList([...newItems, ...donaturList]);
          onNotify('Import Berhasil', `${newItems.length} donatur berhasil di-import dari Excel.`);
        } else if (activeSubTab === 'iuran') {
          const newItems: IuranRow[] = [];
          dataRows.forEach((cols, idx) => {
            if (cols.length >= 2) {
              const hasNoCol = !isNaN(Number(cols[0]));
              const offset = hasNoCol ? 1 : 0;
              newItems.push({
                id: 'imp-iuran-' + Date.now() + '-' + idx,
                no: iuranList.length + idx + 1,
                nis: cols[offset] || '10000' + idx,
                nama: cols[offset + 1] || 'Aktivis Baru',
                asrama: cols[offset + 2] || 'Sapudi',
                noHandphone: cols[offset + 3] || '',
                tipe: (cols[offset + 4] as any) || 'putra',
                nominalPerBulan: Number(cols[offset + 5]) || 50000,
                jenisIuran: cols[offset + 6] || 'Iuran Wajib',
                dzulqodah: true, dzulhijjah: true, muharrom: false, shofar: false,
                robiulAwwal: false, robiusTsani: false, jumadilUla: false, jumadilAkhir: false, rojab: false,
                keterangan: cols[offset + 7] || 'Aktif'
              });
            }
          });
          setIuranList([...newItems, ...iuranList]);
          onNotify('Import Berhasil', `${newItems.length} data iuran aktivis berhasil di-import.`);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      (err) => onNotify('Import Gagal', err)
    );
  };

  // Filtered Iuran List
  const filteredIuran = filteredIuranList.filter((item) => {
    const matchesCategory =
      iuranCategoryFilter === 'all' || item.tipe === iuranCategoryFilter;
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.asrama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.noHandphone && item.noHandphone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.jenisIuran && item.jenisIuran.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const paginatedIuran = filteredIuran.slice((iuranPage - 1) * iuranPageSize, iuranPage * iuranPageSize);
  const paginatedTanggungan = filteredTanggunganList.slice((tanggunganPage - 1) * tanggunganPageSize, tanggunganPage * tanggunganPageSize);
  const paginatedDonatur = filteredDonaturList.slice((donaturPage - 1) * donaturPageSize, donaturPage * donaturPageSize);
  const paginatedTransaksi = filteredTransactionsList.slice((transaksiPage - 1) * transaksiPageSize, transaksiPage * transaksiPageSize);

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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Modul F - Keuangan
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tersinkron Database Sensus</span>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-emerald-950 mt-2">
            BENDAHARA: Iuran Anggota, Tanggungan, Donatur & Struk WA
          </h2>
          <p className="text-xs text-emerald-600 mt-1">
            Pencatatan iuran 9 bulan (Dzulqo'dah - Rojab), kustomisasi tarif nominal iuran, cetak struk ber-nominal & fitur kirim pesan WhatsApp otomatis.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200"
            title="Download Template Format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Template</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200"
            title="Import Data Excel"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200"
            title="Export Tab Aktif ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handleExportAllWorkbook}
            className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
            title="Export Seluruh Buku Kas (Iuran, Tanggungan, Donatur, Kas Global) ke 1 Berkas Excel Multi-Sheet"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Buku Kas (.xlsx)</span>
          </button>

          <button
            onClick={() => setShowPrintRekapModal(true)}
            className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Kas Masuk (Debit)</p>
            <p className="text-2xl font-bold text-emerald-950 mt-1 font-mono">Rp {totalDebit.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Pengeluaran (Kredit)</p>
            <p className="text-2xl font-bold text-red-700 mt-1 font-mono">Rp {totalKredit.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-700 rounded-2xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Saldo Kas Bersih</p>
            <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">Rp {totalSaldo.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap bg-emerald-50/60 p-2 rounded-2xl border border-emerald-100 gap-2">
        {[
          { id: 'iuran', label: 'Iuran Anggota (Sensus Sync)' },
          { id: 'tanggungan', label: 'Tanggungan Organisasi' },
          { id: 'donatur', label: 'Donatur & Wakaf' },
          { id: 'transaksi', label: 'Riwayat Transaksi (Struk)' },
          { id: 'kas', label: 'Rekap Globalisasi Kas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === tab.id
                ? 'bg-emerald-900 text-amber-200 shadow'
                : 'text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Iuran Anggota Sensus */}
      {activeSubTab === 'iuran' && (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden space-y-0">
          
          {/* Top Control Bar */}
          <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-amber-200 text-base">MATRIKS IURAN ANGGOTA (DZULQO'DAH s.d JUMADIL AKHIR)</h3>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-300/30">
                    {iuranList.length} Anggota Terdaftar
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Tersinkron dengan Database Sensus Sahmasy. Lengkap dengan nominal iuran & fitur kirim Struk WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Button Kustom Iuran Settings */}
                <button
                  onClick={() => setShowCustomIuranModal(true)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                  title="Atur Kustom Nominal & Penerapan Massal"
                >
                  <Sliders className="w-4 h-4 text-emerald-950" />
                  <span>Kustom Iuran</span>
                </button>

                {/* Button Sinkronkan Sensus */}
                <button
                  onClick={handleSyncWithSensus}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-700 shadow-sm"
                  title="Tarik data anggota dari Database Sensus jika belum ada"
                >
                  <RefreshCw className="w-4 h-4 text-amber-300" />
                  <span>Sinkron Sensus</span>
                </button>

                {/* Button Form Input Pembayaran Baru */}
                <button
                  onClick={() => handleOpenIuranModal()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input Iuran Baru</span>
                </button>
              </div>
            </div>

            {/* Category Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Semua Anggota' },
                  { id: 'putra', label: 'Sahmasy Putra' },
                  { id: 'putri', label: 'Sahmasy Putri' },
                  { id: 'santri_putra', label: 'Santri Putra' },
                  { id: 'santri_putri', label: 'Santri Putri' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setIuranCategoryFilter(cat.id as any);
                      setIuranPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      iuranCategoryFilter === cat.id
                        ? 'bg-amber-300 text-emerald-950 font-bold shadow'
                        : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-emerald-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIuranPage(1);
                  }}
                  placeholder="Cari nama, NIS, desa..."
                  className="w-full pl-8 pr-3 py-1.5 bg-emerald-800/80 border border-emerald-700/80 rounded-xl text-xs text-white placeholder-emerald-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              </div>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-10">NO</th>
                  <th className="p-3">ANGGOTA SENSUS</th>
                  <th className="p-3">ALAMAT / DESA</th>
                  <th className="p-3 font-mono">NOMINAL / BLN</th>
                  <th className="p-3 text-center font-mono">TOTAL DIBAYAR</th>
                  <th className="p-3 text-center">DZUL</th>
                  <th className="p-3 text-center">HIJ</th>
                  <th className="p-3 text-center">MUH</th>
                  <th className="p-3 text-center">SHOF</th>
                  <th className="p-3 text-center">ROB.I</th>
                  <th className="p-3 text-center">ROB.II</th>
                  <th className="p-3 text-center">JUM.I</th>
                  <th className="p-3 text-center">JUM.II</th>
                  <th className="p-3 text-center font-mono text-red-700">SISA BELUM</th>
                  <th className="p-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {filteredIuran.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-8 text-center text-emerald-600">
                      Tidak ada data iuran yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedIuran.map((item, index) => {
                    const rowTotal = calculateRowTotal(item);
                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                        <td className="p-3 text-center font-bold text-emerald-700">{(iuranPage - 1) * iuranPageSize + index + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-emerald-950">{item.nama}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              {item.nis}
                            </span>
                            {item.tipe && (
                              <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {item.tipe.replace('_', ' ')}
                              </span>
                            )}
                            {item.jenisIuran && (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{item.jenisIuran}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-emerald-800">
                          <p>{item.asrama}</p>
                          {item.noHandphone && (
                            <p className="text-[10px] text-emerald-600 font-mono">WA: {item.noHandphone}</p>
                          )}
                        </td>
                        <td className="p-3 font-mono text-emerald-900 font-medium">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded font-bold text-emerald-950">
                            Rp {(item.nominalPerBulan || 50000).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-950 bg-emerald-50/40">
                          Rp {rowTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center">{item.dzulqodah ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.dzulhijjah ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.muharrom ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.shofar ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.robiulAwwal ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.robiusTsani ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.jumadilUla ? '✅' : '❌'}</td>
                        <td className="p-3 text-center">{item.jumadilAkhir ? '✅' : '❌'}</td>
                        <td className="p-3 text-center font-mono font-bold text-red-700 bg-red-50/40">
                          Rp {((9 * (item.nominalPerBulan || 50000)) - rowTotal).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenIuranModal(item, 'payment')}
                              className="px-2 py-1 bg-emerald-800 text-white hover:bg-emerald-700 rounded-lg transition shadow-sm font-bold text-[10px]"
                              title="Bayar Iuran (Angsuran Baru)"
                            >
                              <Plus className="w-3.5 h-3.5 inline mr-1" /> Bayar
                            </button>
                            <button
                              onClick={() => handleOpenIuranModal(item, 'edit')}
                              className="px-2 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg transition shadow-sm font-bold text-[10px]"
                              title="Edit Data Iuran"
                            >
                              <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteIuran(item.id, item.nama)}
                              className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-sm font-bold text-[10px]"
                              title="Hapus Iuran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
            currentPage={iuranPage}
            totalItems={filteredIuran.length}
            pageSize={iuranPageSize}
            onPageChange={setIuranPage}
            onPageSizeChange={setIuranPageSize}
            itemLabel="iuran"
          />
        </div>
      )}

      {/* Tab 2: Tanggungan */}
      {activeSubTab === 'tanggungan' && (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-amber-200 text-base">TANGGUNGAN ORGANISASI & TINDAK LANJUT</h3>
              <p className="text-xs text-emerald-200">Daftar tanggungan anggaran dan cetak tagihan resmi</p>
            </div>
            <button
              onClick={handleOpenTanggunganModal}
              className="px-4 py-2 bg-amber-400 text-amber-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition shadow inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Input Pengeluaran / Tanggungan
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-12">NO</th>
                  <th className="p-3">TAHUN ANGGARAN</th>
                  <th className="p-3">NOMINAL (RP.)</th>
                  <th className="p-3">TINDAK LANJUT</th>
                  <th className="p-3">KETERANGAN</th>
                  <th className="p-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {tanggunganList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-emerald-600">
                      Belum ada data tanggungan.
                    </td>
                  </tr>
                ) : (
                  paginatedTanggungan.map((item, index) => (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-emerald-700">{(tanggunganPage - 1) * tanggunganPageSize + index + 1}</td>
                      <td className="p-3 font-semibold text-emerald-950">{item.tahunAnggaran}</td>
                      <td className="p-3 font-mono font-bold text-red-700">Rp {item.nominal.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-emerald-900">{item.tindakLanjut}</td>
                      <td className="p-3 text-emerald-700">{item.keterangan}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setPrintTagihanItem(item)}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition shadow-sm"
                            title="Cetak Tagihan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenTanggunganModal(item)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-sm"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTanggungan(item.id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-sm"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            currentPage={tanggunganPage}
            totalItems={tanggunganList.length}
            pageSize={tanggunganPageSize}
            onPageChange={setTanggunganPage}
            onPageSizeChange={setTanggunganPageSize}
            itemLabel="tanggungan"
          />
        </div>
      )}

      {/* Tab 3: Donatur */}
      {activeSubTab === 'donatur' && (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-amber-200 text-base">DAFTAR DONATUR & WAKAF ORGANISASI</h3>
              <p className="text-xs text-emerald-200">Pencatatan donatur, nominal, penerima, dan keterangan</p>
            </div>
            <button
              id="btn-tambah-donatur"
              onClick={() => handleOpenDonaturModal()}
              className="px-4 py-2 bg-amber-400 text-amber-950 font-bold rounded-xl text-xs hover:bg-amber-300 active:scale-95 transition shadow inline-flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <Plus className="w-4 h-4" /> Tambah Donatur
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-12">NO</th>
                  <th className="p-3">HARI / TANGGAL</th>
                  <th className="p-3">NAMA DONATUR</th>
                  <th className="p-3">ALAMAT</th>
                  <th className="p-3">NO. WA / HP</th>
                  <th className="p-3 text-right">NOMINAL (RP.)</th>
                  <th className="p-3">PENERIMA</th>
                  <th className="p-3">KETERANGAN</th>
                  <th className="p-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {donaturList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-emerald-600">
                      Belum ada data donatur. Silakan klik tombol <b>Tambah Donatur</b> di atas untuk mencatat sumbangan baru.
                    </td>
                  </tr>
                ) : (
                  paginatedDonatur.map((item, index) => (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-emerald-700">{(donaturPage - 1) * donaturPageSize + index + 1}</td>
                      <td className="p-3 font-semibold text-emerald-950">{item.hariTanggal}</td>
                      <td className="p-3 font-bold text-emerald-900">
                        <div className="flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{item.nama}</span>
                        </div>
                      </td>
                      <td className="p-3 text-emerald-700">{item.alamat || '-'}</td>
                      <td className="p-3 text-emerald-800 font-mono text-[11px]">
                        {item.noHandphone ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium">
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            {item.noHandphone}
                          </span>
                        ) : (
                          <span className="text-emerald-400 italic text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-900">Rp {item.nominal.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-emerald-800 font-medium">{item.penerima}</td>
                      <td className="p-3 text-emerald-700">
                        <span className="inline-block bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100 text-[11px]">
                          {item.keterangan || 'Donasi Organisasi'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setPrintDonaturItem(item);
                              setDonaturWaPhone(item.noHandphone || '');
                            }}
                            className="p-1.5 bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200 rounded-lg transition shadow-xs cursor-pointer"
                            title="Cetak Kwitansi Tanda Terima & Kirim WhatsApp"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDonaturModal(item)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-xs cursor-pointer"
                            title="Edit Data Donatur"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDonatur(item.id, item.nama)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-xs cursor-pointer"
                            title="Hapus Donatur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            currentPage={donaturPage}
            totalItems={donaturList.length}
            pageSize={donaturPageSize}
            onPageChange={setDonaturPage}
            onPageSizeChange={setDonaturPageSize}
            itemLabel="donatur"
          />
        </div>
      )}

      {/* Tab 5: Transaksi / Riwayat Pembayaran */}
      {activeSubTab === 'transaksi' && (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-emerald-100 bg-emerald-900 text-white flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-amber-200 text-base">RIWAYAT TRANSAKSI & STRUK PEMBAYARAN</h3>
              <p className="text-xs text-emerald-200">Setiap struk yang tercetak akan tersimpan otomatis di sini untuk dapat dikirim ulang.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-12">NO</th>
                  <th className="p-3">ID STRUK</th>
                  <th className="p-3">TANGGAL TRANSAKSI</th>
                  <th className="p-3">NAMA ANGGOTA (NIS)</th>
                  <th className="p-3">BULAN DIBAYAR</th>
                  <th className="p-3">TOTAL BAYAR</th>
                  <th className="p-3 text-center">AKSI & STRUK WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-emerald-600 font-medium italic bg-emerald-50/20">
                      Belum ada riwayat transaksi pembayaran iuran baru.
                    </td>
                  </tr>
                ) : (
                  paginatedTransaksi.map((trx, index) => (
                    <tr key={trx.id} className="hover:bg-emerald-50/50 transition">
                      <td className="p-3 text-center font-bold text-emerald-700">{(transaksiPage - 1) * transaksiPageSize + index + 1}</td>
                      <td className="p-3 font-mono font-bold text-emerald-900">{trx.id}</td>
                      <td className="p-3 font-medium text-emerald-800">{trx.tanggal}</td>
                      <td className="p-3">
                        <p className="font-bold text-emerald-950">{trx.nama}</p>
                        <p className="text-[10px] text-emerald-600 font-mono">{trx.nis}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {trx.bulanDibayar.map((b: string) => (
                            <span key={b} className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-700">Rp {trx.nominalTotal.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenStruk(trx)}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow"
                            title="Cetak & Kirim Struk WA"
                          >
                            <Printer className="w-3 h-3 text-amber-300" />
                            <span>Lihat Struk</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(trx.id, trx.nama)}
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-sm font-bold text-[10px]"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Hapus
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
            currentPage={transaksiPage}
            totalItems={transactions.length}
            pageSize={transaksiPageSize}
            onPageChange={setTransaksiPage}
            onPageSizeChange={setTransaksiPageSize}
            itemLabel="transaksi"
          />
        </div>
      )}

      {/* Tab 4: Rekap Kas */}
      {activeSubTab === 'kas' && (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-emerald-950">REKAP GLOBALISASI KAS ORGANISASI</h3>
              <p className="text-xs text-emerald-600">Laporan keuangan komprehensif debit, kredit, dan saldo bersih</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-amber-400 text-amber-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition shadow inline-flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => setShowPrintRekapModal(true)}
                className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow hover:bg-emerald-800 transition"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>

          {/* Input Saldo Awal */}
          <div className="bg-emerald-50/90 p-4 sm:p-5 rounded-2xl border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
             <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <p id="label-saldo-awal" className="text-sm sm:text-base font-bold text-emerald-950">
                     Saldo Awal Kas Organisasi
                   </p>
                   <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                     Custom Mulai Rp 0
                   </span>
                </div>
                <p className="text-xs text-emerald-700">
                  Nominal kas awal periode pembukuan. Bisa diisi bebas berapa pun mulai dari <b>Rp 0</b> (tanpa kas awal) hingga nominal saldo riil sebelumnya.
                </p>
                {saldoAwal > 0 ? (
                  <p className="text-[11px] text-emerald-800 italic">
                    Terbilang: <span className="font-semibold">{terbilang(saldoAwal)} Rupiah</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    Status: <span className="italic text-emerald-700">Kas dimulai murni dari Rp 0 (Nol Rupiah)</span>
                  </p>
                )}
             </div>

             <div className="flex flex-col md:items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                   <span className="text-emerald-900 font-bold font-mono text-sm">Rp</span>
                   <input
                     id="input-saldo-awal-kas"
                     type="number"
                     min={0}
                     step={1000}
                     value={saldoAwal === 0 ? '' : saldoAwal}
                     placeholder="0"
                     onChange={(e) => {
                       const val = e.target.value.trim();
                       if (val === '') {
                         setSaldoAwal(0);
                       } else {
                         const num = Number(val);
                         setSaldoAwal(isNaN(num) || num < 0 ? 0 : num);
                       }
                     }}
                     className="w-44 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-base font-bold text-emerald-950 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                   />
                </div>

                {/* Tombol Cepat Pilihan Saldo Awal */}
                <div className="flex flex-wrap items-center gap-1.5">
                   <button
                     id="btn-saldo-awal-nol"
                     type="button"
                     onClick={() => setSaldoAwal(0)}
                     className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                       saldoAwal === 0
                         ? 'bg-emerald-900 text-amber-200 border-emerald-950 shadow-xs'
                         : 'bg-white text-emerald-850 border-emerald-200 hover:bg-emerald-100/80 text-emerald-900'
                     }`}
                     title="Reset saldo awal menjadi Rp 0"
                   >
                     {saldoAwal === 0 && <Check className="w-3 h-3 text-amber-300" />}
                     <span>Mulai dari Rp 0</span>
                   </button>
                   {[1000000, 5000000, 10000000, 25000000].map((preset) => (
                     <button
                       key={preset}
                       type="button"
                       onClick={() => setSaldoAwal(preset)}
                       className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                         saldoAwal === preset
                           ? 'bg-emerald-800 text-amber-200 border-emerald-900 shadow-xs'
                           : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                       }`}
                     >
                       {preset >= 1000000 ? `${preset / 1000000} Jt` : `${preset / 1000} Rb`}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-semibold uppercase">Total Pemasukan (Debit)</p>
              <p className="text-2xl font-bold text-emerald-950 mt-2 font-mono">Rp {totalDebit.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-emerald-600 mt-1">Dari iuran, donatur, dan kas awal.</p>
            </div>
            <div className="p-5 bg-red-50/70 rounded-2xl border border-red-200">
              <p className="text-xs text-red-700 font-semibold uppercase">Total Pengeluaran (Kredit)</p>
              <p className="text-2xl font-bold text-red-900 mt-2 font-mono">Rp {totalKredit.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-red-600 mt-1">Biaya operasional & kegiatan fokus.</p>
            </div>
            <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200">
              <p className="text-xs text-amber-800 font-semibold uppercase">Saldo Kas Akhir</p>
              <p className="text-2xl font-bold text-amber-950 mt-2 font-mono">Rp {totalSaldo.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-amber-700 mt-1">Tersimpan aman di Rekening Resmi Fokus.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Donatur */}
      {showDonaturModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 border border-emerald-100 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-emerald-950">
                    {editingDonatur ? 'Edit Data Donatur & Wakaf' : 'Input Donatur & Wakaf Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-600">
                    Pencatatan sumbangan, wakaf tunai, infaq, dan sedekah organisasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDonaturModal(false)}
                className="p-1.5 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDonatur} className="space-y-4 text-xs">
              <div className="space-y-3.5">
                
                {/* Bagian 1: Identitas Donatur */}
                <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-emerald-900">
                        Nama Donatur / Dermawan <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 font-medium">Bisa dari anggota atau luar</span>
                    </div>
                    <input
                      type="text"
                      list="sensus-member-suggestions"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Contoh: H. Syamsul Arifin / K. Ach. Zaini"
                    />
                    <datalist id="sensus-member-suggestions">
                      {sahmasy.slice(0, 50).map((m) => (
                        <option key={m.id} value={m.nama}>
                          {m.desa ? `Desa ${m.desa}` : m.alamat || 'Anggota'}
                        </option>
                      ))}
                    </datalist>

                    {/* Smart Autofill Suggestion if matched */}
                    {(() => {
                      if (!formNama.trim() || formNama.trim().length < 2) return null;
                      const matched = sahmasy.find(m => m.nama.toLowerCase().includes(formNama.toLowerCase().trim()));
                      if (!matched || matched.nama.toLowerCase() === formNama.toLowerCase().trim()) return null;
                      return (
                        <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-amber-900 text-[11px] truncate">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">Sensus: <b>{matched.nama}</b> ({matched.desa ? `Desa ${matched.desa}` : matched.alamat || 'Warga Sapudi'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormNama(matched.nama);
                              if (matched.desa || matched.alamat) {
                                setFormDonaturAlamat(matched.desa ? `Desa ${matched.desa}` : (matched.alamat || 'Sapudi'));
                              }
                              if (matched.noHandphone) {
                                setFormDonaturNoHp(matched.noHandphone);
                              }
                            }}
                            className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[10px] shrink-0 transition cursor-pointer"
                          >
                            Pakai Data
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">Alamat / Asal</label>
                      <input
                        type="text"
                        value={formDonaturAlamat}
                        onChange={(e) => setFormDonaturAlamat(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="Contoh: Desa Gayam / Sapudi"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">No. WhatsApp / HP</label>
                      <input
                        type="tel"
                        value={formDonaturNoHp}
                        onChange={(e) => setFormDonaturNoHp(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="Contoh: 08123456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Nominal & Preset Cepat */}
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-950">
                      Nominal Donasi / Wakaf <span className="text-red-500">*</span>
                    </label>
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      Rp {formDonaturNominal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-mono font-bold text-amber-900 text-xs">Rp</span>
                    <input
                      type="number"
                      value={formDonaturNominal || ''}
                      onChange={(e) => setFormDonaturNominal(Number(e.target.value))}
                      required
                      min={1000}
                      step={1000}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-white text-amber-950 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="100000"
                    />
                  </div>

                  {/* Terbilang Preview */}
                  {formDonaturNominal > 0 && (
                    <div className="text-[11px] text-emerald-800 italic bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200">
                      Terbilang: <span className="font-semibold capitalize">{terbilang(formDonaturNominal)} Rupiah</span>
                    </div>
                  )}

                  {/* Quick Preset Nominal Chips */}
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold uppercase block mb-1">Pilihan Nominal Cepat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[50000, 100000, 250000, 500000, 1000000, 2500000, 5000000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormDonaturNominal(preset)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                            formDonaturNominal === preset
                              ? 'bg-emerald-800 text-amber-200 border-emerald-900 shadow-xs'
                              : 'bg-white text-emerald-950 border-amber-200 hover:bg-amber-100/70'
                          }`}
                        >
                          {preset >= 1000000 ? `${preset / 1000000} Jt` : `${preset / 1000} Rb`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bagian 3: Automated Day & Date Selector */}
                <div className="space-y-2.5 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100/80">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 mb-1">Tanggal Masehi</label>
                      <input
                        type="date"
                        value={donDate}
                        onChange={e => handleDonDateChange(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 mb-1">Hari</label>
                      <select
                        value={donDay}
                        onChange={e => handleDonDayChange(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
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
                        value={donTahun}
                        onChange={e => setDonTahun(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer font-semibold text-emerald-950"
                      >
                        <option value="2026">2026 / 1448 H</option>
                        <option value="2025">2025 / 1447 H</option>
                        <option value="2024">2024 / 1446 H</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Keterangan Hijriah (Opsional)</label>
                      <input
                        type="text"
                        value={donHijri}
                        onChange={e => handleDonHijriChange(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        placeholder="Contoh: 19 Shofar 1448 H"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-950 mb-1">Hasil Gabungan (Otomatis)</label>
                      <input
                        type="text"
                        required
                        value={formDonaturHari}
                        onChange={e => setFormDonaturHari(e.target.value)}
                        className="w-full p-2 text-xs bg-emerald-100/50 border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        placeholder="Contoh: Rabu, 2 September 2026"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 4: Penerima & Keterangan / Peruntukan */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Penerima Sumbangan</label>
                    <input
                      type="text"
                      value={formPenerima}
                      onChange={(e) => setFormPenerima(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {['H. Moh. Hasan (Bendahara)', 'K. Ach. Zaini (Ketua Umum)', 'Sekretariat Fokus Sapudi'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormPenerima(p)}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-medium transition cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-900 mb-1">Peruntukan / Jenis Wakaf</label>
                    <input
                      type="text"
                      value={formKeterangan}
                      onChange={(e) => setFormKeterangan(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Contoh: Wakaf Tunai Pembangunan Gedung"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {[
                        'Wakaf Tunai Pembangunan',
                        'Donasi Operasional Organisasi',
                        'Infaq Pengajian & Khotmil',
                        'Sedekah / Zakat Mal',
                        'Sponsor Hadiah Lomba',
                        'Sumbangan Acara Haul'
                      ].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setFormKeterangan(k)}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-medium transition cursor-pointer"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Option to Open Kwitansi / Tanda Terima Immediately */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={donaturAutoPrint}
                      onChange={(e) => setDonaturAutoPrint(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600 border-emerald-300"
                    />
                    <span className="font-semibold text-emerald-950 text-xs">
                      Langsung buka Tanda Terima & Kwitansi setelah disimpan
                    </span>
                  </label>
                  <Receipt className="w-4 h-4 text-emerald-700" />
                </div>

              </div>

              {/* Tombol Aksi Simpan */}
              <div className="pt-3 border-t border-emerald-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDonaturModal(false)}
                  className="px-4 py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-amber-200 rounded-xl font-bold hover:bg-emerald-800 transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  {editingDonatur ? 'Perbarui Data Donatur' : 'Simpan Data Donatur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Tanggungan */}
      {showTanggunganModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-emerald-100 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-emerald-950">
                  {editingTanggungan ? 'Edit Pengeluaran / Tanggungan' : 'Input Pengeluaran / Tanggungan Organisasi'}
                </h3>
              </div>
              <button onClick={() => setShowTanggunganModal(false)} className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTanggungan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3">
                 <div>
                    <label className="block font-bold text-emerald-900 mb-1">Tahun Anggaran</label>
                    <input type="text" value={formTanggunganTahun} onChange={(e) => setFormTanggunganTahun(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500" placeholder="Contoh: 2026/2027" />
                 </div>
                 <div>
                    <label className="block font-bold text-emerald-900 mb-1">Uraian / Keterangan Pengeluaran</label>
                    <input type="text" value={formKeterangan} onChange={(e) => setFormKeterangan(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500" placeholder="Contoh: Pembelian Sound System" />
                 </div>
                 <div>
                    <label className="block font-bold text-emerald-900 mb-1">Nominal (Rp)</label>
                    <input type="number" value={formTanggunganNominal || ''} onChange={(e) => setFormTanggunganNominal(Number(e.target.value))} required className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 font-mono" />
                 </div>
                 <div>
                    <label className="block font-bold text-emerald-900 mb-1">Tindak Lanjut / Status</label>
                    <input type="text" value={formTanggunganTindak} onChange={(e) => setFormTanggunganTindak(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500" placeholder="Contoh: Lunas, atau SP 1" />
                 </div>
              </div>
              <div className="pt-4 border-t border-emerald-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowTanggunganModal(false)} className="px-5 py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold transition">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-900 text-amber-200 rounded-xl font-bold hover:bg-emerald-800 transition shadow">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kustom Iuran & Tarif Global Settings */}
      {showCustomIuranModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-emerald-100 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Sliders className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-emerald-950">
                    Pengaturan Kustom Iuran & Tarif Batch
                  </h3>
                  <p className="text-xs text-emerald-600">
                    Atur nominal default per kategori dan terapkan kustomisasi massal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomIuranModal(false)}
                className="p-1 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Bagian 1: Default Nominal Per Kategori */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-3">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-emerald-700" />
                  <span>1. Default Tarif Nominal Per Bulan per Kategori Anggota:</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Sahmasy Putra (Rp)</label>
                    <input
                      type="number"
                      value={customNominalPutra}
                      onChange={(e) => setCustomNominalPutra(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-mono font-bold text-emerald-950"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Sahmasy Putri (Rp)</label>
                    <input
                      type="number"
                      value={customNominalPutri}
                      onChange={(e) => setCustomNominalPutri(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-mono font-bold text-emerald-950"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Santri Putra (Rp)</label>
                    <input
                      type="number"
                      value={customNominalSantriPutra}
                      onChange={(e) => setCustomNominalSantriPutra(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-mono font-bold text-emerald-950"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Santri Putri (Rp)</label>
                    <input
                      type="number"
                      value={customNominalSantriPutri}
                      onChange={(e) => setCustomNominalSantriPutri(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-mono font-bold text-emerald-950"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Penerapan Massal / Batch Apply */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-800" />
                  <span>2. Penerapan Massal (Batch Apply Custom Nominal):</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  Ubah tarif nominal bulanan untuk seluruh anggota di tabel secara serentak:
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Target Anggota:</label>
                    <select
                      value={massTargetCategory}
                      onChange={(e) => setMassTargetCategory(e.target.value as any)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-emerald-950 font-medium"
                    >
                      <option value="all">Semua Anggota ({iuranList.length} orang)</option>
                      <option value="putra">Khusus Sahmasy Putra</option>
                      <option value="putri">Khusus Sahmasy Putri</option>
                      <option value="santri_putra">Khusus Santri Putra</option>
                      <option value="santri_putri">Khusus Santri Putri</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">Nominal Kustom (Rp)</label>
                      <input
                        type="number"
                        value={massNominalValue}
                        onChange={(e) => setMassNominalValue(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-emerald-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">Jenis / Judul Tagihan</label>
                      <input
                        type="text"
                        value={massJenisIuranText}
                        onChange={(e) => setMassJenisIuranText(e.target.value)}
                        placeholder="Iuran Wajib Rutin 9 Bulan"
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-medium text-emerald-950"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMassApplyCustomNominal}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Ke Seluruh Tabel Now</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomIuranModal(false)}
                  className="px-5 py-2 bg-emerald-900 text-amber-200 rounded-xl font-bold hover:bg-emerald-800 transition shadow"
                >
                  Selesai & Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input / Edit Iuran */}
      {showIuranModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-emerald-100 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-emerald-950">
                  {!editingIuran ? 'Input Data Pembayaran Iuran Baru' : (iuranModalMode === 'payment' ? 'Input Angsuran Pembayaran Baru' : 'Perbaiki / Edit Data Iuran')}
                </h3>
                <p className="text-xs text-emerald-600">
                  {iuranModalMode === 'edit' ? 'Mode Perbaikan: Fitur untuk mengubah data yang sudah tersimpan atau membatalkan bulan.' : 'Sesuai daftar tabel iuran & tersinkronisasi dengan Database Sensus Sahmasy'}
                </p>
              </div>
              <button
                onClick={() => setShowIuranModal(false)}
                className="p-1 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIuran} className="space-y-4 text-xs">
              {/* Searchable Dropdown Auto-Pick from Sensus Database */}
              {sahmasy.length > 0 && !editingIuran && (
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-950 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-amber-700" />
                      <span>Cari & Pilih Dari Sensus Sahmasy (Pencarian Nama / NIS / Desa):</span>
                    </label>
                    <span className="text-[10px] bg-amber-200/90 text-amber-900 font-mono px-2 py-0.5 rounded-full font-bold border border-amber-300">
                      {sahmasy.length} Santri/Anggota
                    </span>
                  </div>

                  {/* Input Pencarian Nama, NIS, Desa */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-700" />
                    <input
                      type="text"
                      value={sensusSearchQuery}
                      onChange={(e) => setSensusSearchQuery(e.target.value)}
                      placeholder="🔎 Ketik Nama Santri, No. NIS, Desa, No. HP..."
                      className="w-full pl-8 pr-8 py-2 bg-white border border-amber-300 rounded-xl text-emerald-950 placeholder-amber-700/60 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {sensusSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSensusSearchQuery('')}
                        className="absolute right-2.5 top-2 text-amber-700 hover:text-amber-950"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Select Dropdown (Filtered) */}
                  <select
                    value={selectedSensusId}
                    onChange={(e) => handleSelectSensusMember(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl text-emerald-950 font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- {sensusSearchQuery ? `Hasil Filter (${filteredSensusList.length} Ditemukan)` : 'Pilih Langsung Dari Dropdown'} --</option>
                    {filteredSensusList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.nis}) - {m.tipe?.toUpperCase()} - Desa {m.desa || m.alamat}
                      </option>
                    ))}
                  </select>

                  {/* Realtime Search Option List Cards */}
                  {sensusSearchQuery && (
                    <div className="max-h-44 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-amber-200 shadow-inner">
                      {filteredSensusList.length === 0 ? (
                        <p className="p-3 text-center text-amber-800 text-xs italic">
                          Tidak ditemukan santri dengan kata kunci "{sensusSearchQuery}".
                        </p>
                      ) : (
                        filteredSensusList.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              handleSelectSensusMember(m.id);
                              setSensusSearchQuery('');
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between hover:bg-amber-100/90 ${
                              selectedSensusId === m.id ? 'bg-amber-200 font-bold border border-amber-400' : 'bg-amber-50/60'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-emerald-950 text-xs">{m.nama}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-amber-800 font-mono bg-amber-100 px-1.5 py-0.2 rounded">
                                  NIS: {m.nis}
                                </span>
                                <span className="text-[10px] text-emerald-800 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Desa: {m.desa || m.alamat}
                                </span>
                                {m.noHandphone && (
                                  <span className="text-[10px] text-blue-800 font-mono">
                                    WA: {m.noHandphone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg shadow-xs hover:bg-emerald-700">
                              Auto-Fill
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Member Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Nama Lengkap Anggota *</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Moh. Fajar Shodiq"
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">NIS / NIK</label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="SHM-PTR-01"
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Asrama / Alamat Desa</label>
                  <input
                    type="text"
                    value={formAsrama}
                    onChange={(e) => setFormAsrama(e.target.value)}
                    placeholder="Contoh: Desa Gayam"
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Kategori / Tipe Anggota</label>
                  <select
                    value={formTipe}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setFormTipe(newType);
                      if (newType === 'putri') setFormNominalBulan(customNominalPutri);
                      else if (newType === 'santri_putra') setFormNominalBulan(customNominalSantriPutra);
                      else if (newType === 'santri_putri') setFormNominalBulan(customNominalSantriPutri);
                      else setFormNominalBulan(customNominalPutra);
                    }}
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-medium"
                  >
                    <option value="putra">Sahmasy Putra</option>
                    <option value="putri">Sahmasy Putri</option>
                    <option value="santri_putra">Santri Putra</option>
                    <option value="santri_putri">Santri Putri</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Jenis / Judul Tagihan Iuran</label>
                  <select
                    value={formJenisIuran}
                    onChange={(e) => setFormJenisIuran(e.target.value)}
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl font-medium"
                  >
                    <option value="Iuran Wajib Rutin 9 Bulan">Iuran Wajib Rutin 9 Bulan</option>
                    <option value="Iuran Kas Khusus Organisasi">Iuran Kas Khusus Organisasi</option>
                    <option value="Iuran Pembangunan & Inventaris">Iuran Pembangunan & Inventaris</option>
                    <option value="Iuran Panitia Kegiatan / Lomba">Iuran Panitia Kegiatan / Lomba</option>
                    <option value="Iuran Sukarela / Insidental">Iuran Sukarela / Insidental</option>
                  </select>
                </div>
              </div>

              {/* Custom Nominal Section with Quick Preset Chips */}
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950">Nominal Iuran Per Bulan (Rp) Kustom:</label>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    Rp {formNominalBulan.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-emerald-700 font-semibold mr-1">Pilih Cepat:</span>
                  {PRESET_NOMINALS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormNominalBulan(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                        formNominalBulan === preset
                          ? 'bg-emerald-900 text-amber-300 shadow'
                          : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {(preset / 1000).toLocaleString('id-ID')}rb
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  value={formNominalBulan}
                  onChange={(e) => setFormNominalBulan(Number(e.target.value))}
                  placeholder="Ketik nominal kustom..."
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-emerald-950"
                />
              </div>

              {/* Checklist 9 Bulan Iuran */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <p className="font-bold text-emerald-950">Matriks Pembayaran Bulan Iuran (Centang Bulan Lunas):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {MONTH_LIST.map((m) => {
                    const isPreviouslyPaid = originalMonths[m.key as keyof typeof originalMonths];
                    return (
                      <label
                        key={m.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer text-xs font-medium ${
                          formMonths[m.key as keyof typeof formMonths]
                            ? 'bg-emerald-900 text-amber-200 border-emerald-800 font-bold'
                            : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50'
                        } ${isPreviouslyPaid ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isPreviouslyPaid}
                          checked={formMonths[m.key as keyof typeof formMonths]}
                          onChange={(e) =>
                            setFormMonths({ ...formMonths, [m.key]: e.target.checked })
                          }
                          className="rounded text-amber-500 focus:ring-amber-400 disabled:opacity-50 disabled:bg-emerald-900"
                        />
                        <span>{m.label} {isPreviouslyPaid ? '(Sudah Lunas)' : ''}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tanggal & Penerima */}
              <div className="space-y-2.5 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/70 mb-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">Pilih Tanggal Masehi (Pembayaran)</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => handlePayDateChange(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Hari</label>
                    <select
                      value={payDay}
                      onChange={e => handlePayDayChange(e.target.value)}
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
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Tambahan Keterangan Hijriah (Opsional)</label>
                    <input
                      type="text"
                      value={payHijri}
                      onChange={e => handlePayHijriChange(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      placeholder="Contoh: 15 Syawal 1447 H"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Hasil Gabungan Hari / Tanggal (Otomatis)</label>
                  <input
                    type="text"
                    required
                    value={formTanggalBayar}
                    onChange={e => setFormTanggalBayar(e.target.value)}
                    className="w-full p-2.5 text-xs bg-emerald-100/50 border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Contoh: Sabtu, 10 Syawal 1447 H"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Kasir / Penerima Bendahara</label>
                  <input
                    type="text"
                    value={formPenerima}
                    onChange={(e) => setFormPenerima(e.target.value)}
                    placeholder="H. Moh. Hasan"
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Catatan / Status Pembayaran</label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Lunas Periode Berjalan"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowIuranModal(false)}
                  className="px-4 py-2 bg-emerald-100 text-emerald-900 rounded-xl font-bold hover:bg-emerald-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-amber-200 rounded-xl font-bold hover:bg-emerald-800 transition shadow"
                >
                  {iuranModalMode === 'edit' ? 'Simpan Perbaikan Data' : 'Simpan Transaksi & Cetak Struk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Struk & WhatsApp Sending Modal */}
      {printStrukItem && (() => {
        const paidMonths = printStrukItem.bulanDibayar;
        const unpaidMonths = MONTH_LIST.map(m => m.label).filter(m => !paidMonths.includes(m));
        const nominalPerMonth = printStrukItem.nominalTotal / (paidMonths.length || 1);
        const totalAmount = printStrukItem.nominalTotal;
        const wordsTerbilang = terbilang(totalAmount);

        return (
          <PrintModal
            title={`Struk Pembayaran Iuran - ${printStrukItem.nama}`}
            onClose={() => setPrintStrukItem(null)}
          >
            <div className="space-y-4 font-sans text-xs">
              
              {/* WhatsApp & Image Export Quick Box */}
              <div className="bg-emerald-900 text-white p-4 rounded-2xl space-y-3 border border-emerald-800 shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-300" />
                    <span className="font-bold text-amber-200">Kirim Struk Gambar JPG via WhatsApp</span>
                  </div>
                  <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                    JPG Image Struk
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200">
                  Konversi otomatis desain struk di bawah menjadi gambar JPG. Anda dapat mengunduh gambar JPG, menyalin ke clipboard, atau langsung membuka WA:
                </p>

                {/* WA Phone Number Input & WA Button */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="text"
                      value={waNumberInput}
                      onChange={(e) => setWaNumberInput(e.target.value)}
                      placeholder="Nomor WhatsApp (Contoh: 081234567891)"
                      className="w-full pl-8 pr-3 py-2 bg-emerald-950/80 border border-emerald-700 rounded-xl text-white text-xs font-mono placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                  </div>
                  <button
                    onClick={handleSendWhatsAppStruk}
                    disabled={isGeneratingJpg}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isGeneratingJpg ? 'Processing JPG...' : 'Kirim WA & Auto Download JPG'}</span>
                  </button>
                </div>

                {/* Additional Direct Image Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-emerald-800/80">
                  <button
                    onClick={handleDownloadStrukJpg}
                    disabled={isGeneratingJpg}
                    className="flex-1 py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-amber-200 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border border-emerald-700 disabled:opacity-50 text-[11px]"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Download Gambar JPG Struk</span>
                  </button>
                  <button
                    onClick={handleCopyStrukImage}
                    disabled={isGeneratingJpg}
                    className="flex-1 py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-xl font-bold transition flex items-center justify-center gap-1.5 border border-emerald-700 disabled:opacity-50 text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Gambar Struk (Paste in WA)</span>
                  </button>
                </div>
              </div>

              {/* Official Struk Preview (Captured as JPG) */}
              <div ref={strukCardRef} className="bg-white p-6 rounded-2xl border-2 border-emerald-900 text-emerald-950 space-y-4">
                
                {/* Header Struk */}
                <div className="text-center border-b border-emerald-200 pb-3 space-y-1 relative">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto border-2 border-amber-400 shadow-md overflow-hidden p-0.5">
                    <img src={logoUrl || orgProfile?.logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <h2 className="text-sm font-serif font-bold text-emerald-950 tracking-wide uppercase pt-1">
                    STRUK RESMI PEMBAYARAN IURAN AKTIVIS
                  </h2>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                    {orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI PULAU SAPUDI (FOKUS)'}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-600">
                    No. Struk: {printStrukItem.id.toUpperCase()} | Tanggal: {printStrukItem.tanggal}
                  </p>
                </div>

                {/* Member Info */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                  <div>
                    <p className="text-emerald-700">Nama Anggota:</p>
                    <p className="font-bold text-emerald-950">{printStrukItem.nama}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">NIS / NIK:</p>
                    <p className="font-mono font-bold text-emerald-950">{printStrukItem.nis}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Jenis Iuran / Tagihan:</p>
                    <p className="font-bold text-amber-900">{printStrukItem.jenisIuran || 'Iuran Wajib Rutin 9 Bulan'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Asrama / Alamat:</p>
                    <p className="font-semibold text-emerald-900">{printStrukItem.asrama}</p>
                  </div>
                </div>

                {/* Paid Months Rincian */}
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950">Rincian Transaksi Saat Ini (Bulan Dibayar):</p>
                  {paidMonths.length === 0 ? (
                    <p className="text-red-600 italic">Belum ada bulan iuran yang ditandai lunas.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {paidMonths.map((m) => (
                        <div
                          key={m}
                          className="flex items-center justify-between p-1.5 bg-emerald-50 rounded-lg border border-emerald-200/60 text-[10px]"
                        >
                          <span className="font-bold text-emerald-900">✅ Bulan {m}</span>
                          <span className="font-mono text-emerald-700">
                            Rp {nominalPerMonth.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unpaid Months / Tanggungan */}
                <div className="space-y-1 pt-2 border-t border-emerald-100">
                  <p className="font-bold text-red-900">Sisa Tanggungan (Belum Lunas):</p>
                  {unpaidMonths.length === 0 ? (
                    <p className="text-emerald-700 italic">Alhamdulillah, seluruh tanggungan iuran telah lunas.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {unpaidMonths.map((m) => (
                        <span key={m} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-medium">
                          ❌ {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nominal Total Box & Terbilang */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-300/80 text-center space-y-1">
                  <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    TOTAL NOMINAL PEMBAYARAN IURAN
                  </p>
                  <p className="text-2xl font-bold font-mono text-emerald-950">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] font-serif italic font-semibold text-amber-900 pt-1 border-t border-amber-200">
                    Terbilang: "{wordsTerbilang}"
                  </p>
                </div>

                {/* Footer Signatures */}
                <div className="flex items-end justify-between text-[11px] pt-4 border-t border-emerald-200">
                  <div className="text-left space-y-1">
                    <p className="text-emerald-700">Status Pembayaran:</p>
                    <p className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block">
                      {printStrukItem.keterangan || 'LUNAS RESMI'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-emerald-700">Penerima / Bendahara,</p>
                    <div className="h-8"></div>
                    <p className="font-bold underline text-emerald-950">
                      ( {printStrukItem.penerima || orgProfile?.namaBendahara || 'H. MOH. HASAN'} )
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </PrintModal>
        );
      })()}

      {/* Print Tagihan Modal */}
      {printTagihanItem && (
        <PrintModal 
          title={`Surat Tagihan Resmi - ${printTagihanItem.tahunAnggaran}`} 
          onClose={() => setPrintTagihanItem(null)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="text-center space-y-3 text-xs">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto border-2 border-amber-400 shadow-md overflow-hidden p-0.5 mb-2">
              <img src={logoUrl || orgProfile?.logoUrl || "/logo.png"} alt="Logo Fokus" className="w-full h-full object-contain rounded-full" />
            </div>
            <h2 className="text-base font-serif font-bold text-emerald-950">SURAT PEMBERITAHUAN TANGGUNGAN ORGANISASI</h2>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI PULAU SAPUDI (FOKUS)'}</p>
            <div className="text-left border-t border-b border-emerald-200 py-3 my-3 space-y-2">
              <p><strong>Tahun Anggaran:</strong> {printTagihanItem.tahunAnggaran}</p>
              <p><strong>Nominal Tanggungan:</strong> <span className="font-mono font-bold text-red-700">Rp {printTagihanItem.nominal.toLocaleString('id-ID')}</span></p>
              <p><strong>Tindak Lanjut:</strong> {printTagihanItem.tindakLanjut}</p>
              <p><strong>Keterangan:</strong> {printTagihanItem.keterangan}</p>
            </div>
            <div className="text-right">
              <p>Pengurus Harian,</p>
              <div className="h-10"></div>
              <p className="font-bold underline">( {orgProfile?.namaKetua || 'PENGURUS FOKUS'} )</p>
            </div>
          </div>
        </PrintModal>
      )}

      {/* Print Rekap Kas Modal */}
      {showPrintRekapModal && (
        <PrintModal 
          title={`Rekap Laporan Keuangan Bendahara`} 
          onClose={() => setShowPrintRekapModal(false)}
          orgProfile={orgProfile}
          logoUrl={logoUrl}
        >
          <div className="text-center space-y-6 font-sans text-xs">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto border-2 border-amber-400 shadow-md overflow-hidden p-0.5 mb-2">
              <img src={logoUrl || orgProfile?.logoUrl || "/logo.png"} alt="Logo Fokus" className="w-full h-full object-contain rounded-full" />
            </div>
            <h2 className="text-base font-serif font-bold text-emerald-950 uppercase">
              LAPORAN REKAPITULASI KEUANGAN & KAS ORGANISASI
            </h2>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI PULAU SAPUDI (FOKUS)'}</p>
            <div className="border border-emerald-200 rounded-2xl p-6 text-left space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-emerald-900 border-b border-emerald-100 pb-1">RINCIAN PEMASUKAN (DEBIT)</h4>
                <div className="flex justify-between">
                  <span>Saldo Awal Kas:</span>
                  <span className="font-mono font-bold text-emerald-900">Rp {saldoAwal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Iuran Anggota:</span>
                  <span className="font-mono font-bold text-emerald-900">Rp {totalIuranSum.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Donatur & Wakaf:</span>
                  <span className="font-mono font-bold text-emerald-900">Rp {totalDonaturSum.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-100">
                  <span className="font-bold">TOTAL PEMASUKAN:</span>
                  <span className="font-mono font-bold text-emerald-900">Rp {totalDebit.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <h4 className="font-bold text-sm text-red-900 border-b border-red-100 pb-1">RINCIAN PENGELUARAN (KREDIT)</h4>
                <div className="flex justify-between">
                  <span>Total Tanggungan Organisasi:</span>
                  <span className="font-mono font-bold text-red-700">Rp {totalKredit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-100">
                  <span className="font-bold">TOTAL PENGELUARAN:</span>
                  <span className="font-mono font-bold text-red-700">Rp {totalKredit.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 mt-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex justify-between text-base">
                  <span className="font-bold text-amber-950">SALDO KAS BERSIH (AKHIR):</span>
                  <span className="font-mono font-bold text-amber-900">Rp {totalSaldo.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </PrintModal>
      )}

      {/* Modal Cetak Tanda Terima Donatur / Kwitansi */}
      {printDonaturItem && (
        <PrintModal
          title={`Tanda Terima Donasi - ${printDonaturItem.nama}`}
          onClose={() => setPrintDonaturItem(null)}
        >
          <div className="space-y-4 font-sans text-xs">
            {/* WhatsApp & Image Export Quick Box */}
            <div className="bg-emerald-900 text-white p-4 rounded-2xl space-y-3 border border-emerald-800 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-amber-300" />
                  <span className="font-bold text-amber-200">Kirim Tanda Terima Donasi via WhatsApp</span>
                </div>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                  Kwitansi Resmi Donatur
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Tanda terima donasi resmi ber-KOP Fokus Sapudi dapat langsung diunduh sebagai gambar JPG, disalin ke clipboard, atau dikirimkan ke WhatsApp donatur:
              </p>

              {/* WA Phone Number Input & WA Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                  <input
                    type="tel"
                    value={donaturWaPhone}
                    onChange={(e) => setDonaturWaPhone(e.target.value)}
                    placeholder="Nomor WhatsApp Donatur (Contoh: 08123456789)"
                    className="w-full pl-9 pr-3 py-2 bg-emerald-950/70 border border-emerald-700 rounded-xl text-white text-xs font-mono placeholder:text-emerald-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendWhatsAppDonatur}
                  disabled={isGeneratingDonaturJpg}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp & Download JPG</span>
                </button>
              </div>

              {/* Action Buttons: Download JPG & Copy Image */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-800/80">
                <button
                  type="button"
                  onClick={handleDownloadDonaturJpg}
                  disabled={isGeneratingDonaturJpg}
                  className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 active:scale-95 text-emerald-100 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Unduh File Gambar JPG</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyDonaturImage}
                  disabled={isGeneratingDonaturJpg}
                  className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 active:scale-95 text-emerald-100 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Salin Gambar (Clipboard)</span>
                </button>
                {isGeneratingDonaturJpg && (
                  <span className="text-[10px] text-amber-300 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Memproses gambar...
                  </span>
                )}
              </div>
            </div>

            {/* Official Tanda Terima Donatur Card (Captured as JPG) */}
            <div ref={donaturReceiptCardRef} className="bg-white p-6 sm:p-7 rounded-2xl border-2 border-emerald-900 text-emerald-950 space-y-4 shadow-sm">
              
              {/* Header KOP */}
              <div className="text-center border-b-2 border-emerald-900 pb-3 space-y-1 relative">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto border-2 border-amber-400 shadow-md overflow-hidden p-0.5">
                  <img src={logoUrl || orgProfile?.logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain rounded-full" />
                </div>
                <h2 className="text-sm sm:text-base font-serif font-bold text-emerald-950 tracking-wide uppercase pt-1">
                  TANDA TERIMA DONASI & WAKAF RESMI
                </h2>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  {orgProfile?.namaOrganisasi || 'FORUM KOMUNIKASI SANTRI PULAU SAPUDI (FOKUS)'}
                </p>
                <p className="text-[9px] text-emerald-600">
                  {orgProfile?.alamat || 'Sekretariat: Pulau Sapudi, Kab. Sumenep, Jawa Timur'} | No. Kontak: {orgProfile?.telepon || '081234567890'}
                </p>
                <div className="inline-block bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border border-emerald-300 mt-1">
                  No. Bukti: {printDonaturItem.id.toUpperCase()}
                </div>
              </div>

              {/* Rincian Donatur */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Telah Diterima Dari (Donatur):</span>
                    <span className="font-bold text-emerald-950 text-sm">{printDonaturItem.nama}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Alamat / Asal:</span>
                    <span className="font-semibold text-emerald-900">{printDonaturItem.alamat || 'Sapudi'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-100">
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Hari & Tanggal Donasi:</span>
                    <span className="font-semibold text-emerald-950">{printDonaturItem.hariTanggal}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Periode Tahun Anggaran:</span>
                    <span className="font-mono font-bold text-emerald-900">{printDonaturItem.tahun || '2026'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-100">
                  <span className="text-emerald-700 block text-[10px]">Peruntukan / Jenis Donasi:</span>
                  <span className="font-bold text-emerald-900">{printDonaturItem.keterangan || 'Wakaf Tunai / Donasi Organisasi'}</span>
                </div>
              </div>

              {/* Nominal Banner */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-4 rounded-xl border border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
                <div>
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">Jumlah Nominal Donasi</span>
                  <span className="text-2xl font-mono font-bold text-amber-300">
                    Rp {printDonaturItem.nominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right sm:max-w-[50%]">
                  <span className="text-[10px] text-emerald-200 block">Terbilang:</span>
                  <span className="text-xs font-semibold text-white italic">
                    "{terbilang(printDonaturItem.nominal)} Rupiah"
                  </span>
                </div>
              </div>

              {/* Doa & Ucapan Terima Kasih */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
                <p className="text-xs text-amber-950 font-serif italic">
                  "Jazakumullah Khairan Katsiran atas keikhlasan Bapak/Ibu sekalian. Semoga menjadi amal jariyah yang membawa keberkahan berlipat ganda bagi keluarga di dunia dan akhirat. Aamiin."
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200 text-center text-xs">
                <div className="space-y-12">
                  <p className="text-emerald-800 font-medium">Donatur / Penyumbang,</p>
                  <p className="font-bold text-emerald-950 border-t border-dotted border-emerald-400 pt-1 inline-block min-w-[120px]">
                    ( {printDonaturItem.nama} )
                  </p>
                </div>
                <div className="space-y-12">
                  <p className="text-emerald-800 font-medium">Penerima (Pengurus Fokus),</p>
                  <p className="font-bold text-emerald-950 border-t border-dotted border-emerald-400 pt-1 inline-block min-w-[120px]">
                    ( {printDonaturItem.penerima || 'H. Moh. Hasan'} )
                  </p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 text-center text-[9px] text-emerald-600 border-t border-emerald-100 flex items-center justify-between">
                <span>Dokumen Sah & Resmi Fokus Sapudi</span>
                <span className="font-mono">Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
              </div>

            </div>
          </div>
        </PrintModal>
      )}

    </div>
  );
};
