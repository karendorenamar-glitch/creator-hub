import type { AppLocale } from "@/lib/i18n/types";

const en = {
  "nav.creators": "Creators",
  "nav.videos": "Video library",
  "nav.campaigns": "Campaigns",
  "nav.dashboard": "Dashboard",
  "nav.planner": "Content Planner",
  "nav.payouts": "Payouts",
  "nav.settings": "Settings",
  "header.openMenu": "Open menu",
  "header.closeMenu": "Close menu",
  "header.closeOverlay": "Close overlay",
  "user.greeting": "Hi, {name}",
  "user.signOut": "Sign out",
  "user.signingOut": "Signing out...",
  "user.accountMenu": "Account menu",
  "language.label": "Language",
  "language.en": "English",
  "language.id": "Bahasa",
  "pages.creators.title": "Creators",
  "pages.creators.description":
    "Your creator roster — profiles, fees, and campaign assignments in one place.",
  "pages.creators.descriptionShort":
    "Search your roster and keep creator details up to date.",
  "pages.creatorDetails.title": "Creator Details",
  "pages.creatorDetails.description":
    "Performance, linked videos, and campaign history for this creator.",
  "pages.videos.title": "Video library",
  "pages.videos.description":
    "Paste a link, pull metrics automatically, and tie content to campaigns.",
  "pages.videos.descriptionShort":
    "Browse every linked video and live metrics across your workspace.",
  "pages.videos.libraryHint":
    "This is your video library. To add or bulk-upload links, open a campaign",
  "pages.videos.libraryHintLink": "Go to campaigns",
  "pages.videos.hacks":
    "Paste a TikTok or Instagram link — we'll detect the creator and add them to your roster automatically.",
  "pages.videos.hacksLabel": "Quick tip",
  "pages.videos.bulkUploadWarning":
    "Create a campaign first, then bulk upload links. We'll attach each video and creator to the campaign you pick.",
  "pages.videos.addVideo": "Add Video",
  "pages.videos.editVideo": "Edit Video",
  "pages.videos.addVideoDescription":
    "Paste a TikTok URL, hit Import Metrics, and we'll fill in the stats for you.",
  "pages.videos.addInstagramDescription":
    "Paste an Instagram URL, hit Import Metrics, and we'll fill in the stats for you.",
  "pages.videos.editVideoDescription":
    "Update metrics manually or re-import from the link.",
  "pages.videos.bulkUpload": "Bulk Upload",
  "pages.campaigns.title": "Campaigns",
  "pages.campaigns.description":
    "Plan campaigns, link content, and see what's working.",
  "pages.campaigns.descriptionShort":
    "Organize brand partnerships with linked creators and content.",
  "tutorial.title": "Getting started",
  "tutorial.description":
    "Follow these three steps to set up your first campaign and see live performance.",
  "tutorial.progress": "{done}/{total} done",
  "tutorial.stepCampaignTitle": "Create your first campaign",
  "tutorial.stepCampaignDescription":
    "Name the brand partnership and set campaign dates so your team has a home base.",
  "tutorial.stepContentTitle": "Add creators or paste video links",
  "tutorial.stepContentDescription":
    "Open Content on the campaign, add creators to the tracker, then paste links when they go live.",
  "tutorial.stepPerformanceTitle": "Check live performance",
  "tutorial.stepPerformanceDescription":
    "Open Performance on the campaign to see views, engagement, CPV, and budget usage.",
  "tutorial.stepDone": "Done",
  "tutorial.actionCreateCampaign": "Create campaign",
  "tutorial.actionNeedsCampaign": "Create a campaign first",
  "tutorial.actionOpenExecution": "Open Content",
  "tutorial.actionOpenPerformance": "Open Performance",
  "tutorial.dismiss": "Dismiss tutorial",
  "tutorial.hide": "Hide this guide",
  "campaign.content.title": "Content",
  "campaign.content.description":
    "Track creator progress and paste video links in one place.",
  "campaign.content.howItWorks": "How it works",
  "campaign.content.step1":
    "Add creators to your tracker — pick from your roster or they’ll appear when you paste a link.",
  "campaign.content.step2":
    "Update status as you work: Brief → Waiting content → Revision.",
  "campaign.content.step3":
    "When a creator posts, paste their video link below (single or bulk). Status becomes Uploaded automatically.",
  "campaign.content.pasteTitle": "Paste video links",
  "campaign.content.pasteDescription":
    "When a creator goes live, paste their TikTok or Instagram link here — one or many at once. Status updates to Uploaded automatically.",
  "campaign.content.instagramMetaTitle": "Meta metrics are not imported automatically",
  "campaign.content.instagramMetaDescription":
    "Views, shares, and saves are not available from Instagram via Meta. After import, open Performance → Creators, view the creator, and enter metrics manually.",
  "campaign.creator.instagramManualMetrics":
    "Enter views, likes, comments, shares, and saves manually below — Meta does not provide them automatically.",
  "campaign.creator.saveMetrics": "Save",
  "campaign.creator.savingMetrics": "Saving…",
  "pages.campaignDetails.title": "Campaign Details",
  "pages.campaignDetails.description":
    "Live performance summary for this campaign.",
  "pages.dashboard.title": "Dashboard",
  "pages.payouts.title": "Payouts",
  "pages.payouts.description":
    "Track payment deadlines with auto-calculated due dates and status at a glance.",
  "pages.settings.title": "Settings",
  "pages.settings.description": "Workspace settings and account preferences.",
  "pages.settings.signOutDescription": "Sign out of Kefoo on this device.",
  "dashboard.activeCampaigns": "Active & Completed Campaigns",
  "dashboard.activeCampaignsOnly":
    "Includes active and completed campaigns — drafts and archived aren't shown here.",
  "dashboard.totalBudget": "Total Budget",
  "dashboard.totalViews": "Total Views",
  "dashboard.totalViewsSubtitle": "Across campaign videos",
  "dashboard.averageEr": "Average ER",
  "dashboard.averageErSubtitle":
    "(likes + comments + shares + saves) / views",
  "dashboard.cpv": "CPV",
  "dashboard.cpvSubtitle": "Budget divided by views",
  "dashboard.campaignOverview": "Campaign overview",
  "dashboard.performanceComparison": "Performance comparison",
  "dashboard.performanceComparisonDescription":
    "Compare campaigns month over month within your selected filters.",
  "dashboard.refreshVideos": "Refresh videos",
  "dashboard.refreshingVideos": "Refreshing...",
  "dashboard.advancedUpgradeTitle": "Advanced performance dashboard",
  "dashboard.advancedUpgradeDescription":
    "Unlock creator comparisons, live insights, and monthly trends with Scale.",
  "campaign.refreshVideos": "Refresh videos",
  "common.upgradePlan": "Upgrade plan",
  "common.renewSubscription": "Renew subscription",
  "trial.expired":
    "Your free access has ended{date}. Update your plan and pay your subscription to keep campaigns, creators, and videos in sync.",
  "trial.expiredDate": " on {date}",
  "subscription.expired":
    "Your subscription has ended{date}. Pay your next subscription to keep campaigns, creators, and videos in sync.",
} as const;

