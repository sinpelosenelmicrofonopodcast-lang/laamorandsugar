"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

import type { MediaAssetRow } from "@/lib/types/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

export function MediaLibrary({ assets }: { assets: MediaAssetRow[] }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(`"${file.name}" is too large. Please use an image smaller than 4 MB.`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "admin");

    setUploading(true);
    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData
      });
      const json = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Upload failed");
      }

      toast.success("Media uploaded");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Media library</CardTitle>
          <Button type="button" variant="gold" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload image"}
          </Button>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void upload(file);
              }
            }}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded-[1.5rem] border border-border bg-white/70">
                <div className="relative aspect-[1/0.9]">
                  <Image
                    src={asset.public_url ?? "/products/placeholder-elegance.svg"}
                    alt={asset.file_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1 p-4">
                  <p className="truncate font-medium text-foreground">{asset.file_name}</p>
                  <p className="text-xs text-muted-foreground">{asset.storage_path}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
