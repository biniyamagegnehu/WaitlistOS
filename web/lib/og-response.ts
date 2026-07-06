import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { OG_CACHE_HEADERS, OG_SIZE } from "@/lib/og";

type OgImageOptions = {
  fonts?: Array<{
    name: string;
    data: ArrayBuffer;
    weight: 400 | 600 | 700;
    style: "normal" | "italic";
  }>;
};

async function createOgImageResponse(
  element: ReactElement,
  options?: OgImageOptions
): Promise<Response> {
  return new ImageResponse(element, {
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    ...(options?.fonts?.length ? { fonts: options.fonts } : {}),
  });
}

export async function materializeOgImage(
  element: ReactElement,
  options?: OgImageOptions
): Promise<Response> {
  const imageResponse = await createOgImageResponse(element, options);
  const buffer = await imageResponse.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error("OG image generation returned an empty body");
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      ...OG_CACHE_HEADERS,
    },
  });
}
