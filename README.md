# MindFlow
aplikasi jurnaling yang dibuat dengan tujuan untuk menumbuhkan kebiasan menulis jurnal harian, dibuat dengan generative AI

## Hasil akhir Meta Prompting sebelum generate app
```
# Role & Objective
Anda adalah seorang Senior Front-End Developer dan Pakar UI/UX Material Design 3. Tugas Anda adalah membuat sebuah aplikasi web Jurnal Harian berbasis lokal (Single Page Application) menggunakan HTML5, CSS3, dan Vanilla JavaScript murni tanpa framework/library apa pun. Aplikasi ini harus menerapkan prinsip KISS (Keep It Simple, Stupid) dan DRY (Don't Repeat Yourself), serta memiliki performa yang fluid dan animasi mikro khas Material You.

---

# Context & Rules

## 1. Arsitektur Data & LocalStorage (DRY)
- Buat sebuah fungsi terpisah/kapsul khusus untuk mengelola seluruh operasi `localStorage`. Variabel key utama, yaitu `"daily_journals"`, harus dideklarasikan di dalam lingkup fungsi/modul tersebut.
- Semua aksi menambah, membaca, mengedit, dan menghapus data harus melalui fungsi pengelola ini.
- Data disimpan dalam bentuk satu Array of Objects dengan struktur sebagai berikut:
  {
    id: [Angka, hasil dari Date.now() saat pertama kali dibuat],
    timestamp: [String, format "DD-NamaBulan-YYYY", contoh: "12-Juni-2026"],
    mood: [String, nilai dari radio button mood],
    content: [String, teks mentah dari textarea],
    comments: [Array of Strings, kumpulan komentar untuk jurnal tersebut]
  }

## 2. Aturan Batasan Waktu & Fitur CRUD
- **Aturan Batasan Hari:** User hanya boleh memiliki 1 jurnal per hari.
- **Halaman Utama (Tab Create):** Jika user sudah menulis jurnal di hari ini, `textarea` dan pilihan `mood` otomatis terisi dengan data hari ini dan beralih ke mode **Edit**. Jika belum, maka dalam mode **Tambah Baru**.
- **Tab Arsip:** Menampilkan seluruh jurnal masa lalu dalam bentuk grid 2 kolom.
- **Modal Detail:** Ketika salah satu kartu arsip diklik, muncul modal di tengah layar (lebar & tinggi 80% layar). 
  - Jika jurnal yang dibuka adalah jurnal hari ini, fitur komentar dinonaktifkan/disembunyikan.
  - Jika jurnal yang dibuka adalah jurnal hari lampau, user tidak bisa mengedit isi jurnal, tetapi **bisa menambahkan komentar kapan saja**. Komentar baru akan langsung disimpan ke dalam array `comments` di objek jurnal yang bersangkutan.
- **Tab Pengaturan:** Hanya berisi opsi tombol bahaya untuk **Reset/Hapus Semua Data** dari `localStorage`.

## 3. Aturan Visual & Aturan Teks (Baris Pertama Bold)
- Di dalam `textarea` input, teks terlihat seperti teks biasa tanpa styling khusus.
- Di dalam **Tab Arsip (Grid & Modal Detail)**, baris pertama dari `content` harus dipisahkan secara programatis menggunakan JavaScript (misal berbasis karakter `\n`) dan dibungkus menggunakan tag `<b>` agar tampil tebal sebagai judul, sedangkan baris berikutnya menjadi paragraf biasa.

## 4. Desain & Animasi (Material You & Flat Rounded)
- **Komponen Utama:** Gunakan font "Google Sans" (atau Roboto sebagai fallback) dan Material Icons untuk ikon navigasi.
- **Gaya Visual:** Desain flat dengan sudut melengkung tajam (`border-radius: 30px`). Skema warna menggunakan warna Hijau Pastel khas Material You.
- **Navigasi:** Gunakan Navbar di posisi bawah (Bottom Navigation Bar) dengan 3 menu: [Create, Arsip, Pengaturan]. Sifatnya SPA (Single Page Application), perpindahan antar menu hanya menyembunyikan/menampilkan section terkait.
- **Animasi:** Terapkan transisi skala mikro khas Material Design 3 (efek *scale* halus, *fade-in/out* yang fluid, dan transisi tanpa patah-patah).

---

# Input Variables
- [Font]: Google Sans / Roboto via Google Fonts.
- [Icons]: Material Icons via Google Fonts CDN.
- [Theme Color]: Pastel Green Palette (Material You token: Primary, Surface, On-Surface).
- [Border Radius]: 30px untuk semua komponen utama (Card, Modal, Button, Textarea).
- [Grid Layout]: 2 Kolom untuk Arsip dengan tinggi pratinjau maksimal 4 baris teks (`line-clamp: 4` atau `max-height`).
- [Modal Size]: `width: 80vw; height: 80vh;` berada tepat di tengah layar (*centered*).

---

# Expected Output Format
Berikan kode yang rapi, bersih, dan terstruktur dengan memisahkannya ke dalam 3 blok kode terpisah berikut:

1. **index.html** - Struktur markup semantik yang bersih, termasuk link CDN font/icon dan wrapper untuk 3 tab utama.
2. **style.css** - Semua dokumentasi utility-first CSS, variabel warna hijau pastel, layout grid, styling modal, bottom nav, dan keyframes untuk animasi fluid mikro Material Design 3.
3. **app.js** - Logika Vanilla JS murni. Wajib menyertakan enkapsulasi fungsi `localStorage`, pemisahan baris pertama untuk tag `<b>`, pengaturan state edit/read-only berbasis tanggal, dan manajemen interaksi DOM (Tab & Modal).
```

## dibuat di device android
