export type TabType = 
  | 'dashboard'
  | 'fokus'
  | 'pengajian'
  | 'perlombaan'
  | 'khotmil'
  | 'hadrah'
  | 'bendahara'
  | 'sensus'
  | 'google_sync'
  | 'kta'
  | 'role_management';

export type UserRole = 'admin' | 'sekretaris' | 'bendahara' | 'lomba' | 'quran' | 'hadrah' | 'sensus' | 'pengurus' | string;

export interface RolePermission {
  roleId: string;
  roleName: string;
  description: string;
  isSuperAdmin?: boolean;
  allowedTabs: TabType[];
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  jabatan: string;
  encryptedPassword?: string;
  fotoUrl?: string;
  isActive?: boolean;
  customAllowedTabs?: TabType[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'update';
  read: boolean;
}

export interface ExpedisiRow {
  id: string;
  kategoriExpedisi: 'rapat_pra_lokal' | 'rapat_pra_sahmasy' | 'opening_safari' | 'rapat_pasca_lokal' | 'rapat_pasca_sahmasy' | 'undangan_vip' | 'undangan_umum';
  no: number;
  nama: string;
  instansiJabatan: string;
  alamat: string;
  noHandphone: string;
  keterangan: string;
  berkasUrl?: string;
}

export interface AgendaItem {
  id: string;
  no: number;
  kategori: string;
  namaKegiatan: string;
  tanggalPelaksanaan: string;
  penanggungJawab: string;
  terlaksana: boolean;
  keterangan: string;
}

export interface LombaRow {
  id: string;
  jenisLomba: 'Lomba Tartil Tingkat Anak-Anak' | 'Lomba Sholat Munfarid Tingkat Anak-Anak' | 'Lomba Siroh Nabawiyah' | 'Festival Hadroh Tingkat Umum';
  tingkat: string;
  no: number;
  namaPeserta: string;
  binBinti: string;
  utusan: string;
  pengasuh: string;
  alamat: string;
  noHandphone: string;
  col1: string; // e.g. Fashohah / Gerakan / Hafalan / Vocal
  col2: string; // e.g. Tajwid / Bacaan / Pemahaman / Pukulan
  col3: string; // e.g. Irama / Thumakninah / Ekspresi / Adab
  juara: string;
  berkasUrl?: string;
}

export interface KhotmilJadwalRow {
  id: string;
  no: number;
  hariTanggal: string;
  tuanRumah: string;
  alamat: string;
  noHandphone: string;
  infaq: number;
}

export interface KhotmilAbsenRow {
  id: string;
  no: number;
  nis: string;
  nama: string;
  alamat: string;
  juzAlQuran: string;
  keterangan: string;
}

export interface HadrahJadwalRow {
  id: string;
  no: number;
  hariTanggal: string;
  pengundang: string;
  tuanRumah: string;
  alamat: string;
  noHandphone: string;
  infaq: number;
}

export interface TransactionRecord {
  id: string;
  iuranId: string;
  nama: string;
  nis: string;
  asrama: string;
  noHandphone?: string;
  tanggal: string;
  bulanDibayar: string[];
  nominalTotal: number;
  tipe?: string;
  penerima?: string;
  jenisIuran?: string;
  keterangan?: string;
}

export interface IuranRow {
  id: string;
  no: number;
  nis: string;
  nama: string;
  asrama: string;
  noHandphone?: string;
  tipe?: 'putra' | 'putri' | 'santri_putra' | 'santri_putri';
  nominalPerBulan?: number;
  jenisIuran?: string;
  dzulqodah: boolean;
  dzulhijjah: boolean;
  muharrom: boolean;
  shofar: boolean;
  robiulAwwal: boolean;
  robiusTsani: boolean;
  jumadilUla: boolean;
  jumadilAkhir: boolean;
  rojab: boolean;
  keterangan: string;
  tanggalBayar?: string;
  penerima?: string;
}

export interface TanggunganRow {
  id: string;
  no: number;
  tahunAnggaran: string;
  nominal: number;
  tindakLanjut: string;
  keterangan: string;
}

export interface DonaturRow {
  id: string;
  no: number;
  hariTanggal: string;
  nama: string;
  alamat: string;
  nominal: number;
  penerima: string;
  keterangan: string;
}

export interface SahmasyRow {
  id: string;
  tipe: 'putra' | 'putri' | 'santri_putra' | 'santri_putri';
  no: number;
  nis: string;
  nama: string;
  nik: string;
  ttl: string;
  ayah: string;
  ibu: string;
  noHandphone: string;
  alamat: string;
  rtRw: string;
  desa: string;
  kecamatan: string;
  fotoUrl?: string;
  berkasUrl?: string;
}
