import { Staff, Jobdes } from "../types";

export const DEFAULT_STAFFS: Staff[] = [
  { id: "st-1", name: "Aldi Pratama", role: "KASIR", shift: "Pagi", isActive: true },
  { id: "st-2", name: "Yoga Saputra", role: "KASIR", shift: "Siang", isActive: true },
  { id: "st-3", name: "Budi Santoso", role: "KASIR", shift: "Malam", isActive: true },
  { id: "st-4", name: "Rian Hidayat", role: "CS", shift: "Pagi", isActive: true },
  { id: "st-5", name: "Siti Rahma", role: "KASIR", shift: "Pagi", isActive: true },
  { id: "st-6", name: "Lisa Indah", role: "CS", shift: "Siang", isActive: true },
  { id: "st-7", name: "Denny Wijaya", role: "KAPTEN", shift: "Malam", isActive: true },
  { id: "st-8", name: "Fajar Nugraha", role: "KASIR", shift: "Siang", isActive: true },
  { id: "st-9", name: "Anisa Putri", role: "KASIR", shift: "Pagi", isActive: true },
  { id: "st-10", name: "Gilang Ramadhan", role: "KASIR", shift: "Malam", isActive: true },
];

export const DEFAULT_JOBDES_LIST: Jobdes[] = [
  { id: "jd-1", title: "Cek HP all SITUS - Google Chrome & Safari", category: "HP SITUS", description: "Periksa fungsionalitas dan status login seluruh situs utama pada HP pengujian." },
  { id: "jd-2", title: "Cek HP all SITUS - Mozilla Firefox & Opera", category: "HP SITUS", description: "Verifikasi performa render dan ketahanan session cookie di browser sekunder." },
  { id: "jd-3", title: "Cek HP all SITUS - Aplikasi Android Khusus", category: "HP SITUS", description: "Monitor notifikasi push dan latency koneksi pada platform aplikasi Android native." },
  { id: "jd-4", title: "Inspeksi Area Kerja Utama (Server Room)", category: "AREA KERJA", description: "Cek suhu AC, kestabilan hub, dan status lampu indikator server utama." },
  { id: "jd-5", title: "Pengecekan Ruang Kontrol & Layar LED", category: "AREA KERJA", description: "Pastikan seluruh dashboard real-time termonitor dengan baik tanpa ada freeze." },
  { id: "jd-6", title: "Cek HP all SITUS - Testing Gateway Pembayaran", category: "HP SITUS", description: "Uji simulasi pemrosesan transaksi pada gerbang pembayaran mobile." },
  { id: "jd-7", title: "Audit Kebersihan & Kerapian Rak HP Pengisian", category: "AREA KERJA", description: "Pastikan semua kabel charger tersambung rapi dan tidak panas berlebih." },
  { id: "jd-8", title: "Verifikasi Log Harian Backup Situs", category: "LAINNYA", description: "Konfirmasi sinkronisasi cadangan basis data lokal selesai diproses." },
];
