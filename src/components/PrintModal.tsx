import React from 'react';
import { X, Printer, Download, Sparkles } from 'lucide-react';

interface PrintModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const PrintModal: React.FC<PrintModalProps> = ({ title, onClose, children }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif font-bold text-amber-200 text-base">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 max-w-3xl mx-auto print:shadow-none print:border-none">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-emerald-50 px-6 py-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-700 shrink-0">
          <span>MANAJEMENT FOKUS SAPUDI — Dokumen Resmi Organisasi</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-800 text-white rounded-xl font-medium hover:bg-emerald-900 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
