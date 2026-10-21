import { ForgotPasswordForm } from "@/components/wedding/forgot-password-form";
import { getLocale } from "@/lib/i18n/get-locale";

export const metadata = { title: "Lupa kata sandi" };

export default async function ForgotPasswordPage() {
  const locale = await getLocale();

  return (
    <div className="rounded-3xl border border-blush-100 bg-white p-7 shadow-[0_24px_70px_-50px_rgba(120,80,60,0.45)] sm:p-9">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        {locale === "id" ? "Lupa kata sandi?" : "Forgot your password?"}
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-ink-soft">
        {locale === "id"
          ? "Masukkan email akun Anda. Kami kirimkan tautan untuk membuat kata sandi baru."
          : "Enter your account email and we will send you a link to set a new password."}
      </p>
      <ForgotPasswordForm locale={locale} />
    </div>
  );
}