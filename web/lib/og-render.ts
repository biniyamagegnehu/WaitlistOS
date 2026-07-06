import type { ReferralOgData } from "@/types/referral-og";

const MAX_LOGO_BYTES = 120_000;

function optimizeLogoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "res.cloudinary.com" &&
      url.includes("/upload/")
    ) {
      return url.replace(
        "/upload/",
        "/upload/w_128,h_128,c_fill,f_png,q_auto/"
      );
    }
  } catch {
    // Ignore invalid URLs and fetch the original value.
  }

  return url;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  if (typeof btoa === "function") {
    return btoa(binary);
  }

  return Buffer.from(bytes).toString("base64");
}

async function fetchLogoAsDataUri(url: string): Promise<string | null> {
  try {
    const optimizedUrl = optimizeLogoUrl(url);
    const response = await fetch(optimizedUrl, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_LOGO_BYTES) {
      return null;
    }

    const base64 = arrayBufferToBase64(buffer);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function prepareReferralOgDataForImage(
  data: ReferralOgData
): Promise<ReferralOgData> {
  if (!data.branding?.logoUrl) {
    return data;
  }

  const embeddedLogo = await fetchLogoAsDataUri(data.branding.logoUrl);

  return {
    ...data,
    branding: {
      ...data.branding,
      logoUrl: embeddedLogo ?? null,
    },
  };
}
