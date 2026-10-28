"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui";
import { friendlyUploadError, precheckFile, shrinkImage } from "@/lib/upload-client";

/**
 * Uploads a file through the authenticated /api/upload route and reports the stored URL.
 * Plain-language messages: what happened, and what to do next (a new photo only goes live after "Save changes").
 */
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
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!note?.ok) return;
    const t = window.setTimeout(() => setNote(null), 12000);
    return () => window.clearTimeout(t);
  }, [note]);

  const fail = (text: string) => { setNote({ ok: false, text }); onError(text); };

  const upload = async (picked: File) => {
    setNote(null);
    const pre = precheckFile(picked, kind);
    if (!pre.ok) { fail(pre.message); if (ref.current) ref.current.value = ""; return; }
    setBusy(true);
    try {
      const file = pre.shrink ? await shrinkImage(picked) : picked;
      const fd = new FormData();
      fd.append("file", file);
      let res: Response;
      try { res = await fetch("/api/upload", { method: "POST", body: fd }); } catch { fail(friendlyUploadError(0)); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) fail(friendlyUploadError(res.status, data.error));
      else if (kind === "image" && data.kind === "video") fail("That is a video. Choose a photo here.");
      else if (kind === "video" && data.kind !== "video") fail("That is a photo. Choose a video here.");
      else {
        onUploaded(data.url);
        setNote({ ok: true, text: pre.shrink ? "Uploaded (the photo was made smaller to fit). Now press “Save changes” to show it on the website." : "Uploaded. Now press “Save changes” to show it on the website." });
      }
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
      <Button size="sm" icon={busy ? undefined : "upload"} loading={busy} onClick={() => ref.current?.click()}>
        {busy ? "Uploading…" : hasValue ? "Replace" : "Upload"}
      </Button>
      {note ? <span role={note.ok ? "status" : "alert"} className="adm-hint" style={{ color: note.ok ? "var(--a-success)" : "var(--a-danger)", fontWeight: 600, flexBasis: "100%" }}>{note.text}</span> : null}
    </>
  );
}
