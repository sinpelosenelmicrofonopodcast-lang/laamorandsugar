import { randomUUID } from "crypto";

import { SECURITY } from "@/lib/security/config";

const signatures = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]]
} as const;

export function sanitizeFileName(value: string) {
  const fallback = "upload";
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return cleaned || fallback;
}

export function getFileExtension(value: string) {
  const match = value.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

export function validateImageUpload(file: File) {
  const type = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  if (!SECURITY.allowedUploadMimeTypes.includes(type as never)) {
    return { valid: false, error: "Only JPG, PNG, and WebP uploads are supported." };
  }

  if (!SECURITY.allowedUploadExtensions.includes(extension as never)) {
    return { valid: false, error: "File extension must be .jpg, .jpeg, .png, or .webp." };
  }

  if (file.size <= 0 || file.size > SECURITY.maxUploadBytes) {
    return { valid: false, error: "Image is too large. Please upload an image smaller than 4 MB." };
  }

  return { valid: true, error: null };
}

export function detectImageMime(buffer: Buffer) {
  const bytes = [...buffer.subarray(0, 16)];

  if (matches(bytes, signatures["image/png"][0])) {
    return "image/png";
  }

  if (matches(bytes, signatures["image/jpeg"][0])) {
    return "image/jpeg";
  }

  if (
    matches(bytes, signatures["image/webp"][0]) &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function buildUploadPath(input: { purpose: string; fileName: string }) {
  const safePurpose = input.purpose.replace(/[^a-z0-9/_-]/gi, "-").slice(0, 80) || "uploads";
  const safeName = sanitizeFileName(input.fileName);

  return `${safePurpose}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
}

function matches(bytes: number[], signature: readonly number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}
