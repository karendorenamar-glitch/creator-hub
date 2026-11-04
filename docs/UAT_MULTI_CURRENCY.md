# UAT Manual — Multi-Currency Input (Kefoo Wedding Planner)

Pengujian manual di browser untuk seluruh modul multi-currency yang sudah
selesai. Tidak ada kode, database, migration, atau data customer yang diubah
selama UAT ini.

- Status kode: **belum di-commit, belum di-deploy**. UAT di local/dev.
- Migration yang wajib aktif: `046`, `047` (terverifikasi), `048` (sudah dijalankan).
- Matriks: **MYR**, **SGD**, **USD**. IDR hanya sebagai pembanding.

---

## 0. Persiapan

### 0.1 Alat

| Item | Nilai |
|---|---|
| Aplikasi | `npm run dev` → `http://localhost:3000` |
| Akun uji | 3 customer baru, satu per mata uang (jangan pakai akun customer asli) |
| Wedding uji | 1 wedding per akun, data kosong |
| SQL Editor | Supabase Dashboard untuk verifikasi audit |
| Kurs acuan | <https://open.er-api.com/v6/latest/IDR> |

### 0.2 Cara mengatur currency customer

| Jalur | Langkah | Ekspektasi |
|---|---|---|
| A. Settings | `/wedding/settings` → **Currency Preference** → pilih MYR/SGD/USD → Save | Tersimpan; seluruh halaman ikut berubah |
| B. Target Budget | Halaman Budget → dropdown currency di kartu Total Budget | Bila preferensi **belum ada**, pilihan tersimpan. Bila **sudah ada**, muncul chip read-only |

> Default per negara: MY → MYR, SG → SGD, AU → AUD, lainnya USD.
> Untuk akun uji Indonesia, ubah manual lewat jalur A.

### 0.3 Rumus sistem

```text
base IDR = round( nominal_diketik / rate )    rate = 1 IDR = X currency
tampilan = base IDR x rate
prefill  = toInput(base IDR) -> 2 desimal (IDR: 0 desimal)
```

Toleransi perbandingan base: **± Rp 100** untuk MYR/SGD/USD (pembulatan 2
desimal). IDR harus **persis**. Base tidak boleh berbeda ribuan kali lipat.

### 0.4 Cara menghitung nilai harapan

1. Buka <https://open.er-api.com/v6/latest/IDR>, catat `rates.MYR`, `rates.SGD`, `rates.USD`.
2. Contoh USD: ketik `500`, rate `0.0000615` → base harapan = `500 / 0.0000615` ≈ `8.130.081`.
3. Bandingkan dengan DB memakai query di §12.

### 0.5 Format hasil

Isi **PASS** / **FAIL** per baris. Satu FAIL = jangan commit dulu.

---

## 1. Target Budget

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| TB-1 | Buka Budget | Label input memakai mata uang customer, mis. `Total budget (MYR)` | ☐ | ☐ | ☐ |
| TB-2 | Isi `10.000`, Save | Tersimpan; kartu menampilkan format currency customer | ☐ | ☐ | ☐ |
| TB-3 | Cek DB `weddings.total_budget` | ≈ `10.000 / rate`, bukan `10.000` | ☐ | ☐ | ☐ |
| TB-4 | Edit, **tanpa ubah apa pun**, Save | Input berisi `10,000` — bukan angka IDR mentah | ☐ | ☐ | ☐ |
| TB-5 | Cek DB setelah TB-4 | Base **identik** (IDR persis; lain ≤ Rp 100) | ☐ | ☐ | ☐ |
| TB-6 | Isi `0`, Save | Tersimpan `0`, tidak error | ☐ | ☐ | ☐ |
| TB-7 | Kosongkan, Save | Mengikuti aturan lama (null/ditolak), tidak ada nilai acak | ☐ | ☐ | ☐ |
| TB-8 | Ganti currency di Settings, buka Budget | Semua nominal ikut berubah; prefill memakai currency baru | ☐ | ☐ | ☐ |

---

## 2. Budget Categories

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| BC-1 | Tambah kategori `2.500` | Label `(MYR)`; tersimpan; list menampilkan currency customer | ☐ | ☐ | ☐ |
| BC-2 | Cek DB `budget_categories.planned_amount` | ≈ `2.500 / rate` | ☐ | ☐ | ☐ |
| BC-3 | Edit tanpa ubah nominal, Save | Base tidak berubah | ☐ | ☐ | ☐ |
| BC-4 | Prefill saat edit | `2,500` — bukan angka IDR | ☐ | ☐ | ☐ |
| BC-5 | Ringkasan total kategori | Sama dengan penjumlahan yang terlihat (tidak dobel konversi) | ☐ | ☐ | ☐ |

