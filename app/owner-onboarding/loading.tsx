import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while the server renders this page.
 *
 * Shaped like the card that follows rather than like the dashboard: these pages are a single
 * panel on an empty background, and a two-block dashboard skeleton here would announce the wrong
 * screen and then replace it.
 */
export default function Loading() {
  return (
    <div className="status-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
