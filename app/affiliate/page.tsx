import Link from "next/link";

export const metadata = { title: "Kefoo Affiliate Program" };

const benefits = [
  ["20% Commission", "20% of every customer payment that our team approves."],
  ["Your Own Referral Link", "One unique link that belongs to you."],
  ["Track Your Performance", "Clicks, signups, approved payments and commission in one place."],
  ["Lifetime Referral Link", "Your link never expires while your account stays active."],
  ["Low Minimum Payout", "Request a payout from Rp6,000 or $0.60."],
  ["Transparent Earnings", "Every commission and payout stays in your history."],
] as const;

const steps = [
  ["Join", "Create your affiliate account in a minute."],
  ["Share", "Send your referral link to friends, family or your audience."],
  ["Customer Purchase", "They sign up and pay for Kefoo Wedding Planner."],
  ["Get Approved & Earn", "Our team approves the payment, then your 20% commission is created."],
] as const;

const faqs = [
  ["How do I become an affiliate?", "Register with your name, email and password. Your account is active immediately, no approval needed."],
  ["Do I need admin approval to join?", "No. You can start sharing your link right after registering."],
  ["Does my referral link expire?", "No. It stays valid for life while your affiliate account is active."],
  ["When does commission arrive?", "Only after a customer pays and our team approves that payment."],
  ["Does a signup earn commission?", "No. A signup alone never creates commission."],
  ["Does uploading a payment receipt earn commission?", "No. The payment is still waiting for review at that point."],
  ["What if the payment is rejected?", "No commission is created at all."],
  ["What is the minimum payout?", "Rp6,000 for IDR balance and $0.60 for USD balance."],
  ["How is an international purchase calculated?", "20% of the USD amount, kept in USD. At payout the admin applies a USD/IDR rate and records it on that payout only."],
  ["How do I withdraw my commission?", "Open your dashboard, request a payout for the currency you want, and the admin transfers it to your bank account."],
] as const;

export default function AffiliateLandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-rosewood">Kefoo Affiliate Program</p>
      <h1 className="mt-4 font-heading text-4xl leading-tight text-ink sm:text-5xl">
        Share Kefoo, <span className="italic text-rosewood">Earn Together.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft">
        Share Kefoo with friends, family, communities or your audience. Earn a 20%
        commission every time a customer you referred pays and our team approves
        that payment.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/affiliate/register" className="rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory hover:bg-cocoa">
          Join Affiliate Program
        </Link>
        <Link href="/affiliate/login" className="rounded-full border border-blush px-6 py-3 text-sm font-medium text-cocoa hover:bg-blush/50">
          Affiliate Login
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="font-heading text-2xl text-ink">Why join</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-blush/60 bg-white p-5">
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-2xl text-ink">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, body], index) => (
            <li key={title} className="rounded-2xl border border-blush/60 bg-white p-5">
              <span className="text-[11px] font-medium text-rosewood">0{index + 1}</span>
              <p className="mt-1 text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-xl bg-champagne/20 px-4 py-3 text-xs leading-relaxed text-cocoa">
          A signup alone earns nothing. Commission exists only after the customer
          pays and our team approves that payment.
        </p>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blush/60 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-rosewood">Indonesia</p>
          <p className="mt-3 text-sm text-ink">Customer pays Rp30,000 → admin approves → you earn <strong>Rp6,000</strong>.</p>
        </div>
        <div className="rounded-2xl border border-blush/60 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-rosewood">International</p>
          <p className="mt-3 text-sm text-ink">Customer pays USD 3 → admin approves → you earn <strong>USD 0.60</strong>, kept in USD until payout.</p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-2xl text-ink">FAQ</h2>
        <div className="mt-6 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-blush/60 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">{q}</summary>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
