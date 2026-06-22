import { Header } from "@/components/layout/header";
import { PayoutsSection } from "@/components/payouts/payouts-section";
import {
  getCampaignOptions,
  getCreators,
  getPayouts,
} from "@/lib/data";

export default async function PayoutsPage() {
  const [payouts, creators, campaigns] = await Promise.all([
    getPayouts(),
    getCreators(),
    getCampaignOptions(),
  ]);

  return (
    <>
      <Header
        title="Payouts"
        description="Track creator payment deadlines with automatic due dates and status badges."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <PayoutsSection
          payouts={payouts}
          creators={creators}
          campaigns={campaigns}
        />
      </main>
    </>
  );
}
