export function printImagePlacement(sourceWidth: number, sourceHeight: number, width: number, height: number, fit: string, objectPosition = "50% 50%") {
  const factor = (fit === "cover" ? Math.max : Math.min)(width / sourceWidth, height / sourceHeight);
  const drawnWidth = sourceWidth * factor, drawnHeight = sourceHeight * factor;
  const position = (value: string) => value.endsWith("%") ? Number.parseFloat(value) / 100 : ["left", "top"].includes(value) ? 0 : ["right", "bottom"].includes(value) ? 1 : .5;
  const [x = "50%", y = "50%"] = objectPosition.split(" ");
  return { x: (width - drawnWidth) * position(x), y: (height - drawnHeight) * position(y), width: drawnWidth, height: drawnHeight };
}

/** html2canvas does not honor object-fit; prepare the same crop before capture. */
export async function prepareKitPrintImages(root: HTMLElement, scale: number) {
  const originals: { image: HTMLImageElement; src: string }[] = [];
  const restore = () => originals.forEach(({ image, src }) => { image.src = src; });
  try {
    for (const image of root.querySelectorAll<HTMLImageElement>("img")) {
      const style = getComputedStyle(image);
      if (!["cover", "contain"].includes(style.objectFit)) continue;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(image.clientHeight * scale));
      const context = canvas.getContext("2d");
      if (!context || !image.naturalWidth || !image.naturalHeight) throw new Error("Ilustrația nu poate fi pregătită pentru PDF.");
      const placed = printImagePlacement(image.naturalWidth, image.naturalHeight, canvas.width, canvas.height, style.objectFit, style.objectPosition);
      context.drawImage(image, placed.x, placed.y, placed.width, placed.height);
      originals.push({ image, src: image.src });
      image.src = canvas.toDataURL("image/png");
      await image.decode();
    }
    return restore;
  } catch (error) { restore(); throw error; }
}
