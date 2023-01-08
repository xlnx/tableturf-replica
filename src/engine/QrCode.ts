import { QRCodeToDataURLOptions } from "qrcode";

export async function renderQrCode(
  url: string,
  options?: QRCodeToDataURLOptions
): Promise<string> {
  const qrcode = await import("qrcode");
  return await qrcode.toDataURL(url, options);
}
