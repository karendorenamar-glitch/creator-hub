import type { AppLocale } from "@/lib/i18n/types";

export type LandingCopy = {
  nav: { label: string; href: string }[];
  header: { login: string; signup: string; menu: string };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    footnote: string;
    proofCount: string;
    proofRest: string;
    countdownLabel: string;
    countdownDays: string;
    countdownRest: string;
  };
  preview: {
    nav: string[];
    total: string;
    paid: string;
    remaining: string;
    paidProgress: string;
    checklist: string;
    inspiration: string;
    inspirationTags: string;
    statusDeposit: string;
    statusPaid: string;
  };
  inspiration: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    cta: string;
    footnote: string;
    tiles: { label: string; alt: string; src: string; tone: string }[];
  };
  features: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    cards: {
      budget: { tag: string; title: string; body: string; link: string };
      expenses: { tag: string; title: string; body: string };
      vendors: { tag: string; title: string; body: string };
      planning: { tag: string; title: string; body: string; guests: string; attending: string };
    };
    expenseRows: { name: string; amount: string; status: string }[];
    vendorRows: { name: string; status: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    author: string;
    items: { initials: string; name: string; quote: string }[];
  };
  steps: {
    eyebrow: string;
    title: string;
    items: { no: string; title: string; body: string }[];
  };
  pricing: {
    label: string;
    title: string;
    titleAccent: string;
    body: string;
    price: string;
    note: string;
    bullets: string[];
    cta: string;
  };
  finalCta: { title: string; titleAccent: string; body: string; cta: string };
  footer: { body: string; login: string; signup: string; privacy: string; terms: string; refund: string };
};

