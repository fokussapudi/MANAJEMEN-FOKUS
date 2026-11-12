/**
 * File & Media Utilities for FOKUS Applet
 * Provides client-side image compression, persistent server storage upload,
 * multi-sheet berkas extraction, and file downloading.
 */

import { BerkasItem, SahmasyRow } from '../types';
import { saveMediaToVault } from './idbStorage';
import { saveFileToCloudFirestore } from '../firebase';

export interface FileDataResult {
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}

export interface SheetDefinition {
  id: 'kk' | 'akta' | 'ktp' | 'santri' | 'ijazah' | 'foto' | 'dokumen_lain';
  title: string;
  shortLabel: string;
  sheetCode: string;
  description: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  bgLight: string;
}

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  {
    id: 'kk',
    title: 'Sheet Kartu Keluarga (KK)',
    shortLabel: 'Sheet KK',
    sheetCode: 'SH-01',
    description: 'Dokumen Resmi Kartu Keluarga (No. KK & Susunan Keluarga)',
    iconName: 'Users',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-blue-700',
    borderCol: 'border-blue-200',
    bgLight: 'bg-blue-50',
  },
  {
    id: 'akta',
    title: 'Sheet Akta Kelahiran',
    shortLabel: 'Sheet Akta',
    sheetCode: 'SH-02',
    description: 'Kutipan Akta Kelahiran Resmi dari Dispendukcapil',
    iconName: 'FileCheck',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-purple-700',
    borderCol: 'border-purple-200',
    bgLight: 'bg-purple-50',
  },
  {
    id: 'ktp',
    title: 'Sheet KTP / Identitas Santri',
    shortLabel: 'Sheet KTP',
    sheetCode: 'SH-03',
    description: 'Kartu Tanda Penduduk / Kartu Identitas Anak (NIK)',
    iconName: 'ShieldCheck',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-amber-700',
    borderCol: 'border-amber-200',
    bgLight: 'bg-amber-50',
  },
  {
    id: 'santri',
    title: 'Sheet Kartu Santri / Pesantren',
    shortLabel: 'Sheet Santri',
    sheetCode: 'SH-04',
    description: 'Kartu Tanda Santri / Bukti Registrasi Pondok Pesantren',
    iconName: 'BookOpen',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-emerald-700',
    borderCol: 'border-emerald-200',
    bgLight: 'bg-emerald-50',
  },
  {
    id: 'ijazah',
    title: 'Sheet Ijazah / Syahadah',
    shortLabel: 'Sheet Ijazah',
    sheetCode: 'SH-05',
    description: 'Ijazah Formal / Syahadah Pondok Pesantren Terakhir',
    iconName: 'GraduationCap',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-teal-700',
    borderCol: 'border-teal-200',
    bgLight: 'bg-teal-50',
  },
  {
    id: 'foto',
    title: 'Sheet Pas Foto Resmi',
    shortLabel: 'Sheet Pas Foto',
    sheetCode: 'SH-00',
    description: 'Pas Foto Resmi Berlatar Belakang Standar',
    iconName: 'Camera',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-indigo-700',
    borderCol: 'border-indigo-200',
    bgLight: 'bg-indigo-50',
  },
  {
    id: 'dokumen_lain',
    title: 'Sheet Dokumen Tambahan',
    shortLabel: 'Sheet Dokumen',
    sheetCode: 'SH-06',
    description: 'Sertifikat, Surat Keterangan, atau Berkas Tambahan Lainnya',
    iconName: 'FileText',
    badgeBg: 'bg-gray-700',
    badgeText: 'text-gray-700',
    borderCol: 'border-gray-200',
    bgLight: 'bg-gray-50',
  },
];

/**
 * Compresses an image file client-side to ensure lightweight storage
 * and ultra-fast preview without exceeding Firestore or browser memory limits.
 * Gracefully resolves on any canvas/decoding issue to prevent unhandled rejection.
 */
