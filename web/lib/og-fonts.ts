type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal" | "italic";
};

const INTER_REGULAR =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_E.woff";
const INTER_SEMIBOLD =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKjAZ9hiA.woff";
const INTER_BOLD =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff";

let fontsPromise: Promise<OgFont[]> | null = null;

async function fetchFont(
  url: string,
  weight: OgFont["weight"]
): Promise<OgFont | null> {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) {
      return null;
    }

    return {
      name: "Inter",
      data: await response.arrayBuffer(),
      weight,
      style: "normal",
    };
  } catch {
    return null;
  }
}

export async function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFont(INTER_REGULAR, 400),
      fetchFont(INTER_SEMIBOLD, 600),
      fetchFont(INTER_BOLD, 700),
    ]).then((fonts) =>
      fonts.filter((font): font is OgFont => font !== null)
    );
  }

  try {
    return await fontsPromise;
  } catch {
    fontsPromise = null;
    return [];
  }
}
