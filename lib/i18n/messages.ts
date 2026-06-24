import type { AppLocale } from "@/lib/i18n/types";

const en = {
  "nav.creators": "Creators",
  "nav.videos": "Videos",
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
    "Manage creator profiles, fees, and campaign assignments.",
  "pages.creators.descriptionShort": "Manage and search your creator roster.",
  "pages.creatorDetails.title": "Creator Details",
  "pages.creatorDetails.description":
    "Review creator performance, videos, and campaign participation.",
  "pages.videos.title": "Videos",
  "pages.videos.description":
    "Track video performance and link content to campaigns.",
  "pages.videos.descriptionShort":
    "Track views, likes, comments, shares, and saves across all content.",
  "pages.videos.hacks":
    "Creators are added automatically when you paste a TikTok or Instagram video link.",
  "pages.videos.hacksLabel": "Hacks!",
  "pages.videos.bulkUploadWarning":
    "Create a campaign first to use Bulk Upload. Bulk upload links videos and creators to the campaign you select.",
  "pages.videos.addVideo": "Add Video",
  "pages.videos.editVideo": "Edit Video",
  "pages.videos.addVideoDescription":
    "HOW TO USE IT : Paste a TikTok link -> CLICK Import Metrics -> we'll give you all the details automatically!",
  "pages.videos.addInstagramDescription":
    "HOW TO USE IT : Paste an Instagram link -> CLICK Import Metrics -> we'll give you all the details automatically!",
  "pages.videos.editVideoDescription": "Update video metrics and save changes.",
  "pages.videos.bulkUpload": "Bulk Upload",
  "pages.campaigns.title": "Campaigns",
  "pages.campaigns.description":
    "Plan, track, and measure your creator campaigns.",
  "pages.campaigns.descriptionShort":
    "Manage brand campaigns and track linked content and creators.",
  "pages.campaignDetails.title": "Campaign Details",
  "pages.campaignDetails.description":
    "Executive performance summary for this campaign.",
  "pages.dashboard.title": "Dashboard",
  "pages.payouts.title": "Payouts",
  "pages.payouts.description":
    "Track creator payment deadlines with automatic due dates and status badges.",
  "pages.settings.title": "Settings",
  "pages.settings.description": "Account and workspace preferences.",
  "pages.settings.signOutDescription": "Sign out of Kefoo on this device.",
  "dashboard.activeCampaigns": "Active & Completed Campaigns",
  "dashboard.activeCampaignsOnly": "Showing active and completed campaigns only.",
  "dashboard.totalBudget": "Total Budget",
  "dashboard.totalViews": "Total Views",
  "dashboard.totalViewsSubtitle": "Across campaign videos",
  "dashboard.averageEr": "Average ER",
  "dashboard.averageErSubtitle":
    "(likes + comments + shares + saves) / views",
  "dashboard.cpv": "CPV",
  "dashboard.cpvSubtitle": "Budget divided by views",
  "dashboard.campaignOverview": "Campaign Overview",
  "dashboard.performanceComparison": "Performance Comparison",
  "dashboard.performanceComparisonDescription":
    "Compare campaigns within each selected month.",
  "dashboard.refreshVideos": "Refresh videos",
  "dashboard.refreshingVideos": "Refreshing...",
  "dashboard.advancedUpgradeTitle": "Advanced Performance Dashboard",
  "dashboard.advancedUpgradeDescription":
    "Compare creators, surface key insights, and track monthly trends with Growth.",
  "campaign.refreshVideos": "Refresh videos",
  "common.upgradePlan": "Upgrade plan",
  "trial.expired":
    "Free trial ended{date}. Upgrade your plan to keep using campaigns, creators, and videos.",
  "trial.expiredDate": " on {date}",
} as const;

