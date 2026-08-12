/**
 * Utility functions for Indonesian Currency Formatting and Terbilang Words
 */

export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return 'Nol Rupiah';

  const angka = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];

  function convert(x: number): string {
    if (x < 12) return angka[x];
    if (x < 20) return convert(x - 10) + ' Belas';
    if (x < 100) return convert(Math.floor(x / 10)) + ' Puluh ' + convert(x % 10);
    if (x < 200) return 'Seratus ' + convert(x - 100);
    if (x < 1000) return convert(Math.floor(x / 100)) + ' Ratus ' + convert(x % 100);
    if (x < 2000) return 'Seribu ' + convert(x - 1000);
    if (x < 1000000) return convert(Math.floor(x / 1000)) + ' Ribu ' + convert(x % 1000);
    if (x < 1000000000) return convert(Math.floor(x / 1000000)) + ' Juta ' + convert(x % 1000000);
    return convert(Math.floor(x / 1000000000)) + ' Milyar ' + convert(x % 1000000000);
  }

  const result = convert(Math.abs(Math.floor(n))).replace(/\s+/g, ' ').trim();
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
