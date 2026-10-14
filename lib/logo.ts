export interface InvoiceLogo {
  id: string;
  bytes: Uint8Array;
  width: number;
  height: number;
}

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];

export function validateLogoFile(file: Pick<File, "size" | "type">) {
  if (!acceptedTypes.includes(file.type) || file.size === 0 || file.size > MAX_LOGO_BYTES) throw new Error("Invalid logo file");
}

export function inspectRasterDimensions(bytes: Uint8Array, type: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length));
  let width = 0, height = 0;
  if (type === "image/png" && bytes.length >= 24 && bytes[0] === 137 && ascii(1, 3) === "PNG" && ascii(12, 4) === "IHDR") {
    width = view.getUint32(16); height = view.getUint32(20);
  } else if (type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 255) throw new Error("Invalid JPEG marker");
      while (bytes[offset] === 255) offset += 1;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) throw new Error("Invalid JPEG segment");
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 7) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
      }
      offset += length;
    }
  } else if (type === "image/webp" && bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const format = ascii(12, 4);
    if (format === "VP8X") {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (format === "VP8 " && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) {
      width = view.getUint16(26, true) & 16383; height = view.getUint16(28, true) & 16383;
    } else if (format === "VP8L" && bytes[20] === 47) {
      width = 1 + bytes[21] + ((bytes[22] & 63) << 8);
      height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10);
    }
  }
  if (width < 1 || height < 1 || width * height > 20_000_000) throw new Error("Invalid or oversized image dimensions");
  return { width, height };
}

// Decode and re-encode on a canvas so malformed files are rejected, metadata
// is removed, and WebP never needs a PDF decoder. All processing stays local.
export async function prepareLogo(file: File): Promise<InvoiceLogo> {
  validateLogoFile(file);
  inspectRasterDimensions(new Uint8Array(await file.arrayBuffer()), file.type);
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < 1 || bitmap.height < 1 || bitmap.width * bitmap.height > 20_000_000) throw new Error("Invalid logo dimensions");
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image conversion unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((output) => output ? resolve(output) : reject(new Error("Image conversion failed")), "image/png"));
    if (blob.size > MAX_LOGO_BYTES) throw new Error("Converted logo too large");
    return { id: crypto.randomUUID(), bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
  } finally { bitmap.close(); }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("itm-assets", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("logos", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Local asset storage blocked"));
  });
}

async function logoTransaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction("logos", mode);
      const request = run(transaction.objectStore("logos"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

export async function saveLogo(logo: InvoiceLogo) {
  await logoTransaction("readwrite", (store) => store.put(logo));
}

export async function loadLogo(id: string): Promise<InvoiceLogo | undefined> {
  const value: unknown = await logoTransaction("readonly", (store) => store.get(id));
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") throw new Error("Invalid saved logo");
  const logo = value as InvoiceLogo;
  if (logo.id !== id || !(logo.bytes instanceof Uint8Array) || logo.bytes.length === 0 || logo.bytes.length > MAX_LOGO_BYTES || !Number.isInteger(logo.width) || !Number.isInteger(logo.height) || logo.width < 1 || logo.height < 1 || logo.width > 1200 || logo.height > 1200) throw new Error("Invalid saved logo");
  return logo;
}

export async function deleteLogo(id: string) {
  await logoTransaction("readwrite", (store) => store.delete(id));
}