export const landingCopy: Record<AppLocale, LandingCopy> = {
  id: {
    nav: [
      { label: "Fitur", href: "#fitur" },
      { label: "Testimoni", href: "#testimoni" },
      { label: "Inspirasi", href: "#inspirasi" },
      { label: "Anggaran", href: "#anggaran" },
      { label: "Harga", href: "#harga" },
    ],
    header: { login: "Masuk", signup: "Daftar", menu: "Menu" },
    hero: {
      eyebrow: "Wedding planner untuk persiapan yang lebih tenang",
      title: "Merencanakan Hari Istimewa,",
      titleAccent: "dengan Hati yang Lebih Tenang.",
      body: "Kelola anggaran dan pengeluaran, atur vendor, susun daftar tamu dan checklist, atur susunan kursi, serta simpan inspirasi pernikahan dalam satu ruang yang dirancang dengan indah.",
      ctaPrimary: "Mulai Merencanakan",
      ctaSecondary: "Jelajahi Fitur",
      footnote: "Satu ruang untuk inspirasi, anggaran, vendor, dan seluruh persiapan pernikahan.",
      proofCount: "100+ pasangan",
      proofRest: "sudah menggunakan Kefoo",
      countdownLabel: "Menuju hari H",
      countdownDays: "120 hari",
      countdownRest: "lagi",
    },
    preview: {
      nav: ["Dashboard", "Anggaran", "Vendor", "Tamu", "Checklist", "Inspirasi"],
      total: "Total biaya",
      paid: "Terbayar",
      remaining: "Sisa",
      paidProgress: "Biaya terbayar",
      checklist: "Checklist 2/5",
      inspiration: "Inspirasi",
      inspirationTags: "Dekorasi · MUA · Venue",
      statusDeposit: "DP",
      statusPaid: "Lunas",
    },
    inspiration: {
      eyebrow: "Inspirasi pernikahan",
      title: "Kumpulkan Inspirasi,",
      titleAccent: "Wujudkan Pernikahan Impian.",
      body: "Dari dekorasi hingga detail terkecil, simpan ide-ide yang kamu sukai dan jadikan referensi untuk hari istimewamu.",
      cta: "Mulai kumpulkan inspirasi",
      footnote: "Kumpulkan foto referensi sendiri dan simpan per kategori.",
      tiles: [
        { label: "Dekorasi", src: "/inspiration/dekorasi.jpg", alt: "Dekorasi resepsi pernikahan dengan rangkaian bunga dan cahaya lilin", tone: "dekorasi" },
        { label: "Attire", src: "/inspiration/ring.jpg", alt: "Busana pengantin berwarna lembut dengan detail elegan", tone: "square" },
        { label: "MUA", src: "/inspiration/mua.jpg", alt: "Tata rias pengantin bernuansa soft glam", tone: "tall" },
        { label: "Hair do", src: "/inspiration/hairdo.jpg", alt: "Sanggul pengantin dengan aksen hiasan rambut", tone: "square" },
        { label: "Wedding ring", src: "/inspiration/wedding-ring.jpg", alt: "Cincin pernikahan dengan latar lembut", tone: "dekorasi" },
        { label: "Venue", src: "/inspiration/attire.jpg", alt: "Venue pernikahan romantis dengan dekorasi hangat", tone: "tall" },
      ],
    },
    features: {
      eyebrow: "Fitur inti",
      title: "Semua Persiapan Pernikahan,",
      titleAccent: "Lebih Terorganisir.",
      body: "Lebih sedikit hal yang perlu dikhawatirkan. Lebih banyak waktu untuk menikmati perjalanannya.",
      cards: {
        budget: { tag: "Anggaran", title: "Anggaran Lebih Terkontrol.", body: "Tentukan anggaran, alokasikan per kategori, dan pantau sisa budget.", link: "Panduan budget pernikahan" },
        expenses: { tag: "Pengeluaran", title: "Setiap Pengeluaran Terpantau.", body: "Catat biaya dan status pembayaran agar tidak ada yang terlewat." },
        vendors: { tag: "Vendor", title: "Semua Vendor Satu Tempat.", body: "Kontak, harga kesepakatan, dan status pembayaran tiap vendor." },
        planning: { tag: "Checklist & Tamu", title: "Persiapan Lebih Terarah.", body: "Tugas, progres, dan daftar tamu beserta konfirmasi kehadiran.", guests: "120 tamu", attending: "84 hadir" },
      },
      expenseRows: [
        { name: "Catering", amount: "Rp 25 jt", status: "DP" },
        { name: "Dekorasi", amount: "Rp 20 jt", status: "Lunas" },
        { name: "Fotografi", amount: "Rp 12 jt", status: "Diskusi" },
      ],
      vendorRows: [
        { name: "Venue · Ballroom", status: "Lunas" },
        { name: "Catering · Ibu Sari", status: "DP" },
      ],
    },
    testimonials: {
      eyebrow: "Cerita pasangan",
      title: "Lebih Tenang,",
      titleAccent: "Lebih Terarah.",
      body: "Cerita dari pasangan yang menyiapkan pernikahannya dengan Kefoo.",
      author: "Pengguna Kefoo",
      items: [
        { initials: "NR", name: "Nadia & Raka", quote: "Dulu kami pakai spreadsheet dan sering lupa pembayaran vendor. Setelah pakai Kefoo, semua DP, pelunasan, dan sisa tagihan kelihatan jelas. Persiapan jadi jauh lebih tenang." },
        { initials: "SB", name: "Sinta & Bima", quote: "Daftar tamu dan susunan kursi biasanya paling bikin pusing. Di Kefoo kami bisa atur meja, isi tamu, dan tukar posisi duduk cukup dengan klik. Hemat waktu banget." },
        { initials: "DA", name: "Dewi & Aldi", quote: "Checklist persiapan dan catatan vendor jadi rapi dalam satu tempat. Kami tidak perlu buka banyak file atau chat lama untuk mencari detail yang sudah disepakati." },
      ],
    },
    steps: {
      eyebrow: "Alurnya sederhana",
      title: "Dari Ide Menjadi Rencana.",
      items: [
        { no: "01", title: "Temukan Inspirasi", body: "Mulai dengan mengumpulkan referensi dan ide untuk pernikahan impianmu." },
        { no: "02", title: "Susun Rencana & Anggaran", body: "Tentukan budget, catat kebutuhan, dan atur prioritas pengeluaran." },
        { no: "03", title: "Pantau Persiapan", body: "Kelola vendor, checklist, dan progres persiapan dalam satu tempat." },
      ],
    },
    pricing: {
      label: "Harga",
      title: "Perencanaan Indah, dengan Harga yang",
      titleAccent: "Tetap Bersahabat.",
      body: "Mulai merencanakan hari istimewamu dengan akses ke seluruh fitur yang tersedia.",
      price: "Rp30.000",
      note: "Satu harga untuk mengakses seluruh fitur yang tersedia.",
      bullets: [
        "Anggaran, pengeluaran, dan pembayaran vendor",
        "Pengelolaan vendor dan daftar tamu",
        "Checklist dan linimasa persiapan",
        "Pengaturan tempat duduk tamu",
        "Papan inspirasi pernikahan",
      ],
      cta: "Mulai Merencanakan",
    },
    finalCta: {
      title: "Mulai Menyusun Hari yang Akan",
      titleAccent: "Selalu Kamu Kenang.",
      body: "Jadikan persiapan pernikahan terasa lebih terarah, dari inspirasi pertama hingga detail terakhir.",
      cta: "Mulai Merencanakan",
    },
    footer: {
      body: "Wedding planner untuk mengatur anggaran, vendor, tamu, checklist, dan inspirasi pernikahan dalam satu tempat.",
      login: "Masuk",
      signup: "Daftar",
      privacy: "Privasi",
      terms: "Syarat",
      refund: "Refund",
    },
  },
  en: {
    nav: [
      { label: "Features", href: "#fitur" },
      { label: "Stories", href: "#testimoni" },
      { label: "Inspiration", href: "#inspirasi" },
      { label: "Budget", href: "#anggaran" },
      { label: "Pricing", href: "#harga" },
    ],
    header: { login: "Sign in", signup: "Sign up", menu: "Menu" },
    hero: {
      eyebrow: "A wedding planner for calmer preparation",
      title: "Plan Your Special Day,",
      titleAccent: "with a Calmer Heart.",
      body: "Manage your budget and expenses, organise vendors, build your guest list and checklist, arrange seating, and keep every wedding inspiration in one beautifully designed space.",
      ctaPrimary: "Start Planning",
      ctaSecondary: "Explore Features",
      footnote: "One space for inspiration, budget, vendors, and your whole wedding preparation.",
      proofCount: "100+ couples",
      proofRest: "already plan with Kefoo",
      countdownLabel: "Days to go",
      countdownDays: "120 days",
      countdownRest: "left",
    },
    preview: {
      nav: ["Dashboard", "Budget", "Vendors", "Guests", "Checklist", "Inspiration"],
      total: "Total cost",
      paid: "Paid",
      remaining: "Remaining",
      paidProgress: "Paid progress",
      checklist: "Checklist 2/5",
      inspiration: "Inspiration",
      inspirationTags: "Decor · Makeup · Venue",
      statusDeposit: "Deposit",
      statusPaid: "Paid",
    },
    inspiration: {
      eyebrow: "Wedding inspiration",
      title: "Collect Inspiration,",
      titleAccent: "Create the Wedding You Dream Of.",
      body: "From the decor to the smallest detail, save the ideas you love and turn them into references for your special day.",
      cta: "Start collecting inspiration",
      footnote: "Save your own reference photos and keep them by category.",
      tiles: [
        { label: "Decor", src: "/inspiration/dekorasi.jpg", alt: "Wedding reception decor with flowers and candlelight", tone: "dekorasi" },
        { label: "Attire", src: "/inspiration/ring.jpg", alt: "Soft-toned wedding attire with elegant details", tone: "square" },
        { label: "Makeup", src: "/inspiration/mua.jpg", alt: "Soft glam bridal makeup", tone: "tall" },
        { label: "Hair do", src: "/inspiration/hairdo.jpg", alt: "Bridal updo with a delicate hair accent", tone: "square" },
        { label: "Wedding ring", src: "/inspiration/wedding-ring.jpg", alt: "Wedding rings on a soft background", tone: "dekorasi" },
        { label: "Venue", src: "/inspiration/attire.jpg", alt: "Romantic wedding venue with warm decor", tone: "tall" },
      ],
    },
    features: {
      eyebrow: "Core features",
      title: "Every Wedding Detail,",
      titleAccent: "Better Organised.",
      body: "Fewer things to worry about. More time to enjoy the journey.",
      cards: {
        budget: { tag: "Budget", title: "A Budget You Control.", body: "Set your budget, allocate it per category, and track what is left.", link: "Wedding budget guide" },
        expenses: { tag: "Expenses", title: "Every Expense Tracked.", body: "Record costs and payment status so nothing slips through." },
        vendors: { tag: "Vendors", title: "All Vendors in One Place.", body: "Contacts, agreed prices, and payment status for every vendor." },
        planning: { tag: "Checklist & Guests", title: "Preparation with Direction.", body: "Tasks, progress, and your guest list with attendance confirmation.", guests: "120 guests", attending: "84 attending" },
      },
      expenseRows: [
        { name: "Catering", amount: "Rp 25m", status: "Deposit" },
        { name: "Decor", amount: "Rp 20m", status: "Paid" },
        { name: "Photography", amount: "Rp 12m", status: "In talks" },
      ],
      vendorRows: [
        { name: "Venue · Ballroom", status: "Paid" },
        { name: "Catering · Ibu Sari", status: "Deposit" },
      ],
    },
    testimonials: {
      eyebrow: "Couple stories",
      title: "Calmer,",
      titleAccent: "Better Focused.",
      body: "Stories from couples planning their wedding with Kefoo.",
      author: "Kefoo user",
      items: [
        { initials: "NR", name: "Nadia & Raka", quote: "We used to rely on spreadsheets and kept forgetting vendor payments. With Kefoo every deposit, final payment, and remaining bill is clear. Planning feels much calmer." },
        { initials: "SB", name: "Sinta & Bima", quote: "Guest lists and seating used to be the most stressful part. In Kefoo we arrange tables, assign guests, and swap seats with a click. A huge time saver." },
        { initials: "DA", name: "Dewi & Aldi", quote: "Our preparation checklist and vendor notes are tidy in one place. No more digging through old files or chats to find what we agreed on." },
      ],
    },
    steps: {
      eyebrow: "A simple flow",
      title: "From Idea to Plan.",
      items: [
        { no: "01", title: "Find Inspiration", body: "Start by collecting references and ideas for your dream wedding." },
        { no: "02", title: "Build the Plan & Budget", body: "Set your budget, list what you need, and prioritise spending." },
        { no: "03", title: "Track the Preparation", body: "Manage vendors, checklist, and progress in one place." },
      ],
    },
    pricing: {
      label: "Pricing",
      title: "Beautiful Planning, at a Price That",
      titleAccent: "Stays Friendly.",
      body: "Start planning your special day with access to every available feature.",
      price: "Rp30,000",
      note: "One price for access to every available feature.",
      bullets: [
        "Budget, expenses, and vendor payments",
        "Vendor management and guest list",
        "Preparation checklist and timeline",
        "Guest seating arrangement",
        "Wedding inspiration board",
      ],
      cta: "Start Planning",
    },
    finalCta: {
      title: "Start Building the Day You Will",
      titleAccent: "Always Remember.",
      body: "Make wedding preparation feel more directed, from the first inspiration to the final detail.",
      cta: "Start Planning",
    },
    footer: {
      body: "A wedding planner to manage budget, vendors, guests, checklist, and inspiration in one place.",
      login: "Sign in",
      signup: "Sign up",
      privacy: "Privacy",
      terms: "Terms",
      refund: "Refund",
    },
  },
};