const id: Record<keyof typeof en, string> = {
  "nav.creators": "Kreator",
  "nav.videos": "Video",
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
    "Kelola profil kreator, fee, dan penugasan campaign.",
  "pages.creators.descriptionShort":
    "Kelola dan cari daftar kreator kamu.",
  "pages.creatorDetails.title": "Detail Kreator",
  "pages.creatorDetails.description":
    "Lihat performa kreator, video, dan partisipasi campaign.",
  "pages.videos.title": "Video",
  "pages.videos.description":
    "Pantau performa video dan hubungkan konten ke campaign.",
  "pages.videos.descriptionShort":
    "Pantau views, likes, comments, shares, dan saves dari semua konten.",
  "pages.videos.hacks":
    "Kreator otomatis ditambahkan saat kamu paste link TikTok atau Instagram.",
  "pages.videos.hacksLabel": "Hacks!",
  "pages.videos.bulkUploadWarning":
    "Buat campaign dulu untuk Bulk Upload. Bulk upload menghubungkan video dan kreator ke campaign yang kamu pilih.",
  "pages.videos.addVideo": "Tambah Video",
  "pages.videos.editVideo": "Edit Video",
  "pages.videos.addVideoDescription":
    "CARA PAKAI : Paste link TikTok -> KLIK Import Metrics -> semua detail otomatis muncul!",
  "pages.videos.addInstagramDescription":
    "CARA PAKAI : Paste link Instagram -> KLIK Import Metrics -> semua detail otomatis muncul!",
  "pages.videos.editVideoDescription":
    "Perbarui metrik video dan simpan perubahan.",
  "pages.videos.bulkUpload": "Bulk Upload",
  "pages.campaigns.title": "Campaign",
  "pages.campaigns.description":
    "Rencanakan, lacak, dan ukur campaign kreator kamu.",
  "pages.campaigns.descriptionShort":
    "Kelola campaign brand dan lacak konten serta kreator yang terhubung.",
  "pages.campaignDetails.title": "Detail Campaign",
  "pages.campaignDetails.description":
    "Ringkasan performa eksekutif untuk campaign ini.",
  "pages.dashboard.title": "Dashboard",
  "pages.payouts.title": "Pembayaran",
  "pages.payouts.description":
    "Lacak deadline pembayaran kreator dengan due date otomatis dan status badge.",
  "pages.settings.title": "Pengaturan",
  "pages.settings.description": "Preferensi akun dan workspace.",
  "pages.settings.signOutDescription": "Keluar dari Kefoo di perangkat ini.",
  "dashboard.activeCampaigns": "Campaign Aktif & Selesai",
  "dashboard.activeCampaignsOnly": "Hanya menampilkan campaign aktif dan selesai.",
  "dashboard.totalBudget": "Total Budget",
  "dashboard.totalViews": "Total Views",
  "dashboard.totalViewsSubtitle": "Dari video campaign",
  "dashboard.averageEr": "Rata-rata ER",
  "dashboard.averageErSubtitle":
    "(likes + comments + shares + saves) / views",
  "dashboard.cpv": "CPV",
  "dashboard.cpvSubtitle": "Budget dibagi views",
  "dashboard.campaignOverview": "Ringkasan Campaign",
  "dashboard.performanceComparison": "Perbandingan Performa",
  "dashboard.performanceComparisonDescription":
    "Bandingkan campaign di setiap bulan yang dipilih.",
  "dashboard.refreshVideos": "Refresh video",
  "dashboard.refreshingVideos": "Sedang refresh...",
  "dashboard.advancedUpgradeTitle": "Dashboard Performa Lanjutan",
  "dashboard.advancedUpgradeDescription":
    "Bandingkan kreator, lihat insight utama, dan lacak tren bulanan dengan Growth.",
  "campaign.refreshVideos": "Refresh video",
  "common.upgradePlan": "Upgrade plan",
  "trial.expired":
    "Free trial berakhir{date}. Upgrade plan kamu untuk terus pakai campaign, kreator, dan video.",
  "trial.expiredDate": " pada {date}",
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
