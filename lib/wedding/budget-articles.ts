export type BudgetArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BudgetArticle = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  intro: string;
  publishedAt: string;
  updatedAt: string;
  sections: BudgetArticleSection[];
  related: { href: string; label: string }[];
};

export const budgetArticles: BudgetArticle[] = [
  {
    slug: "cara-membuat-budget-pernikahan",
    title: "Cara Membuat Budget Pernikahan dari Nol",
    seoTitle: "Cara Membuat Budget Pernikahan dari Nol | Kefoo",
    description:
      "Panduan praktis menyusun budget pernikahan dari nol: menentukan total dana, membagi pos biaya, menyiapkan buffer, dan mencatat komitmen vendor.",
    intro:
      "Menyusun budget pernikahan bukan sekadar menulis daftar harga. Kamu perlu menentukan batas pengeluaran, membagi prioritas, lalu mencatat komitmen yang benar-benar sudah dibuat. Panduan ini membantu memulai dari angka nol tanpa harus langsung memiliki semua jawabannya.",
    publishedAt: "2026-10-26",
    updatedAt: "2026-10-26",
    sections: [
      {
        heading: "Mulai dari total dana yang realistis",
        paragraphs: [
          "Sebelum mencari vendor, tentukan kisaran dana yang benar-benar tersedia. Pisahkan dana yang sudah ada, dana yang akan terkumpul sampai hari acara, dan dana cadangan. Jangan memakai angka target yang hanya terasa ambisius tetapi belum memiliki sumber yang jelas.",
          "Tulis juga siapa yang berkontribusi. Jika ada bantuan orang tua atau pasangan, catat nominal atau batas maksimalnya. Ini mencegah satu pihak menganggap biaya tertentu sudah ditanggung pihak lain padahal belum ada kesepakatan.",
        ],
      },
      {
        heading: "Bagi ke pos biaya besar terlebih dahulu",
        paragraphs: [
          "Bagi total dana ke kelompok besar: venue dan catering, dekorasi, dokumentasi, busana dan rias, undangan, serta biaya administrasi. Setelah kelompok besar memiliki batas, baru masukkan detail vendor. Membalik urutannya sering membuat pengeluaran kecil menghabiskan ruang untuk kebutuhan utama.",
          "Beri prioritas pada hal yang paling memengaruhi pengalaman tamu dan kenyamanan kalian. Tidak semua pos harus mendapat porsi yang sama. Angka ilustrasi berikut hanya contoh proporsi, bukan patokan harga pasar.",
        ],
        bullets: [
          "Ilustrasi total rencana: Rp150.000.000.",
          "Venue dan catering: sekitar 45–50% dari total.",
          "Dekorasi dan dokumentasi: sekitar 20–25%.",
          "Busana, rias, dan undangan: sekitar 10–15%.",
          "Buffer atau cadangan: sekitar 10%.",
        ],
      },
      {
        heading: "Sisakan buffer, jangan menghabiskan seluruh dana",
        paragraphs: [
          "Buffer membantu ketika ada biaya tambahan, perubahan jumlah tamu, atau selisih pembayaran. Simpan buffer sebagai pos terpisah agar tidak terlihat sebagai uang yang bisa dipakai untuk upgrade dekorasi.",
          "Jika buffer mulai terpakai, catat alasannya. Dengan begitu, kamu bisa menyesuaikan pos lain sebelum tagihan berikutnya datang.",
        ],
      },
      {
        heading: "Catat komitmen, bukan hanya rencana",
        paragraphs: [
          "Rencana biaya bisa berubah. Komitmen seperti DP vendor atau pembayaran penuh adalah angka yang sudah terjadi. Bedakan keduanya saat meninjau budget.",
          "Di Kefoo, harga vendor, pembayaran yang tercatat, biaya lainnya, dan sisa tagihan ditampilkan dalam satu tampilan agar keputusan berikutnya tidak berdasarkan tebakan.",
        ],
      },
      {
        heading: "Evaluasi setiap minggu",
        paragraphs: [
          "Luangkan waktu singkat untuk memeriksa: pos mana yang sudah terpakai, pembayaran mana yang jatuh tempo, dan apakah buffer masih cukup. Evaluasi rutin lebih berguna daripada menunggu sampai semua tagihan menumpuk.",
        ],
      },
    ],
    related: [
      {
        href: "/wedding-budget-planner/rincian-biaya-pernikahan",
        label: "Rincian biaya pernikahan dan cara membaginya",
      },
      {
        href: "/wedding-budget-planner/mengontrol-pengeluaran-vendor",
        label: "Cara mengontrol pengeluaran dan pembayaran vendor",
      },
    ],
  },
  {
    slug: "rincian-biaya-pernikahan",
    title: "Rincian Biaya Pernikahan dan Cara Membaginya",
    seoTitle: "Rincian Biaya Pernikahan dan Cara Membaginya | Kefoo",
    description:
      "Lihat pos-pos biaya pernikahan yang perlu direncanakan—dari venue dan catering sampai administrasi—serta cara membaginya tanpa double counting.",
    intro:
      "Biaya pernikahan mudah terasa besar karena banyak pos kecil muncul bersamaan. Cara paling aman adalah memahami kelompok biaya, menandai mana yang sudah menjadi komitmen, lalu menghindari pencatatan yang sama dua kali.",
    publishedAt: "2026-10-26",
    updatedAt: "2026-10-26",
    sections: [
      {
        heading: "Biaya utama dan biaya pendukung",
        paragraphs: [
          "Kelompok utama biasanya mencakup venue, catering, dekorasi, dokumentasi, busana, dan rias. Biaya pendukung mencakup undangan, transportasi, akomodasi, administrasi, souvenir, serta kebutuhan teknis di hari acara.",
          "Pisahkan keduanya agar kamu bisa melihat apakah biaya pendukung tumbuh tanpa disadari. Pos pendukung yang banyak dalam jumlah kecil tetap bisa menggeser total budget.",
        ],
      },
      {
        heading: "Contoh pembagian yang bisa dijadikan titik awal",
        paragraphs: [
          "Gunakan tabel sederhana dengan nama pos, perkiraan biaya, status, dan nominal yang sudah dibayar. Contoh di bawah adalah ilustrasi untuk total rencana Rp150.000.000; bukan standar harga atau jaminan hasil.",
        ],
        bullets: [
          "Venue dan catering: Rp75.000.000 — komitmen terbesar.",
          "Dekorasi dan dokumentasi: Rp30.000.000.",
          "Busana, rias, dan undangan: Rp20.000.000.",
          "Transportasi, akomodasi, dan administrasi: Rp10.000.000.",
          "Buffer: Rp15.000.000.",
        ],
      },
      {
        heading: "Jangan mencatat satu tagihan dua kali",
        paragraphs: [
          "Jika harga vendor sudah dimasukkan sebagai biaya vendor, jangan menambahkannya lagi sebagai biaya lainnya. Jika pembayaran vendor sudah tercatat, jangan menghitungnya lagi sebagai pembayaran terpisah.",
          "Untuk biaya lain yang dibayar sebagian, catat harga total dan nominal yang benar-benar sudah dibayar. Sisa tagihan dihitung dari selisih keduanya.",
        ],
      },
      {
        heading: "Bedakan biaya yang direncanakan dan yang sudah terjadi",
        paragraphs: [
          "Rencana membantu melihat batas. Pembayaran membantu melihat kenyataan. Keduanya perlu ditampilkan, tetapi jangan dicampur menjadi satu angka yang tidak bisa dijelaskan.",
          "Saat meninjau vendor, tanyakan: apakah ini baru penawaran, sudah menjadi komitmen, atau sudah dibayar? Status yang jelas membuat prioritas lebih mudah ditentukan.",
        ],
      },
      {
        heading: "Siapkan ruang untuk perubahan",
        paragraphs: [
          "Jumlah tamu, tanggal, dan kebutuhan teknis bisa berubah. Buffer bukan tanda rencana yang lemah; buffer adalah bagian dari rencana yang realistis.",
        ],
      },
    ],
    related: [
      {
        href: "/wedding-budget-planner/cara-membuat-budget-pernikahan",
        label: "Cara membuat budget pernikahan dari nol",
      },
      {
        href: "/wedding-budget-planner/mengontrol-pengeluaran-vendor",
        label: "Mengontrol pengeluaran dan pembayaran vendor",
      },
    ],
  },
  {
    slug: "mengontrol-pengeluaran-vendor",
    title: "Cara Mengontrol Pengeluaran dan Pembayaran Vendor",
    seoTitle:
      "Cara Mengontrol Pengeluaran dan Pembayaran Vendor | Kefoo",
    description:
      "Cara mencatat komitmen vendor, membedakan DP dan pelunasan, memantau bukti pembayaran, serta menjaga sisa tagihan tetap jelas.",
    intro:
      "Pengeluaran vendor sulit dikontrol jika harga, pembayaran, dan bukti transaksi disimpan di tempat berbeda. Mulailah dari satu daftar yang menunjukkan status setiap vendor secara jujur.",
    publishedAt: "2026-10-26",
    updatedAt: "2026-10-26",
    sections: [
      {
        heading: "Catat harga kesepakatan sebelum mencatat pembayaran",
        paragraphs: [
          "Harga penawaran belum tentu harga akhir. Setelah ada kesepakatan, catat harga yang disepakati sebagai dasar perhitungan. Pembayaran DP tidak otomatis berarti seluruh tagihan sudah lunas.",
          "Jika harga belum disepakati, tandai sebagai belum lengkap. Jangan menganggap harga penawaran sebagai angka final hanya agar total terlihat selesai.",
        ],
      },
      {
        heading: "Pisahkan jenis transaksi",
        paragraphs: [
          "DP, termin lanjutan, dan pelunasan adalah transaksi berbeda. Setiap transaksi memiliki tanggal, nominal, dan bukti pembayaran sendiri. Memisahkannya membuat sisa tagihan lebih mudah diperiksa.",
        ],
        bullets: [
          "DP: pembayaran awal untuk mengunci pemesanan.",
          "Termin lanjutan: pembayaran bertahap sesuai kesepakatan.",
          "Pelunasan: pembayaran akhir yang menutup sisa tagihan.",
        ],
      },
      {
        heading: "Simpan bukti bersama transaksinya",
        paragraphs: [
          "Bukti transfer atau invoice membantu menyelesaikan perbedaan catatan tanpa mengandalkan ingatan. Jika bukti belum ada, tandai dengan jelas agar bisa dilengkapi.",
          "Jangan menganggap bukti sudah terlampir hanya karena UI menampilkan status tertentu. Periksa file atau tautan bukti yang benar-benar tersimpan.",
        ],
      },
      {
        heading: "Tinjau sisa tagihan secara berkala",
        paragraphs: [
          "Sisa tagihan adalah harga kesepakatan dikurangi pembayaran yang tercatat. Jika ada biaya yang ditanggung donatur, catat sebagai alokasi tersendiri dan jangan menghitungnya sebagai pembayaran tunai.",
          "Dengan cara ini, progres pembayaran tetap menggambarkan uang yang benar-benar sudah dibayar, sementara alokasi donasi tetap terlihat sebagai penggunaan dana yang berbeda.",
        ],
      },
      {
        heading: "Jangan mengubah riwayat untuk merapikan tampilan",
        paragraphs: [
          "Transaksi lama adalah catatan kejadian. Jika ada kesalahan input, perbaiki dengan alur yang jelas dan simpan alasannya. Jangan menghapus atau mengubah nominal historis hanya supaya dashboard terlihat lebih rapi.",
        ],
      },
    ],
    related: [
      {
        href: "/wedding-budget-planner/cara-membuat-budget-pernikahan",
        label: "Cara membuat budget pernikahan dari nol",
      },
      {
        href: "/wedding-budget-planner/rincian-biaya-pernikahan",
        label: "Rincian biaya pernikahan dan cara membaginya",
      },
    ],
  },
];

export function findBudgetArticle(slug: string) {
  return budgetArticles.find((article) => article.slug === slug) ?? null;
}