---

## 3. Expenses

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| EX-1 | Tambah expense `300`, status unpaid | Label `(MYR)`; tersimpan | ☐ | ☐ | ☐ |
| EX-2 | Edit → partial → **Amount paid** `100`, Save | Amount & paid dikonversi masing-masing | ☐ | ☐ | ☐ |
| EX-3 | Cek DB `expenses` (`amount`, `paid_amount`) | Keduanya ≈ `/rate`; tidak ada yang tetap display | ☐ | ☐ | ☐ |
| EX-4 | Edit tanpa ubah, Save | Kedua base tidak berubah | ☐ | ☐ | ☐ |
| EX-5 | Prefill edit | Amount dan Amount paid sama-sama currency customer | ☐ | ☐ | ☐ |
| EX-6 | Deposit (bila muncul) | Ikut terkonversi | ☐ | ☐ | ☐ |

---

## 4. Other Costs

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| OC-1 | Tambah other cost `150`, unpaid | Tersimpan, tampil currency customer | ☐ | ☐ | ☐ |
| OC-2 | Edit → partial → **Amount paid** `50`, Save | Dua nominal dikonversi; label paid `(MYR)` | ☐ | ☐ | ☐ |
| OC-3 | Cek DB | Dua kolom nominal ≈ `/rate` | ☐ | ☐ | ☐ |
| OC-4 | Edit tanpa ubah, Save | Base tidak berubah | ☐ | ☐ | ☐ |
| OC-5 | Status `donor` | Tidak membuat pembayaran; alokasi donor tidak membengkak | ☐ | ☐ | ☐ |

---

## 5. Vendor Agreed Price

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| VP-1 | Tambah vendor, harga `500`, status Diskusi | Label `Agreed price (MYR)`; tersimpan | ☐ | ☐ | ☐ |
| VP-2 | Cek DB `vendors.agreed_price` | ≈ `500 / rate` | ☐ | ☐ | ☐ |
| VP-3 | Buka Edit vendor | Berisi `500,00` — **bukan** angka IDR seperti `1.908.000` | ☐ | ☐ | ☐ |
| VP-4 | Simpan tanpa ubah, cek DB | Base **identik** | ☐ | ☐ | ☐ |
| VP-5 | List vendor & kartu pembayaran | Harga dan sisa dalam currency customer | ☐ | ☐ | ☐ |
| VP-6 | Buat vendor dari kandidat (prefill harga opsi) | Prefill currency customer; setelah Save base = hasil konversi | ☐ | ☐ | ☐ |
| VP-7 | Harga kosong | Tersimpan null, tampil "harga belum diisi" | ☐ | ☐ | ☐ |
| VP-8 | Harga `0` + centang selesai kolaborasi | Aturan lama tetap berlaku, tidak error | ☐ | ☐ | ☐ |

---

## 6. Vendor Payment

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| VPAY-1 | Catat pembayaran `200` | Label `(MYR)`; tersimpan | ☐ | ☐ | ☐ |
| VPAY-2 | Cek DB `vendor_payments.amount` | ≈ `200 / rate` | ☐ | ☐ | ☐ |
| VPAY-3 | Edit pembayaran | Berisi `200,00` (currency customer) | ☐ | ☐ | ☐ |
| VPAY-4 | Simpan tanpa ubah | Base tidak berubah | ☐ | ☐ | ☐ |
| VPAY-5 | Total dibayar & sisa di kartu vendor | Konsisten dengan nominal yang diketik | ☐ | ☐ | ☐ |
| VPAY-6 | Isi nominal > sisa (sisa 200, isi 500) | Peringatan "melebihi sisa" **muncul** | ☐ | ☐ | ☐ |
| VPAY-7 | Pelunasan < sisa | Peringatan "belum lunas penuh" muncul | ☐ | ☐ | ☐ |
| VPAY-8 | Buat vendor baru + DP awal sekaligus | DP terkonversi; vendor tidak lahir tanpa pembayaran bila gagal | ☐ | ☐ | ☐ |
| VPAY-9 | Upload bukti + Save | Bukti tersimpan; gagal simpan tidak meninggalkan file | ☐ | ☐ | ☐ |

---

## 7. Vendor Comparison / Option

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| VC-1 | Tambah kandidat vendor, harga `700` | Label `(MYR, optional)`; tersimpan | ☐ | ☐ | ☐ |
| VC-2 | Cek DB `vendor_options.reference_price` | ≈ `700 / rate` | ☐ | ☐ | ☐ |
| VC-3 | Edit kandidat | Prefill `700,00`, bukan IDR | ☐ | ☐ | ☐ |
| VC-4 | Simpan tanpa ubah | Base tidak berubah | ☐ | ☐ | ☐ |
| VC-5 | Tabel perbandingan | Kolom harga menampilkan currency customer, konsisten antar kolom | ☐ | ☐ | ☐ |
| VC-6 | Batas kandidat per kategori | Tetap berlaku | ☐ | ☐ | ☐ |
| VC-7 | Pilih kandidat → jadikan vendor | Harga terbawa sebagai prefill yang benar | ☐ | ☐ | ☐ |

