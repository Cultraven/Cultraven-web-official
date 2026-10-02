"use client";
import React, { useRef, useState } from "react";
import { resizeToSquareJpeg } from "@/lib/image-crop";

interface Props {
  letter: string;
  initialUrl: string | null;
  /** Called after the stored photo changed (upload / remove) so the sidebar + header can refresh. */
  onChanged: () => void;
}

type Msg = { tone: "ok" | "bad"; text: string } | null;

/** Profile photo: pick -> browser crops/resizes to 256x256 JPEG -> preview -> save (POST /api/account/avatar) or remove (DELETE). */
export function AvatarCard({ letter, initialUrl, onChanged }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [pending, setPending] = useState<{ dataUrl: string; bytes: number } | null>(null);
  const [busy, setBusy] = useState<"" | "read" | "save" | "remove">("");
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setMsg(null);
    if (file.type && !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setMsg({ tone: "bad", text: "Please choose a JPG, PNG or WebP picture." });
      return;
    }
    setBusy("read");
    try {
      const r = await resizeToSquareJpeg(file);
      setPending({ dataUrl: r.dataUrl, bytes: r.bytes });
    } catch (err) {
      setMsg({ tone: "bad", text: err instanceof Error ? err.message : "We couldn't read that picture." });
    }
    setBusy("");
  };

  const save = async () => {
    if (!pending) return;
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch("/api/account/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: pending.dataUrl }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not save the photo.");
      setUrl(d.avatar ?? null);
      setPending(null);
      setMsg({ tone: "ok", text: "Profile photo updated." });
      onChanged();
    } catch (err) {
      setMsg({ tone: "bad", text: err instanceof Error ? err.message : "Could not save the photo." });
    }
    setBusy("");
  };

  const remove = async () => {
    setBusy("remove");
    setMsg(null);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not remove the photo.");
      setUrl(null);
      setMsg({ tone: "ok", text: "Profile photo removed." });
      onChanged();
    } catch (err) {
      setMsg({ tone: "bad", text: err instanceof Error ? err.message : "Could not remove the photo." });
    }
    setBusy("");
  };

  const shown = pending?.dataUrl ?? url;

  return (
    <section className="acct-card" aria-labelledby="pf-photo-h">
      <div className="acct-card-h"><h3 id="pf-photo-h">Profile photo</h3></div>
      <div className="acct-card-b pf-photo">
        <div className="pf-avatar" data-testid="pf-avatar" data-has-photo={shown ? "true" : "false"}>
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt={pending ? "Preview of your new profile photo" : "Your profile photo"} width={132} height={132} />
          ) : (
            <span aria-hidden="true">{letter}</span>
          )}
          {pending ? <span className="pf-avatar-tag">Preview</span> : null}
        </div>

        <div className="pf-photo-side">
          <p className="pf-hint">
            JPG, PNG or WebP. We crop it to a square and shrink it to 256 &times; 256 here in your browser, so uploads stay tiny.
          </p>
          <div className="pf-actions">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="pf-file" tabIndex={-1} aria-hidden="true" onChange={pick} data-testid="pf-file" />
            {pending ? (
              <>
                <button type="button" className="cv-btn cv-btn-lava cv-btn-sm" onClick={save} disabled={busy !== ""}>{busy === "save" ? "Saving…" : "Save photo"}</button>
                <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => { setPending(null); setMsg(null); }} disabled={busy !== ""}>Cancel</button>
              </>
            ) : (
              <>
                <button type="button" className="cv-btn cv-btn-navy cv-btn-sm" onClick={() => fileRef.current?.click()} disabled={busy !== ""}>
                  {busy === "read" ? "Preparing…" : url ? "Change photo" : "Upload photo"}
                </button>
                {url ? (
                  <button type="button" className="cv-btn cv-btn-danger cv-btn-sm" onClick={remove} disabled={busy !== ""}>{busy === "remove" ? "Removing…" : "Remove photo"}</button>
                ) : null}
              </>
            )}
          </div>
          <p className={`pf-msg ${msg ? (msg.tone === "ok" ? "is-ok" : "is-bad") : ""}`} role={msg?.tone === "bad" ? "alert" : "status"}>{msg?.text ?? ""}</p>
        </div>
      </div>
    </section>
  );
}
