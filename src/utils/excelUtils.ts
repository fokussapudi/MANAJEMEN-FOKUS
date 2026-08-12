/**
 * Utility functions for Excel / CSV Export, Template Download, and File Parsing
 */

/**
 * Downloads a CSV template formatted for Excel
 */
export function downloadCsvTemplate(filename: string, headers: string[], sampleRow?: (string | number)[]) {
  const content = [
    headers.join(','),
    sampleRow ? sampleRow.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') : ''
  ].filter(Boolean).join('\n');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_Template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data rows to a CSV file (compatible with Excel)
 */
export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ];

  const content = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded CSV/Excel file into rows of columns
 */
export function parseExcelFile(
  file: File,
  onSuccess: (dataRows: string[][]) => void,
  onError?: (msg: string) => void
) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target?.result as string;
    if (!text) {
      if (onError) onError('File kosong.');
      return;
    }

    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      if (onError) onError('File CSV/Excel tidak memiliki data.');
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
}
