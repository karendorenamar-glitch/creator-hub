import type { Metadata } from "next";
import { LoginPage } from "@/components/login/login-page";

export const metadata: Metadata = {
  title: "Sign In — Kefoo",
  description: "Sign in to your Kefoo Creator Intelligence OS workspace.",
};

type PageProps = {
  searchParams: Promise<{ signup?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { signup } = await searchParams;

  return <LoginPage initialMode={signup ? "signup" : "signin"} />;
}
