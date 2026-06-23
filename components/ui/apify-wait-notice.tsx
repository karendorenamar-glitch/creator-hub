import { cn } from "@/lib/utils";

export const APIFY_IMPORT_DURATION_LABEL = "~60s";

type ApifyWaitNoticeProps = {
  detail?: string;
  className?: string;
};

export function ApifyWaitNotice({
  detail = "Apify runs on every plan. Keep this tab open until it finishes.",
  className,
}: ApifyWaitNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className,
      )}
    >
      <p className="font-medium">This can take up to 60 seconds.</p>
      <p className="mt-1 text-amber-900">{detail}</p>
    </div>
  );
}
