# Manual Book Aplikasi Reservasi Futsal GOR Tambora

Panduan sederhana untuk menjalankan aplikasi di perangkat baru.

## 1. Gambaran Umum Aplikasi

Aplikasi Reservasi Futsal GOR Tambora terdiri dari tiga bagian utama yang saling terhubung. Dengan panduan ini, Anda bisa menjalankan seluruh sistem di perangkat baru tanpa harus memahami istilah teknis secara mendalam.

Alur sederhananya: customer memakai aplikasi mobile, admin memakai panel web, dan semua data disimpan di database melalui backend.

| Bagian | Fungsi Utama | Port |
| --- | --- | --- |
| Backend | Mengolah data, login, booking, dan komunikasi ke database | 3333 |
| Panel Admin | Mengelola lapangan, booking, dan data operasional | 3000 |
| Mobile App | Dipakai customer untuk reservasi | - |
| Database | Menyimpan seluruh data aplikasi | 3306 |

## 2. Yang Harus Disiapkan

Sebelum mulai, pastikan perangkat sudah memiliki software berikut.

| Software | Kegunaan |
| --- | --- |
| Node.js | Menjalankan backend dan panel admin |
| MySQL / MariaDB | Menyimpan data aplikasi |
| Flutter SDK | Menjalankan aplikasi mobile |
| Android Studio | Emulator Android dan Android SDK |
| VS Code | Membuka dan mengubah source code |
| Git | Menyimpan dan membagikan kode ke GitHub |

## 3. Urutan Menjalankan Aplikasi

Urutan ini penting agar aplikasi tidak error saat dibuka.

- Nyalakan MySQL terlebih dahulu.
- Jalankan backend.
- Jalankan panel admin.
- Jalankan aplikasi mobile.

## 4. Menyiapkan Database

Database harus dibuat sebelum backend dijalankan. Nama database yang digunakan adalah db_reservasi_futsal_new.

Jika Anda memiliki file backup SQL, file itu bisa di-import ke database tersebut.

- Buka MySQL atau Laragon / XAMPP.
- Buat database bernama db_reservasi_futsal_new.
- Jika ada file SQL backup, import file itu ke database.

## 5. Menjalankan Backend

Backend adalah pusat aplikasi. Jika backend tidak jalan, panel admin dan mobile tidak bisa mengambil data.

Setelah membuka folder backend, jalankan install dependency lalu start development server.

```bash
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

| File / Pengaturan | Penjelasan |
| --- | --- |
| DATABASE_URL | Alamat database yang dipakai backend |
| PORT=3333 | Backend berjalan di port 3333 |
| JWT_SECRET | Kode rahasia untuk keamanan login |

## 6. Menjalankan Panel Admin

Panel admin dipakai untuk mengelola data aplikasi melalui browser.

Jika backend dan panel ada di komputer yang sama, pengaturan biasanya sudah aman dengan default.

- Buka browser setelah panel aktif.
- Akses alamat http://localhost:3000 dari komputer yang sama.

```bash
npm install
npm run dev
```

## 7. Menjalankan Aplikasi Mobile

Aplikasi mobile dipakai customer untuk melihat jadwal dan melakukan reservasi.

File .env di aplikasi mobile harus berisi alamat backend yang benar.

```bash
flutter pub get
flutter run
```

```bash
flutter run -d chrome
```

| Kondisi | BASE_URL yang Dipakai |
| --- | --- |
| Android Emulator | http://10.0.2.2:3333 |
| HP fisik melalui WiFi | http://IP-KOMPUTER:3333 |
| Chrome / Web | http://localhost:3333 |

## 8. Cara Mengetahui IP Komputer

Jika aplikasi mobile dijalankan di HP fisik, HP harus diarahkan ke IP komputer yang menjalankan backend.

- Cari bagian IPv4 Address.
- Contoh: 192.168.1.15.
- IP itulah yang dipakai di BASE_URL mobile.

```bash
ipconfig
```

## 9. Troubleshooting Sederhana

Bagian ini membantu jika ada error saat menjalankan aplikasi.

| Masalah | Kemungkinan Penyebab | Solusi Singkat |
| --- | --- | --- |
| Aplikasi tidak bisa konek | Backend belum jalan atau alamat salah | Cek backend dan file .env |
| Panel admin kosong | Backend belum aktif | Jalankan backend lalu refresh panel |
| Mobile timeout | HP dan komputer tidak satu jaringan | Pastikan satu WiFi dan IP benar |
| Database error | Database belum dibuat | Buat database db_reservasi_futsal_new |

## 10. Ringkasan Cepat

Kalau ingin menjalankan aplikasi dengan cepat, ikuti langkah ini:

- Nyalakan MySQL.
- Jalankan backend.
- Jalankan panel admin.
- Jalankan mobile app.
- Pastikan alamat backend di mobile sudah benar.

> Terakhir diperbarui: Juli 2026