const id: Record<keyof typeof en, string> = {
  "nav.creators": "Kreator",
  "nav.videos": "Library video",
  "nav.campaigns": "Campaign",
  "nav.dashboard": "Dashboard",
  "nav.planner": "Content Planner",
  "nav.payouts": "Pembayaran",
  "nav.settings": "Pengaturan",
  "header.openMenu": "Buka menu",
  "header.closeMenu": "Tutup menu",
  "header.closeOverlay": "Tutup overlay",
  "user.greeting": "Hai, {name}",
  "user.signOut": "Keluar",
  "user.signingOut": "Sedang keluar...",
  "user.accountMenu": "Menu akun",
  "language.label": "Bahasa",
  "language.en": "English",
  "language.id": "Bahasa",
  "pages.creators.title": "Kreator",
  "pages.creators.description":
    "Daftar kreator kamu — profil, fee, dan penugasan campaign dalam satu tempat.",
  "pages.creators.descriptionShort":
    "Cari di roster dan jaga detail kreator tetap up to date.",
  "pages.creatorDetails.title": "Detail Kreator",
  "pages.creatorDetails.description":
    "Performa, video terhubung, dan riwayat campaign untuk kreator ini.",
  "pages.videos.title": "Library video",
  "pages.videos.description":
    "Paste link, ambil metrik otomatis, dan hubungkan konten ke campaign.",
  "pages.videos.descriptionShort":
    "Lihat semua video terhubung dan metrik live di workspace kamu.",
  "pages.videos.libraryHint":
    "Ini library video kamu. Untuk tambah atau bulk upload link, buka campaign",
  "pages.videos.libraryHintLink": "Ke campaigns",
  "pages.videos.hacks":
    "Paste link TikTok atau Instagram — kami deteksi kreatornya dan tambahkan ke roster kamu otomatis.",
  "pages.videos.hacksLabel": "Tips cepat",
  "pages.videos.bulkUploadWarning":
    "Buat campaign dulu, lalu bulk upload link. Kami hubungkan setiap video dan kreator ke campaign yang kamu pilih.",
  "pages.videos.addVideo": "Tambah Video",
  "pages.videos.editVideo": "Edit Video",
  "pages.videos.addVideoDescription":
    "Paste URL TikTok, klik Import Metrics, dan kami isi statistiknya untuk kamu.",
  "pages.videos.addInstagramDescription":
    "Paste URL Instagram, klik Import Metrics, dan kami isi statistiknya untuk kamu.",
  "pages.videos.editVideoDescription":
    "Perbarui metrik manual atau import ulang dari link.",
  "pages.videos.bulkUpload": "Bulk Upload",
  "pages.campaigns.title": "Campaign",
  "pages.campaigns.description":
    "Rencanakan campaign, hubungkan konten, dan lihat apa yang works.",
  "pages.campaigns.descriptionShort":
    "Organisir brand partnership dengan kreator dan konten terhubung.",
  "tutorial.title": "Mulai pakai Kefoo",
  "tutorial.description":
    "Ikuti 3 langkah ini untuk setup campaign pertama dan lihat performa live.",
  "tutorial.progress": "{done}/{total} selesai",
  "tutorial.stepCampaignTitle": "Buat campaign pertama",
  "tutorial.stepCampaignDescription":
    "Isi nama brand partnership dan tanggal campaign supaya tim punya home base.",
  "tutorial.stepContentTitle": "Tambah kreator atau paste link video",
  "tutorial.stepContentDescription":
    "Buka Content di campaign, tambah kreator ke tracker, lalu paste link saat sudah live.",
  "tutorial.stepPerformanceTitle": "Cek performa live",
  "tutorial.stepPerformanceDescription":
    "Buka Performance di campaign untuk lihat views, engagement, CPV, dan pemakaian budget.",
  "tutorial.stepDone": "Selesai",
  "tutorial.actionCreateCampaign": "Buat campaign",
  "tutorial.actionNeedsCampaign": "Buat campaign dulu",
  "tutorial.actionOpenExecution": "Buka Content",
  "tutorial.actionOpenPerformance": "Buka Performance",
  "tutorial.dismiss": "Tutup tutorial",
  "tutorial.hide": "Sembunyikan panduan ini",
  "campaign.content.title": "Konten",
  "campaign.content.description":
    "Lacak progress kreator dan paste link video di satu tempat.",
  "campaign.content.howItWorks": "Cara pakai",
  "campaign.content.step1":
    "Tambah kreator ke tracker — pilih dari roster atau mereka muncul otomatis saat kamu paste link.",
  "campaign.content.step2":
    "Update status sambil jalan: Brief → Waiting content → Revision.",
  "campaign.content.step3":
    "Saat kreator sudah posting, paste link videonya di bawah (satu atau bulk). Status otomatis jadi Uploaded.",
  "campaign.content.pasteTitle": "Paste link video",
  "campaign.content.pasteDescription":
    "Saat kreator sudah live, paste link TikTok atau Instagram di sini — satu atau banyak sekaligus. Status otomatis jadi Uploaded.",
  "campaign.content.instagramMetaTitle": "Metrik Meta tidak di-import otomatis",
  "campaign.content.instagramMetaDescription":
    "Views, shares, dan saves tidak tersedia dari Instagram lewat Meta. Setelah import, buka Performance → Creators, buka detail kreator, lalu isi metrik manual.",
  "campaign.creator.instagramManualMetrics":
    "Isi views, likes, comments, shares, dan saves manual di bawah — Meta tidak menyediakannya otomatis.",
  "campaign.creator.saveMetrics": "Simpan",
  "campaign.creator.savingMetrics": "Menyimpan…",
  "pages.campaignDetails.title": "Detail Campaign",
  "pages.campaignDetails.description":
    "Ringkasan performa live untuk campaign ini.",
  "pages.dashboard.title": "Dashboard",
  "pages.payouts.title": "Pembayaran",
  "pages.payouts.description":
    "Lacak deadline pembayaran dengan due date otomatis dan status sekilas pandang.",
  "pages.settings.title": "Pengaturan",
  "pages.settings.description": "Pengaturan workspace dan preferensi akun.",
  "pages.settings.signOutDescription": "Keluar dari Kefoo di perangkat ini.",
  "dashboard.activeCampaigns": "Campaign Aktif & Selesai",
  "dashboard.activeCampaignsOnly":
    "Termasuk campaign aktif dan selesai — draft dan arsip tidak ditampilkan di sini.",
  "dashboard.totalBudget": "Total Budget",
  "dashboard.totalViews": "Total Views",
  "dashboard.totalViewsSubtitle": "Dari video campaign",
  "dashboard.averageEr": "Rata-rata ER",
  "dashboard.averageErSubtitle":
    "(likes + comments + shares + saves) / views",
  "dashboard.cpv": "CPV",
  "dashboard.cpvSubtitle": "Budget dibagi views",
  "dashboard.campaignOverview": "Ringkasan campaign",
  "dashboard.performanceComparison": "Perbandingan performa",
  "dashboard.performanceComparisonDescription":
    "Bandingkan campaign bulan ke bulan sesuai filter yang kamu pilih.",
  "dashboard.refreshVideos": "Refresh video",
  "dashboard.refreshingVideos": "Sedang refresh...",
  "dashboard.advancedUpgradeTitle": "Dashboard performa lanjutan",
  "dashboard.advancedUpgradeDescription":
    "Buka perbandingan kreator, insight live, dan tren bulanan dengan Scale.",
  "campaign.refreshVideos": "Refresh video",
  "common.upgradePlan": "Upgrade plan",
  "common.renewSubscription": "Perpanjang langganan",
  "trial.expired":
    "Free trial kamu sudah berakhir{date}. Upgrade untuk terus sinkronkan campaign, kreator, dan video.",
  "trial.expiredDate": " pada {date}",
  "subscription.expired":
    "Langganan kamu sudah berakhir{date}. Bayar langganan berikutnya untuk terus pakai campaign, kreator, dan video.",
};

export type MessageKey = keyof typeof en;

const messages: Record<AppLocale, Record<MessageKey, string>> = {
  en,
  id,
};

export function getMessage(locale: AppLocale, key: MessageKey): string {
  return messages[locale][key] ?? messages.en[key] ?? key;
}

export function formatMessage(
  locale: AppLocale,
  key: MessageKey,
  params: Record<string, string> = {},
): string {
  let text = getMessage(locale, key);

  for (const [param, value] of Object.entries(params)) {
    text = text.replaceAll(`{${param}}`, value);
  }

  return text;
}
