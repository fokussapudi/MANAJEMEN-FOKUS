import { UserAccount, RolePermission, ExpedisiRow, AgendaItem, LombaRow, KhotmilJadwalRow, KhotmilAbsenRow, HadrahJadwalRow, IuranRow, TanggunganRow, DonaturRow, SahmasyRow, NotificationItem } from '../types';

export const initialRolePermissions: RolePermission[] = [
  {
    roleId: 'admin',
    roleName: 'Super Admin (Akses Penuh)',
    description: 'Pemegang wewenang tertinggi. Memiliki akses penuh ke seluruh menu, database, dan pengaturan manajemen akun & role.',
    isSuperAdmin: true,
    allowedTabs: ['dashboard', 'fokus', 'pengajian', 'perlombaan', 'khotmil', 'hadrah', 'bendahara', 'sensus', 'kta', 'google_sync', 'role_management']
  },
  {
    roleId: 'sekretaris',
    roleName: 'Sekretariat & Surat',
    description: 'Akses pengelolaan administrasi, persuratan, agenda rapat FOKUS, pengajian, dan database sensus.',
    allowedTabs: ['dashboard', 'fokus', 'pengajian', 'sensus', 'kta', 'google_sync']
  },
  {
    roleId: 'bendahara',
    roleName: 'Bendahara & Keuangan',
    description: 'Akses khusus pengelolaan iuran aktivis, kas organisasi, tanggungan, dan donatur.',
    allowedTabs: ['dashboard', 'bendahara', 'sensus', 'kta']
  },
  {
    roleId: 'lomba',
    roleName: 'Panitia Perlombaan',
    description: 'Akses pengelolaan pendaftaran peserta lomba, rekapitulasi nilai, juara, dan pencetakan piagam.',
    allowedTabs: ['dashboard', 'perlombaan', 'sensus', 'kta']
  },
  {
    roleId: 'quran',
    roleName: 'Koordinator Khotmil Qur\'an',
    description: 'Akses jadwal safari Khotmil Qur\'an dan absensi pembaca juz.',
    allowedTabs: ['dashboard', 'khotmil', 'sensus', 'kta']
  },
  {
    roleId: 'hadrah',
    roleName: 'Pimpinan Jam\'iyatul Hadrah',
    description: 'Akses jadwal performa hadrah, daftar undangan, dan infaq grup.',
    allowedTabs: ['dashboard', 'hadrah', 'sensus', 'kta']
  },
  {
    roleId: 'sensus',
    roleName: 'Tim Sensus & Database',
    description: 'Akses pencatatan dan verifikasi data Sahmasy Putra/Putri dan Santri Aktif.',
    allowedTabs: ['dashboard', 'sensus', 'kta']
  },
  {
    roleId: 'pengurus',
    roleName: 'Pengurus & Simpatisan',
    description: 'Akses umum informasi agenda kegiatan, pengajian, dan safari khotmil.',
    allowedTabs: ['dashboard', 'fokus', 'pengajian', 'khotmil']
  }
];

