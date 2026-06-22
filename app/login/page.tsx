import type { Metadata } from "next";
import { LoginPage } from "@/components/login/login-page";

export const metadata: Metadata = {
  title: "Sign In — Kefoo",
  description: "Sign in to your Kefoo Creator Intelligence OS workspace.",
};

export default function Page() {
  return <LoginPage />;
}
