import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SahmasyRow, BerkasItem, IuranRow, OrganizationProfile } from '../types';
import { 
  Users, Plus, Search, Trash2, Upload, FileText, FileSpreadsheet, 
  Download, Printer, Edit3, Camera, Eye, X, User, Sparkles, 
  CheckCircle2, FileCheck, ArrowDownToLine, Image as ImageIcon, FolderOpen, 
  ShieldCheck, Loader2, ZoomIn, ZoomOut, RotateCw, BookOpen, 
  GraduationCap, Layers, Check, ExternalLink, RefreshCw, AlertCircle,
  Filter, CreditCard, CheckSquare, Square, Phone, MapPin, Calendar, 
  Building, ChevronRight, Info, DollarSign, ArrowRight
} from 'lucide-react';
import { PrintModal } from './PrintModal';
import { Pagination } from './Pagination';
import { downloadCsvTemplate, exportToExcel, parseExcelFile, exportMultiSheetWorkbook } from '../utils/excelUtils';
import { matchesYear } from '../utils/filterUtils';
import { 
  compressImage, 
  downloadFile, 
  getBerkasBadgeInfo, 
  uploadFileToServer, 
  getAllMemberBerkas,
  SHEET_DEFINITIONS,
  SheetDefinition
} from '../utils/fileUtils';
import { saveDoc, deleteDocFromDb, recordDeletedId } from '../firebase';
import { PermanentImage } from './PermanentImage';
import { saveMediaToVault } from '../utils/idbStorage';

interface SensusViewProps {
  sahmasy: SahmasyRow[];
  setSahmasy: React.Dispatch<React.SetStateAction<SahmasyRow[]>>;
  iuranList?: IuranRow[];
  setIuranList?: React.Dispatch<React.SetStateAction<IuranRow[]>>;
  onNotify: (title: string, message: string) => void;
  selectedYear?: string;
  orgProfile?: OrganizationProfile;
  logoUrl?: string;
  onNavigateTab?: (tab: string) => void;
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

export const SensusView: React.FC<SensusViewProps> = ({ 
  sahmasy, 
  setSahmasy, 
  iuranList = [],
  setIuranList,
  onNotify, 
  selectedYear = 'Semua',
  orgProfile,
  logoUrl,
  onNavigateTab
}) => {
  // Main Navigation View: 'table' (Tabular Sensus) or 'sheets_gallery' (Multi-Sheet Berkas Archive)
  const [viewMode, setViewMode] = useState<'table' | 'sheets_gallery'>('table');
  const [activeTipe, setActiveTipe] = useState<'putra' | 'putri' | 'santri_putra' | 'santri_putri' | 'semua'>('putra');
  const [activeGallerySheet, setActiveGallerySheet] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState<string>('semua');
  const [filterStatusBerkas, setFilterStatusBerkas] = useState<string>('semua');
  
  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<SahmasyRow | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [detailMember, setDetailMember] = useState<SahmasyRow | null>(null);
  const [previewSheetMember, setPreviewSheetMember] = useState<SahmasyRow | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('kk');
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isUploadingSheetModal, setIsUploadingSheetModal] = useState(false);

  // Form State for Adding / Editing Members
  const [formTipe, setFormTipe] = useState<'putra' | 'putri' | 'santri_putra' | 'santri_putri'>('putra');
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
  const [kecamatan, setKecamatan] = useState('Gayam');
  const [jabatan, setJabatan] = useState('');
  
  // Document Sheets State
  const [fotoUrl, setFotoUrl] = useState('');
  const [kkUrl, setKkUrl] = useState('');
  const [kkName, setKkName] = useState('');
  const [aktaUrl, setAktaUrl] = useState('');
  const [aktaName, setAktaName] = useState('');
  const [ktpUrl, setKtpUrl] = useState('');
  const [ktpName, setKtpName] = useState('');
  const [santriUrl, setSantriUrl] = useState('');
  const [santriName, setSantriName] = useState('');
  const [ijazahUrl, setIjazahUrl] = useState('');
  const [ijazahName, setIjazahName] = useState('');
  const [berkasList, setBerkasList] = useState<BerkasItem[]>([]);
  const [activeFormSheetTab, setActiveFormSheetTab] = useState<'kk' | 'akta' | 'ktp' | 'santri' | 'ijazah' | 'foto' | 'tambahan'>('kk');
  
  // Unlimited Batch Upload status indicators
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sheetModalInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const previewMultiFileInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  // Close excel dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (excelMenuRef.current && !excelMenuRef.current.contains(event.target as Node)) {
        setShowExcelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalPutra = sahmasy.filter(s => s.tipe === 'putra').length;
    const totalPutri = sahmasy.filter(s => s.tipe === 'putri').length;
    const totalSantriPutra = sahmasy.filter(s => s.tipe === 'santri_putra').length;
    const totalSantriPutri = sahmasy.filter(s => s.tipe === 'santri_putri').length;
    const totalKk = sahmasy.filter(s => !!(s.kkUrl || (s.berkasType === 'kk' && s.berkasUrl))).length;
    const totalAkta = sahmasy.filter(s => !!(s.aktaUrl || (s.berkasType === 'akta' && s.berkasUrl))).length;
    const totalKtp = sahmasy.filter(s => !!(s.ktpUrl || (s.berkasType === 'ktp' && s.berkasUrl))).length;
    const totalFoto = sahmasy.filter(s => !!s.fotoUrl).length;

