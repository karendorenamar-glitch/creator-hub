import { cn } from "@/lib/utils";

export const IMPORT_DURATION_LABEL = "~60s";

type ImportWaitNoticeProps = {
  className?: string;
};

export function ImportWaitNotice({ className }: ImportWaitNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950",
        className,
      )}
    >
      This can take up to 60 seconds.
    </div>
  );
}
