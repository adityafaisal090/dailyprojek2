# Sistem Pelacakan Alumni

Aplikasi sederhana untuk mengelola data alumni dan melakukan simulasi pelacakan alumni (pekerjaan, perusahaan, dan sumber informasi).

## Fitur

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

- (isi setelah deploy) https://<nama-service>.onrender.com

## Cara Deploy (Render)

Proyek ini menjalankan Express (API + frontend statis), jadi paling mudah dipublish sebagai **Web Service**.

1. Buka https://render.com lalu login.
2. Klik **New** → **Blueprint**.
3. Hubungkan repo GitHub kamu: `adityafaisal090/dailyprojek2`.
4. Render akan mendeteksi file `render.yaml` dan menyiapkan service otomatis.
5. Klik **Apply** / **Deploy**.
6. Setelah selesai, kamu akan dapat URL publik seperti: `https://dailyprojek2.onrender.com` (contoh).

Catatan: data disimpan di file `data/alumni.json`. Di hosting seperti Render, penyimpanan lokal bisa bersifat sementara (bisa reset saat redeploy/restart).

## Tabel Pengujian

| No | Fitur | Skenario | Hasil yang Diharapkan | Status |
|----|------|----------|------------------------|--------|
| 1 | Tambah alumni | Kirim `POST /alumni` dengan payload valid | Data alumni tersimpan dan response `201` | OK (Manual) |
| 2 | Tampilkan alumni | Akses `GET /alumni` | Mengembalikan list alumni (array) | OK (Manual) |
| 3 | Update alumni | Kirim `PUT /alumni/:id` untuk id yang valid | Data alumni berubah dan response `200` | OK (Manual) |
| 4 | Hapus alumni | Kirim `DELETE /alumni/:id` untuk id yang valid | Data alumni terhapus dan response `200` | OK (Manual) |
| 5 | Lacak alumni | Kirim `POST /track/:id` untuk id yang valid | Menghasilkan pekerjaan/perusahaan/sumber dan tersimpan di `lastTracking` | OK (Manual) |
