import React from 'react';
import { X, Printer, Sparkles } from 'lucide-react';
import { OrganizationProfile } from '../types';
import { PermanentImage } from './PermanentImage';

interface PrintModalProps {
  isOpen?: boolean;
  title: string;
  onClose: () => void;
  subtitle?: string;
  data?: Record<string, any>[];
  children?: React.ReactNode;
  logoUrl?: string;
  orgName?: string;
  orgProfile?: OrganizationProfile;
  showKop?: boolean;
}

export const PrintModal: React.FC<PrintModalProps> = ({ 
  isOpen = true, 
  title, 
  onClose, 
  subtitle,
  data,
  children,
  logoUrl,
  orgName,
  orgProfile,
  showKop = false
}) => {
  if (isOpen === false) {
    return null;
  }

  const effectiveLogo = logoUrl || orgProfile?.logoUrl || '/logo.png';
  const effectiveOrgName = orgName || orgProfile?.namaOrganisasi || 'MANAJEMEN FOKUS SAPUDI';
  const effectiveAddress = orgProfile?.alamatSekretariat || 'Pulau Sapudi, Kab. Sumenep, Jawa Timur';
  const effectiveContact = orgProfile?.noTelepon || orgProfile?.email || 'Telp/WA: +62 812-3456-7890';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-serif font-bold text-amber-200 text-base">{title}</h3>
              {subtitle && <p className="text-xs text-emerald-300">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 max-w-3xl mx-auto print:shadow-none print:border-none">
            {children ? (
              children
            ) : data && data.length > 0 ? (
              <div className="space-y-4 text-xs font-sans">
                {/* Official Kop Surat Header */}
                <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-900">
                  <div className="w-14 h-14 bg-white rounded-full border border-amber-400 overflow-hidden shrink-0 shadow-xs p-0.5">
                    <PermanentImage src={effectiveLogo} fallbackSrc="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div className="flex-1 text-center pr-6">
                    <h2 className="text-sm sm:text-base font-serif font-bold text-emerald-950 uppercase tracking-wide">
                      {effectiveOrgName}
                    </h2>
                    <p className="text-[10px] text-emerald-800 mt-0.5 font-sans">
                      {effectiveAddress} | {effectiveContact}
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-1 py-2">
                  <h2 className="text-sm font-serif font-bold text-emerald-950 uppercase tracking-wider underline">{title}</h2>
                  {subtitle && <p className="text-xs text-emerald-800">{subtitle}</p>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-200 font-bold text-emerald-950 bg-emerald-50">
                        <th className="p-2 text-center w-8">NO</th>
                        {Object.keys(data[0]).map((key) => (
                          <th key={key} className="p-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 text-emerald-900">
                      {data.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center font-bold text-emerald-800">{idx + 1}</td>
                          {Object.values(row).map((val, vIdx) => (
                            <td key={vIdx} className="p-2">{String(val ?? '-')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-emerald-700">Tidak ada data untuk dicetak.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-emerald-50 px-6 py-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-700 shrink-0">
          <span className="font-medium text-emerald-900 uppercase tracking-wider text-[11px]">
            {effectiveOrgName} &mdash; Dokumen Resmi Organisasi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-800 text-white rounded-xl font-medium hover:bg-emerald-900 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