    return {
      total: sahmasy.length,
      totalPutra,
      totalPutri,
      totalSantriPutra,
      totalSantriPutri,
      totalKk,
      totalAkta,
      totalKtp,
      totalFoto
    };
  }, [sahmasy]);

  // Main Filter Logic
  const filtered = useMemo(() => {
    return sahmasy.filter(item => {
      // Type filter
      if (activeTipe !== 'semua' && item.tipe !== activeTipe) return false;

      // Year filter
      if (!matchesYear(item, selectedYear)) return false;

      // Kecamatan filter
      if (filterKecamatan !== 'semua') {
        if (filterKecamatan === 'Gayam' && item.kecamatan.toLowerCase() !== 'gayam') return false;
        if (filterKecamatan === 'Nonggunong' && item.kecamatan.toLowerCase() !== 'nonggunong') return false;
        if (filterKecamatan === 'Luar Sapudi' && (item.kecamatan.toLowerCase() === 'gayam' || item.kecamatan.toLowerCase() === 'nonggunong')) return false;
      }

      // Status Berkas filter
      if (filterStatusBerkas !== 'semua') {
        const hasKk = !!(item.kkUrl || (item.berkasType === 'kk' && item.berkasUrl));
        const hasAkta = !!(item.aktaUrl || (item.berkasType === 'akta' && item.berkasUrl));
        const hasKtp = !!(item.ktpUrl || (item.berkasType === 'ktp' && item.berkasUrl));
        const hasFoto = !!item.fotoUrl;

        if (filterStatusBerkas === 'lengkap' && !(hasKk && hasAkta && hasKtp && hasFoto)) return false;
        if (filterStatusBerkas === 'ada_foto' && !hasFoto) return false;
        if (filterStatusBerkas === 'ada_kk' && !hasKk) return false;
        if (filterStatusBerkas === 'ada_ktp' && !hasKtp) return false;
        if (filterStatusBerkas === 'belum_ada_berkas' && (hasKk || hasAkta || hasKtp || hasFoto)) return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchName = item.nama.toLowerCase().includes(term);
        const matchNis = item.nis.toLowerCase().includes(term);
        const matchNik = item.nik.toLowerCase().includes(term);
        const matchDesa = item.desa.toLowerCase().includes(term);
        const matchAyah = item.ayah.toLowerCase().includes(term);
        const matchIbu = item.ibu.toLowerCase().includes(term);
        const matchHp = item.noHandphone.toLowerCase().includes(term);
        const matchJabatan = item.jabatan ? item.jabatan.toLowerCase().includes(term) : false;

        if (!matchName && !matchNis && !matchNik && !matchDesa && !matchAyah && !matchIbu && !matchHp && !matchJabatan) {
          return false;
        }
      }

      return true;
    });
  }, [sahmasy, activeTipe, selectedYear, filterKecamatan, filterStatusBerkas, searchTerm]);

  const paginatedList = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  // Filtered members for Gallery Sheets
  const galleryMembers = useMemo(() => {
    return sahmasy.filter(item => {
      if (!matchesYear(item, selectedYear)) return false;
      if (activeTipe !== 'semua' && item.tipe !== activeTipe) return false;
      if (searchTerm.trim() === '') return true;

      const term = searchTerm.toLowerCase();
      return (
        item.nama.toLowerCase().includes(term) ||
        item.nis.toLowerCase().includes(term) ||
        item.nik.toLowerCase().includes(term) ||
        item.desa.toLowerCase().includes(term)
      );
    });
  }, [sahmasy, selectedYear, activeTipe, searchTerm]);

  // Bulk Selection Helpers
  const isAllSelected = paginatedList.length > 0 && paginatedList.every(p => selectedIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedList.some(p => p.id === id)));
    } else {
      const pageIds = paginatedList.map(p => p.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Hapus ${selectedIds.length} data anggota yang dipilih secara bersamaan?`)) {
      selectedIds.forEach((id) => {
        recordDeletedId(id);
        deleteDocFromDb('sahmasy', id);
      });
      setSahmasy(prev => prev.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      onNotify('Hapus Massal Berhasil', `${selectedIds.length} data sensus anggota telah dihapus.`);
    }
  };

  const clearFormDraft = () => {
    try {
      localStorage.removeItem('fokus_sensus_form_draft');
    } catch {}
  };

  // Restore draft on initial mount if available and recent (deferred to avoid render contention)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedDraft = localStorage.getItem('fokus_sensus_form_draft');
        if (savedDraft) {
          const d = JSON.parse(savedDraft);
          if (d && (d.nama || d.nis || d.kkUrl || d.fotoUrl || (Array.isArray(d.berkasList) && d.berkasList.length > 0))) {
            if (d.editingItemId) {
              const match = sahmasy.find(s => s.id === d.editingItemId);
              if (match) {
                setEditingItem(match);
              }
            }
            if (d.formTipe) setFormTipe(d.formTipe);
            if (d.nis) setNis(d.nis);
            if (d.nama) setNama(d.nama);
            if (d.nik) setNik(d.nik);
            if (d.ttl) setTtl(d.ttl);
            if (d.ayah) setAyah(d.ayah);
            if (d.ibu) setIbu(d.ibu);
            if (d.hp) setHp(d.hp);
            if (d.alamat) setAlamat(d.alamat);
            if (d.rtRw) setRtRw(d.rtRw);
            if (d.desa) setDesa(d.desa);
            if (d.kecamatan) setKecamatan(d.kecamatan);
            if (d.jabatan) setJabatan(d.jabatan);
            if (d.fotoUrl) setFotoUrl(d.fotoUrl);
            if (d.kkUrl) setKkUrl(d.kkUrl);
            if (d.kkName) setKkName(d.kkName);
            if (d.aktaUrl) setAktaUrl(d.aktaUrl);
            if (d.aktaName) setAktaName(d.aktaName);
            if (d.ktpUrl) setKtpUrl(d.ktpUrl);
            if (d.ktpName) setKtpName(d.ktpName);
            if (d.santriUrl) setSantriUrl(d.santriUrl);
            if (d.santriName) setSantriName(d.santriName);
            if (d.ijazahUrl) setIjazahUrl(d.ijazahUrl);
            if (d.ijazahName) setIjazahName(d.ijazahName);
            if (Array.isArray(d.berkasList)) setBerkasList(d.berkasList);
            if (d.activeFormSheetTab) setActiveFormSheetTab(d.activeFormSheetTab);
            setShowAdd(true);
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Continuous auto-save draft to localStorage whenever form is open
  useEffect(() => {
    if (showAdd) {
      const draftData = {
        editingItemId: editingItem?.id || null,
        formTipe,
        nis,
        nama,
        nik,
        ttl,
        ayah,
        ibu,
        hp,
        alamat,
        rtRw,
        desa,
        kecamatan,
        jabatan,
        fotoUrl,
        kkUrl,
        kkName,
        aktaUrl,
        aktaName,
        ktpUrl,
        ktpName,
        santriUrl,
        santriName,
        ijazahUrl,
        ijazahName,
        berkasList,
        activeFormSheetTab,
        savedAt: Date.now()
      };
      try {
        localStorage.setItem('fokus_sensus_form_draft', JSON.stringify(draftData));
      } catch {}
    }
  }, [
    showAdd,
    editingItem,
    formTipe,
    nis,
    nama,
    nik,
    ttl,
    ayah,
    ibu,
    hp,
    alamat,
    rtRw,
    desa,
    kecamatan,
    jabatan,
    fotoUrl,
    kkUrl,
    kkName,
    aktaUrl,
    aktaName,
    ktpUrl,
    ktpName,
    santriUrl,
    santriName,
    ijazahUrl,
    ijazahName,
    berkasList,
    activeFormSheetTab
  ]);

  // Open Modal Helpers
  const handleOpenAddModal = () => {
    clearFormDraft();
    setEditingItem(null);
    const targetTipe = activeTipe === 'semua' ? 'putra' : activeTipe;
    setFormTipe(targetTipe);
    setNis(`SHM-${targetTipe.toUpperCase().substring(0, 3)}-${String(sahmasy.filter(s => s.tipe === targetTipe).length + 1).padStart(3, '0')}`);
    setNama('');
    setNik('');
    setTtl('Sumenep, ');
    setAyah('');
    setIbu('');
    setHp('');
    setAlamat('');
    setRtRw('001/001');
    setDesa('Gayam');
    setKecamatan('Gayam');
    setJabatan(
      targetTipe === 'putra' ? 'Anggota Sahmasy Putra' :
      targetTipe === 'putri' ? 'Anggota Sahmasy Putri' :
      targetTipe === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri'
    );
    setFotoUrl('');
    setKkUrl('');
    setKkName('');
    setAktaUrl('');
    setAktaName('');
    setKtpUrl('');
    setKtpName('');
    setSantriUrl('');
    setSantriName('');
    setIjazahUrl('');
    setIjazahName('');
    setBerkasList([]);
    setActiveFormSheetTab('kk');
    setShowAdd(true);
  };

  const handleOpenEditModal = (item: SahmasyRow) => {
    clearFormDraft();
    setEditingItem(item);
    setFormTipe(item.tipe);
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
    setKecamatan(item.kecamatan || 'Gayam');
    setJabatan(item.jabatan || (
      item.tipe === 'putra' ? 'Anggota Sahmasy Putra' :
      item.tipe === 'putri' ? 'Anggota Sahmasy Putri' :
      item.tipe === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri'
    ));
    setFotoUrl(item.fotoUrl || '');
    setKkUrl(item.kkUrl || (item.berkasType === 'kk' ? item.berkasUrl : '') || '');
    setKkName(item.kkName || (item.berkasType === 'kk' ? item.berkasName : '') || '');
    setAktaUrl(item.aktaUrl || (item.berkasType === 'akta' ? item.berkasUrl : '') || '');
    setAktaName(item.aktaName || (item.berkasType === 'akta' ? item.berkasName : '') || '');
    setKtpUrl(item.ktpUrl || (item.berkasType === 'ktp' ? item.berkasUrl : '') || '');
    setKtpName(item.ktpName || (item.berkasType === 'ktp' ? item.berkasName : '') || '');
    setSantriUrl(item.santriUrl || (item.berkasType === 'santri' ? item.berkasUrl : '') || '');
    setSantriName(item.santriName || (item.berkasType === 'santri' ? item.berkasName : '') || '');
    setIjazahUrl(item.ijazahUrl || (item.berkasType === 'ijazah' ? item.berkasUrl : '') || '');
    setIjazahName(item.ijazahName || (item.berkasType === 'ijazah' ? item.berkasName : '') || '');
    setBerkasList(Array.isArray(item.berkasList) ? [...item.berkasList] : []);
    setActiveFormSheetTab('kk');
    setShowAdd(true);
  };

  // Calculate Iuran payment status for any member
  const getMemberIuranSummary = (member: SahmasyRow) => {
    if (!iuranList || iuranList.length === 0) {
      return { isFound: false, paidMonths: 0, totalMonths: 9, isLunas: false, totalPaid: 0, nominal: 50000 };
    }

    const item = iuranList.find(
      i => (i.nis && member.nis && i.nis.trim().toLowerCase() === member.nis.trim().toLowerCase()) ||
           (i.nama && member.nama && i.nama.trim().toLowerCase() === member.nama.trim().toLowerCase())
    );

    if (!item) {
      const defaultNominal = member.tipe?.includes('santri') ? 30000 : 50000;
      return { isFound: false, paidMonths: 0, totalMonths: 9, isLunas: false, totalPaid: 0, nominal: defaultNominal };
    }

    const months = [
      item.dzulqodah,
      item.dzulhijjah,
      item.muharrom,
      item.shofar,
      item.robiulAwwal,
      item.robiusTsani,
      item.jumadilUla,
      item.jumadilAkhir,
      item.rojab
    ];
    const paidMonths = months.filter(Boolean).length;
    const nominal = item.nominalPerBulan || (member.tipe?.includes('santri') ? 30000 : 50000);
    const totalPaid = paidMonths * nominal;
    const isLunas = paidMonths >= 9;

    return {
      isFound: true,
      item,
      paidMonths,
      totalMonths: 9,
      isLunas,
      totalPaid,
      nominal
    };
  };

  // Safe Direct Photo Upload for any specific member row
  const handleDirectRowPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetMemberId: string,
    targetMemberNama: string
  ) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file || !targetMemberId) return;

    try {
      setUploadingField(`quick-foto-${targetMemberId}`);
      const uploaded = await uploadFileToServer(file, `Foto_${targetMemberNama || 'santri'}_${Date.now()}`);

      if (uploaded && uploaded.url) {
        let updatedRowObj: SahmasyRow | null = null;
        setSahmasy((prev) =>
          prev.map((m) => {
            if (m.id !== targetMemberId) return m;
            const updated: SahmasyRow = {
              ...m,
              fotoUrl: uploaded.url,
              updatedAt: new Date().toISOString()
            };
            updatedRowObj = updated;
            if (detailMember && detailMember.id === targetMemberId) {
              setDetailMember(updated);
            }
            if (previewSheetMember && previewSheetMember.id === targetMemberId) {
              setPreviewSheetMember(updated);
            }
            return updated;
          })
        );

        if (updatedRowObj) {
          saveDoc('sahmasy', updatedRowObj);
        }

        onNotify(
          'Pas Foto Berhasil Disimpan',
          `Foto untuk ${targetMemberNama} telah tersimpan permanen di cloud dan database lokal.`
        );
      }
    } catch (err: any) {
      console.error('Direct photo upload error:', err);
      onNotify('Kendala Foto', 'Gagal memproses pas foto. Silakan coba kembali.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Safe Photo Upload using Persistent Server Storage API
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview so user immediately sees their photo with zero delay
    try {
      const previewUrl = URL.createObjectURL(file);
      setFotoUrl(previewUrl);
    } catch {}

    try {
      setUploadingField('foto');
      const cleanFileName = `Foto_${(nama || 'santri').trim().replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const uploaded = await uploadFileToServer(file, cleanFileName);
      if (uploaded && uploaded.url) {
        setFotoUrl(uploaded.url);
        // Persist immediately into local draft so data is NEVER lost across reloads
        try {
          const savedDraft = localStorage.getItem('fokus_sensus_form_draft');
          const prevDraft = savedDraft ? JSON.parse(savedDraft) : {};
          localStorage.setItem('fokus_sensus_form_draft', JSON.stringify({
            ...prevDraft,
            fotoUrl: uploaded.url,
            savedAt: Date.now()
          }));
        } catch {}
        onNotify('Foto Berhasil Disimpan', `Pas foto ${file.name} telah disimpan ke server.`);
      }
    } catch (err: any) {
      console.error('Photo processing error:', err);
      onNotify('Kendala Foto', 'Format tidak didukung atau berkas terlalu besar.');
    } finally {
      setUploadingField(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Safe Sheet Document Upload (KK / Akta / KTP / Santri / Ijazah)
  const handleSheetDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sheetType: 'kk' | 'akta' | 'ktp' | 'santri' | 'ijazah'
  ) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField(sheetType);
      const uploaded = await uploadFileToServer(file, `${sheetType.toUpperCase()}_${nama || 'anggota'}_${file.name}`);
      
      if (sheetType === 'kk') {
        setKkUrl(uploaded.url);
        setKkName(uploaded.name);
      } else if (sheetType === 'akta') {
        setAktaUrl(uploaded.url);
        setAktaName(uploaded.name);
      } else if (sheetType === 'ktp') {
        setKtpUrl(uploaded.url);
        setKtpName(uploaded.name);
      } else if (sheetType === 'santri') {
        setSantriUrl(uploaded.url);
        setSantriName(uploaded.name);
      } else if (sheetType === 'ijazah') {
        setIjazahUrl(uploaded.url);
        setIjazahName(uploaded.name);
      }

      onNotify('Sheet Dokumen Tersimpan', `Berkas ${file.name} untuk Sheet ${sheetType.toUpperCase()} berhasil diunggah.`);
    } catch (err: any) {
      console.error('Sheet upload error:', err);
      onNotify('Kendala Berkas', 'Gagal membaca atau memproses berkas lampiran.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Unlimited Multi-File Batch Upload Handler (Images & PDFs)
  const handleBatchFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetMember?: SahmasyRow | null
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray: File[] = Array.from(files);
    setBatchUploading(true);
    setBatchProgress({ current: 0, total: fileArray.length });

    try {
      const newItems: BerkasItem[] = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setBatchProgress({ current: i + 1, total: fileArray.length });

        const cleanBaseName = file.name.replace(/\.[^/.]+$/, "");
        const docName = `${cleanBaseName}_${Date.now()}`;
        const uploaded = await uploadFileToServer(file, docName);

        if (uploaded && uploaded.url) {
          const isPhoto = file.type.startsWith('image/');
          let detectedType = 'dokumen_lain';
          const lowerName = file.name.toLowerCase();
          if (lowerName.includes('kk') || lowerName.includes('keluarga')) detectedType = 'kk';
          else if (lowerName.includes('akta') || lowerName.includes('lahir')) detectedType = 'akta';
          else if (lowerName.includes('ktp') || lowerName.includes('nik')) detectedType = 'ktp';
          else if (lowerName.includes('santri') || lowerName.includes('pondok')) detectedType = 'santri';
          else if (lowerName.includes('ijazah') || lowerName.includes('syahadah') || lowerName.includes('diploma')) detectedType = 'ijazah';
          else if (isPhoto) detectedType = 'foto';

          newItems.push({
            id: `berkas-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: detectedType,
            name: file.name,
            url: uploaded.url,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            description: cleanBaseName.replace(/_/g, ' ')
          });
        }
      }

      if (newItems.length > 0) {
        if (targetMember) {
          // Direct update for member inside multi-sheet preview modal
          let updatedRow: SahmasyRow | null = null;
          setSahmasy(prev => prev.map(m => {
            if (m.id !== targetMember.id) return m;
            const updated = {
              ...m,
              berkasList: [...(m.berkasList || []), ...newItems],
              updatedAt: new Date().toISOString()
            };
            updatedRow = updated;
            setPreviewSheetMember(updated);
            if (detailMember && detailMember.id === updated.id) {
              setDetailMember(updated);
            }
            return updated;
          }));
          if (updatedRow) {
            saveDoc('sahmasy', updatedRow);
          }
          setSelectedSheetId(newItems[0].id);
        } else {
          // Form state update
          setBerkasList(prev => [...prev, ...newItems]);
        }
        onNotify('Unggah Berkas Berhasil', `${newItems.length} berkas/foto berhasil diunggah tanpa batasan.`);
      }
    } catch (err: any) {
      console.error('Batch upload error:', err);
      onNotify('Kendala Unggah', 'Gagal memproses sebagian berkas. Silakan coba kembali.');
    } finally {
      setBatchUploading(false);
      setBatchProgress(null);
      e.target.value = '';
    }
  };

  // Replace / Upload a Sheet Directly from Preview Modal
  const handleUploadFromSheetModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file || !previewSheetMember) return;
    try {
      setIsUploadingSheetModal(true);
      const uploaded = await uploadFileToServer(file, `${selectedSheetId.toUpperCase()}_${previewSheetMember.nama}_${file.name}`);
      
      let updatedRowObj: SahmasyRow | null = null;
      setSahmasy(prev => prev.map(m => {
        if (m.id !== previewSheetMember.id) return m;

        // Check if selectedSheetId is a custom berkasList item
        const isCustomSheet = Array.isArray(m.berkasList) && m.berkasList.some(b => b.id === selectedSheetId);

        let updated: SahmasyRow;
        if (isCustomSheet) {
          updated = {
            ...m,
            berkasList: (m.berkasList || []).map(b => 
              b.id === selectedSheetId 
                ? { ...b, url: uploaded.url, name: uploaded.name, uploadedAt: new Date().toISOString() } 
                : b
            ),
            updatedAt: new Date().toISOString()
          };
        } else {
          updated = {
            ...m,
            ...(selectedSheetId === 'kk' ? { kkUrl: uploaded.url, kkName: uploaded.name } : {}),
            ...(selectedSheetId === 'akta' ? { aktaUrl: uploaded.url, aktaName: uploaded.name } : {}),
            ...(selectedSheetId === 'ktp' ? { ktpUrl: uploaded.url, ktpName: uploaded.name } : {}),
            ...(selectedSheetId === 'santri' ? { santriUrl: uploaded.url, santriName: uploaded.name } : {}),
            ...(selectedSheetId === 'ijazah' ? { ijazahUrl: uploaded.url, ijazahName: uploaded.name } : {}),
            ...(selectedSheetId === 'foto' ? { fotoUrl: uploaded.url } : {}),
            updatedAt: new Date().toISOString()
          };
        }

        updatedRowObj = updated;
        setPreviewSheetMember(updated);
        if (detailMember && detailMember.id === updated.id) {
          setDetailMember(updated);
        }
        return updated;
      }));

      if (updatedRowObj) {
        saveDoc('sahmasy', updatedRowObj);
      }

      onNotify('Sheet Berhasil Diperbarui', `Berkas Sheet untuk ${previewSheetMember.nama} berhasil tersimpan ke database.`);
    } catch (err: any) {
      console.error('Modal sheet upload error:', err);
      onNotify('Gagal Mengunggah', 'Terjadi kendala saat mengunggah berkas.');
    } finally {
      setIsUploadingSheetModal(false);
      if (sheetModalInputRef.current) sheetModalInputRef.current.value = '';
    }
  };

  // Delete a Sheet Directly from Preview Modal
  const handleDeleteSheetFromModal = () => {
    if (!previewSheetMember) return;
    if (!window.confirm(`Hapus berkas sheet ini untuk ${previewSheetMember.nama}?`)) return;

    let updatedRowObj: SahmasyRow | null = null;
    setSahmasy(prev => prev.map(m => {
      if (m.id !== previewSheetMember.id) return m;

      // Check if selectedSheetId is a custom berkasList item
      const isCustomSheet = Array.isArray(m.berkasList) && m.berkasList.some(b => b.id === selectedSheetId);

      let updated: SahmasyRow;
      if (isCustomSheet) {
        const remainingBerkas = (m.berkasList || []).filter(b => b.id !== selectedSheetId);
        updated = {
          ...m,
          berkasList: remainingBerkas,
          updatedAt: new Date().toISOString()
        };
      } else {
        updated = {
          ...m,
          ...(selectedSheetId === 'kk' ? { kkUrl: '', kkName: '' } : {}),
          ...(selectedSheetId === 'akta' ? { aktaUrl: '', aktaName: '' } : {}),
          ...(selectedSheetId === 'ktp' ? { ktpUrl: '', ktpName: '' } : {}),
          ...(selectedSheetId === 'santri' ? { santriUrl: '', santriName: '' } : {}),
          ...(selectedSheetId === 'ijazah' ? { ijazahUrl: '', ijazahName: '' } : {}),
          ...(selectedSheetId === 'foto' ? { fotoUrl: '' } : {}),
          updatedAt: new Date().toISOString()
        };
      }

      updatedRowObj = updated;
      setPreviewSheetMember(updated);
      if (detailMember && detailMember.id === updated.id) {
        setDetailMember(updated);
      }
      return updated;
    }));

    if (updatedRowObj) {
      saveDoc('sahmasy', updatedRowObj);
    }
    setSelectedSheetId('kk');
    onNotify('Berkas Dihapus', `Berkas sheet untuk ${previewSheetMember.nama} telah dihapus.`);
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        let updatedDoc: SahmasyRow | null = null;
        setSahmasy(prev => prev.map(item => {
          if (item.id !== editingItem.id) return item;
          const updated: SahmasyRow = {
            ...item,
            tipe: formTipe,
            nis: nis.trim(),
            nama: nama.trim(),
            nik: nik.trim(),
            ttl: ttl.trim(),
            ayah: ayah.trim(),
            ibu: ibu.trim(),
            noHandphone: hp.trim(),
            alamat: alamat.trim(),
            rtRw: rtRw.trim(),
            desa: desa.trim(),
            kecamatan: kecamatan.trim(),
            jabatan: jabatan.trim() || (
              formTipe === 'putra' ? 'Anggota Sahmasy Putra' :
              formTipe === 'putri' ? 'Anggota Sahmasy Putri' :
              formTipe === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri'
            ),
            fotoUrl: fotoUrl,
            kkUrl: kkUrl,
            kkName: kkName,
            aktaUrl: aktaUrl,
            aktaName: aktaName,
            ktpUrl: ktpUrl,
            ktpName: ktpName,
            santriUrl: santriUrl,
            santriName: santriName,
            ijazahUrl: ijazahUrl,
            ijazahName: ijazahName,
            berkasList: berkasList,
            berkasUrl: kkUrl || aktaUrl || ktpUrl || santriUrl || ijazahUrl || (berkasList[0]?.url) || '',
            berkasName: kkName || aktaName || ktpName || santriName || ijazahName || (berkasList[0]?.name) || '',
            berkasType: kkUrl ? 'kk' : aktaUrl ? 'akta' : ktpUrl ? 'ktp' : santriUrl ? 'santri' : ijazahUrl ? 'ijazah' : (berkasList[0]?.type) || 'kk',
            updatedAt: new Date().toISOString()
          };
          updatedDoc = updated;
          if (detailMember && detailMember.id === updated.id) {
            setDetailMember(updated);
          }
          return updated;
        }));
        if (updatedDoc) {
          saveDoc('sahmasy', updatedDoc);
        }
        clearFormDraft();
        setShowAdd(false);
        onNotify('Data Tersimpan', `Data sensus dan seluruh lembar lampiran berkas ${nama} berhasil disimpan.`);
      } else {
        const newItem: SahmasyRow = {
          id: 'shm-' + Date.now(),
          tipe: formTipe,
          no: sahmasy.filter(s => s.tipe === formTipe).length + 1,
          nis: nis.trim(),
          nama: nama.trim(),
          nik: nik.trim(),
          ttl: ttl.trim(),
          ayah: ayah.trim(),
          ibu: ibu.trim(),
          noHandphone: hp.trim(),
          alamat: alamat.trim(),
          rtRw: rtRw.trim(),
          desa: desa.trim(),
          kecamatan: kecamatan.trim(),
          jabatan: jabatan.trim() || (
            formTipe === 'putra' ? 'Anggota Sahmasy Putra' :
            formTipe === 'putri' ? 'Anggota Sahmasy Putri' :
            formTipe === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri'
          ),
          fotoUrl: fotoUrl,
          kkUrl: kkUrl,
          kkName: kkName,
          aktaUrl: aktaUrl,
          aktaName: aktaName,
          ktpUrl: ktpUrl,
          ktpName: ktpName,
          santriUrl: santriUrl,
          santriName: santriName,
          ijazahUrl: ijazahUrl,
          ijazahName: ijazahName,
          berkasList: berkasList,
          berkasUrl: kkUrl || aktaUrl || ktpUrl || santriUrl || ijazahUrl || (berkasList[0]?.url) || '',
          berkasName: kkName || aktaName || ktpName || santriName || ijazahName || (berkasList[0]?.name) || '',
          berkasType: kkUrl ? 'kk' : aktaUrl ? 'akta' : ktpUrl ? 'ktp' : santriUrl ? 'santri' : ijazahUrl ? 'ijazah' : (berkasList[0]?.type) || 'kk',
          tahunMasuk: selectedYear !== 'Semua' ? selectedYear : '2026',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        setSahmasy(prev => [newItem, ...prev]);
        saveDoc('sahmasy', newItem);
        
        // Auto-switch to the created tab so user immediately sees their new entry
        if (activeTipe !== 'semua' && activeTipe !== formTipe) {
          setActiveTipe(formTipe);
        }
        setSearchTerm('');
        setCurrentPage(1);
        clearFormDraft();
        setShowAdd(false);
        onNotify('Data Baru Tersimpan', `Data sensus ${newItem.nama} (${newItem.jabatan}) berhasil ditambahkan.`);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert('Terjadi kendala saat menyimpan data: ' + err?.message);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data anggota ini beserta seluruh lampiran berkasnya?')) {
      recordDeletedId(id);
      deleteDocFromDb('sahmasy', id);
      setSahmasy(prev => prev.filter(s => s.id !== id));
      if (detailMember && detailMember.id === id) {
        setDetailMember(null);
      }
      onNotify('Data Dihapus', 'Data anggota telah dihapus dari database.');
    }
  };

  // Open Multi-Sheet Preview
  const handleOpenMultiSheetPreview = (item: SahmasyRow, preferredSheetId = 'kk') => {
    setPreviewSheetMember(item);
    setSelectedSheetId(preferredSheetId);
    setZoomScale(1);
    setRotation(0);
  };

  // Get active sheet content inside preview modal
  const getActiveSheetData = (member: SahmasyRow | null, sheetId: string) => {
    if (!member) return null;
    if (sheetId === 'foto') {
      return {
        url: member.fotoUrl,
        name: `Pas_Foto_${member.nama}.jpg`,
        type: 'foto',
        title: 'Sheet Pas Foto Resmi',
      };
    }
    if (sheetId === 'kk') {
      return {
        url: member.kkUrl || (member.berkasType === 'kk' ? member.berkasUrl : ''),
        name: member.kkName || (member.berkasType === 'kk' ? member.berkasName : '') || `Kartu_Keluarga_${member.nama}.jpg`,
        type: 'kk',
        title: 'Sheet Kartu Keluarga (KK)',
      };
    }
    if (sheetId === 'akta') {
      return {
        url: member.aktaUrl || (member.berkasType === 'akta' ? member.berkasUrl : ''),
        name: member.aktaName || (member.berkasType === 'akta' ? member.berkasName : '') || `Akta_Kelahiran_${member.nama}.jpg`,
        type: 'akta',
        title: 'Sheet Akta Kelahiran',
      };
    }
    if (sheetId === 'ktp') {
      return {
        url: member.ktpUrl || (member.berkasType === 'ktp' ? member.berkasUrl : ''),
        name: member.ktpName || (member.berkasType === 'ktp' ? member.berkasName : '') || `KTP_Identitas_${member.nama}.jpg`,
        type: 'ktp',
        title: 'Sheet KTP / Identitas Santri',
      };
    }
    if (sheetId === 'santri') {
      return {
        url: member.santriUrl || (member.berkasType === 'santri' ? member.berkasUrl : ''),
        name: member.santriName || (member.berkasType === 'santri' ? member.berkasName : '') || `Kartu_Santri_${member.nama}.jpg`,
        type: 'santri',
        title: 'Sheet Kartu Santri / Pesantren',
      };
    }
    if (sheetId === 'ijazah') {
      return {
        url: member.ijazahUrl || (member.berkasType === 'ijazah' ? member.berkasUrl : ''),
        name: member.ijazahName || (member.berkasType === 'ijazah' ? member.berkasName : '') || `Ijazah_${member.nama}.jpg`,
        type: 'ijazah',
        title: 'Sheet Ijazah / Syahadah',
      };
    }
    // Dynamic sheet from berkasList
    if (Array.isArray(member.berkasList)) {
      const customItem = member.berkasList.find(b => b.id === sheetId);
      if (customItem) {
        return {
          url: customItem.url,
          name: customItem.name,
          type: customItem.type || 'dokumen_lain',
          title: customItem.description || customItem.name || 'Dokumen Lampiran Tambahan',
        };
      }
    }
    return null;
  };

  // Excel Handlers
  const handleDownloadTemplate = () => {
    const headers = ['NO', 'NIS', 'NIK', 'NAMA LENGKAP', 'KATEGORI (putra/putri/santri_putra/santri_putri)', 'TTL', 'AYAH', 'IBU', 'NO HANDPHONE', 'ALAMAT', 'RT RW', 'DESA', 'KECAMATAN', 'JABATAN', 'FOTO URL'];
    const sample = [1, 'SHM-PTR-001', '3529081234560001', 'Ahmad Abdullah', 'putra', 'Sumenep, 10 Mei 2003', 'H. Ali', 'Hj. Aminah', '081234567890', 'Dusun Gayam', '001/002', 'Gayam', 'Gayam', 'Anggota Sahmasy Putra', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'];
    downloadCsvTemplate(`Template_Sensus_Fokus_Sapudi`, headers, sample);
    onNotify('Template Didownload', 'Template Excel sensus anggota berhasil diunduh.');
  };

  const handleExportExcel = () => {
    const targetData = selectedIds.length > 0 
      ? filtered.filter(f => selectedIds.includes(f.id))
      : filtered;

    const headers = ['NO', 'NIS', 'NIK', 'NAMA LENGKAP', 'KATEGORI', 'JABATAN', 'TEMPAT TANGGAL LAHIR', 'NAMA AYAH', 'NAMA IBU', 'NO HANDPHONE / WA', 'ALAMAT LENGKAP', 'RT / RW', 'DESA', 'KECAMATAN', 'STATUS FOTO', 'STATUS SHEET KK', 'STATUS SHEET AKTA', 'STATUS SHEET KTP', 'STATUS SHEET SANTRI/IJAZAH'];
    const rows = targetData.map((item, idx) => [
      idx + 1, item.nis, item.nik, item.nama, 
      item.tipe.toUpperCase().replace(/_/g, ' '),
      item.jabatan || '-',
      item.ttl, item.ayah, item.ibu, item.noHandphone, item.alamat, item.rtRw, item.desa, item.kecamatan, 
      item.fotoUrl ? 'Ada Foto' : 'Belum Ada',
      item.kkUrl ? 'Ada KK' : '-',
      item.aktaUrl ? 'Ada Akta' : '-',
      item.ktpUrl ? 'Ada KTP' : '-',
      (item.santriUrl || item.ijazahUrl) ? 'Ada' : '-'
    ]);
    exportToExcel(
      `Data_Sensus_${activeTipe.toUpperCase()}_${targetData.length}_Anggota`,
      headers,
      rows,
      {
        title: `ORGANISASI FOKUS SAPUDI - DATABASE SENSUS (${activeTipe.toUpperCase().replace(/_/g, ' ')})`,
        subtitle: `Data Sahmasy & Santri Aktif Sapudi • Total: ${targetData.length} Anggota Terdata`,
        sheetName: `Sensus ${activeTipe.replace(/_/g, ' ')}`
      }
    );
    onNotify('Export Excel Berhasil', `${targetData.length} data sensus berhasil diexport ke Excel (.xlsx).`);
  };

  const handleExportMasterWorkbook = () => {
    const headers = ['NO', 'NIS', 'NIK', 'NAMA LENGKAP', 'JABATAN', 'TEMPAT TANGGAL LAHIR', 'NAMA AYAH', 'NAMA IBU', 'NO HANDPHONE / WA', 'ALAMAT LENGKAP', 'RT / RW', 'DESA', 'KECAMATAN', 'FOTO', 'SHEET KK', 'SHEET AKTA', 'SHEET KTP', 'SHEET SANTRI', 'SHEET IJAZAH'];
    
    const getExportRows = (type: string) => sahmasy.filter(s => s.tipe === type).map((item, idx) => [
      idx + 1, item.nis, item.nik, item.nama, item.jabatan || '-', item.ttl, item.ayah, item.ibu, item.noHandphone, item.alamat, item.rtRw, item.desa, item.kecamatan, 
      item.fotoUrl ? 'Ada' : '-',
      item.kkUrl ? 'Ada' : '-',
      item.aktaUrl ? 'Ada' : '-',
      item.ktpUrl ? 'Ada' : '-',
      item.santriUrl ? 'Ada' : '-',
      item.ijazahUrl ? 'Ada' : '-'
    ]);

    exportMultiSheetWorkbook('MASTER_DATABASE_SENSUS_FOKUS', [
      {
        sheetName: 'Sahmasy Putra',
        title: 'ORGANISASI FOKUS SAPUDI - SENSUS SAHMASY PUTRA',
        subtitle: 'Data Sahmasy Aktivis Putra Se-Kecamatan Gayam & Nonggunong',
        headers,
        rows: getExportRows('putra')
      },
      {
        sheetName: 'Sahmasy Putri',
        title: 'ORGANISASI FOKUS SAPUDI - SENSUS SAHMASY PUTRI',
        subtitle: 'Data Sahmasy Aktivis Putri Se-Kecamatan Gayam & Nonggunong',
        headers,
        rows: getExportRows('putri')
      },
      {
        sheetName: 'Santri Aktif Putra',
        title: 'ORGANISASI FOKUS SAPUDI - SANTRI AKTIF PUTRA',
        subtitle: 'Data Santri Aktif Mondok Asal Sapudi (Putra)',
        headers,
        rows: getExportRows('santri_putra')
      },
      {
        sheetName: 'Santri Aktif Putri',
        title: 'ORGANISASI FOKUS SAPUDI - SANTRI AKTIF PUTRI',
        subtitle: 'Data Santri Aktif Mondok Asal Sapudi (Putri)',
        headers,
        rows: getExportRows('santri_putri')
      }
    ]);

    onNotify('Master Database Diexport', 'Seluruh 4 kategori database sensus berhasil diexport ke satu file Excel (.xlsx).');
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
            
            // Smart type detection
            const rawTipe = (cols[offset + 3] || '').toLowerCase().trim();
            const determinedTipe: 'putra' | 'putri' | 'santri_putra' | 'santri_putri' = 
              rawTipe.includes('santri_putri') || rawTipe.includes('santriwati') ? 'santri_putri' :
              rawTipe.includes('santri_putra') || rawTipe.includes('santri') ? 'santri_putra' :
              rawTipe.includes('putri') ? 'putri' :
              (activeTipe !== 'semua' ? activeTipe : 'putra');

            newItems.push({
              id: 'imp-shm-' + Date.now() + '-' + idx,
              tipe: determinedTipe,
              no: sahmasy.length + idx + 1,
              nis: cols[offset] || 'SHM-' + (idx + 100),
              nik: cols[offset + 1] || '3529000000',
              nama: cols[offset + 2] || 'Anggota Baru',
              ttl: cols[offset + 4] || 'Sumenep',
              ayah: cols[offset + 5] || '-',
              ibu: cols[offset + 6] || '-',
              noHandphone: cols[offset + 7] || '-',
              alamat: cols[offset + 8] || 'Gayam',
              rtRw: cols[offset + 9] || '001/001',
              desa: cols[offset + 10] || 'Gayam',
              kecamatan: cols[offset + 11] || 'Gayam',
              jabatan: cols[offset + 12] || (determinedTipe === 'putra' ? 'Anggota Sahmasy Putra' : 'Anggota'),
              fotoUrl: cols[offset + 13] || '',
              berkasUrl: '',
              berkasType: 'kk'
            });
          }
        });
        setSahmasy(prev => [...newItems, ...prev]);
        onNotify('Import Berhasil', `${newItems.length} data sensus berhasil di-import dari Excel.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      (err) => onNotify('Import Gagal', err)
    );
  };

  // Active sheet item inside modal
  const activeModalSheetData = getActiveSheetData(previewSheetMember, selectedSheetId);

  const isFilterActive = searchTerm !== '' || filterKecamatan !== 'semua' || filterStatusBerkas !== 'semua';

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterKecamatan('semua');
    setFilterStatusBerkas('semua');
    setCurrentPage(1);
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

      {/* ========================================================================= */}
      {/* 1. MASTER ISLAMIC EMERALD & GOLD COMMAND BANNER                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0B3B24] to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none select-none">
          <Users className="w-56 h-56 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Modul Master Sensus</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-200 bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-700/60 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>Multi-Sheet Berkas Digital (KK • Akta • KTP • Ijazah)</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-100 bg-emerald-900/90 px-3 py-1 rounded-full border border-emerald-700/50">
                Tahun: {selectedYear}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 tracking-tight">
              DATABASE SENSUS ANGGOTA & ARSIP BERKAS
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-3xl leading-relaxed">
              Pusat database kependudukan santri dan aktivis Fokus Sapudi (Kec. Gayam & Kec. Nonggunong). Dilengkapi arsip dokumen digital berkas keluarga, akta, identitas santri, dan foto resmi.
            </p>
          </div>

          {/* Action Center Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Add Member Primary Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
              <span>+ Tambah Anggota</span>
            </button>

            {/* Excel Master Dropdown Menu */}
            <div className="relative" ref={excelMenuRef}>
              <button
                onClick={() => setShowExcelMenu(!showExcelMenu)}
                className="px-3.5 py-2.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 rounded-xl font-semibold text-xs transition flex items-center gap-2 shadow-xs"
                title="Menu Pengelolaan Data Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                <span>Opsi Excel</span>
                <ChevronRight className={`w-3.5 h-3.5 text-emerald-300 transition-transform ${showExcelMenu ? 'rotate-90' : ''}`} />
              </button>

              {showExcelMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-100 py-2 z-50 animate-in fade-in zoom-in-95 text-emerald-950">
                  <div className="px-3 py-1.5 border-b border-emerald-50">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Integrasi Data Excel</p>
                  </div>
                  
                  <button
                    onClick={() => { setShowExcelMenu(false); handleDownloadTemplate(); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-xs font-semibold text-emerald-900 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p>Unduh Template Excel</p>
                      <p className="text-[10px] text-emerald-600 font-normal">Format kolom sensus baku (.csv)</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowExcelMenu(false); fileInputRef.current?.click(); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-xs font-semibold text-emerald-900 transition"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <div>
                      <p>Import Data dari Excel</p>
                      <p className="text-[10px] text-emerald-600 font-normal">Unggah file sensus (.xlsx, .csv)</p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-emerald-50" />

                  <button
                    onClick={() => { setShowExcelMenu(false); handleExportExcel(); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-xs font-semibold text-emerald-900 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p>Export Data Terfilter ({filtered.length})</p>
                      <p className="text-[10px] text-emerald-600 font-normal">Ekspor tabel aktif ke (.xlsx)</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowExcelMenu(false); handleExportMasterWorkbook(); }}
                    className="w-full text-left px-3.5 py-2 bg-amber-50/70 hover:bg-amber-100/80 flex items-center gap-2.5 text-xs font-bold text-amber-950 transition"
                  >
                    <Layers className="w-4 h-4 text-amber-700" />
                    <div>
                      <p>Master Multi-Sheet (.xlsx)</p>
                      <p className="text-[10px] text-amber-700 font-normal">4 Sheet: Putra, Putri, Santri Putra & Putri</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Print PDF Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REFINED INTERACTIVE CATEGORY HUB CARDS                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Semua Data */}
        <div 
          onClick={() => { setActiveTipe('semua'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeTipe === 'semua' 
              ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-amber-400/50' 
              : 'bg-white text-emerald-950 border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTipe === 'semua' ? 'text-amber-300' : 'text-emerald-800'}`}>
              Semua Anggota
            </span>
            <div className={`p-1.5 rounded-xl ${activeTipe === 'semua' ? 'bg-emerald-800/80 text-amber-300' : 'bg-emerald-50 text-emerald-700'}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif">{stats.total}</p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80">
              <span>Total Terdata</span>
              {activeTipe === 'semua' && <span className="font-bold text-amber-300">Aktif ✓</span>}
            </div>
          </div>
        </div>

        {/* Card 2: Sahmasy Putra */}
        <div 
          onClick={() => { setActiveTipe('putra'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeTipe === 'putra' 
              ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-blue-400/50' 
              : 'bg-white text-emerald-950 border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTipe === 'putra' ? 'text-blue-300' : 'text-blue-700'}`}>
              Sahmasy Putra
            </span>
            <div className={`p-1.5 rounded-xl ${activeTipe === 'putra' ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif">{stats.totalPutra}</p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80">
              <span>Aktivis Putra</span>
              {activeTipe === 'putra' && <span className="font-bold text-blue-300">Aktif ✓</span>}
            </div>
          </div>
        </div>

        {/* Card 3: Sahmasy Putri */}
        <div 
          onClick={() => { setActiveTipe('putri'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeTipe === 'putri' 
              ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-pink-400/50' 
              : 'bg-white text-emerald-950 border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTipe === 'putri' ? 'text-pink-300' : 'text-pink-700'}`}>
              Sahmasy Putri
            </span>
            <div className={`p-1.5 rounded-xl ${activeTipe === 'putri' ? 'bg-pink-900/60 text-pink-300' : 'bg-pink-50 text-pink-700'}`}>
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif">{stats.totalPutri}</p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80">
              <span>Aktivis Putri</span>
              {activeTipe === 'putri' && <span className="font-bold text-pink-300">Aktif ✓</span>}
            </div>
          </div>
        </div>

        {/* Card 4: Santri Aktif Putra */}
        <div 
          onClick={() => { setActiveTipe('santri_putra'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeTipe === 'santri_putra' 
              ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-emerald-400/50' 
              : 'bg-white text-emerald-950 border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTipe === 'santri_putra' ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Santri Putra
            </span>
            <div className={`p-1.5 rounded-xl ${activeTipe === 'santri_putra' ? 'bg-emerald-800/80 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif">{stats.totalSantriPutra}</p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80">
              <span>Mondok Pesantren</span>
              {activeTipe === 'santri_putra' && <span className="font-bold text-emerald-300">Aktif ✓</span>}
            </div>
          </div>
        </div>

        {/* Card 5: Santri Aktif Putri */}
        <div 
          onClick={() => { setActiveTipe('santri_putri'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeTipe === 'santri_putri' 
              ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-purple-400/50' 
              : 'bg-white text-emerald-950 border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTipe === 'santri_putri' ? 'text-purple-300' : 'text-purple-700'}`}>
              Santri Putri
            </span>
            <div className={`p-1.5 rounded-xl ${activeTipe === 'santri_putri' ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif">{stats.totalSantriPutri}</p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80">
              <span>Mondok Pesantren</span>
              {activeTipe === 'santri_putri' && <span className="font-bold text-purple-300">Aktif ✓</span>}
            </div>
          </div>
        </div>

        {/* Card 6: Arsip Berkas Multi-Sheet */}
        <div 
          onClick={() => setViewMode(viewMode === 'sheets_gallery' ? 'table' : 'sheets_gallery')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            viewMode === 'sheets_gallery'
              ? 'bg-gradient-to-br from-amber-900 to-amber-950 text-amber-100 border-amber-800 shadow-md ring-2 ring-amber-400/50'
              : 'bg-amber-50/80 text-amber-950 border-amber-200/80 hover:bg-amber-100/60'
          }`}
          title="Klik untuk beralih antara Mode Tabel dan Galeri Berkas"
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${viewMode === 'sheets_gallery' ? 'text-amber-300' : 'text-amber-900'}`}>
              Arsip Berkas
            </span>
            <div className={`p-1.5 rounded-xl ${viewMode === 'sheets_gallery' ? 'bg-amber-800/80 text-amber-300' : 'bg-amber-200/70 text-amber-800'}`}>
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif text-amber-950 dark:text-amber-100">
              {stats.totalKk + stats.totalAkta + stats.totalKtp + stats.totalFoto}
            </p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 text-amber-800 dark:text-amber-300">
              <span>{stats.totalKk} KK • {stats.totalKtp} KTP</span>
              <span className="font-bold underline">{viewMode === 'sheets_gallery' ? 'Galeri' : 'Buka'} →</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. UNIFIED CONTROL & FILTER RIBBON (SLEEK INTEGRATED BAR)                */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-600 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama anggota, NIS, NIK, desa, orang tua..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl text-emerald-950 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-500 hover:text-emerald-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Kecamatan */}
          <div className="flex items-center gap-1.5 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={filterKecamatan}
              onChange={e => { setFilterKecamatan(e.target.value); setCurrentPage(1); }}
              className="bg-transparent font-semibold text-emerald-950 focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Wilayah</option>
              <option value="Gayam">Kecamatan Gayam</option>
              <option value="Nonggunong">Kecamatan Nonggunong</option>
              <option value="Luar Sapudi">Luar Pulau Sapudi</option>
            </select>
          </div>

          {/* Filter Status Berkas */}
          <div className="flex items-center gap-1.5 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={filterStatusBerkas}
              onChange={e => { setFilterStatusBerkas(e.target.value); setCurrentPage(1); }}
              className="bg-transparent font-semibold text-emerald-950 focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Kelengkapan Berkas</option>
              <option value="lengkap">Berkas Lengkap (KK + Akta + KTP + Foto)</option>
              <option value="ada_foto">Sudah Ada Pas Foto</option>
              <option value="ada_kk">Sudah Ada Lembar KK</option>
              <option value="ada_ktp">Sudah Ada Lembar KTP</option>
              <option value="belum_ada_berkas">Belum Ada Lampiran Berkas</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-semibold text-xs transition flex items-center gap-1"
              title="Reset semua filter ke kondisi awal"
            >
              <RefreshCw className="w-3 h-3 text-amber-700" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: Bulk Selection Actions & View Switcher */}
        <div className="flex items-center gap-2 justify-between lg:justify-end">
          
          {/* Bulk Selection Badge */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-100 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-300 font-bold text-xs animate-in fade-in">
              <span>{selectedIds.length} Baris Dipilih</span>
              <button
                onClick={handleBulkDelete}
                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                title="Hapus data terpilih"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 hover:bg-amber-200 rounded-lg text-amber-800"
                title="Batalkan pilihan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center bg-emerald-50 p-1 rounded-xl border border-emerald-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-emerald-900 text-amber-200 shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tabel Sensus</span>
            </button>

            <button
              onClick={() => setViewMode('sheets_gallery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'sheets_gallery'
                  ? 'bg-emerald-900 text-amber-200 shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Galeri Berkas</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: TABULAR SENSUS VIEW                                         */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          
          {/* Table Header Bar with Live Info */}
          <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 uppercase tracking-wide">
                {activeTipe === 'semua' ? 'Semua Database Sensus' :
                 activeTipe === 'putra' ? 'Database Sahmasy Putra' : 
                 activeTipe === 'putri' ? 'Database Sahmasy Putri' : 
                 activeTipe === 'santri_putra' ? 'Database Santri Aktif Putra' : 'Database Santri Aktif Putri'}
              </span>
              <span className="bg-emerald-900 text-amber-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {filtered.length} Data
              </span>
            </div>
            
            <div className="text-emerald-700 text-[11px] flex items-center gap-2">
              <span>Halaman {currentPage} dari {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
              <span>•</span>
              <span>Klik badge berkas (KK/Akta/KTP/Santri) untuk pratinjau langsung</span>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/70 text-emerald-950 font-bold border-b border-emerald-200">
                  <th className="p-3 text-center w-10">
                    <button 
                      onClick={handleToggleSelectAll}
                      className="text-emerald-900 hover:text-emerald-950 flex items-center justify-center mx-auto"
                      title={isAllSelected ? "Batalkan semua" : "Pilih semua di halaman ini"}
                    >
                      {isAllSelected ? <CheckSquare className="w-4 h-4 text-emerald-900" /> : <Square className="w-4 h-4 text-emerald-700" />}
                    </button>
                  </th>
                  <th className="p-3 text-center w-10">NO</th>
                  <th className="p-3 text-center w-14">FOTO</th>
                  <th className="p-3">NIS / NIK</th>
                  <th className="p-3">NAMA LENGKAP & JABATAN</th>
                  <th className="p-3">TTL</th>
                  <th className="p-3">ORANG TUA & HP</th>
                  <th className="p-3">ALAMAT DOMISILI</th>
                  <th className="p-3 text-center">SHEETS BERKAS LAMPIRAN</th>
                  <th className="p-3 text-center w-36">AKSI CEPAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-emerald-900">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-emerald-700">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-emerald-400" />
                        <p className="font-bold text-sm">Tidak ada data sensus yang sesuai dengan filter.</p>
                        <p className="text-xs text-emerald-500">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
                        <button
                          onClick={() => { setSearchTerm(''); setFilterKecamatan('semua'); setFilterStatusBerkas('semua'); setActiveTipe('semua'); }}
                          className="mt-2 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs transition"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item, index) => {
                    const globalIndex = (currentPage - 1) * pageSize + index + 1;
                    const allBerkas = getAllMemberBerkas(item);
                    const hasKk = !!(item.kkUrl || (item.berkasType === 'kk' && item.berkasUrl));
                    const hasAkta = !!(item.aktaUrl || (item.berkasType === 'akta' && item.berkasUrl));
                    const hasKtp = !!(item.ktpUrl || (item.berkasType === 'ktp' && item.berkasUrl));
                    const hasSantri = !!(item.santriUrl || (item.berkasType === 'santri' && item.berkasUrl));
                    const hasIjazah = !!(item.ijazahUrl || (item.berkasType === 'ijazah' && item.berkasUrl));
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr key={item.id} className={`hover:bg-emerald-50/60 transition ${isSelected ? 'bg-amber-50/70' : ''}`}>
                        
                        {/* Checkbox Select */}
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleToggleSelectRow(item.id)}
                            className="text-emerald-900 flex items-center justify-center mx-auto"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-900" /> : <Square className="w-4 h-4 text-emerald-400" />}
                          </button>
                        </td>

                        <td className="p-3 text-center font-bold text-emerald-700">{globalIndex}</td>
                        
                        {/* Foto Column with 1-Click Instant Direct Photo Upload */}
                        <td className="p-2 text-center">
                          <div className="relative group inline-block">
                            <div 
                              onClick={() => setDetailMember(item)}
                              className="cursor-pointer"
                              title="Klik untuk melihat Biodata & Berkas Lengkap"
                            >
                              {item.fotoUrl ? (
                                <PermanentImage
                                  src={item.fotoUrl}
                                  alt={item.nama}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-sm group-hover:scale-105 group-hover:border-amber-400 transition"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-sm group-hover:scale-105 group-hover:border-amber-400 transition">
                                  <User className="w-5 h-5 text-emerald-600" />
                                </div>
                              )}
                            </div>
                            
                            <label
                              className="absolute -bottom-1 -right-1 bg-emerald-900 hover:bg-emerald-800 text-amber-300 p-1 rounded-full shadow border border-white transition transform hover:scale-110 cursor-pointer flex items-center justify-center"
                              title="Unggah / Ganti Pas Foto Langsung"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {uploadingField === `quick-foto-${item.id}` ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-300" />
                              ) : (
                                <Camera className="w-2.5 h-2.5" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingField === `quick-foto-${item.id}`}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleDirectRowPhotoUpload(e, item.id, item.nama)}
                              />
                            </label>
                          </div>
                        </td>

                        <td className="p-3">
                          <p className="font-mono font-bold text-emerald-950">{item.nis}</p>
                          <p className="text-[10px] font-mono text-emerald-600">{item.nik}</p>
                        </td>

                        <td className="p-3 font-bold text-emerald-950">
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => setDetailMember(item)}
                              className="cursor-pointer hover:text-emerald-700 hover:underline"
                            >
                              {item.nama}
                            </span>
                            {item.fotoUrl && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">Foto ✓</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                            <span className="inline-block px-2 py-0.5 bg-emerald-100/80 text-[#114440] font-semibold text-[10px] rounded-md border border-emerald-200">
                              {item.jabatan || (
                                item.tipe === 'putra' ? 'Anggota Sahmasy Putra' :
                                item.tipe === 'putri' ? 'Anggota Sahmasy Putri' :
                                item.tipe === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri'
                              )}
                            </span>
                            {activeTipe === 'semua' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                                {item.tipe.replace(/_/g, ' ')}
                              </span>
                            )}

                            {/* Iuran Sync Badge */}
                            {(() => {
                              const iuranSummary = getMemberIuranSummary(item);
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onNavigateTab) {
                                      onNavigateTab('bendahara');
                                    } else {
                                      setDetailMember(item);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border transition ${
                                    iuranSummary.isLunas
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                      : iuranSummary.paidMonths > 0
                                      ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
                                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                                  }`}
                                  title={`Iuran: ${iuranSummary.paidMonths}/9 Bulan Terbayar (Rp ${iuranSummary.totalPaid.toLocaleString('id-ID')}). Klik untuk buka di menu Bendahara`}
                                >
                                  <CreditCard className="w-2.5 h-2.5" />
                                  <span>
                                    {iuranSummary.isLunas
                                      ? 'Iuran Lunas (9/9)'
                                      : iuranSummary.paidMonths > 0
                                      ? `Iuran ${iuranSummary.paidMonths}/9 Bln`
                                      : 'Iuran: Belum Bayar'}
                                  </span>
                                </button>
                              );
                            })()}
                          </div>
                        </td>

                        <td className="p-3 text-emerald-800">{item.ttl}</td>
                        
                        <td className="p-3 text-emerald-800">
                          <p><span className="text-[10px] text-emerald-600">Ayah:</span> {item.ayah}</p>
                          <p><span className="text-[10px] text-emerald-600">Ibu:</span> {item.ibu}</p>
                          {item.noHandphone && (
                            <p className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{item.noHandphone}</span>
                            </p>
                          )}
                        </td>
                        
                        <td className="p-3 text-emerald-700">
                          <p className="font-semibold text-emerald-950">{item.alamat}</p>
                          <p className="text-[10px] text-emerald-600">RT {item.rtRw} • Desa {item.desa}, Kec. {item.kecamatan}</p>
                        </td>

                        {/* Sheets Status Badges with Direct Preview Click */}
                        <td className="p-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
                            {/* Sheet KK */}
                            <button
                              onClick={() => handleOpenMultiSheetPreview(item, 'kk')}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition border ${
                                hasKk ? 'bg-blue-100 text-blue-800 border-blue-300 hover:scale-105' : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                              title={hasKk ? 'Klik untuk buka Sheet KK' : 'Sheet KK belum diunggah'}
                            >
                              KK {hasKk ? '✓' : '—'}
                            </button>

                            {/* Sheet Akta */}
                            <button
                              onClick={() => handleOpenMultiSheetPreview(item, 'akta')}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition border ${
                                hasAkta ? 'bg-purple-100 text-purple-800 border-purple-300 hover:scale-105' : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                              title={hasAkta ? 'Klik untuk buka Sheet Akta' : 'Sheet Akta belum diunggah'}
                            >
                              Akta {hasAkta ? '✓' : '—'}
                            </button>

                            {/* Sheet KTP */}
                            <button
                              onClick={() => handleOpenMultiSheetPreview(item, 'ktp')}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition border ${
                                hasKtp ? 'bg-amber-100 text-amber-800 border-amber-300 hover:scale-105' : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                              title={hasKtp ? 'Klik untuk buka Sheet KTP' : 'Sheet KTP belum diunggah'}
                            >
                              KTP {hasKtp ? '✓' : '—'}
                            </button>

                            {/* Sheet Santri / Ijazah */}
                            {(hasSantri || hasIjazah) && (
                              <button
                                onClick={() => handleOpenMultiSheetPreview(item, hasSantri ? 'santri' : 'ijazah')}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:scale-105 transition"
                                title="Klik untuk buka Sheet Santri / Ijazah"
                              >
                                {hasSantri ? 'Santri ✓' : 'Ijazah ✓'}
                              </button>
                            )}

                            {allBerkas.length === 0 && !item.fotoUrl && (
                              <span className="text-[10px] text-gray-400 italic">Belum Ada Berkas</span>
                            )}
                          </div>
                        </td>

                        {/* Action Column */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* Detail Member Modal */}
                            <button
                              onClick={() => setDetailMember(item)}
                              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl transition inline-flex items-center gap-1 font-bold text-xs shadow-2xs cursor-pointer"
                              title="Buka Biodata & Berkas Lengkap"
                            >
                              <User className="w-3.5 h-3.5 text-emerald-800" />
                              <span className="hidden sm:inline">Biodata</span>
                            </button>

                            {/* Open Multi-Sheet Preview Button */}
                            <button
                              onClick={() => handleOpenMultiSheetPreview(item)}
                              className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-200 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Buka Lembar Preview Berkas Lengkap"
                            >
                              <Layers className="w-3.5 h-3.5 text-amber-300" />
                              <span>Sheets</span>
                              {allBerkas.length > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-emerald-950 rounded-full text-[10px] font-mono font-black">
                                  {allBerkas.length}
                                </span>
                              )}
                            </button>

                            {/* Edit Member */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl transition inline-flex items-center cursor-pointer"
                              title="Edit Data & Upload Berkas"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                            </button>

                            {/* Delete Member */}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition inline-flex items-center cursor-pointer"
                              title="Hapus Data Anggota"
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
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="anggota"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: MULTI-SHEET BERKAS ARCHIVE GALLERY                          */}
      {/* ========================================================================= */}
      {viewMode === 'sheets_gallery' && (
        <div className="space-y-4">
          {/* Gallery Sheet Filter Header */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                <FolderOpen className="w-4 h-4 text-emerald-700" />
                <span>Kategori Sheet:</span>
              </span>

              <button
                onClick={() => setActiveGallerySheet('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeGallerySheet === 'all'
                    ? 'bg-emerald-900 text-amber-200 shadow'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Semua Sheet
              </button>

              {SHEET_DEFINITIONS.filter(s => s.id !== 'dokumen_lain').map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => setActiveGallerySheet(sheet.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    activeGallerySheet === sheet.id
                      ? `${sheet.badgeBg} text-white shadow`
                      : `${sheet.bgLight} ${sheet.badgeText} ${sheet.borderCol} hover:opacity-80`
                  }`}
                >
                  {sheet.shortLabel}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-emerald-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari nama / NIS berkas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl text-emerald-950 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Gallery Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryMembers.flatMap(member => {
              const allBerkas = getAllMemberBerkas(member);
              const itemsToShow = activeGallerySheet === 'all' 
                ? allBerkas 
                : allBerkas.filter(b => b.type === activeGallerySheet);

              return itemsToShow.map(berkas => {
                const badge = getBerkasBadgeInfo(berkas.type, berkas.name);
                const isImage = !berkas.url.endsWith('.pdf') && !berkas.url.includes('application/pdf');

                return (
                  <div 
                    key={berkas.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono">
                          {member.nis}
                        </span>
                      </div>

                      {/* Thumbnail Preview */}
                      <div 
                        onClick={() => handleOpenMultiSheetPreview(member, berkas.type)}
                        className="w-full h-36 bg-emerald-50 rounded-xl overflow-hidden mb-3 border border-emerald-200 flex items-center justify-center cursor-pointer relative"
                      >
                        {isImage ? (
                          <img
                            src={berkas.url}
                            alt={berkas.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-emerald-700 p-2 text-center">
                            <FileText className="w-10 h-10 text-emerald-600 mb-1" />
                            <span className="text-[11px] font-bold">Dokumen PDF</span>
                            <span className="text-[9px] text-emerald-500 truncate max-w-[140px]">{berkas.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <span className="px-3 py-1.5 bg-white text-emerald-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Buka Sheet</span>
                          </span>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div>
                        <h4 className="font-bold text-xs text-emerald-950 truncate">{member.nama}</h4>
                        <p className="text-[10px] text-emerald-600 truncate">{member.desa}, Kec. {member.kecamatan}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{berkas.name}</p>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-50">
                      <button
                        onClick={() => handleOpenMultiSheetPreview(member, berkas.type)}
                        className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Sheet</span>
                      </button>

                      <button
                        onClick={() => downloadFile(berkas.url, berkas.name)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition"
                        title="Unduh Berkas Ini"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DETAIL BIODATA ANGGOTA RESMI MODAL                                     */}
      {/* ========================================================================= */}
      {detailMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailMember(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 p-0.5 border border-amber-300/40 overflow-hidden flex items-center justify-center shrink-0 shadow">
                    {detailMember.fotoUrl ? (
                      <PermanentImage
                        src={detailMember.fotoUrl}
                        alt={detailMember.nama}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <User className="w-7 h-7 text-amber-300" />
                    )}
                  </div>
                  <label
                    className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 p-1.5 rounded-full shadow-md transition transform hover:scale-110 cursor-pointer flex items-center justify-center"
                    title="Ganti Pas Foto Langsung"
                  >
                    {uploadingField === `quick-foto-${detailMember.id}` ? (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-950" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingField === `quick-foto-${detailMember.id}`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleDirectRowPhotoUpload(e, detailMember.id, detailMember.nama)}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-amber-200">{detailMember.nama}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-emerald-200">
                    <span className="font-mono bg-emerald-950/60 px-2 py-0.5 rounded font-bold">{detailMember.nis}</span>
                    <span>•</span>
                    <span className="capitalize">{detailMember.jabatan || detailMember.tipe.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const printData = [
                      { 'INFORMASI': 'Nama Lengkap', 'KETERANGAN': detailMember.nama },
                      { 'INFORMASI': 'Nomor Induk (NIS)', 'KETERANGAN': detailMember.nis },
                      { 'INFORMASI': 'NIK Kependudukan', 'KETERANGAN': detailMember.nik },
                      { 'INFORMASI': 'Tempat, Tanggal Lahir', 'KETERANGAN': detailMember.ttl },
                      { 'INFORMASI': 'Nama Orang Tua', 'KETERANGAN': `Ayah: ${detailMember.ayah} | Ibu: ${detailMember.ibu}` },
                      { 'INFORMASI': 'Nomor WhatsApp/HP', 'KETERANGAN': detailMember.noHandphone || '-' },
                      { 'INFORMASI': 'Alamat Lengkap', 'KETERANGAN': `${detailMember.alamat}, RT/RW ${detailMember.rtRw}, Desa ${detailMember.desa}, Kec. ${detailMember.kecamatan}` },
                      { 'INFORMASI': 'Jabatan / Status', 'KETERANGAN': detailMember.jabatan || '-' },
                      { 'INFORMASI': 'Kategori', 'KETERANGAN': detailMember.tipe.toUpperCase().replace(/_/g, ' ') },
                    ];
                    setShowPrintModal(true);
                  }}
                  className="p-2 bg-emerald-800 hover:bg-emerald-700 text-amber-200 rounded-xl transition"
                  title="Cetak Lembar Biodata"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDetailMember(null)}
                  className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Profile Card Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">NIK (Kependudukan)</span>
                    <p className="text-xs font-mono font-bold text-emerald-950">{detailMember.nik}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Tempat, Tanggal Lahir</span>
                    <p className="text-xs font-semibold text-emerald-950">{detailMember.ttl}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Orang Tua Kandung</span>
                    <p className="text-xs text-emerald-950">Ayah: <span className="font-semibold">{detailMember.ayah}</span></p>
                    <p className="text-xs text-emerald-950">Ibu: <span className="font-semibold">{detailMember.ibu}</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Kontak / WhatsApp</span>
                    <p className="text-xs font-mono font-bold text-emerald-950">{detailMember.noHandphone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Alamat & Domisili</span>
                    <p className="text-xs font-semibold text-emerald-950">{detailMember.alamat}</p>
                    <p className="text-[11px] text-emerald-700">RT/RW {detailMember.rtRw}, Desa {detailMember.desa}, Kec. {detailMember.kecamatan}</p>
                  </div>
                </div>
              </div>

              {/* Status Iuran Kas Bendahara (Synchronized) */}
              {(() => {
                const iuranSummary = getMemberIuranSummary(detailMember);
                const monthLabels = [
                  { key: 'dzulqodah', label: "Dzulqo'dah" },
                  { key: 'dzulhijjah', label: 'Dzulhijjah' },
                  { key: 'muharrom', label: 'Muharrom' },
                  { key: 'shofar', label: 'Shofar' },
                  { key: 'robiulAwwal', label: 'Robiul Awwal' },
                  { key: 'robiusTsani', label: 'Robiust Tsani' },
                  { key: 'jumadilUla', label: 'Jumadil Ula' },
                  { key: 'jumadilAkhir', label: 'Jumadil Akhir' },
                  { key: 'rojab', label: 'Rojab' },
                ];

                return (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-900 text-amber-300 rounded-xl">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                            Status Iuran Kas Bendahara (Tersinkronisasi)
                          </h4>
                          <p className="text-[11px] text-emerald-700">
                            Tarif: Rp {iuranSummary.nominal.toLocaleString('id-ID')} / bulan • Terbayar: {iuranSummary.paidMonths}/9 Bulan (Rp {iuranSummary.totalPaid.toLocaleString('id-ID')})
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setDetailMember(null);
                          if (onNavigateTab) onNavigateTab('bendahara');
                        }}
                        className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Menu Bendahara</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                      {monthLabels.map((m, idx) => {
                        const isPaid = iuranSummary.item ? !!(iuranSummary.item as any)[m.key] : false;
                        return (
                          <div
                            key={m.key}
                            className={`p-2 rounded-xl border text-center transition ${
                              isPaid
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-emerald-900/60 border-emerald-100'
                            }`}
                          >
                            <p className="text-[9px] font-bold truncate">{m.label}</p>
                            <div className="mt-1 flex items-center justify-center">
                              {isPaid ? (
                                <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                              ) : (
                                <span className="text-[9px] text-gray-400 font-medium">Bln {idx + 1}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Status Dokumen & Lembar Berkas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Arsip & Lembar Berkas Identitas</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Total {getAllMemberBerkas(detailMember).length} Dokumen
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'kk', label: 'Sheet KK', hasDoc: !!(detailMember.kkUrl || (detailMember.berkasType === 'kk' && detailMember.berkasUrl)) },
                    { id: 'akta', label: 'Sheet Akta', hasDoc: !!(detailMember.aktaUrl || (detailMember.berkasType === 'akta' && detailMember.berkasUrl)) },
                    { id: 'ktp', label: 'Sheet KTP', hasDoc: !!(detailMember.ktpUrl || (detailMember.berkasType === 'ktp' && detailMember.berkasUrl)) },
                    { id: 'santri', label: 'Sheet Santri', hasDoc: !!(detailMember.santriUrl || (detailMember.berkasType === 'santri' && detailMember.berkasUrl)) },
                    { id: 'ijazah', label: 'Sheet Ijazah', hasDoc: !!(detailMember.ijazahUrl || (detailMember.berkasType === 'ijazah' && detailMember.berkasUrl)) },
                    { id: 'foto', label: 'Pas Foto', hasDoc: !!detailMember.fotoUrl },
                    ...(Array.isArray(detailMember.berkasList) 
                      ? detailMember.berkasList.map((b, idx) => ({
                          id: b.id,
                          label: b.description || b.name || `Lampiran #${idx + 1}`,
                          hasDoc: !!b.url
                        }))
                      : []
                    )
                  ].map(sheet => (
                    <button
                      key={sheet.id}
                      onClick={() => {
                        const m = detailMember;
                        setDetailMember(null);
                        handleOpenMultiSheetPreview(m, sheet.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        sheet.hasDoc 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100' 
                          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xs font-bold truncate pr-1">{sheet.label}</span>
                      {sheet.hasDoc ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-gray-400 shrink-0">Kosong</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  onClick={() => {
                    const itemToEdit = detailMember;
                    setDetailMember(null);
                    handleOpenEditModal(itemToEdit);
                  }}
                  className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Data Anggota</span>
                </button>

                <button
                  onClick={() => {
                    const itemToPreview = detailMember;
                    setDetailMember(null);
                    handleOpenMultiSheetPreview(itemToPreview);
                  }}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-amber-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Lembar Berkas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MULTI-SHEET PREVIEW MODAL (With Tab Switcher & Safe Zoom)  */}
      {/* ========================================================================= */}
      {previewSheetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewSheetMember(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 border border-emerald-700 overflow-hidden flex items-center justify-center shrink-0">
                  {previewSheetMember.fotoUrl ? (
                    <PermanentImage
                      src={previewSheetMember.fotoUrl}
                      alt={previewSheetMember.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-amber-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-amber-200 text-sm sm:text-base">
                      {previewSheetMember.nama}
                    </h3>
                    <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-mono">
                      {previewSheetMember.nis}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-300">
                    NIK: {previewSheetMember.nik} • Desa {previewSheetMember.desa}, Kec. {previewSheetMember.kecamatan}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewSheetMember(null)}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* SHEETS SELECTOR TABS (Standard Sheets + Custom Dynamic Sheets) */}
            <div className="bg-emerald-950/90 p-2 border-b border-emerald-800 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-amber-300 px-2 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Pilih Sheet:</span>
              </span>

              {/* Standard Sheets */}
              {SHEET_DEFINITIONS.filter(s => s.id !== 'dokumen_lain').map(sheet => {
                const sheetData = getActiveSheetData(previewSheetMember, sheet.id);
                const hasDoc = !!sheetData?.url;
                const isSelected = selectedSheetId === sheet.id;

                return (
                  <button
                    key={sheet.id}
                    onClick={() => {
                      setSelectedSheetId(sheet.id);
                      setZoomScale(1);
                      setRotation(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md scale-105'
                        : hasDoc
                        ? 'bg-emerald-800/90 text-white border-emerald-700 hover:bg-emerald-700'
                        : 'bg-emerald-900/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-800/50'
                    }`}
                  >
                    <span>{sheet.shortLabel}</span>
                    {hasDoc ? (
                      <Check className={`w-3 h-3 ${isSelected ? 'text-emerald-950 font-bold' : 'text-amber-300'}`} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    )}
                  </button>
                );
              })}

              {/* Dynamic Berkas List Items */}
              {Array.isArray(previewSheetMember.berkasList) && previewSheetMember.berkasList.map((b, idx) => {
                const isSelected = selectedSheetId === b.id;
                const badgeInfo = getBerkasBadgeInfo(b.type, b.name);

                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedSheetId(b.id);
                      setZoomScale(1);
                      setRotation(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-teal-400 text-emerald-950 border-teal-300 shadow-md scale-105'
                        : 'bg-teal-900/70 text-teal-100 border-teal-700 hover:bg-teal-800'
                    }`}
                    title={b.name}
                  >
                    <span>{badgeInfo.shortLabel} #{idx + 1}</span>
                    <Check className={`w-3 h-3 ${isSelected ? 'text-emerald-950 font-bold' : 'text-teal-300'}`} />
                  </button>
                );
              })}

              {/* Quick Unlimited Multi-Upload Button */}
              <button
                type="button"
                disabled={batchUploading}
                onClick={() => previewMultiFileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-sm ml-auto"
              >
                {batchUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengunggah ({batchProgress?.current}/{batchProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Berkas (Tanpa Batas)</span>
                  </>
                )}
              </button>
            </div>

            {/* Hidden Input for Multi-File Upload in Preview Modal */}
            <input
              type="file"
              ref={previewMultiFileInputRef}
              multiple
              accept=".pdf,image/*"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleBatchFilesUpload(e, previewSheetMember)}
              className="hidden"
            />

            {/* Hidden Input for Quick Modal Upload (Replace current single sheet) */}
            <input
              type="file"
              ref={sheetModalInputRef}
              accept=".pdf,image/*"
              onClick={(e) => e.stopPropagation()}
              onChange={handleUploadFromSheetModal}
              className="hidden"
            />

            {/* Main Sheet Viewer Area */}
            <div className="flex-1 p-4 bg-emerald-50/40 overflow-y-auto flex flex-col items-center justify-center min-h-[380px]">
              {activeModalSheetData?.url ? (
                <div className="w-full flex flex-col items-center">
                  
                  {/* Toolbar for Sheet Zoom & Rotate */}
                  <div className="w-full max-w-xl bg-white/90 backdrop-blur p-2 rounded-2xl border border-emerald-200 shadow-xs mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition"
                        title="Perbesar"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition"
                        title="Perkecil"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomScale(1)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg transition"
                        title="Reset Ukuran"
                      >
                        {Math.round(zoomScale * 100)}%
                      </button>
                      <button
                        onClick={() => setRotation(prev => (prev + 90) % 360)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition"
                        title="Putar 90 Derajat"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sheetModalInputRef.current?.click()}
                        disabled={isUploadingSheetModal}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ganti Berkas</span>
                      </button>

                      <button
                        onClick={handleDeleteSheetFromModal}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Hapus berkas pada sheet ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>

                      <button
                        onClick={() => downloadFile(activeModalSheetData.url, activeModalSheetData.name)}
                        className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Canvas Display */}
                  <div className="w-full flex items-center justify-center p-4 bg-white rounded-3xl border border-emerald-200 shadow-sm overflow-hidden min-h-[300px]">
                    {activeModalSheetData.url.endsWith('.pdf') || activeModalSheetData.url.includes('application/pdf') ? (
                      <div className="w-full h-[500px] flex flex-col items-center justify-center">
                        <iframe
                          src={activeModalSheetData.url}
                          title={activeModalSheetData.title}
                          className="w-full h-full rounded-2xl border border-emerald-100"
                        />
                      </div>
                    ) : (
                      <div className="transition-transform duration-200 ease-out flex items-center justify-center overflow-auto max-h-[500px]">
                        <PermanentImage
                          src={activeModalSheetData.url}
                          alt={activeModalSheetData.title}
                          fallbackIcon="generic"
                          style={{
                            transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease-in-out'
                          }}
                          className="max-h-[460px] w-auto object-contain rounded-xl shadow-md border border-emerald-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Document Meta Footer */}
                  <div className="mt-2 text-center text-xs text-emerald-700">
                    <span className="font-bold">{activeModalSheetData.title}:</span> {activeModalSheetData.name}
                  </div>
                </div>
              ) : (
                /* Empty Sheet State with Instant Upload Dropzone */
                <div className="w-full max-w-md bg-white p-8 rounded-3xl border-2 border-dashed border-emerald-300 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      {SHEET_DEFINITIONS.find(s => s.id === selectedSheetId)?.title} Belum Ada
                    </h4>
                    <p className="text-xs text-emerald-600 mt-1">
                      Anggota ini belum memiliki berkas untuk lembar {selectedSheetId.toUpperCase()}. Anda dapat langsung mengunggahnya sekarang.
                    </p>
                  </div>

                  <button
                    onClick={() => sheetModalInputRef.current?.click()}
                    disabled={isUploadingSheetModal}
                    className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-amber-200 text-xs font-bold rounded-2xl transition inline-flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isUploadingSheetModal ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah Berkas...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-amber-300" />
                        <span>Unggah {SHEET_DEFINITIONS.find(s => s.id === selectedSheetId)?.shortLabel} Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT MEMBER MODAL (With Multi-Sheet Tabs & Category Selection)   */}
      {/* ========================================================================= */}
      {showAdd && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (uploadingField) return; // Prevent closing while upload is running
              if (nama.trim() || nis.trim() || fotoUrl) {
                if (window.confirm('Tutup formulir sensus? Draf data Anda tetap tersimpan otomatis.')) {
                  setShowAdd(false);
                }
              } else {
                setShowAdd(false);
              }
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden p-6 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 border-b border-emerald-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-emerald-950">
                  {editingItem ? 'Edit Data Sensus & Lembar Berkas' : 'Tambah Anggota Sensus Baru'}
                </h3>
                <p className="text-[11px] text-emerald-600">Pastikan formulir identitas kependudukan dan lembar berkas diisi dengan benar</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (uploadingField) return;
                  setShowAdd(false);
                }} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* KATEGORI / DIVISI PEMILIHAN */}
              <div className="bg-emerald-900 text-white p-3.5 rounded-2xl shadow-xs space-y-2">
                <label className="block text-xs font-bold text-amber-300">Pilih Kategori / Divisi Keanggotaan:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'putra', label: 'Sahmasy Putra' },
                    { id: 'putri', label: 'Sahmasy Putri' },
                    { id: 'santri_putra', label: 'Santri Putra' },
                    { id: 'santri_putri', label: 'Santri Putri' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormTipe(cat.id as any);
                        if (!editingItem) {
                          setJabatan(
                            cat.id === 'putra' ? 'Anggota Sahmasy Putra' :
                            cat.id === 'putri' ? 'Anggota Sahmasy Putri' :
                            cat.id === 'santri_putra' ? 'Santri Aktif Putra' : 'Santri Aktif Putri'
                          );
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                        formTipe === cat.id
                          ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow'
                          : 'bg-emerald-800/80 text-emerald-200 border-emerald-700 hover:bg-emerald-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION: PAS FOTO RESMI */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Pas Foto Santri / Anggota Resmi</span>
                  </label>
                  {fotoUrl && (
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                      Foto Terpasang ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {uploadingField === 'foto' ? (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-500 flex flex-col items-center justify-center text-emerald-800 text-[10px] animate-pulse shadow-sm">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-700 mb-0.5" />
                        <span className="font-bold text-[9px]">Memproses</span>
                      </div>
                    ) : fotoUrl ? (
                      <PermanentImage
                        src={fotoUrl}
                        alt="Preview Foto"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-200/80 border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center text-emerald-700 text-[10px]">
                        <User className="w-6 h-6 text-emerald-600" />
                        <span className="font-semibold">Tanpa Foto</span>
                      </div>
                    )}
                    {fotoUrl && uploadingField !== 'foto' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFotoUrl('');
                          if (photoInputRef.current) photoInputRef.current.value = '';
                        }}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition"
                        title="Hapus foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*"
                      onClick={(e) => e.stopPropagation()}
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingField === 'foto'}
                        onClick={(e) => {
                          e.stopPropagation();
                          photoInputRef.current?.click();
                        }}
                        className="px-3.5 py-2 bg-emerald-900 text-amber-200 text-xs font-bold rounded-xl hover:bg-emerald-800 active:scale-95 transition inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {uploadingField === 'foto' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan Foto...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>Pilih Pas Foto</span>
                          </>
                        )}
                      </button>

                      {fotoUrl && (
                        <button
                          type="button"
                          onClick={() => downloadFile(fotoUrl, `Foto_${nama || 'santri'}.jpg`)}
                          className="p-2 bg-white text-emerald-800 border border-emerald-200 text-xs rounded-xl hover:bg-emerald-50 transition"
                          title="Unduh preview foto ini"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Preset Avatars */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-emerald-900 font-bold">Contoh Cepat:</span>
                      {(formTipe.includes('putri') ? PRESET_AVATARS.putri : PRESET_AVATARS.putra).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFotoUrl(url)}
                          className="w-6 h-6 rounded-full border border-emerald-400 overflow-hidden hover:scale-110 transition shadow-xs"
                          title={`Gunakan contoh foto ${idx + 1}`}
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: MULTI-SHEET BERKAS LAMPIRAN (UNLIMITED) */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-700" />
                    <span>Upload Lembar Berkas & Foto (Multi-Sheet Tanpa Batas)</span>
                  </label>
                  <span className="text-[10px] text-amber-900 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                    {[kkUrl, aktaUrl, ktpUrl, santriUrl, ijazahUrl].filter(Boolean).length + berkasList.length} Berkas Terlampir
                  </span>
                </div>

                {/* Form Sheet Tab Selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: 'kk', label: '1. Sheet KK', hasUrl: !!kkUrl },
                    { id: 'akta', label: '2. Sheet Akta', hasUrl: !!aktaUrl },
                    { id: 'ktp', label: '3. Sheet KTP', hasUrl: !!ktpUrl },
                    { id: 'santri', label: '4. Sheet Santri', hasUrl: !!santriUrl },
                    { id: 'ijazah', label: '5. Sheet Ijazah', hasUrl: !!ijazahUrl },
                    { id: 'tambahan', label: `+ Lainnya (${berkasList.length})`, hasUrl: berkasList.length > 0 },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFormSheetTab(tab.id as any)}
                      className={`p-2 rounded-xl text-left border text-[10px] font-bold transition flex items-center justify-between ${
                        activeFormSheetTab === tab.id
                          ? 'bg-amber-900 text-amber-200 border-amber-900 shadow-xs'
                          : 'bg-white text-emerald-950 border-amber-200 hover:bg-amber-100/50'
                      }`}
                    >
                      <span className="truncate">{tab.label}</span>
                      {tab.hasUrl && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>

                {/* Active Tab Upload Card */}
                {activeFormSheetTab !== 'tambahan' ? (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-950">
                          {SHEET_DEFINITIONS.find(s => s.id === activeFormSheetTab)?.title}
                        </h4>
                        <p className="text-[10px] text-amber-700">
                          {SHEET_DEFINITIONS.find(s => s.id === activeFormSheetTab)?.description}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Sheet File Input */}
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5 transition shadow-sm">
                        {uploadingField === activeFormSheetTab ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>Pilih File ({activeFormSheetTab.toUpperCase()})</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleSheetDocumentUpload(e, activeFormSheetTab as any)}
                          className="hidden"
                        />
                      </label>

                      {/* Delete Current Sheet */}
                      {((activeFormSheetTab === 'kk' && kkUrl) ||
                        (activeFormSheetTab === 'akta' && aktaUrl) ||
                        (activeFormSheetTab === 'ktp' && ktpUrl) ||
                        (activeFormSheetTab === 'santri' && santriUrl) ||
                        (activeFormSheetTab === 'ijazah' && ijazahUrl)) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeFormSheetTab === 'kk') { setKkUrl(''); setKkName(''); }
                            if (activeFormSheetTab === 'akta') { setAktaUrl(''); setAktaName(''); }
                            if (activeFormSheetTab === 'ktp') { setKtpUrl(''); setKtpName(''); }
                            if (activeFormSheetTab === 'santri') { setSantriUrl(''); setSantriName(''); }
                            if (activeFormSheetTab === 'ijazah') { setIjazahUrl(''); setIjazahName(''); }
                          }}
                          className="p-2 bg-red-50 text-red-600 border border-red-200 text-xs rounded-xl hover:bg-red-100 transition"
                          title="Hapus berkas sheet ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Current Active Sheet File Status Box */}
                    {((activeFormSheetTab === 'kk' && kkUrl) ||
                      (activeFormSheetTab === 'akta' && aktaUrl) ||
                      (activeFormSheetTab === 'ktp' && ktpUrl) ||
                      (activeFormSheetTab === 'santri' && santriUrl) ||
                      (activeFormSheetTab === 'ijazah' && ijazahUrl)) && (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-emerald-950 truncate">
                              {activeFormSheetTab === 'kk' ? kkName || 'Kartu_Keluarga.jpg'
                                : activeFormSheetTab === 'akta' ? aktaName || 'Akta_Kelahiran.jpg'
                                : activeFormSheetTab === 'ktp' ? ktpName || 'KTP_Identitas.jpg'
                                : activeFormSheetTab === 'santri' ? santriName || 'Kartu_Santri.jpg'
                                : ijazahName || 'Ijazah.jpg'}
                            </p>
                            <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                              Tersimpan di Sheet {activeFormSheetTab.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          Siap Disimpan ✓
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* UNLIMITED EXTRA DOCUMENTS & PHOTOS SECTION */
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Unggah Berkas & Foto Tambahan (Bebas / Tanpa Limit)</span>
                        </h4>
                        <p className="text-[10px] text-amber-700">
                          Anda dapat memilih banyak file sekaligus (PDF / Foto / Piagam / Dokumen Lain) tanpa batasan jumlah sheets.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={batchUploading}
                        onClick={() => multiFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                      >
                        {batchUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengunggah ({batchProgress?.current}/{batchProgress?.total})...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Pilih Banyak File Sekaligus</span>
                          </>
                        )}
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={multiFileInputRef}
                      multiple
                      accept=".pdf,image/*"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleBatchFilesUpload(e)}
                      className="hidden"
                    />

                    {/* List of Extra Uploaded Files */}
                    {berkasList.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {berkasList.map((item, idx) => {
                          const badge = getBerkasBadgeInfo(item.type, item.name);
                          return (
                            <div key={item.id || idx} className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                                  {item.url.endsWith('.pdf') ? (
                                    <FileText className="w-4 h-4" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="truncate flex-1">
                                  <input
                                    type="text"
                                    value={item.description || item.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setBerkasList(prev => prev.map((b, i) => i === idx ? { ...b, description: val } : b));
                                    }}
                                    placeholder="Judul / Keterangan Dokumen"
                                    className="w-full text-xs font-bold text-emerald-950 bg-transparent border-b border-transparent focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded outline-hidden truncate"
                                  />
                                  <div className="flex items-center gap-2 text-[10px] text-emerald-700 px-1">
                                    <span className="font-semibold">{badge.shortLabel}</span>
                                    <span>•</span>
                                    <span className="font-mono truncate">{item.name}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => downloadFile(item.url, item.name)}
                                  className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded-lg transition"
                                  title="Unduh file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBerkasList(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                                  title="Hapus lampiran ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div 
                        onClick={() => multiFileInputRef.current?.click()}
                        className="p-6 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 text-center cursor-pointer hover:bg-emerald-50 transition"
                      >
                        <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-emerald-950">Klik di sini untuk upload banyak berkas/foto tanpa batasan</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Dapat memilih lebih dari 2 lembar / ratusan lembar sekaligus (JPG, PNG, PDF)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Data Identitas Anggota */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">NIS (Nomor Induk Santri / Anggota)</label>
                  <input 
                    type="text" 
                    required 
                    value={nis} 
                    onChange={e => setNis(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl font-mono font-bold" 
                    placeholder="Contoh: SHM-PTR-001" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">NIK (Nomor Induk Kependudukan)</label>
                  <input 
                    type="text" 
                    required 
                    value={nik} 
                    onChange={e => setNik(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl font-mono" 
                    placeholder="Contoh: 352908..." 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  value={nama} 
                  onChange={e => setNama(e.target.value)} 
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl font-bold text-emerald-950" 
                  placeholder="Nama lengkap santri / aktivis..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Jabatan / Status Organisasi</label>
                  <input 
                    type="text" 
                    required 
                    value={jabatan} 
                    onChange={e => setJabatan(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl font-bold text-emerald-950" 
                    placeholder="Contoh: Sekretaris Umum / Anggota" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Tempat, Tanggal Lahir</label>
                  <input 
                    type="text" 
                    required 
                    value={ttl} 
                    onChange={e => setTtl(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" 
                    placeholder="Contoh: Sumenep, 12 Maret 2004" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Ayah</label>
                  <input 
                    type="text" 
                    required 
                    value={ayah} 
                    onChange={e => setAyah(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" 
                    placeholder="Nama ayah kandung..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Nama Ibu</label>
                  <input 
                    type="text" 
                    required 
                    value={ibu} 
                    onChange={e => setIbu(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" 
                    placeholder="Nama ibu kandung..." 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Nomor WhatsApp / HP</label>
                  <input 
                    type="text" 
                    value={hp} 
                    onChange={e => setHp(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl font-mono" 
                    placeholder="Contoh: 081234567890" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">RT / RW</label>
                  <input 
                    type="text" 
                    required 
                    value={rtRw} 
                    onChange={e => setRtRw(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" 
                    placeholder="Contoh: 001/002" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">Alamat Lengkap (Dusun / Jalan)</label>
                <textarea 
                  required 
                  value={alamat} 
                  onChange={e => setAlamat(e.target.value)} 
                  rows={2} 
                  className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" 
                  placeholder="Nama dusun, asrama pondok, atau nama jalan..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Desa</label>
                  <input 
                    type="text" 
                    required 
                    value={desa} 
                    onChange={e => setDesa(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl" 
                    placeholder="Contoh: Gayam / Tarebung / Pancor" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Kecamatan</label>
                  <select 
                    value={kecamatan} 
                    onChange={e => setKecamatan(e.target.value)} 
                    className="w-full p-2.5 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl font-bold"
                  >
                    <option value="Gayam">Gayam</option>
                    <option value="Nonggunong">Nonggunong</option>
                    <option value="Luar Sapudi">Luar Sapudi</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-amber-200 bg-emerald-900 hover:bg-emerald-800 rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Anggota & Sheets'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal Component */}
      {showPrintModal && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Database Sensus Anggota (${activeTipe.toUpperCase().replace(/_/g, ' ')})`}
          subtitle="Laporan Resmi Data Sensus & Status Berkas Anggota Sapudi"
          orgProfile={orgProfile}
          logoUrl={logoUrl}
          data={filtered.map(item => ({
            'NIS': item.nis,
            'NIK': item.nik,
            'NAMA': item.nama,
            'JABATAN': item.jabatan || '-',
            'TTL': item.ttl,
            'ORANG TUA': `Ayah: ${item.ayah} | Ibu: ${item.ibu}`,
            'NO HP': item.noHandphone || '-',
            'ALAMAT': `${item.alamat}, RT ${item.rtRw}, Desa ${item.desa}, Kec. ${item.kecamatan}`,
            'STATUS FOTO': item.fotoUrl ? 'Ada' : '-',
            'SHEET BERKAS': getAllMemberBerkas(item).map(b => getBerkasBadgeInfo(b.type, b.name).shortLabel).join(', ') || 'Belum Ada'
          }))}
        />
      )}
    </div>
  );
};
