import type { Entry } from "@/db/schema";
import { apiUrl } from "@/lib/api";

export function getEntryPhotoUrl(
  entry: Pick<Entry, "photoUri" | "photoId">
): string | null {
  const path = entry.photoUri ?? (entry.photoId ? `/api/photos/${entry.photoId}` : null);
  return path ? apiUrl(path) : null;
}