export const compressImage = (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve) => {
    // If not an image or empty type, read directly as DataURL
    if (!file || !file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    // Safety timeout: Never hang more than 4.5 seconds for image decoding
    let isSettled = false;
    const safeResolve = (val: string) => {
      if (!isSettled) {
        isSettled = true;
        resolve(val);
      }
    };

    const safetyTimer = setTimeout(() => {
      const fallbackReader = new FileReader();
      fallbackReader.onload = (ev) => safeResolve((ev.target?.result as string) || '');
      fallbackReader.onerror = () => safeResolve('');
      fallbackReader.readAsDataURL(file);
    }, 4500);

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultStr = (event.target?.result as string) || '';
      if (!resultStr) {
        clearTimeout(safetyTimer);
        safeResolve('');
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        clearTimeout(safetyTimer);
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            safeResolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            safeResolve(resultStr);
          }
        } catch {
          safeResolve(resultStr);
        }
      };

      img.onerror = () => {
        clearTimeout(safetyTimer);
        safeResolve(resultStr);
      };

      img.src = resultStr;
    };

    reader.onerror = () => {
      clearTimeout(safetyTimer);
      safeResolve('');
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Reads any document (PDF, Image, etc.) as a Data URL for instant in-browser preview and download.
 */
export const readFileAsDataUrl = (file: File): Promise<FileDataResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file (or base64 data URL) to the persistent server storage `/api/upload`.
 * Returns the short URL `/uploads/filename` which keeps Firestore and local state ultra-lightweight.
 * If server is unreachable, safely falls back to the compressed data URL to guarantee zero data loss.
 */
export const uploadFileToServer = async (
  fileOrDataUrl: File | string,
  customName?: string
): Promise<{ url: string; name: string; size?: number; type?: string }> => {
  try {
    let dataUrl = '';
    let name = customName || 'berkas';
    let size = 0;
    let type = 'image/jpeg';

    if (typeof fileOrDataUrl === 'string') {
      // If already an existing server uploaded URL, return immediately without re-processing
      if (fileOrDataUrl.startsWith('/uploads/')) {
        return {
          url: fileOrDataUrl,
          name: customName || fileOrDataUrl.split('/').pop() || 'berkas',
          type: 'image/jpeg'
        };
      }
      dataUrl = fileOrDataUrl;
    } else {
      name = customName || fileOrDataUrl.name;
      size = fileOrDataUrl.size;
      type = fileOrDataUrl.type || 'image/jpeg';

      const isFoto = name.toLowerCase().includes('foto') || fileOrDataUrl.name.toLowerCase().includes('foto');
      const maxWidth = isFoto ? 800 : 1600;
      const maxHeight = isFoto ? 1000 : 1600;
      const quality = isFoto ? 0.82 : 0.85;

      if (fileOrDataUrl.type && fileOrDataUrl.type.startsWith('image/')) {
        dataUrl = await compressImage(fileOrDataUrl, maxWidth, maxHeight, quality);
      } else {
        const res = await readFileAsDataUrl(fileOrDataUrl);
        dataUrl = res.dataUrl;
      }
    }

    if (!dataUrl && typeof fileOrDataUrl !== 'string') {
      const res = await readFileAsDataUrl(fileOrDataUrl);
      dataUrl = res.dataUrl;
    }

    // Immediately cache dataUrl in IndexedDB Vault so it can never be lost
    if (dataUrl) {
      saveMediaToVault(name, dataUrl, { filename: name, size, type }).catch(() => {});
    }

    // Attempt upload to server with 1 retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl,
            filename: name,
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json.status === 'ok' && json.url) {
            const finalName = json.originalName || name;
            const finalSize = json.size || size;

            // Permanently cache under server URL in IndexedDB Vault
            saveMediaToVault(json.url, dataUrl, { filename: finalName, size: finalSize, type }).catch(() => {});
            
            // Permanently sync to Cloud Firestore
            saveFileToCloudFirestore(json.url, dataUrl, { filename: finalName, size: finalSize, type }).catch(() => {});

            return {
              url: json.url,
              name: finalName,
              size: finalSize,
              type,
            };
          }
        }
      } catch (netErr) {
        if (attempt === 2) {
          console.warn('[Upload] Server POST /api/upload notice after attempt 2:', netErr);
        }
      }
    }

    // Fallback: return compressed dataUrl and store permanently in IndexedDB and Cloud Firestore
    if (dataUrl) {
      saveMediaToVault(dataUrl, dataUrl, { filename: name, size, type }).catch(() => {});
      saveFileToCloudFirestore(name, dataUrl, { filename: name, size, type }).catch(() => {});
    }

    return {
      url: dataUrl,
      name,
      size,
      type,
    };
  } catch (err) {
    console.warn('[Upload Warning] Server upload fallback to local dataUrl:', err);
    if (typeof fileOrDataUrl === 'string') {
      return { url: fileOrDataUrl, name: customName || 'berkas' };
    }
    const res = await readFileAsDataUrl(fileOrDataUrl);
    if (res.dataUrl) {
      saveMediaToVault(res.name, res.dataUrl, { filename: res.name, size: res.size, type: res.type }).catch(() => {});
    }
    return { url: res.dataUrl, name: res.name, size: res.size, type: res.type };
  }
};

/**
 * Consolidates all sheets and uploaded berkas for a given member into a structured BerkasItem[] list.
 */
