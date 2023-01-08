import { QRCodeToDataURLOptions } from "qrcode";

export async function renderQrCode(
  url: string,
  options?: QRCodeToDataURLOptions
): Promise<string> {
  const qrcode = await import("qrcode");
  return await qrcode.toDataURL(url, options);
}

const canvas = document.createElement("canvas");

export function measureTextWidth(text: string, font: string) {
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  const metrics = ctx.measureText(text);
  return metrics.width;
}
