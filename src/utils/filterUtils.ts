/**
 * Helper to check if a data row matches the user-selected year period.
 * Supports standard dates, Hijri dates containing year numbers, or custom fields.
 */
export function matchesYear(item: any, selectedYear: string): boolean {
  if (!selectedYear || selectedYear === 'Semua') {
    return true;
  }

  // Support explicit year properties if defined
  if (item.tahun && item.tahun.toString() === selectedYear) {
    return true;
  }
  if (item.tahunMasuk && item.tahunMasuk.toString() === selectedYear) {
    return true;
  }
  if (item.tahunAnggaran) {
    // e.g. "2024 / 2025" -> can match "2024" or "2025" depending on selectedYear
    return item.tahunAnggaran.toString().includes(selectedYear);
  }

  // Derive from any of the standard date/time properties
  const dateString = (
    item.tanggal || 
    item.hariTanggal || 
    item.tanggalPelaksanaan || 
    item.tanggalBayar || 
    ''
  ).toString();

  if (dateString) {
    // Mapping of Gregorian years to Hijri years used in initialData
    if (selectedYear === '2026') {
      return dateString.includes('2026') || dateString.includes('1447');
    }
    if (selectedYear === '2025') {
      return dateString.includes('2025') || dateString.includes('1446');
    }
    if (selectedYear === '2024') {
      return dateString.includes('2024') || dateString.includes('1445');
    }
  }

  // Fallback: If no date exists and selectedYear is 2026, treat as current period (so existing items don't vanish)
  // But if we want custom years or item does not have a date field, we can default to true or false.
  // Let's make it return true if there is no date property at all, to keep it accessible unless filtered specifically.
  const hasAnyDateProp = 'tanggal' in item || 'hariTanggal' in item || 'tanggalPelaksanaan' in item || 'tanggalBayar' in item || 'tahun' in item || 'tahunMasuk' in item || 'tahunAnggaran' in item;
  if (!hasAnyDateProp) {
    return true; 
  }

  return false;
}

/**
 * Parses and formats an HTML date string (YYYY-MM-DD) into Indonesian Day name and formatted Gregorian date.
 * Avoids local timezone shift bugs by parsing as UTC.
 */
export function formatGregorianIndo(dateStr: string): { dayName: string; dateFormatted: string } {
  if (!dateStr) return { dayName: '', dateFormatted: '' };
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { dayName: '', dateFormatted: '' };
    
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    
    const dateObj = new Date(Date.UTC(year, month, day));
    if (isNaN(dateObj.getTime())) return { dayName: '', dateFormatted: '' };
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[dateObj.getUTCDay()];
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dateFormatted = `${dateObj.getUTCDate()} ${months[dateObj.getUTCMonth()]} ${dateObj.getUTCFullYear()}`;
    return { dayName, dateFormatted };
  } catch (e) {
    return { dayName: '', dateFormatted: '' };
  }
}