export const getAllMemberBerkas = (member: SahmasyRow): BerkasItem[] => {
  const result: BerkasItem[] = [];
  const addedUrls = new Set<string>();

  // Helper to add unique berkas
  const add = (item: BerkasItem) => {
    if (item.url && !addedUrls.has(item.url)) {
      addedUrls.add(item.url);
      result.push(item);
    }
  };

  // 1. Explicit multi-sheet fields
  if (member.kkUrl) {
    add({
      id: `${member.id}-kk`,
      type: 'kk',
      name: member.kkName || `Kartu_Keluarga_${member.nama.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      url: member.kkUrl,
      description: 'Sheet Kartu Keluarga (KK)',
    });
  }

  if (member.aktaUrl) {
    add({
      id: `${member.id}-akta`,
      type: 'akta',
      name: member.aktaName || `Akta_Kelahiran_${member.nama.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      url: member.aktaUrl,
      description: 'Sheet Akta Kelahiran',
    });
  }

  if (member.ktpUrl) {
    add({
      id: `${member.id}-ktp`,
      type: 'ktp',
      name: member.ktpName || `KTP_Identitas_${member.nama.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      url: member.ktpUrl,
      description: 'Sheet KTP / Identitas',
    });
  }

  if (member.santriUrl) {
    add({
      id: `${member.id}-santri`,
      type: 'santri',
      name: member.santriName || `Kartu_Santri_${member.nama.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      url: member.santriUrl,
      description: 'Sheet Kartu Santri / Pesantren',
    });
  }

  if (member.ijazahUrl) {
    add({
      id: `${member.id}-ijazah`,
      type: 'ijazah',
      name: member.ijazahName || `Ijazah_${member.nama.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
      url: member.ijazahUrl,
      description: 'Sheet Ijazah / Syahadah',
    });
  }

  // 2. Berkas list items
  if (Array.isArray(member.berkasList)) {
    member.berkasList.forEach((b) => {
      if (b && b.url) add(b);
    });
  }

  // 3. Legacy / single berkasUrl
  if (member.berkasUrl && !addedUrls.has(member.berkasUrl)) {
    const bType = member.berkasType || 'dokumen_lain';
    const bName = member.berkasName || `Berkas_${member.nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    add({
      id: `${member.id}-legacy-berkas`,
      type: bType,
      name: bName,
      url: member.berkasUrl,
      description: getBerkasBadgeInfo(bType, bName).label,
    });
  }

  return result;
};

/**
 * Triggers a browser file download with custom filename.
 */
export const downloadFile = async (dataUrlOrLink: string, fileName: string) => {
  if (!dataUrlOrLink) {
    alert('Berkas atau foto tidak ditemukan untuk diunduh.');
    return;
  }

  try {
    if (dataUrlOrLink.startsWith('http') || dataUrlOrLink.startsWith('/uploads')) {
      const response = await fetch(dataUrlOrLink);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
        return;
      }
    }
  } catch {}

  const a = document.createElement('a');
  a.href = dataUrlOrLink;
  a.download = fileName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Returns formatted label and badge color for different document types (KK, Akta, KTP, etc.)
 */
export const getBerkasBadgeInfo = (berkasType?: string, fileName?: string) => {
  const type = (berkasType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  if (type === 'kk' || name.includes('kk') || name.includes('keluarga')) {
    return {
      label: 'Kartu Keluarga (KK)',
      shortLabel: 'KK',
      sheetCode: 'SH-01',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      badgeBg: 'bg-blue-600 text-white',
    };
  }

  if (type === 'akta' || name.includes('akta') || name.includes('akte') || name.includes('lahir')) {
    return {
      label: 'Akta Kelahiran',
      shortLabel: 'Akta',
      sheetCode: 'SH-02',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      badgeBg: 'bg-purple-600 text-white',
    };
  }

  if (type === 'ktp' || name.includes('ktp') || name.includes('identitas')) {
    return {
      label: 'KTP / Identitas',
      shortLabel: 'KTP',
      sheetCode: 'SH-03',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-600 text-white',
    };
  }

  if (type === 'santri' || name.includes('santri')) {
    return {
      label: 'Kartu Santri',
      shortLabel: 'K. Santri',
      sheetCode: 'SH-04',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-600 text-white',
    };
  }

  if (type === 'ijazah' || name.includes('ijazah') || name.includes('syahadah')) {
    return {
      label: 'Ijazah / Syahadah',
      shortLabel: 'Ijazah',
      sheetCode: 'SH-05',
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      badgeBg: 'bg-teal-600 text-white',
    };
  }

  if (type === 'foto' || name.includes('foto')) {
    return {
      label: 'Pas Foto Resmi',
      shortLabel: 'Pas Foto',
      sheetCode: 'SH-00',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      badgeBg: 'bg-indigo-600 text-white',
    };
  }

  return {
    label: 'Dokumen Lampiran',
    shortLabel: name.endsWith('.pdf') ? 'PDF' : 'Berkas',
    sheetCode: 'SH-06',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-700 text-white',
  };
};
