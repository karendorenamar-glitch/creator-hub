"use client";

import { useEffect, useRef, useState } from "react";
import { PAYMENT_CONFIG } from "@/lib/wedding/payment-config";

type PaypalHostedButtons = {
  HostedButtons: (options: { hostedButtonId: string }) => {
    render: (target: string | HTMLElement) => Promise<void>;
  };
};

declare global {
  interface Window {
    paypal?: PaypalHostedButtons;
  }
}

const CONTAINER_ID = "paypal-container-4USXNSB8AKRXS";
const SCRIPT_ID = "paypal-hosted-buttons-sdk";

/** Official PayPal Stacked (hosted) Button. One-time USD 2.99, no subscription. */
export function PaypalHostedButton() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function render() {
      if (cancelled) return;
      const paypal = window.paypal;
      const target = containerRef.current;
      if (!paypal?.HostedButtons || !target) return;
      target.innerHTML = "";
      paypal
        .HostedButtons({ hostedButtonId: PAYMENT_CONFIG.paypal.hostedButtonId })
        .render(target)
        .catch(() => setError(true));
    }

    if (window.paypal?.HostedButtons) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", render);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      PAYMENT_CONFIG.paypal.clientId,
    )}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.async = true;
    script.onload = render;
    script.onerror = () => setError(true);
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <div id={CONTAINER_ID} ref={containerRef} className="min-h-11" />
      {error ? (
        <p className="text-xs text-rose-700">
          Tombol PayPal gagal dimuat. Muat ulang halaman atau lanjutkan dengan
          transfer BCA di bagian Indonesia.
        </p>
      ) : null}
    </div>
  );
}
