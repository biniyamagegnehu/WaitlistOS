import { api } from "@/lib/axios";
import type {
  WaitlistCopy,
  WaitlistCopyVersion,
  CopySection,
  CopyFeature,
  CopyFaq,
} from "@/types/copywriter";

/**
 * Generate a full set of marketing copy for the waitlist.
 */
export async function generateCopy(waitlistId: string): Promise<WaitlistCopy> {
  const response = await api.post<WaitlistCopy>(
    `/ai/copywriter/${waitlistId}/generate`
  );
  return response.data;
}

/**
 * Get the current saved copy for a waitlist.
 * Returns null if no copy has been generated yet.
 */
export async function getCopy(
  waitlistId: string
): Promise<WaitlistCopy | null> {
  const response = await api.get<WaitlistCopy | null>(
    `/ai/copywriter/${waitlistId}`
  );
  return response.data;
}

/**
 * Save founder edits to the copy.
 */
export async function updateCopy(
  waitlistId: string,
  data: {
    headline?: string;
    subheadline?: string;
    cta?: string;
    features?: CopyFeature[];
    faqs?: CopyFaq[];
  }
): Promise<WaitlistCopy> {
  const response = await api.patch<WaitlistCopy>(
    `/ai/copywriter/${waitlistId}`,
    data
  );
  return response.data;
}

/**
 * Regenerate a single section of the copy.
 */
export async function regenerateSection(
  waitlistId: string,
  section: CopySection
): Promise<WaitlistCopy> {
  const response = await api.post<WaitlistCopy>(
    `/ai/copywriter/${waitlistId}/regenerate`,
    { section }
  );
  return response.data;
}

/**
 * Get the version history for a waitlist's copy.
 */
export async function getVersionHistory(
  waitlistId: string
): Promise<WaitlistCopyVersion[]> {
  const response = await api.get<WaitlistCopyVersion[]>(
    `/ai/copywriter/${waitlistId}/versions`
  );
  return response.data;
}

/**
 * Restore a previous copy version as the current live copy.
 */
export async function restoreVersion(
  waitlistId: string,
  versionId: string
): Promise<WaitlistCopy> {
  const response = await api.post<WaitlistCopy>(
    `/ai/copywriter/${waitlistId}/versions/${versionId}/restore`
  );
  return response.data;
}
