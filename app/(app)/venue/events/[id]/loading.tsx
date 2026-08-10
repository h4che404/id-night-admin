import { LoadingSkeleton } from "@/components/ui-kit";

/**
 * Shown while the server renders this page.
 *
 * Without this file Next.js keeps the previous screen frozen until the server answers, and every
 * navigation here first authenticates against the backend before a single pixel is drawn. The
 * wait is the same either way; what changes is whether the app looks like it is working or like
 * it has stopped responding.
 */
export default function Loading() {
  return <LoadingSkeleton />;
}