export const initialUsers: UserAccount[] = [
  { id: '1', username: 'admin', name: 'Kyai Kholil (Admin Pusat)', role: 'admin', jabatan: 'Dewan Pembina & Administrator Utama', encryptedPassword: 'admin123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: '2', username: 'sekretaris', name: 'Ust. Zainal Abidin', role: 'sekretaris', jabatan: 'Sekretaris Jenderal Fokus', encryptedPassword: 'sekretaris123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: '3', username: 'bendahara', name: 'H. Moh. Hasan', role: 'bendahara', jabatan: 'Bendahara Umum Organisasi', encryptedPassword: 'bendahara123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: '4', username: 'lomba', name: 'Ahmad Fauzi', role: 'lomba', jabatan: 'Ketua Panitia Perlombaan', encryptedPassword: 'lomba123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: '5', username: 'quran', name: 'Syaiful Islam', role: 'quran', jabatan: 'Koordinator Khotmil Qur\'an', encryptedPassword: 'quran123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { id: '6', username: 'hadrah', name: 'Badruttamam', role: 'hadrah', jabatan: 'Pimpinan Jam\'iyatul Hadrah', encryptedPassword: 'hadrah123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { id: '7', username: 'sensus', name: 'Fathurrahman', role: 'sensus', jabatan: 'Kepala Sensus & Database Anggota', encryptedPassword: 'sensus123', isActive: true, fotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
];

export const initialFokusStats = {
  suratMasuk: 3,
  suratKeluar: 55,
  jumlahTotal: 58,
  frekuensiRapat: 24,
  rencanaKegiatanTotal: 40,
  rencanaPanitiaLokal: 2,
  rencanaPanitiaAktivisPutra: 2,
  rencanaPanitiaAktivisPutri: 4,
  rencanaRapatFokus: 2,
  rencanaRapatPutraPutri: 5,
  rencanaRapatSahmasy: 7,
  rencanaRapatPanitiaLokal: 7,
  rencanaRapatLainLain: 2,
  kegiatanTerlaksana: 31,
  kegiatanBelumTerlaksana: 9,
};

export const initialExpedisiRows: ExpedisiRow[] = [
  { id: 'exp-1', kategoriExpedisi: 'rapat_pra_lokal', no: 1, nama: 'KH. Abdullah Faqih', instansiJabatan: 'Ketua Panitia Lokal', alamat: 'Dungkek Sumenep', noHandphone: '081234567890', keterangan: 'Hadir tepat waktu & siap mendukung', berkasUrl: 'berkas_rapat_pra_1.pdf' },
  { id: 'exp-2', kategoriExpedisi: 'rapat_pra_lokal', no: 2, nama: 'K. Moh. Rofi\'i', instansiJabatan: 'Sekretaris Lokal', alamat: 'Sapudi Sumenep', noHandphone: '081987654321', keterangan: 'Konfirmasi kehadiran fix', berkasUrl: 'berkas_rapat_pra_2.pdf' },
  { id: 'exp-3', kategoriExpedisi: 'rapat_pra_sahmasy', no: 1, nama: 'Achmad Zaini', instansiJabatan: 'Ketua Sahmasy Putra', alamat: 'Gayam Sapudi', noHandphone: '082345678901', keterangan: 'Koordinasi logistik acara', berkasUrl: 'sahmasy_rapat_1.pdf' },
  { id: 'exp-4', kategoriExpedisi: 'opening_safari', no: 1, nama: 'Bupati Sumenep (Undangan VIP)', instansiJabatan: 'Kepala Daerah', alamat: 'Sumenep Madura', noHandphone: '085234567892', keterangan: 'Surat terkirim via kurir khusus', berkasUrl: 'undangan_vip_bupati.pdf' },
  { id: 'exp-5', kategoriExpedisi: 'rapat_pasca_lokal', no: 1, nama: 'K. Holilur Rahman', instansiJabatan: 'Evaluator Panitia', alamat: 'Gayam', noHandphone: '087712345678', keterangan: 'Evaluasi tahap akhir sukses', berkasUrl: 'evaluasi_pasca.pdf' },
  { id: 'exp-6', kategoriExpedisi: 'undangan_vip', no: 1, nama: 'KH. Moh. Sholahuddin', instansiJabatan: 'Pengasuh Pesantren', alamat: 'Ganding Sumenep', noHandphone: '081357924680', keterangan: 'Konfirmasi hadir sebagai keynote speaker', berkasUrl: 'vip_kh_sholah.pdf' },
  { id: 'exp-7', kategoriExpedisi: 'undangan_umum', no: 1, nama: 'Seluruh Wali Santri & Alumni', instansiJabatan: 'Simpatisan Fokus', alamat: 'Pulau Sapudi & Sekitarnya', noHandphone: '081299887766', keterangan: 'Penyebaran via WhatsApp Broadcast & Undangan Cetak', berkasUrl: 'undangan_umum.pdf' },
];

export const initialLombaRows: LombaRow[] = [
  {
    id: 'lomba-1',
    jenisLomba: 'Lomba Tartil Tingkat Anak-Anak',
    tingkat: 'Kabupaten / Se-Sapudi',
    no: 1,
    namaPeserta: 'Muhammad Al-Fatih',
    binBinti: 'Ahmad Zaini',
    utusan: 'Ranting Gayam',
    pengasuh: 'KH. Ahmad Dahlan',
    alamat: 'Nonggunong Sapudi',
    noHandphone: '081234567811',
    col1: '92 (Fashohah)',
    col2: '90 (Tajwid)',
    col3: '95 (Irama)',
    juara: 'Juara I',
    berkasUrl: 'akte_fatih.pdf'
  },
  {
    id: 'lomba-2',
    jenisLomba: 'Lomba Tartil Tingkat Anak-Anak',
    tingkat: 'Kabupaten / Se-Sapudi',
    no: 2,
    namaPeserta: 'Fatimah Azzahra',
    binBinti: 'H. Ismail',
    utusan: 'Ranting Nonggunong',
    pengasuh: 'Nyai Hj. Maimunah',
    alamat: 'Gayam Sumenep',
    noHandphone: '081987654322',
    col1: '94 (Fashohah)',
    col2: '92 (Tajwid)',
    col3: '93 (Irama)',
    juara: 'Juara II',
    berkasUrl: 'akte_fatimah.pdf'
  },
  {
    id: 'lomba-3',
    jenisLomba: 'Lomba Sholat Munfarid Tingkat Anak-Anak',
    tingkat: 'Kecamatan Gayam',
    no: 1,
    namaPeserta: 'Zainal Arifin',
    binBinti: 'H. Hasan Basri',
    utusan: 'Aktivis Putra Gayam',
    pengasuh: 'K. Syafi\'i',
    alamat: 'Pancor Gayam',
    noHandphone: '082345678933',
    col1: '88 (Gerakan)',
    col2: '95 (Bacaan)',
    col3: '90 (Thumakninah)',
    juara: 'Juara I',
    berkasUrl: 'kk_zainal.pdf'
  },
  {
    id: 'lomba-4',
    jenisLomba: 'Lomba Siroh Nabawiyah',
    tingkat: 'Se-Pulau Sapudi',
    no: 1,
    namaPeserta: 'Lailatul Qodriyah',
    binBinti: 'H. Syamsul Arifin',
    utusan: 'Sahmasy Putri',
    pengasuh: 'Nyai Halimah',
    alamat: 'Nonggunong',
    noHandphone: '087788990011',
    col1: '91 (Hafalan)',
    col2: '94 (Pemahaman)',
    col3: '96 (Ekspresi)',
    juara: 'Juara Favorit',
    berkasUrl: 'ijazah_laili.pdf'
  },
  {
    id: 'lomba-5',
    jenisLomba: 'Festival Hadroh Tingkat Umum',
    tingkat: 'Regional Madura Timur',
    no: 1,
    namaPeserta: 'Grup Hadrah Al-Fusha',
    binBinti: 'Tim Resmi Fokus',
    utusan: 'Jam\'iyatul Hadrah Sapudi',
    pengasuh: 'Ust. Badruttamam',
    alamat: 'Gayam',
    noHandphone: '085333222111',
    col1: '95 (Vocal)',
    col2: '93 (Pukulan)',
    col3: '97 (Adab & Penampilan)',
    juara: 'Juara Umum I',
    berkasUrl: 'sertifikat_tim.pdf'
  }
];

export const initialKhotmilJadwal: KhotmilJadwalRow[] = [
  { id: 'kj-1', no: 1, hariTanggal: 'Jumat, 15 Ramadhan 1447 H', tuanRumah: 'H. Achmad Zaini', alamat: 'Desa Gayam Sapudi', noHandphone: '08123456701', infaq: 250000 },
  { id: 'kj-2', no: 2, hariTanggal: 'Jumat, 22 Ramadhan 1447 H', tuanRumah: 'K. Moh. Rofi\'i', alamat: 'Desa Pancor Nonggunong', noHandphone: '08198765402', infaq: 300000 },
  { id: 'kj-3', no: 3, hariTanggal: 'Jumat, 29 Ramadhan 1447 H', tuanRumah: 'H. Hasan Basri', alamat: 'Desa Tarebung Gayam', noHandphone: '08234567803', infaq: 500000 },
];

export const initialKhotmilAbsen: KhotmilAbsenRow[] = [
  { id: 'ka-1', no: 1, nis: '2024001', nama: 'Muhammad Faisol', alamat: 'Gayam', juzAlQuran: 'Juz 1 s.d 5', keterangan: 'Hadir Tuntas (Mutqin)' },
  { id: 'ka-2', no: 2, nis: '2024002', nama: 'Siti Aminah', alamat: 'Nonggunong', juzAlQuran: 'Juz 6 s.d 10', keterangan: 'Hadir Tuntas (Mutqin)' },
  { id: 'ka-3', no: 3, nis: '2024003', nama: 'Abdullah Faqih', alamat: 'Pancor', juzAlQuran: 'Juz 11 s.d 15', keterangan: 'Hadir' },
  { id: 'ka-4', no: 4, nis: '2024004', nama: 'Nurul Hidayah', alamat: 'Tarebung', juzAlQuran: 'Juz 16 s.d 20', keterangan: 'Hadir Tuntas' },
  { id: 'ka-5', no: 5, nis: '2024005', nama: 'Ahmad Junaidi', alamat: 'Gayam', juzAlQuran: 'Juz 21 s.d 30', keterangan: 'Hadir (Khotmil Kubro)' },
];

export const initialHadrahJadwal: HadrahJadwalRow[] = [
  { id: 'jh-1', no: 1, hariTanggal: 'Sabtu, 10 Syawal 1447 H', pengundang: 'Takmir Masjid Al-Akbar', tuanRumah: 'H. Moh. Hasan', alamat: 'Gayam Sapudi', noHandphone: '081233445566', infaq: 750000 },
  { id: 'jh-2', no: 2, hariTanggal: 'Minggu, 18 Syawal 1447 H', pengundang: 'Keluarga Besar H. Ismail', tuanRumah: 'H. Ismail', alamat: 'Nonggunong', noHandphone: '081999888777', infaq: 1000000 },
];

export const initialIuranRows: IuranRow[] = [
  { id: 'ir-1', no: 1, nis: 'SHM-PTR-01', nama: 'Moh. Fajar Shodiq', asrama: 'Desa Gayam', noHandphone: '081234567891', tipe: 'putra', nominalPerBulan: 50000, dzulqodah: true, dzulhijjah: true, muharrom: true, shofar: true, robiulAwwal: true, robiusTsani: true, jumadilUla: true, jumadilAkhir: true, rojab: true, keterangan: 'Lunas Periode Berjalan', tanggalBayar: '11 Agustus 2026', penerima: 'H. Moh. Hasan' },
  { id: 'ir-2', no: 2, nis: 'SHM-PTR-02', nama: 'Ahmad Wildan Hakim', asrama: 'Pancor Gayam', noHandphone: '081987654392', tipe: 'putra', nominalPerBulan: 50000, dzulqodah: true, dzulhijjah: true, muharrom: true, shofar: true, robiulAwwal: true, robiusTsani: false, jumadilUla: false, jumadilAkhir: false, rojab: false, keterangan: 'Menunggak 4 Bulan', tanggalBayar: '05 Agustus 2026', penerima: 'H. Moh. Hasan' },
  { id: 'ir-3', no: 3, nis: 'SHM-PTRI-01', nama: 'Nur Aisyah Zubaidah', asrama: 'Desa Nonggunong', noHandphone: '087711223344', tipe: 'putri', nominalPerBulan: 50000, dzulqodah: true, dzulhijjah: true, muharrom: true, shofar: true, robiulAwwal: true, robiusTsani: true, jumadilUla: true, jumadilAkhir: true, rojab: true, keterangan: 'Lunas Tepat Waktu', tanggalBayar: '10 Agustus 2026', penerima: 'Bendahara Putri' },
  { id: 'ir-4', no: 4, nis: 'SAP-001', nama: 'Zainal Arifin', asrama: 'Asrama Putra Al-Fusha', noHandphone: '081333445566', tipe: 'santri_putra', nominalPerBulan: 30000, dzulqodah: true, dzulhijjah: true, muharrom: true, shofar: true, robiulAwwal: false, robiusTsani: false, jumadilUla: false, jumadilAkhir: false, rojab: false, keterangan: 'Sebagian Terbayar (4 Bulan)', tanggalBayar: '01 Agustus 2026', penerima: 'H. Moh. Hasan' },
];

export const initialTanggunganRows: TanggunganRow[] = [
  { id: 'tg-1', no: 1, tahunAnggaran: '2024 / 2025', nominal: 1500000, tindakLanjut: 'Surat Peringatan 1 & Kunjungan Wali', keterangan: 'Pembangunan Gedung Sekretariat' },
  { id: 'tg-2', no: 2, tahunAnggaran: '2025 / 2026', nominal: 750000, tindakLanjut: 'Pembayaran Bertahap via Bendahara', keterangan: 'Dana Operasional Safari Ramadlan' },
];

export const initialDonaturRows: DonaturRow[] = [
  { id: 'dn-1', no: 1, hariTanggal: '12 Ramadhan 1447 H', nama: 'H. Budi Hartono (Tokoh Masyarakat)', alamat: 'Jakarta / Gayam Sapudi', nominal: 10000000, penerima: 'Bendahara Fokus (H. Moh. Hasan)', keterangan: 'Donasi Utama Pembangunan Gedung & Santunan' },
  { id: 'dn-2', no: 2, hariTanggal: '20 Ramadhan 1447 H', nama: 'Hj. Siti Aminah', alamat: 'Surabaya / Nonggunong', nominal: 5000000, penerima: 'Panitia Safari Ramadlan', keterangan: 'Wakaf Operasional Kegiatan' },
];

export const initialSahmasyRows: SahmasyRow[] = [
  { id: 'shm-1', tipe: 'putra', no: 1, nis: 'SHM-PTR-01', nama: 'Moh. Fajar Shodiq', nik: '3529081203040001', ttl: 'Sumenep, 12 Maret 2004', ayah: 'H. Moh. Zaini', ibu: 'Hj. Khodijah', noHandphone: '081234567891', alamat: 'Jl. Raya Gayam No. 45', rtRw: '001/002', desa: 'Gayam', kecamatan: 'Gayam', fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', berkasUrl: 'ktp_fajar.pdf' },
  { id: 'shm-2', tipe: 'putra', no: 2, nis: 'SHM-PTR-02', nama: 'Ahmad Wildan Hakim', nik: '3529082205050002', ttl: 'Sapudi, 22 Mei 2005', ayah: 'H. Abdul Ghani', ibu: 'Siti Fatimah', noHandphone: '081987654392', alamat: 'Dusun Pancor Timur', rtRw: '003/001', desa: 'Pancor', kecamatan: 'Gayam', fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', berkasUrl: 'kk_wildan.pdf' },
  { id: 'shm-3', tipe: 'putri', no: 1, nis: 'SHM-PTRI-01', nama: 'Nur Aisyah Zubaidah', nik: '3529084507060001', ttl: 'Sumenep, 05 Juli 2006', ayah: 'H. Syaiful Bahri', ibu: 'Hj. Aminah', noHandphone: '087711223344', alamat: 'Jl. Pesantren Nonggunong', rtRw: '002/003', desa: 'Nonggunong', kecamatan: 'Nonggunong', fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', berkasUrl: 'ijazah_aisy.pdf' },
  { id: 'shm-4', tipe: 'putri', no: 2, nis: 'SHM-PTRI-02', nama: 'Dewi Lailatul Mubarokah', nik: '3529086009070002', ttl: 'Sapudi, 20 September 2007', ayah: 'K. Hasan Basri', ibu: 'Nyai Maimunah', noHandphone: '085222334455', alamat: 'Desa Tarebung', rtRw: '004/002', desa: 'Tarebung', kecamatan: 'Gayam', fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', berkasUrl: 'akte_dewi.pdf' },
  { id: 'sa-1', tipe: 'santri_putra', no: 1, nis: 'SAP-001', nama: 'Zainal Arifin', nik: '3529081101080001', ttl: 'Sumenep, 10 Januari 2008', ayah: 'H. Faruq', ibu: 'Siti Rohmah', noHandphone: '081333445566', alamat: 'Asrama Putra Al-Fusha', rtRw: '002/001', desa: 'Gayam', kecamatan: 'Gayam', fotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', berkasUrl: 'santri_zainal.pdf' },
  { id: 'sa-2', tipe: 'santri_putri', no: 1, nis: 'SAPR-001', nama: 'Fatimah Zahra', nik: '3529081504090002', ttl: 'Sapudi, 15 April 2009', ayah: 'K. Mahrus', ibu: 'Hj. Halimah', noHandphone: '087888990022', alamat: 'Asrama Putri Al-Amin', rtRw: '001/004', desa: 'Nonggunong', kecamatan: 'Nonggunong', fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', berkasUrl: 'santri_fatimah.pdf' },
];

export const initialNotifications: NotificationItem[] = [
  { id: 'notif-1', title: 'Pembaruan Data Surat', message: 'Surat keluar baru nomor 55 telah dicatat oleh Sekretaris.', timestamp: '10 Menit yang lalu', type: 'success', read: false },
  { id: 'notif-2', title: 'Sinkronisasi Google Drive', message: 'Seluruh database organisasi berhasil disinkronkan ke Google Sheets secara real-time.', timestamp: '1 Jam yang lalu', type: 'info', read: false },
  { id: 'notif-3', title: 'Iuran Aktivis', message: 'Pembayaran iuran periode Rojab telah diterima dari Asrama Al-Ikhlas Putra.', timestamp: '3 Jam yang lalu', type: 'success', read: true },
];

export const initialAgendaList: AgendaItem[] = [
  // Panitia Lokal (2)
  { id: 'ag-1', no: 1, kategori: 'Panitia Lokal', namaKegiatan: 'Rapat Pembentukan Panitia Lokal Gayam', tanggalPelaksanaan: '02 Syaban 1447 H', penanggungJawab: 'KH. Abdullah Faqih', terlaksana: true, keterangan: 'Selesai & SK diterbitkan' },
  { id: 'ag-2', no: 2, kategori: 'Panitia Lokal', namaKegiatan: 'Rapat Koordinasi Logistik & Konsumsi Safari', tanggalPelaksanaan: '10 Syaban 1447 H', penanggungJawab: 'K. Moh. Rofi\'i', terlaksana: true, keterangan: 'Siap terlaksana' },

  // Aktivis Putra (2)
  { id: 'ag-3', no: 3, kategori: 'Aktivis Putra', namaKegiatan: 'Rapat Konsolidasi Aktivis Putra Gelombang I', tanggalPelaksanaan: '15 Syaban 1447 H', penanggungJawab: 'Ust. Zainal Abidin', terlaksana: true, keterangan: 'Kehadiran 100%' },
  { id: 'ag-4', no: 4, kategori: 'Aktivis Putra', namaKegiatan: 'Pembekalan Lapangan & Keamanan Putra', tanggalPelaksanaan: '20 Syaban 1447 H', penanggungJawab: 'Fathurrahman', terlaksana: true, keterangan: 'Pembagian rompi sukses' },

  // Aktivis Putri (4)
  { id: 'ag-5', no: 5, kategori: 'Aktivis Putri', namaKegiatan: 'Rapat Koordinasi Aktivis Putri & Divisi Konsumsi', tanggalPelaksanaan: '12 Syaban 1447 H', penanggungJawab: 'Nyai Hj. Maimunah', terlaksana: true, keterangan: 'Menu konsumsi fix' },
  { id: 'ag-6', no: 6, kategori: 'Aktivis Putri', namaKegiatan: 'Rapat Kerja Dekorasi Panggung Safari', tanggalPelaksanaan: '18 Syaban 1447 H', penanggungJawab: 'Siti Aminah', terlaksana: true, keterangan: 'Bahan dekorasi siap' },
  { id: 'ag-7', no: 7, kategori: 'Aktivis Putri', namaKegiatan: 'Pelatihan Kepemimpinan Srikandi Aktivis Putri', tanggalPelaksanaan: '22 Syaban 1447 H', penanggungJawab: 'Lailatul Qodriyah', terlaksana: true, keterangan: 'Disertai sertifikat' },
  { id: 'ag-8', no: 8, kategori: 'Aktivis Putri', namaKegiatan: 'Rapat Internal Benda-benda Bantuan Putri', tanggalPelaksanaan: '25 Syaban 1447 H', penanggungJawab: 'Dewi Lailatul M.', terlaksana: true, keterangan: 'Tersalurkan' },

  // Rapat Pengurus Fokus (2)
  { id: 'ag-9', no: 9, kategori: 'Rapat Pengurus Fokus', namaKegiatan: 'Rapat Kerja Tahunan Pengurus Fokus Pusat', tanggalPelaksanaan: '01 Ramadhan 1447 H', penanggungJawab: 'Kyai Kholil (Admin)', terlaksana: true, keterangan: 'Program disahkan' },
  { id: 'ag-10', no: 10, kategori: 'Rapat Pengurus Fokus', namaKegiatan: 'Rapat Pleno Evaluasi Pengurus Fokus', tanggalPelaksanaan: '05 Ramadhan 1447 H', penanggungJawab: 'H. Moh. Hasan', terlaksana: true, keterangan: 'Laporan keuangan terdistribusi' },

  // Rapat Putra & Putri (5)
  { id: 'ag-11', no: 11, kategori: 'Rapat Putra & Putri', namaKegiatan: 'Rapat Gabungan Putra & Putri Sesi I', tanggalPelaksanaan: '07 Ramadhan 1447 H', penanggungJawab: 'Ahmad Fauzi', terlaksana: true, keterangan: 'Koordinasi lintas divisi' },
  { id: 'ag-12', no: 12, kategori: 'Rapat Putra & Putri', namaKegiatan: 'Rapat Gabungan Putra & Putri Sesi II', tanggalPelaksanaan: '10 Ramadhan 1447 H', penanggungJawab: 'Syaiful Islam', terlaksana: true, keterangan: 'Pembagian jobdesk fix' },
  { id: 'ag-13', no: 13, kategori: 'Rapat Putra & Putri', namaKegiatan: 'Rapat Coordination Meeting Lapangan', tanggalPelaksanaan: '14 Ramadhan 1447 H', penanggungJawab: 'Badruttamam', terlaksana: true, keterangan: 'Lokasi disurvei' },
  { id: 'ag-14', no: 14, kategori: 'Rapat Putra & Putri', namaKegiatan: 'Rapat Evaluasi Mid-Program Putra & Putri', tanggalPelaksanaan: '17 Ramadhan 1447 H', penanggungJawab: 'Ust. Zainal Abidin', terlaksana: true, keterangan: 'Evaluasi Nuzulul Quran' },
  { id: 'ag-15', no: 15, kategori: 'Rapat Putra & Putri', namaKegiatan: 'Rapat Matrikulasi Kegiatan Akhir Ramadhan', tanggalPelaksanaan: '20 Ramadhan 1447 H', penanggungJawab: 'K. Holilur Rahman', terlaksana: true, keterangan: 'Jadwal khotmil disahkan' },

  // Rapat Fokus & Sahmasy (7)
  { id: 'ag-16', no: 16, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Koordinasi Fokus & Pengurus Sahmasy Gayam', tanggalPelaksanaan: '03 Ramadhan 1447 H', penanggungJawab: 'Achmad Zaini', terlaksana: true, keterangan: 'Penyerahan data awal' },
  { id: 'ag-17', no: 17, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Sinkronisasi Database Sensus Sahmasy', tanggalPelaksanaan: '08 Ramadhan 1447 H', penanggungJawab: 'Fathurrahman', terlaksana: true, keterangan: 'Data terinput' },
  { id: 'ag-18', no: 18, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Konsolidasi Sahmasy Ranting Nonggunong', tanggalPelaksanaan: '11 Ramadhan 1447 H', penanggungJawab: 'Moh. Fajar Shodiq', terlaksana: true, keterangan: 'Anggota terverifikasi' },
  { id: 'ag-19', no: 19, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Sosialisasi Program Safari ke Sahmasy', tanggalPelaksanaan: '13 Ramadhan 1447 H', penanggungJawab: 'Nur Aisyah Z.', terlaksana: true, keterangan: 'Antusiasme tinggi' },
  { id: 'ag-20', no: 20, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Pendataan Keanggotaan Sahmasy Putra', tanggalPelaksanaan: '16 Ramadhan 1447 H', penanggungJawab: 'Ahmad Wildan', terlaksana: true, keterangan: '100+ terdata' },
  { id: 'ag-21', no: 21, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Pendataan Keanggotaan Sahmasy Putri', tanggalPelaksanaan: '19 Ramadhan 1447 H', penanggungJawab: 'Dewi Lailatul', terlaksana: true, keterangan: 'Dokumen lengkap' },
  { id: 'ag-22', no: 22, kategori: 'Rapat Fokus & Sahmasy', namaKegiatan: 'Rapat Pembagian KTA Sahmasy', tanggalPelaksanaan: '21 Ramadhan 1447 H', penanggungJawab: 'H. Moh. Hasan', terlaksana: true, keterangan: 'Selesai didistribusikan' },

  // Fokus & Panitia Lokal (7)
  { id: 'ag-23', no: 23, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Koordinasi Fokus & Panitia Lokal Safari Sapudi', tanggalPelaksanaan: '04 Ramadhan 1447 H', penanggungJawab: 'KH. Abdullah Faqih', terlaksana: true, keterangan: 'Surat resmi dikirim' },
  { id: 'ag-24', no: 24, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Penentuan Jadwal Khotmil Quran & Hadrah', tanggalPelaksanaan: '06 Ramadhan 1447 H', penanggungJawab: 'Syaiful Islam', terlaksana: true, keterangan: 'Jadwal terbit' },
  { id: 'ag-25', no: 25, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Logistik & Perlengkapan Sound Panggung', tanggalPelaksanaan: '09 Ramadhan 1447 H', penanggungJawab: 'Badruttamam', terlaksana: true, keterangan: 'Vendor sound terpilih' },
  { id: 'ag-26', no: 26, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Koordinasi Keamanan & Perizinan Kepolisian', tanggalPelaksanaan: '12 Ramadhan 1447 H', penanggungJawab: 'Ust. Zainal Abidin', terlaksana: true, keterangan: 'Izin diterbitkan' },
  { id: 'ag-27', no: 27, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Gladi Bersih Opening Safari Ramadlan', tanggalPelaksanaan: '15 Ramadhan 1447 H', penanggungJawab: 'Ahmad Fauzi', terlaksana: true, keterangan: 'Sukses dilaksanakan' },
  { id: 'ag-28', no: 28, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Evaluasi Mingguan Safari Ramadlan', tanggalPelaksanaan: '18 Ramadhan 1447 H', penanggungJawab: 'K. Moh. Rofi\'i', terlaksana: true, keterangan: 'Catatan terlampir' },
  { id: 'ag-29', no: 29, kategori: 'Fokus & Panitia Lokal', namaKegiatan: 'Rapat Persiapan Penutupan & Gebyar Lomba', tanggalPelaksanaan: '23 Ramadhan 1447 H', penanggungJawab: 'Ahmad Fauzi', terlaksana: true, keterangan: 'Tropi disiapkan' },

  // Rapat Lain-Lain (11 total: 2 terlaksana, 9 belum)
  { id: 'ag-30', no: 30, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Pembentukan Panitia Gebyar Khotmil Quran', tanggalPelaksanaan: '24 Ramadhan 1447 H', penanggungJawab: 'Syaiful Islam', terlaksana: true, keterangan: 'Panitia terbentuk' },
  { id: 'ag-31', no: 31, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Technical Meeting Lomba Tartil & Hadroh', tanggalPelaksanaan: '25 Ramadhan 1447 H', penanggungJawab: 'Ahmad Fauzi', terlaksana: true, keterangan: 'Peserta mendaftar' },
  { id: 'ag-32', no: 32, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Evaluasi Hasil Sensus Santri Aktif Sapudi', tanggalPelaksanaan: '26 Ramadhan 1447 H', penanggungJawab: 'Fathurrahman', terlaksana: false, keterangan: 'Dijadwalkan H+2 Lebaran' },
  { id: 'ag-33', no: 33, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Koordinasi Penyusunan Laporan Keuangan Audit', tanggalPelaksanaan: '27 Ramadhan 1447 H', penanggungJawab: 'H. Moh. Hasan', terlaksana: false, keterangan: 'Menunggu rekap donatur' },
  { id: 'ag-34', no: 34, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Persiapan Halal Bihalal Alumni & Simpatisan', tanggalPelaksanaan: '02 Syawal 1447 H', penanggungJawab: 'Ust. Zainal Abidin', terlaksana: false, keterangan: 'Undangan disiapkan' },
  { id: 'ag-35', no: 35, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Pembentukan Panitia Safari Idul Fitri', tanggalPelaksanaan: '05 Syawal 1447 H', penanggungJawab: 'Kyai Kholil', terlaksana: false, keterangan: 'Menunggu konfirmasi' },
  { id: 'ag-36', no: 36, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Koordinasi Beasiswa & Santunan Anak Yatim', tanggalPelaksanaan: '08 Syawal 1447 H', penanggungJawab: 'H. Budi Hartono', terlaksana: false, keterangan: 'Draft usulan dibuat' },
  { id: 'ag-37', no: 37, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Audit Internal Bendahara Fokus', tanggalPelaksanaan: '12 Syawal 1447 H', penanggungJawab: 'K. Holilur Rahman', terlaksana: false, keterangan: 'Menunggu bukti kwitansi' },
  { id: 'ag-38', no: 38, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Pemutakhiran Rekening & Donatur Tetap', tanggalPelaksanaan: '15 Syawal 1447 H', penanggungJawab: 'H. Moh. Hasan', terlaksana: false, keterangan: 'Koordinasi perbankan' },
  { id: 'ag-39', no: 39, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Penyusunan LPJ Akhir Periode Pengurus', tanggalPelaksanaan: '20 Syawal 1447 H', penanggungJawab: 'Ust. Zainal Abidin', terlaksana: false, keterangan: 'Draft LPJ dibuat' },
  { id: 'ag-40', no: 40, kategori: 'Rapat Lain-Lain', namaKegiatan: 'Rapat Musyawarah Besar (Mubes) Fokus Sapudi', tanggalPelaksanaan: '25 Syawal 1447 H', penanggungJawab: 'Kyai Kholil (Admin)', terlaksana: false, keterangan: 'Agenda puncak tahunan' }
];
