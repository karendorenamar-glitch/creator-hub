import { Header } from "@/components/layout/header";

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings"
        description="Account and workspace preferences."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            Settings are coming soon. Check back here for account and workspace
            options.
          </p>
        </div>
      </main>
    </>
  );
}
