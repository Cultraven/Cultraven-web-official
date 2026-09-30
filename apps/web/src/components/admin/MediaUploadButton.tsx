"use client";
import React, { useRef, useState } from "react";

/** Uploads a file through the authenticated /api/upload route and reports the stored URL. */
export function MediaUploadButton({
  kind = "image",
  hasValue,
  onUploaded,
  onError,
}: {
  kind?: "image" | "video";
  hasValue?: boolean;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) onError(data.error || "Upload failed");
      else if (kind === "image" && data.kind === "video") onError("A video was uploaded where an image is expected");
      else if (kind === "video" && data.kind !== "video") onError("An image was uploaded where a video is expected");
      else onUploaded(data.url);
    } catch {
      onError("Network error during upload");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif,image/gif"}
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        style={{ padding: "6px 12px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.8)", fontWeight: 600, fontSize: "0.72rem", border: "none", borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {busy ? "Uploading…" : hasValue ? "Replace" : "Upload"}
      </button>
    </>
  );
}
