"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/utils";

export type UploadedLogo = {
  url: string;
  fileName: string;
  transform?: {
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
  };
};

export function LogoUploader({
  logo,
  logoFee,
  turnstileToken,
  onChange
}: {
  logo: UploadedLogo | null;
  logoFee: number;
  turnstileToken?: string;
  onChange: (logo: UploadedLogo | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadLogo(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const body = new FormData();
    body.set("file", file);
    body.set("purpose", "treat-designer-logos");
    body.set("turnstileToken", turnstileToken ?? "");
    setIsUploading(true);

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Logo upload failed.");
      }

      onChange({ url: payload.url, fileName: file.name });
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-3xl text-foreground">Custom Edible Logo or Image</h3>
        <p className="text-sm text-muted-foreground">
          Upload your logo, image, or artwork to preview your personalized treat
          {logoFee > 0 ? ` (+${formatCurrency(logoFee)})` : ""}.
        </p>
      </div>
      <div className="grid gap-4 rounded-[1.75rem] border border-bakery-gold/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(255,248,244,0.82))] p-4 shadow-sm sm:grid-cols-[auto_1fr] sm:items-center">
        <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-bakery-rose/20 bg-bakery-rose px-5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-bakery-rose/90 sm:w-auto">
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Artwork"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => void uploadLogo(event.target.files?.[0] ?? null)}
          />
        </label>
        {logo ? (
          <div className="flex min-w-0 items-center gap-4 rounded-[1.35rem] border border-white/80 bg-white/80 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo.url} alt={`Uploaded artwork: ${logo.fileName}`} className="h-20 w-20 shrink-0 rounded-2xl border border-bakery-gold/20 bg-white object-contain p-2 shadow-sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bakery-gold">Uploaded artwork</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{logo.fileName}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-bakery-rose/30 hover:text-bakery-rose"
                onClick={() => onChange(null)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-dashed border-bakery-gold/30 bg-white/60 p-4 text-sm text-muted-foreground">
            <ImagePlus className="h-5 w-5 text-bakery-gold" />
            <span>{isUploading ? "Preparing your preview..." : "No artwork selected yet"}</span>
          </div>
        )}
      </div>
    </section>
  );
}
