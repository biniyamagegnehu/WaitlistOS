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

export function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(INTER_REGULAR).then((response) => response.arrayBuffer()),
      fetch(INTER_SEMIBOLD).then((response) => response.arrayBuffer()),
      fetch(INTER_BOLD).then((response) => response.arrayBuffer()),
    ]).then(([regular, semibold, bold]) => [
      {
        name: "Inter",
        data: regular,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: semibold,
        weight: 600,
        style: "normal",
      },
      {
        name: "Inter",
        data: bold,
        weight: 700,
        style: "normal",
      },
    ]);
  }

  return fontsPromise;
}
