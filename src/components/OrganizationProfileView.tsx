import React, { useState, useRef } from 'react';
import { OrganizationProfile, UserAccount } from '../types';
import { uploadFileToServer } from '../utils/fileUtils';
import { PermanentImage } from './PermanentImage';
import { 
  Building2, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  FileText, 
  Share2, 
  BookOpen, 
  Trash2, 
  Plus, 
  Eye, 
  Stamp, 
  PenTool,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface OrganizationProfileViewProps {
  profile: OrganizationProfile;
  onSaveProfile: (profile: OrganizationProfile) => void;
  currentUser: UserAccount | null;
}

export const OrganizationProfileView: React.FC<OrganizationProfileViewProps> = ({
  profile,
  onSaveProfile,
  currentUser
}) => {
  const [formData, setFormData] = useState<OrganizationProfile>(profile);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingStempel, setIsUploadingStempel] = useState(false);
  const [isUploadingTtdKetua, setIsUploadingTtdKetua] = useState(false);
  const [isUploadingTtdSekretaris, setIsUploadingTtdSekretaris] = useState(false);
  const [newMisiText, setNewMisiText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'kop' | 'kta' | 'kwitansi' | 'piagam'>('kop');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stempelInputRef = useRef<HTMLInputElement>(null);
  const ttdKetuaInputRef = useRef<HTMLInputElement>(null);
  const ttdSekretarisInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'sekretaris' || currentUser?.role === 'bendahara';

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadFileToServer(file, `Logo_Organisasi_${Date.now()}`);
      if (uploaded && uploaded.url) {
        try {
          localStorage.setItem('fokus_custom_logo', uploaded.url);
        } catch {}

        const updatedProfile: OrganizationProfile = {
          ...formData,
          id: formData.id || 'fokus_sapudi_main_profile',
          logoUrl: uploaded.url,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Administrator'
        };
        setFormData(updatedProfile);
        onSaveProfile(updatedProfile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleStempelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStempel(true);
    try {
      const uploaded = await uploadFileToServer(file, `Stempel_Resmi_${Date.now()}`);
      if (uploaded && uploaded.url) {
        const updatedProfile: OrganizationProfile = {
          ...formData,
          id: formData.id || 'fokus_sapudi_main_profile',
          stempelUrl: uploaded.url,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Administrator'
        };
        setFormData(updatedProfile);
        onSaveProfile(updatedProfile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error uploading stamp:', err);
    } finally {
      setIsUploadingStempel(false);
      if (stempelInputRef.current) stempelInputRef.current.value = '';
    }
  };

  const handleTtdKetuaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTtdKetua(true);
    try {
      const uploaded = await uploadFileToServer(file, `TTD_Ketua_${Date.now()}`);
      if (uploaded && uploaded.url) {
        const updatedProfile: OrganizationProfile = {
          ...formData,
          id: formData.id || 'fokus_sapudi_main_profile',
          tandaTanganKetuaUrl: uploaded.url,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Administrator'
        };
        setFormData(updatedProfile);
        onSaveProfile(updatedProfile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error uploading signature:', err);
    } finally {
      setIsUploadingTtdKetua(false);
      if (ttdKetuaInputRef.current) ttdKetuaInputRef.current.value = '';
    }
  };

  const handleTtdSekretarisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTtdSekretaris(true);
    try {
      const uploaded = await uploadFileToServer(file, `TTD_Sekretaris_${Date.now()}`);
      if (uploaded && uploaded.url) {
        const updatedProfile: OrganizationProfile = {
          ...formData,
          id: formData.id || 'fokus_sapudi_main_profile',
          tandaTanganSekretarisUrl: uploaded.url,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Administrator'
        };
        setFormData(updatedProfile);
        onSaveProfile(updatedProfile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error uploading signature:', err);
    } finally {
      setIsUploadingTtdSekretaris(false);
      if (ttdSekretarisInputRef.current) ttdSekretarisInputRef.current.value = '';
    }
  };

  const handleResetToDefaultLogo = () => {
    if (window.confirm('Kembalikan logo ke logo bawaan resmi sistem (/logo.png)?')) {
      try {
        localStorage.removeItem('fokus_custom_logo');
      } catch {}
      const updatedProfile: OrganizationProfile = {
        ...formData,
        id: formData.id || 'fokus_sapudi_main_profile',
        logoUrl: '/logo.png',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Administrator'
      };
      setFormData(updatedProfile);
      onSaveProfile(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handleAddMisi = () => {
    if (!newMisiText.trim()) return;
    setFormData(prev => ({
      ...prev,
      misi: [...(prev.misi || []), newMisiText.trim()]
    }));
    setNewMisiText('');
  };

  const handleRemoveMisi = (index: number) => {
    setFormData(prev => ({
      ...prev,
      misi: prev.misi.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...formData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Administrator'
    };
    onSaveProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-full p-1 shadow-2xl border-2 border-amber-400 flex items-center justify-center shrink-0 overflow-hidden">
              <PermanentImage 
                src={formData.logoUrl || '/logo.png'} 
                fallbackSrc="/logo.png"
                alt="Logo Organisasi" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Identitas & Brand Organisasi
                </span>
                <span className="text-emerald-300 text-xs flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Multi-View Synchronized
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-amber-200">
                {formData.namaOrganisasi || 'Forum Komunikasi Santri'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 italic max-w-2xl">
                "{formData.semboyan || 'Merajut Silaturrahmi, Meneguhkan Khidmah Santri'}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canEdit}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-xs sm:text-sm active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-950/80 border border-emerald-400 text-amber-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Berhasil! Logo kustom dan data profil organisasi telah diperbarui seketika di seluruh tampilan aplikasi.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Upload Custom Logo, Stempel & Tanda Tangan */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-950 font-serif">
                  1. Kustomisasi Logo & Stempel Resmi
                </h2>
                <p className="text-xs text-emerald-700">
                  Logo yang diunggah di sini otomatis diterapkan pada Navbar, Sidebar, Login, KTA Santri, Kwitansi Kas, dan Piagam.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box 1: Main Custom Logo */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Logo Utama Organisasi
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold">
                    Wajib
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-dashed border-emerald-300 mb-4 text-center">
                  <div className="w-28 h-28 bg-white rounded-full p-1 shadow-md border border-emerald-200 flex items-center justify-center overflow-hidden mb-3">
                    <PermanentImage 
                      src={formData.logoUrl || '/logo.png'} 
                      fallbackSrc="/logo.png"
                      alt="Preview Logo" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1 shadow-xs border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersimpan Permanen (Cloud & Vault)</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-950">Resolusi HD / Transparan</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Format PNG transparan atau JPG bulat disarankan.</p>
                </div>
              </div>

              <div className="space-y-2">
                <input 
                  type="file" 
                  ref={logoInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo || !canEdit}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingLogo ? 'Mengunggah...' : 'Unggah Logo Baru (Manual)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaultLogo}
                  disabled={!canEdit}
                  className="w-full py-2 bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kembalikan Logo Bawaan</span>
                </button>
              </div>
            </div>

            {/* Box 2: Stempel Resmi */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-emerald-700" />
                    Stempel Resmi Organisasi
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold">
                    Surat & Kwitansi
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-dashed border-emerald-300 mb-4 text-center">
                  <div className="w-28 h-28 bg-white rounded-full p-1 shadow-md border border-emerald-200 flex items-center justify-center overflow-hidden mb-3">
                    <PermanentImage 
                      src={formData.stempelUrl || formData.logoUrl || '/logo.png'} 
                      fallbackSrc="/logo.png"
                      alt="Preview Stempel" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1 shadow-xs border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersimpan Permanen (Cloud & Vault)</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-950">Stempel Cap Bulat</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Diterapkan pada tanda tangan surat, nota, dan piagam.</p>
                </div>
              </div>

              <div className="space-y-2">
                <input 
                  type="file" 
                  ref={stempelInputRef}
                  onChange={handleStempelFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => stempelInputRef.current?.click()}
                  disabled={isUploadingStempel || !canEdit}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingStempel ? 'Mengunggah...' : 'Unggah File Stempel'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, stempelUrl: prev.logoUrl }))}
                  disabled={!canEdit}
                  className="w-full py-2 bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <span>Samakan Dengan Logo Utama</span>
                </button>
              </div>
            </div>

            {/* Box 3: Tanda Tangan Digital Pimpinan */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                    Tanda Tangan Pimpinan
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold">
                    Opsional
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center flex flex-col items-center">
                    <div className="w-full h-16 bg-emerald-50/40 rounded-lg flex items-center justify-center overflow-hidden mb-1 border">
                      {formData.tandaTanganKetuaUrl ? (
                        <img src={formData.tandaTanganKetuaUrl} alt="TTD Ketua" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-emerald-500 italic">Belum ada TTD</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-950">TTD Ketua</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center flex flex-col items-center">
                    <div className="w-full h-16 bg-emerald-50/40 rounded-lg flex items-center justify-center overflow-hidden mb-1 border">
                      {formData.tandaTanganSekretarisUrl ? (
                        <img src={formData.tandaTanganSekretarisUrl} alt="TTD Sekretaris" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-emerald-500 italic">Belum ada TTD</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-950">TTD Sekretaris</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="file" 
                  ref={ttdKetuaInputRef}
                  onChange={handleTtdKetuaFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ttdKetuaInputRef.current?.click()}
                  disabled={isUploadingTtdKetua || !canEdit}
                  className="py-2 px-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isUploadingTtdKetua ? '...' : 'TTD Ketua'}</span>
                </button>

                <input 
                  type="file" 
                  ref={ttdSekretarisInputRef}
                  onChange={handleTtdSekretarisFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ttdSekretarisInputRef.current?.click()}
                  disabled={isUploadingTtdSekretaris || !canEdit}
                  className="py-2 px-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isUploadingTtdSekretaris ? '...' : 'TTD Sekretaris'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Informasi Umum & Nama Organisasi */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3 border-b border-emerald-100 pb-4 mb-6">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950 font-serif">
                2. Data Pokok & Susunan Pimpinan Organisasi
              </h2>
              <p className="text-xs text-emerald-700">
                Nama resmi, singkatan, semboyan, dan penanggung jawab pengurus harian.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Nama Lengkap Organisasi
              </label>
              <input 
                type="text"
                value={formData.namaOrganisasi}
                onChange={e => setFormData({ ...formData, namaOrganisasi: e.target.value })}
                required
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Contoh: Forum Komunikasi Santri (FOKUS) Sapudi"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Singkatan / Akronim
              </label>
              <input 
                type="text"
                value={formData.singkatan}
                onChange={e => setFormData({ ...formData, singkatan: e.target.value })}
                required
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Contoh: FOKUS"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Semboyan / Motto Khidmah
              </label>
              <input 
                type="text"
                value={formData.semboyan}
                onChange={e => setFormData({ ...formData, semboyan: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Contoh: Merajut Silaturrahmi, Meneguhkan Khidmah & Nilai-Nilai Santri"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Tahun Berdiri Organisasi
              </label>
              <input 
                type="text"
                value={formData.tahunBerdiri}
                onChange={e => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Contoh: 2018"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Ketua Umum / Pimpinan
              </label>
              <input 
                type="text"
                value={formData.namaKetua}
                onChange={e => setFormData({ ...formData, namaKetua: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Nama Ketua Organisasi"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Sekretaris Umum
              </label>
              <input 
                type="text"
                value={formData.namaSekretaris}
                onChange={e => setFormData({ ...formData, namaSekretaris: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Nama Sekretaris"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Bendahara Umum
              </label>
              <input 
                type="text"
                value={formData.namaBendahara}
                onChange={e => setFormData({ ...formData, namaBendahara: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Nama Bendahara"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kontak & Sekretariat */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3 border-b border-emerald-100 pb-4 mb-6">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950 font-serif">
                3. Alamat Sekretariat & Kontak Resmi
              </h2>
              <p className="text-xs text-emerald-700">
                Informasi kop surat, korespondensi resmi, dan tautan jejaring media sosial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Alamat Lengkap Sekretariat Bersama
              </label>
              <input 
                type="text"
                value={formData.alamatSekretariat}
                onChange={e => setFormData({ ...formData, alamatSekretariat: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Jl. Raya Gayam - Sapudi..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Desa / Kelurahan
              </label>
              <input 
                type="text"
                value={formData.desa}
                onChange={e => setFormData({ ...formData, desa: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Kecamatan
              </label>
              <input 
                type="text"
                value={formData.kecamatan}
                onChange={e => setFormData({ ...formData, kecamatan: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Kabupaten / Kota
              </label>
              <input 
                type="text"
                value={formData.kabupaten}
                onChange={e => setFormData({ ...formData, kabupaten: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-700" />
                No. Telepon / WhatsApp
              </label>
              <input 
                type="text"
                value={formData.noTelepon}
                onChange={e => setFormData({ ...formData, noTelepon: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="+62 812-..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-emerald-700" />
                Email Resmi Organisasi
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="manajemenfokussapudi@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-700" />
                Website Resmi
              </label>
              <input 
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="https://fokussapudi.org"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Instagram (@akun)
              </label>
              <input 
                type="text"
                value={formData.instagram}
                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="@fokus_sapudi"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                YouTube Channel
              </label>
              <input 
                type="text"
                value={formData.youtube}
                onChange={e => setFormData({ ...formData, youtube: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="FOKUS Sapudi Official"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Facebook / Fanpage
              </label>
              <input 
                type="text"
                value={formData.facebook}
                onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Fokus Sapudi Official"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Visi, Misi & Sejarah */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3 border-b border-emerald-100 pb-4 mb-6">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950 font-serif">
                4. Visi, Misi & Sejarah Pendirian
              </h2>
              <p className="text-xs text-emerald-700">
                Landasan perjuangan organisasi santri Pulau Sapudi.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Visi Organisasi
              </label>
              <textarea 
                rows={2}
                value={formData.visi}
                onChange={e => setFormData({ ...formData, visi: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Tuliskan visi utama organisasi..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Butir-Butir Misi Organisasi
              </label>
              <div className="space-y-2.5 mb-3">
                {formData.misi?.map((misiItem, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                    <span className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-950 flex-1 leading-relaxed">{misiItem}</p>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMisi(idx)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Butir Misi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newMisiText}
                    onChange={e => setNewMisiText(e.target.value)}
                    placeholder="Tambah butir misi baru..."
                    className="flex-1 px-4 py-2 rounded-xl border border-emerald-300 text-xs sm:text-sm bg-emerald-50/20 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMisi();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddMisi}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                Sejarah Singkat Organisasi
              </label>
              <textarea 
                rows={3}
                value={formData.sejarahSingkat}
                onChange={e => setFormData({ ...formData, sejarahSingkat: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm text-emerald-950 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-emerald-50/20"
                placeholder="Sejarah singkat berdirinya organisasi..."
              />
            </div>
          </div>
        </div>

        {/* Section 5: Live Interactive Previews */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-950 font-serif">
                  5. Preview Penerapan Logo & Data Organisasi Real-time
                </h2>
                <p className="text-xs text-emerald-700">
                  Uji coba visual bagaimana logo baru tampil di berbagai dokumen resmi aplikasi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-200">
              <button
                type="button"
                onClick={() => setActivePreviewTab('kop')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activePreviewTab === 'kop' ? 'bg-emerald-800 text-amber-200 shadow-sm' : 'text-emerald-800 hover:bg-emerald-200/60'
                }`}
              >
                Kop Surat
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('kta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activePreviewTab === 'kta' ? 'bg-emerald-800 text-amber-200 shadow-sm' : 'text-emerald-800 hover:bg-emerald-200/60'
                }`}
              >
                KTA Digital
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('kwitansi')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activePreviewTab === 'kwitansi' ? 'bg-emerald-800 text-amber-200 shadow-sm' : 'text-emerald-800 hover:bg-emerald-200/60'
                }`}
              >
                Kwitansi Kas
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('piagam')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activePreviewTab === 'piagam' ? 'bg-emerald-800 text-amber-200 shadow-sm' : 'text-emerald-800 hover:bg-emerald-200/60'
                }`}
              >
                Piagam Lomba
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 flex items-center justify-center">
            {activePreviewTab === 'kop' && (
              <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-300 font-serif text-center relative overflow-hidden">
                <div className="flex items-center justify-between border-b-4 border-double border-emerald-900 pb-4 mb-4">
                  <div className="w-20 h-20 bg-white rounded-full p-1 flex items-center justify-center shrink-0 border border-emerald-300">
                    <PermanentImage 
                      src={formData.logoUrl || '/logo.png'} 
                      fallbackSrc="/logo.png"
                      alt="Logo Kop" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div className="flex-1 px-4 text-center">
                    <h3 className="text-base sm:text-lg font-bold text-emerald-950 uppercase tracking-wide">
                      {formData.namaOrganisasi}
                    </h3>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mt-0.5">
                      PENGURUS BESAR / CABANG PULAU SAPUDI
                    </p>
                    <p className="text-[10px] text-gray-600 font-sans mt-1">
                      Sekretariat: {formData.alamatSekretariat}, Desa {formData.desa}, Kec. {formData.kecamatan}, Kab. {formData.kabupaten} {formData.kodePos}
                    </p>
                    <p className="text-[10px] text-gray-600 font-sans">
                      Telp/WA: {formData.noTelepon} | Email: {formData.email} | Web: {formData.website}
                    </p>
                  </div>
                  <div className="w-20 h-20 bg-white rounded-full p-1 flex items-center justify-center shrink-0 border border-emerald-300">
                    <PermanentImage 
                      src={formData.stempelUrl || formData.logoUrl || '/logo.png'} 
                      fallbackSrc="/logo.png"
                      alt="Logo Kop Kanan" 
                      className="w-full h-full object-contain rounded-full opacity-80"
                    />
                  </div>
                </div>

                <div className="py-6 text-left font-sans text-xs text-gray-700 space-y-2">
                  <p className="font-bold text-center underline uppercase text-sm">SURAT KEPUTUSAN / MANDAT RESMI</p>
                  <p className="text-center text-[11px] text-gray-500">Nomor: 014/PB-FOKUS/SK/VIII/2026</p>
                  <p className="pt-2">Dengan memohon rahmat dan ridho Allah SWT, Pengurus {formData.namaOrganisasi} menetapkan keputusan resmi...</p>
                </div>

                <div className="pt-6 flex items-center justify-between text-xs font-sans border-t border-gray-200">
                  <div>
                    <p className="font-semibold">Ketua Umum,</p>
                    <div className="h-12 flex items-center justify-center">
                      {formData.tandaTanganKetuaUrl ? (
                        <PermanentImage src={formData.tandaTanganKetuaUrl} alt="TTD Ketua" className="h-10 object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
                      )}
                    </div>
                    <p className="font-bold underline text-emerald-950">{formData.namaKetua}</p>
                  </div>

                  <div className="w-16 h-16 rounded-full flex items-center justify-center opacity-70">
                    <PermanentImage src={formData.stempelUrl || formData.logoUrl || '/logo.png'} fallbackSrc="/logo.png" alt="Cap" className="w-full h-full object-contain rounded-full" />
                  </div>

                  <div>
                    <p className="font-semibold">Sekretaris Umum,</p>
                    <div className="h-12 flex items-center justify-center">
                      {formData.tandaTanganSekretarisUrl ? (
                        <PermanentImage src={formData.tandaTanganSekretarisUrl} alt="TTD Sekretaris" className="h-10 object-contain" />
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
                      )}
                    </div>
                    <p className="font-bold underline text-emerald-950">{formData.namaSekretaris}</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'kta' && (
              <div className="w-full max-w-sm bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-4 rounded-2xl shadow-xl text-white border-2 border-amber-400/80 relative overflow-hidden">
                <div className="flex items-center gap-3 border-b border-amber-400/30 pb-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-full p-0.5 border border-amber-400 flex items-center justify-center shrink-0">
                    <PermanentImage src={formData.logoUrl || '/logo.png'} fallbackSrc="/logo.png" alt="Logo KTA" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-serif text-amber-200 uppercase leading-tight">
                      KARTU TANDA ANGGOTA
                    </h4>
                    <p className="text-[9px] text-emerald-300">{formData.namaOrganisasi}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-center my-3">
                  <div className="w-16 h-20 bg-emerald-800 rounded-lg border-2 border-amber-300 overflow-hidden flex items-center justify-center text-xs text-amber-200 font-bold">
                    FOTO
                  </div>
                  <div className="text-[10px] space-y-1 text-emerald-100 flex-1">
                    <p><span className="text-emerald-400 font-semibold">Nama:</span> AHMAD ROFIQI</p>
                    <p><span className="text-emerald-400 font-semibold">NIA:</span> 2026.08.0012</p>
                    <p><span className="text-emerald-400 font-semibold">Pesantren:</span> Annuqayah Guluk-Guluk</p>
                    <p><span className="text-emerald-400 font-semibold">Domisili:</span> Gayam - Sapudi</p>
                  </div>
                </div>

                <div className="border-t border-amber-400/30 pt-2 flex items-center justify-between text-[8px] text-emerald-300">
                  <span>Berlaku Selama Menjadi Anggota</span>
                  <span className="text-amber-300 font-mono">SAHMASY RESMI</span>
                </div>
              </div>
            )}

            {activePreviewTab === 'kwitansi' && (
              <div className="w-full max-w-lg bg-white p-5 rounded-xl shadow-md border border-emerald-200 text-xs text-emerald-950 font-sans">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <PermanentImage src={formData.logoUrl || '/logo.png'} fallbackSrc="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-full border border-emerald-300 p-0.5" />
                    <div>
                      <p className="font-bold font-serif text-emerald-900 leading-tight">BENDAHARA & KAS</p>
                      <p className="text-[10px] text-emerald-700">{formData.namaOrganisasi}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">KWITANSI RESMI</span>
                    <p className="text-[9px] text-gray-500 mt-0.5">No: KAS-2026/089</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <p><span className="text-gray-500">Telah Diterima Dari:</span> <strong>Ust. M. Syarifuddin</strong></p>
                  <p><span className="text-gray-500">Jumlah Uang:</span> <strong className="text-emerald-800 font-mono text-sm">Rp 150.000,-</strong> (Seratus Lima Puluh Ribu Rupiah)</p>
                  <p><span className="text-gray-500">Untuk Pembayaran:</span> Iuran Kas Safari Khotmil & Jam'iyatul Hadrah</p>
                </div>
              </div>
            )}

            {activePreviewTab === 'piagam' && (
              <div className="w-full max-w-lg bg-emerald-950 p-6 rounded-2xl shadow-xl text-center text-white border-4 border-double border-amber-400 relative">
                <div className="w-14 h-14 bg-white rounded-full p-1 mx-auto mb-2 border border-amber-400 flex items-center justify-center">
                  <PermanentImage src={formData.logoUrl || '/logo.png'} fallbackSrc="/logo.png" alt="Logo Piagam" className="w-full h-full object-contain rounded-full" />
                </div>
                <h4 className="text-sm font-bold font-serif text-amber-300 uppercase tracking-wider">PIAGAM PENGHARGAAN</h4>
                <p className="text-[10px] text-emerald-200">{formData.namaOrganisasi}</p>
                <p className="text-[9px] text-gray-300 italic mt-2">Diberikan sebagai Juara I Festival Seni Hadrah Al-Habsyi Se-Pulau Sapudi</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Bottom Action Bar */}
        <div className="sticky bottom-4 z-30 bg-emerald-950/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-700/60 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Perubahan logo & data profil otomatis tersimpan ke Server Database & Firestore.</span>
            <span className="sm:hidden">Sinkron ke seluruh sistem</span>
          </div>

          <button
            type="submit"
            disabled={!canEdit}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-bold rounded-xl shadow-lg transition flex items-center gap-2 text-xs sm:text-sm active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
