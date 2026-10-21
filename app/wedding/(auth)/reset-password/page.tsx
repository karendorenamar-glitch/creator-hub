import { getLocale } from "@/lib/i18n/get-locale";
import { ResetPasswordForm } from "@/components/wedding/reset-password-form";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  const locale = await getLocale();

  return (
    <div className="rounded-3xl border border-blush-100 bg-white p-7 shadow-[0_24px_70px_-50px_rgba(120,80,60,0.45)] sm:p-9">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        {locale === "id" ? "Atur kata sandi baru" : "Set a new password"}
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">
        {locale === "id"
          ? "Masukkan kata sandi baru untuk akun Anda."
          : "Enter a new password for your account."}
      </p>
      <ResetPasswordForm locale={locale} />
    </div>
  );
}