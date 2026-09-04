# 🏢 Time Attendance Enterprise Suite

Platform manajemen kehadiran & presensi karyawan Tier-1 modern yang dibangun dengan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Leaflet Geofencing**, dan **Neon Serverless PostgreSQL**.

---

## ✨ Fitur Utama

- 📱 **Portal Khusus Karyawan (Mobile-First)**: Akses presensi mandiri, jadwal shift harian, toleransi keterlambatan, dan riwayat presensi pribadi tanpa tampilan dashboard admin yang rumit.
- 📍 **GPS Geofencing Presisi Tinggi**: Deteksi koordinat GPS aktual perangkat dengan visualisasi peta interaktif Leaflet (Satelit, Jalan, Gelap), perhitungan radius geofence Haversine, dan validasi radius cabang kantor.
- 📊 **Executive Management Dashboard**: Analitik KPI kedisiplinan, grafik tren departemen, dan ledger kehadiran seluruh karyawan.
- 👥 **Multi-Role Role-Based Access Control (RBAC)**: Pembatasan hak akses menu berdasarkan peran:
  - `SUPER_ADMIN` (Akses menyeluruh & pengaturan database)
  - `HR_ADMIN` (Import bulk Excel, template, roster shift)
  - `MANAGER` (Monitoring tim divisi & persetujuan cuti)
  - `EMPLOYEE` (Portal presensi mandiri & pengajuan izin)
- 📁 **Bulk Excel Import & Export**: Fasilitas integrasi data presensi massal berbasis spreadsheet (.xlsx).
- 🌐 **Dukungan Akses Wi-Fi / Jaringan Lokal (LAN)**: Siap diakses oleh smartphone dan perangkat lain dalam 1 jaringan Wi-Fi.

---

## 🚀 Memulai (Quick Start)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` dan sesuaikan koneksi database Neon PostgreSQL Anda:
```bash
cp .env.example .env
```

### 3. Generate Database Client (Prisma)
```bash
npx prisma generate
```

### 4. Menjalankan Server Development

- **Akses Lokal / Jaringan Wi-Fi (LAN)**:
  ```bash
  npm run dev:lan
  # atau
  npm run dev
  ```
- **Akses HTTPS (Rekomendasi untuk GPS di HP via Wi-Fi)**:
  ```bash
  npm run dev:https
  ```

---

## 🛠️ Stack Teknologi

- **Framework**: Next.js 14 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS
- **Peta & Geofence**: Leaflet & React-Leaflet
- **Database ORM**: Prisma ORM & Neon Serverless PostgreSQL
- **Spreadsheet Engine**: XLSX (SheetJS)
- **Icons**: Lucide React
