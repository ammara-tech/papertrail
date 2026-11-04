/*
  Receipt photos, made small before they're saved. A phone photo is often 3–5 MB, but a
  Firestore document can only hold 1 MB, and smaller is quicker on mobile data. So the photo
  is redrawn at most 1400 pixels on its longest side as a JPEG, getting more compressed until
  it's under MAX_RECEIPT_CHARS. A receipt is still easy to read at that size.
*/

export const MAX_RECEIPT_CHARS = 700_000; // about 500 KB, with room to spare under the 1 MB limit

/** How big to draw a photo so its longest side is at most `max` pixels (never made bigger) */
export function fitWithin(width: number, height: number, max = 1400) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Turns a photo the person picked into a small JPEG data: URL, or null if it can't be read */
export async function shrinkReceipt(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  let max = 1400;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff"; // see-through PNGs get a white background, like paper
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const url = canvas.toDataURL("image/jpeg", attempt < 3 ? 0.7 - attempt * 0.1 : 0.5);
    if (url.length <= MAX_RECEIPT_CHARS) return url;
    if (attempt >= 2) max = Math.round(max * 0.8); // still too big: make it smaller as well
  }
  return null;
}
