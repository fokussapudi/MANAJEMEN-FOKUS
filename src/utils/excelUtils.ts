/**
 * Professional Excel (.xlsx) Engine for FOKUS SAPUDI
 * Generates beautifully formatted, multi-column Excel workbooks with
 * brand styling, auto-fitted columns, borders, zebra-striping, and multi-sheet support.
 * Also parses both .xlsx and .csv files seamlessly.
 */

import ExcelJS from 'exceljs';

export interface ExcelSheetConfig {
  sheetName: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  columnWidths?: number[];
}

/**
 * Helper to trigger browser download for a Blob
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format and style a worksheet in ExcelJS
 */
function applySheetStyles(worksheet: ExcelJS.Worksheet, config: ExcelSheetConfig) {
  const { title, subtitle, headers, rows } = config;
  const colCount = headers.length || 1;

  worksheet.views = [{ showGridLines: true }];

  let currentRowIdx = 1;

  // 1. Title Banner (if provided)
  if (title) {
    const titleRow = worksheet.getRow(currentRowIdx);
    titleRow.values = [title];
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 32;

    worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, colCount);
    
    // Emerald green header fill
    for (let c = 1; c <= colCount; c++) {
      worksheet.getCell(currentRowIdx, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF064E3B' }, // Dark Emerald
      };
    }
    currentRowIdx++;

    // Subtitle
    const subTitleRow = worksheet.getRow(currentRowIdx);
    subTitleRow.values = [subtitle || `Sistem Informasi Manajemen FOKUS Sapudi • Export: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`];
    subTitleRow.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF065F46' } };
    subTitleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    subTitleRow.height = 20;
    worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, colCount);

    for (let c = 1; c <= colCount; c++) {
      worksheet.getCell(currentRowIdx, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }, // Soft Mint
      };
    }
    currentRowIdx++;

    // Empty separator row
    worksheet.addRow([]);
    currentRowIdx++;
  }

  // 2. Table Column Headers
  const headerRowIdx = currentRowIdx;
  const headerRow = worksheet.getRow(headerRowIdx);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' }, // Emerald 700
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF064E3B' } },
      left: { style: 'thin', color: { argb: 'FF064E3B' } },
      bottom: { style: 'medium', color: { argb: 'FF064E3B' } },
      right: { style: 'thin', color: { argb: 'FF064E3B' } },
    };
  });
  currentRowIdx++;

  // 3. Data Rows
  rows.forEach((rowValues, rIdx) => {
    const dataRow = worksheet.getRow(currentRowIdx);
    dataRow.values = rowValues;
    dataRow.height = 22;

    const isEven = rIdx % 2 === 1;
    const bgArgb = isEven ? 'FFF0FDF4' : 'FFFFFFFF'; // Light zebra mint

    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const val = cell.value;
      const strVal = String(val ?? '');

      cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF1F2937' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Smart alignment & formatting based on content
      if (typeof val === 'number') {
        if (val > 999) {
          cell.numFmt = '#,##0';
        }
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (
        colNumber === 1 ||
        strVal.toLowerCase() === 'lunas' ||
        strVal.toLowerCase() === 'belum' ||
        strVal.toLowerCase() === 'putra' ||
        strVal.toLowerCase() === 'putri' ||
        strVal.toLowerCase() === 'santri' ||
        /^\d{4}-\d{2}-\d{2}$/.test(strVal) ||
        /^08\d+$/.test(strVal)
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Highlight status badges
        if (strVal.toLowerCase() === 'lunas' || strVal.toLowerCase().includes('terlaksana')) {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF047857' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else if (strVal.toLowerCase() === 'belum') {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    currentRowIdx++;
  });

  // 4. Auto Calculate Column Widths
  headers.forEach((h, colIdx) => {
    let maxLen = h.length;
    rows.forEach(r => {
      const cellVal = String(r[colIdx] ?? '');
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    // Add margin and constrain width
    const calculatedWidth = Math.min(Math.max(maxLen + 4, 12), 45);
    worksheet.getColumn(colIdx + 1).width = calculatedWidth;
  });
}

/**
 * Exports a single table to a beautifully formatted Excel (.xlsx) file
 */
export async function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  options?: { title?: string; subtitle?: string; sheetName?: string }
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FOKUS Sapudi Management System';
  workbook.lastModifiedBy = 'Pengurus FOKUS Sapudi';
  workbook.created = new Date();
  workbook.modified = new Date();

  const cleanSheetName = (options?.sheetName || filename || 'Data').slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
  const worksheet = workbook.addWorksheet(cleanSheetName);

  applySheetStyles(worksheet, {
    sheetName: cleanSheetName,
    title: options?.title || `ORGANISASI FOKUS SAPUDI - ${filename.toUpperCase().replace(/_/g, ' ')}`,
    subtitle: options?.subtitle || `Laporan Resmi Terintegrasi Database • Dicetak pada ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
    headers,
    rows,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanFilename = `${filename.replace(/\.xlsx|\.csv/gi, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  triggerDownload(blob, cleanFilename);
}

/**
 * Exports multi-sheet workbook (e.g. Master Database, Bendahara, Khotmil)
 */
export async function exportMultiSheetWorkbook(
  filename: string,
  sheets: ExcelSheetConfig[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FOKUS Sapudi Management System';
  workbook.created = new Date();

  sheets.forEach((sheetConfig) => {
    const cleanName = sheetConfig.sheetName.slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
    const worksheet = workbook.addWorksheet(cleanName);
    applySheetStyles(worksheet, sheetConfig);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanFilename = `${filename.replace(/\.xlsx|\.csv/gi, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  triggerDownload(blob, cleanFilename);
}

/**
 * Exports Sahmasy member list with full styling
 */
export function exportMembersToExcel(members: any[], filename = 'DATABASE_SENSUS_FOKUS') {
  const headers = [
    'NO',
    'TIPE',
    'NIS',
    'NAMA LENGKAP',
    'NIK',
    'TEMPAT TANGGAL LAHIR',
    'NAMA AYAH',
    'NAMA IBU',
    'NO HP / WA',
    'ALAMAT LENGKAP',
    'RT/RW',
    'DESA',
    'KECAMATAN'
  ];

  const rows = members.map((m, idx) => [
    idx + 1,
    (m.tipe || 'putra').toUpperCase(),
    m.nis || '',
    m.nama || '',
    m.nik || '',
    m.ttl || '',
    m.ayah || '',
    m.ibu || '',
    m.noHandphone || '',
    m.alamat || '',
    m.rtRw || '',
    m.desa || '',
    m.kecamatan || ''
  ]);

  exportToExcel(
    filename,
    headers,
    rows,
    {
      title: 'ORGANISASI FOKUS SAPUDI - MASTER DATABASE SENSUS ANGGOTA',
      subtitle: 'Data Sahmasy Putra, Putri & Santri Aktif Se-Kecamatan Gayam & Nonggunong',
      sheetName: 'Sensus Anggota'
    }
  );
}

/**
 * Downloads a styled Excel (.xlsx) template with sample row & instructions
 */
export async function downloadCsvTemplate(
  filename: string,
  headers: string[],
  sampleRow?: (string | number)[]
) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = 'Template Import';
  const worksheet = workbook.addWorksheet(sheetName);

  const sampleRows: (string | number)[][] = [];
  if (sampleRow) {
    sampleRows.push(sampleRow);
  }

  applySheetStyles(worksheet, {
    sheetName,
    title: `TEMPLATE IMPORT EXCEL - ${filename.toUpperCase().replace(/_/g, ' ')}`,
    subtitle: 'Petunjuk: Isi data mulai dari baris setelah header. Jangan ubah urutan kolom.',
    headers,
    rows: sampleRows,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  triggerDownload(blob, `${filename.replace(/\.xlsx|\.csv/gi, '')}_Template.xlsx`);
}

/**
 * Smart Excel Parser: Supports both .xlsx (ExcelJS) and .csv / .txt fallback
 */
export async function parseExcelFile(
  file: File,
  onSuccess: (dataRows: string[][]) => void,
  onError?: (msg: string) => void
) {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        if (onError) onError('File Excel tidak memiliki lembar kerja (worksheet).');
        return;
      }

      const parsedRows: string[][] = [];
      let foundHeader = false;

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rawValues = Array.isArray(row.values) ? row.values.slice(1) : [];
        const stringCols = rawValues.map(v => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'object' && 'text' in v) return String(v.text);
          if (typeof v === 'object' && 'result' in v) return String(v.result);
          return String(v).trim();
        });

        // Skip banner/title rows at top if any (look for first row with multiple valid columns)
        if (!foundHeader) {
          if (stringCols.filter(c => c !== '').length >= 2) {
            foundHeader = true; // Header row detected
          }
          return;
        }

        if (stringCols.some(c => c !== '')) {
          parsedRows.push(stringCols);
        }
      });

      if (parsedRows.length === 0) {
        if (onError) onError('Tidak ada baris data ditemukan di dalam file Excel.');
        return;
      }

      onSuccess(parsedRows);
      return;
    }

    // CSV / Text Fallback parser
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        if (onError) onError('File kosong.');
        return;
      }

      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        if (onError) onError('File CSV/Excel tidak memiliki baris data.');
        return;
      }

      const sep = lines[0].includes(';') ? ';' : ',';
      const parsedRows: string[][] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.replace(/^["']|["']$/g, '').trim());
        if (cols.some(c => c !== '')) {
          parsedRows.push(cols);
        }
      }

      onSuccess(parsedRows);
    };

    reader.onerror = () => {
      if (onError) onError('Gagal membaca file.');
    };

    reader.readAsText(file);
  } catch (err: any) {
    console.error('Parse Excel error:', err);
    if (onError) onError('Gagal memproses file Excel: ' + (err.message || 'Format tidak didukung.'));
  }
}
