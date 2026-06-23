import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { CreatorsSearch } from "@/components/creators/creators-search";
import { CreatorsSection } from "@/components/creators/creators-section";
import { getCampaignOptions, getCreators } from "@/lib/data";

type CreatorsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

async function CreatorsContent({ query }: { query?: string }) {
  const [creators, campaigns] = await Promise.all([
    getCreators(query),
    getCampaignOptions(),
  ]);

  return <CreatorsSection creators={creators} campaigns={campaigns} />;
}

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const { q } = await searchParams;

  return (
    <>
      <Header
        title="Creators"
        description="Manage and search your creator roster."
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="h-11 max-w-md animate-pulse rounded-lg bg-slate-200" />
          }
        >
          <CreatorsSearch />
        </Suspense>

        <CreatorsContent query={q} />
      </main>
    </>
  );
}
