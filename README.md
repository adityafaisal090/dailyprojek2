# Sistem Pelacakan Alumni

Aplikasi sederhana untuk mengelola data alumni dan melakukan simulasi pelacakan alumni (pekerjaan, perusahaan, dan sumber informasi).

## Fitur

- Login untuk melindungi sistem
  - Halaman utama (`/`) dan endpoint API (`/alumni`, `/track`) hanya bisa diakses setelah login
  - Kredensial default:
    - ID: `rekayasa kebutuhan`
    - Password: `tugas4090`

- CRUD data alumni
  - `GET /alumni`
  - `POST /alumni`
  - `PUT /alumni/:id`
  - `DELETE /alumni/:id`
- Pelacakan alumni (simulasi)
  - `POST /track/:id`
  - Menghasilkan: `pekerjaan`, `perusahaan`, `sumber` (LinkedIn / Google Scholar / ResearchGate)
- Frontend sederhana (Bootstrap)
  - Dashboard
  - Form tambah alumni
  - Tabel data alumni
  - Tombol **Lacak Alumni** + hasil pelacakan
  - Notifikasi sukses/gagal + loading saat proses pelacakan

## Teknologi

- Node.js (disarankan Node 18+)
- Express
- express-session (login)
- exceljs (parser Excel)
- CORS
- Penyimpanan data: JSON file (`data/alumni.json`)
- Frontend: HTML, CSS, JavaScript, Bootstrap 5

## Cara Menjalankan

1. Install dependency:

```bash
npm install
```

2. Jalankan server:

```bash
npm run start
```

Jika muncul error `EADDRINUSE` (port 3000 sudah dipakai), gunakan salah satu cara berikut:

- Matikan proses lain yang memakai port 3000, atau
- Jalankan server di port lain (PowerShell):

```powershell
$env:PORT=3001; npm start
```

Atau mode development (auto-reload):

```bash
npm run dev
```

3. Buka aplikasi:

- Frontend: `http://localhost:3000/`
- API: `http://localhost:3000/alumni`

Catatan: aplikasi meminta login terlebih dahulu.

## Publish Link 24/7 (Hosting)

### Opsi A — GitHub Pages (hanya untuk web statis)

GitHub Pages cocok untuk proyek yang **tanpa backend**. Proyek ini memakai Express (login + API), jadi GitHub Pages hanya akan menampilkan halaman HTML/CSS/JS dan **endpoint seperti** `/auth/*`, `/alumni`, `/track` **tidak akan jalan**.

### Opsi B — Render (disarankan untuk proyek ini)

Repo ini sudah menyiapkan konfigurasi Render di `render.yaml`.

Langkah singkat:

1. Push project ke GitHub.
2. Buka Render → **New** → **Blueprint** → pilih repo ini.
3. Render akan membaca `render.yaml`, lalu klik **Apply** / **Deploy**.
4. Setelah selesai, kamu dapat URL semacam `https://<nama-service>.onrender.com`.

Catatan:

- Di konfigurasi, `SESSION_SECRET` dibuat otomatis oleh Render.
- Folder `data/` dipasang sebagai **persistent disk** supaya `data/alumni.json` tidak hilang saat restart.
- Paket free biasanya bisa sleep saat idle (cold start). Untuk benar-benar selalu responsif 24/7, pakai plan berbayar atau uptime monitor.

## Cara Import File Excel (tanpa upload dari UI)

Mode import Excel dilakukan dengan cara menaruh file `.xlsx` langsung ke folder project, lalu menjalankan script CLI.

1. Taruh file Excel di folder `data/` (contoh: `data/alumni.xlsx`).
2. Jalankan:

```bash
npm run import:alumni -- data/alumni.xlsx
```

Catatan:

- Format didukung: `.xlsx`.
- Perilaku: **upsert by email** (email sama → update; email baru → create).
- Minimal kolom per baris: `Nama` dan `Email`.

Header kolom bersifat fleksibel (case-insensitive). Contoh yang dikenali:

- `Email`
- `No HP` / `HP` / `WhatsApp`
- `LinkedIn`, `IG` / `Instagram`, `FB` / `Facebook`, `TikTok`
- `Tempat Bekerja` / `Perusahaan` / `Instansi`
- `Alamat Bekerja`
- `Posisi` / `Jabatan`
- `Jenis` (di-normalisasi ke: `PNS`, `Swasta`, `Wirausaha` bila terdeteksi)
- Sosmed tempat kerja: `LinkedIn Perusahaan`, `Instagram Perusahaan`, `Facebook Perusahaan`, `TikTok Perusahaan`

## Struktur Folder

```
.
├─ controllers/
│  ├─ alumniController.js
│  └─ trackController.js
├─ data/
│  └─ alumni.json
├─ middleware/
│  ├─ asyncHandler.js
│  └─ errorHandler.js
├─ models/
│  └─ alumniStore.js
├─ public/
│  ├─ index.html
│  ├─ style.css
│  └─ script.js
├─ routes/
│  ├─ alumniRoutes.js
│  └─ trackRoutes.js
├─ server.js
└─ package.json
```

## Link GitHub

- https://github.com/adityafaisal090/dailyprojek2

## Link Deploy

- GitHub Pages (frontend saja): https://adityafaisal090.github.io/dailyprojek2/

Catatan: GitHub Pages hanya untuk file statis. Endpoint API seperti `GET /alumni` dan `POST /track/:id` tetap membutuhkan backend (`server.js`) yang dijalankan di hosting lain atau lokal.

## Tabel Pengujian

| No | Fitur | Skenario | Hasil yang Diharapkan | Status |
|----|------|----------|------------------------|--------|
| 1 | Tambah alumni | Kirim `POST /alumni` dengan payload valid | Data alumni tersimpan dan response `201` | OK (Manual) |
| 2 | Tampilkan alumni | Akses `GET /alumni` | Mengembalikan list alumni (array) | OK (Manual) |
| 3 | Update alumni | Kirim `PUT /alumni/:id` untuk id yang valid | Data alumni berubah dan response `200` | OK (Manual) |
| 4 | Hapus alumni | Kirim `DELETE /alumni/:id` untuk id yang valid | Data alumni terhapus dan response `200` | OK (Manual) |
| 5 | Lacak alumni | Kirim `POST /track/:id` untuk id yang valid | Menghasilkan pekerjaan/perusahaan/sumber dan tersimpan di `lastTracking` | OK (Manual) |
