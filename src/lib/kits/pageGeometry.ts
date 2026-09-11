export type KitPageOrientation = "portrait" | "landscape";

export function kitPageGeometry(page: { orientation?: KitPageOrientation }) {
  const landscape = page.orientation === "landscape";
  return { width: landscape ? 848.5714 : 600, height: landscape ? 600 : 848.5714,
    widthMm: landscape ? 297 : 210, heightMm: landscape ? 210 : 297,
    pdfOrientation: landscape ? "landscape" as const : "portrait" as const };
}