---

## 8. Inspiration Vendor Option

> Modul ini **belum punya UI**. Pengujian hanya di lapisan data + audit.

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| IVO-1 | Pastikan tidak ada form harga inspiration option di UI | Tidak ada input dengan label salah | ☐ | ☐ | ☐ |
| IVO-2 | Bila action ini terpanggil dari UI tersembunyi | Nominal tersimpan sebagai IDR hasil konversi | ☐ | ☐ | ☐ |
| IVO-3 | Cek audit | `module = 'vendor_option'`, `entered_currency` benar | ☐ | ☐ | ☐ |
| IVO-4 | Regresi halaman Inspiration | Create/edit/hapus item & foto tetap normal | ☐ | ☐ | ☐ |

---

## 9. Donation

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| DN-1 | Tambah donasi `1.000` | Label `(MYR)`; tersimpan | ☐ | ☐ | ☐ |
| DN-2 | Cek DB `wedding_donations.amount` | ≈ `1.000 / rate` | ☐ | ☐ | ☐ |
| DN-3 | Edit donasi | Prefill `1.000,00` | ☐ | ☐ | ☐ |
| DN-4 | Simpan tanpa ubah | Base tidak berubah | ☐ | ☐ | ☐ |
| DN-5 | Ringkasan teks "Donasi dari …" | Angka currency customer, konsisten dengan kartu | ☐ | ☐ | ☐ |
| DN-6 | Donasi < total alokasi | Ditolak `donationBelowAllocation` | ☐ | ☐ | ☐ |

---

## 10. Allocation

| ID | Langkah | Ekspektasi | MYR | SGD | USD |
|---|---|---|---|---|---|
| AL-1 | Alokasikan `400` dari donasi `1.000` | Label `(MYR)`; tersimpan | ☐ | ☐ | ☐ |
| AL-2 | Cek DB `donation_allocations.amount` | ≈ `400 / rate` | ☐ | ☐ | ☐ |
| AL-3 | Edit alokasi | Prefill `400,00` | ☐ | ☐ | ☐ |
| AL-4 | Simpan tanpa ubah | Base tidak berubah | ☐ | ☐ | ☐ |
| AL-5 | Alokasi kedua `700` (total 1.100 > 1.000) | **Ditolak** `allocationExceeds` — perbandingan dalam IDR | ☐ | ☐ | ☐ |
| AL-6 | Naikkan donasi jadi `1.200`, ulangi AL-5 | Alokasi `700` diterima | ☐ | ☐ | ☐ |
| AL-7 | Edit alokasi melebihi sisa donasi | Ditolak | ☐ | ☐ | ☐ |
| AL-8 | Sisa donasi ditampilkan | `donasi − total alokasi`, currency customer, tidak negatif | ☐ | ☐ | ☐ |

---

## 11. Kurs tidak tersedia (wajib dicoba, minimal 1 mata uang)

Tujuan: memastikan sistem **menolak menyimpan** daripada menyimpan angka salah.

1. Hentikan dev server.
2. Blokir sumber kurs:
   ```bash
   sudo sh -c 'echo "127.0.0.1 open.er-api.com" >> /etc/hosts'
   ```
3. Jalankan ulang `npm run dev` (cache kurs ada di memori → wajib restart).
4. Ulangi satu create di tiap modul: **TB-2, BC-1, EX-1, OC-1, VP-1, VPAY-1, VC-1, DN-1, AL-1**.

| ID | Ekspektasi | Hasil |
|---|---|---|
| KR-1 | Pesan "Kurs mata uang sedang tidak tersedia. Belum ada yang disimpan" muncul | ☐ |
| KR-2 | Tidak ada baris baru di tabel terkait (cek DB) | ☐ |
| KR-3 | Tidak ada baris baru di `financial_entries` | ☐ |
| KR-4 | Pembayaran: tidak ada file bukti yang tertinggal di storage | ☐ |
| KR-5 | Halaman tidak crash; form tetap terbuka dengan nilai yang diketik | ☐ |

5. **Wajib** kembalikan hosts file:

   ```bash
   # macOS
   sudo sed -i '' '/open.er-api.com/d' /etc/hosts
   # Linux
   sudo sed -i '/open.er-api.com/d' /etc/hosts
   ```

6. Restart dev server; pastikan nominal tampil normal lagi.

