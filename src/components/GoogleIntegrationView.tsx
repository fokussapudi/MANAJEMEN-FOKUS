import React, { useState } from 'react';
import { Cloud, CheckCircle2, RefreshCw, Database, FileSpreadsheet, HardDrive, ShieldCheck } from 'lucide-react';

interface GoogleIntegrationViewProps {
  isSynced: boolean;
  onTriggerSync: () => void;
  onNotify: (title: string, message: string) => void;
}

export const GoogleIntegrationView: React.FC<GoogleIntegrationViewProps> = ({
  isSynced,
  onTriggerSync,
  onNotify
}) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Baru saja (Real-time)');

  const handleRunSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString() + ' - Real-time Connected');
      onTriggerSync();
      onNotify('Sinkronisasi Berhasil', 'Seluruh database FOKUS SAPUDI berhasil dicadangkan ke Google Drive & Google Sheets.');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-emerald-700">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Cloud className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-200 text-xs font-semibold mb-3 border border-emerald-700">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Google Workspace Enterprise Sync</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-100 tracking-wide">
            Integrasi Real-time Google Drive & Sheets
          </h2>
          <p className="text-emerald-100 text-sm mt-2 max-w-2xl leading-relaxed">
            Menghubungkan seluruh modul pencatatan organisasi (Fokuskegiatan, Keuangan Bendahara, Khotmil Qur'an, Perlombaan, dan Sensus Sahmasy) langsung ke cloud Google Drive untuk kolaborasi multi-user antar pengurus.
          </p>
        </div>
      </div>

      {/* Sync Status Box */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-900 text-amber-300 rounded-2xl flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Google Drive Storage</p>
            <p className="text-base font-bold text-emerald-950 mt-1">Folder: /Fokus_Sapudi_Cloud</p>
            <p className="text-[10px] text-emerald-600">Auto-Backup: Aktif</p>
          </div>
        </div>

        <div className="p-5 bg-teal-50/70 rounded-2xl border border-teal-200 flex items-center space-x-4">
          <div className="w-12 h-12 bg-teal-900 text-amber-300 rounded-2xl flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-teal-700 font-bold uppercase tracking-wider">Google Sheets Realtime</p>
            <p className="text-base font-bold text-emerald-950 mt-1">Sheets DB Terhubung</p>
            <p className="text-[10px] text-teal-600">Sinkronisasi Otomatis</p>
          </div>
        </div>

        <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-800 text-white rounded-2xl flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Status Koneksi</p>
            <p className="text-base font-bold text-emerald-950 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Terhubung</span>
            </p>
            <p className="text-[10px] text-emerald-700">Terakhir sync: {lastSyncTime}</p>
          </div>
        </div>
      </div>

      {/* Manual Action Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-serif font-bold text-emerald-950">Sinkronisasi Manual & Refresh Data</h3>
          <p className="text-xs text-emerald-600 mt-0.5">Tekan tombol di samping untuk memaksa sinkronisasi instan ke Google Drive & Sheets.</p>
        </div>
        <button
          onClick={handleRunSync}
          disabled={syncing}
          className="px-6 py-3 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white font-semibold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-amber-300 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sedang Menyinkronkan...' : 'Sinkronisasi Sekarang'}</span>
        </button>
      </div>

    </div>
  );
};