---

## 12. Verifikasi audit `financial_entries`

Ganti email sesuai akun uji.

```sql
-- 1. Baris audit terbaru untuk akun uji
select fe.module,
       fe.entered_amount,
       fe.entered_currency,
       fe.fx_rate,
       fe.fx_rate_at,
       fe.record_id,
       fe.updated_at
from public.financial_entries fe
join auth.users u on u.id = fe.user_id
where u.email = 'uat-myr@example.com'
order by fe.updated_at desc
limit 30;
```

| ID | Ekspektasi | Hasil |
|---|---|---|
| AU-1 | Ada baris untuk module: `wedding_budget`, `budget_category`, `expense`, `other_cost`, `vendor`, `vendor_option`, `vendor_payment`, `donation`, `allocation` | ☐ |
| AU-2 | `entered_amount` = nominal yang **diketik** (mis. 500), bukan IDR | ☐ |
| AU-3 | `entered_currency` = MYR/SGD/USD sesuai akun | ☐ |
| AU-4 | `fx_rate` > 0 dan masuk akal (USD ≈ 0.00006) | ☐ |
| AU-5 | `fx_rate_at` terisi (bukan null) | ☐ |
| AU-6 | Satu baris per `(module, record_id)` — tidak ada duplikat | ☐ |
| AU-7 | Edit berkali-kali → tetap **satu** baris, `updated_at` berubah, `entered_amount` = edit terakhir | ☐ |
| AU-8 | Tidak ada `entered_currency = 'IDR'` untuk akun non-IDR (kecuali memang mengetik IDR) | ☐ |

```sql
-- 2. Bandingkan base IDR dengan hasil konversi audit
select v.name,
       v.agreed_price as base_idr,
       fe.entered_amount,
       fe.entered_currency,
       fe.fx_rate,
       round(fe.entered_amount / fe.fx_rate) as expected_base
from public.vendors v
join public.financial_entries fe
  on fe.record_id = v.id and fe.module = 'vendor'
join auth.users u on u.id = fe.user_id
where u.email = 'uat-usd@example.com'
order by v.created_at desc
limit 10;
```

| ID | Ekspektasi | Hasil |
|---|---|---|
| AU-9 | `base_idr` ≈ `expected_base` (selisih ≤ Rp 100) | ☐ |
| AU-10 | Tidak ada `base_idr` ribuan kali lebih besar (tanda double conversion) | ☐ |

```sql
-- 3. Data historis tidak boleh berubah karena UAT
select count(*) from public.vendors where agreed_price is not null;
select count(*) from public.financial_entries;
```

| ID | Ekspektasi | Hasil |
|---|---|---|
| AU-11 | Hitungan data customer lain sama sebelum & sesudah UAT | ☐ |
| AU-12 | Checkout, status pembayaran langganan, lifetime access tidak terpengaruh | ☐ |

---

## 13. Auto-fail (hentikan UAT bila muncul)

- Nominal DB membengkak ribuan kali setelah **edit tanpa perubahan**.
- Label masih `(IDR)` padahal currency customer MYR/SGD/USD.
- Input edit menampilkan angka IDR mentah (mis. `1.908.000` untuk vendor 500 MYR).
- Alokasi melebihi donasi tetap tersimpan.
- Simpan berhasil saat kurs tidak tersedia.
- Baris audit bertambah banyak untuk record yang sama.
- Nominal berbeda antara list, kartu ringkasan, dan form edit.
- Ada perubahan pada data customer lain, checkout, BCA/PayPal, payment approval, atau lifetime access.

---

## 14. Ringkasan hasil

| Modul | MYR | SGD | USD | Catatan |
|---|---|---|---|---|
| Target Budget | ☐ | ☐ | ☐ | |
| Budget Categories | ☐ | ☐ | ☐ | |
| Expenses | ☐ | ☐ | ☐ | |
| Other Costs | ☐ | ☐ | ☐ | |
| Vendor Agreed Price | ☐ | ☐ | ☐ | |
| Vendor Payment | ☐ | ☐ | ☐ | |
| Vendor Comparison / Option | ☐ | ☐ | ☐ | |
| Inspiration Vendor Option | ☐ | ☐ | ☐ | |
| Donation | ☐ | ☐ | ☐ | |
| Allocation | ☐ | ☐ | ☐ | |
| Kurs tidak tersedia | ☐ | — | — | |
| Audit `financial_entries` | ☐ | ☐ | ☐ | |

```text
Diuji oleh : ____________________
Tanggal    : ____________________
Keputusan  : [ ] LULUS → siap commit    [ ] GAGAL → perbaiki dulu
```

Commit dan deploy tetap tidak dilakukan sampai kamu menyatakan **LULUS**.

