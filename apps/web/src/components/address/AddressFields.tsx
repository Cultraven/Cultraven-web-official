"use client";
/**
 * The address fields + "Use my current location" button, driven by useAddressDraft. Used by /checkout and /account/addresses.
 * Ids are `${idPrefix}-name|phone|pin|city|state|type|l1|l2` (checkout uses prefix "co", the address book "ad").
 */
import React from "react";
import { INDIA_STATES, normalizeMobile } from "@/lib/address-validation";
import type { AddressForm, AddressLabel } from "./useAddressDraft";
import "./address-form.css";

interface Props { f: AddressForm; idPrefix: string; showType?: boolean; disabled?: boolean }

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

export function AddressFields({ f, idPrefix: p, showType = true, disabled = false }: Props) {
  const { draft: d, errors: e, mismatch, softConflict, pin, loc, geo } = f;
  const stateErr = e.state || mismatch?.message || "";
  const pinInvalid = !!e.pincode || !!mismatch;

  const locBusy = f.busy;
  const geoOff = geo !== "ok";
  const locLabel = loc.status === "asking" ? "Waiting for permission…" : loc.status === "locating" ? "Finding your address…" : "Use my current location";

  const err = (id: string, msg: string) => (msg ? <em className="af-err" id={`${id}-err`} role="alert">{msg}</em> : null);

  return (
    <div className="af">
      <div className="af-loc">
        <button
          type="button"
          className={`cv-btn cv-btn-outline af-loc-btn ${locBusy ? "is-busy" : ""}`}
          onClick={f.locate}
          disabled={disabled || locBusy || geoOff}
          aria-describedby={`${p}-loc-msg`}
        >
          {locBusy ? <span className="af-spin" aria-hidden="true" /> : <PinIcon />}
          {locLabel}
        </button>
        <div id={`${p}-loc-msg`} aria-live="polite">
          {geoOff && loc.status === "idle" ? (
            <p className="af-note">
              {geo === "insecure" ? "Location works only on secure (https) pages — please type your address below."
                : geo === "blocked" ? "Location is switched off on this site — please type your address below."
                : "This browser can't share your location — please type your address below."}
            </p>
          ) : null}
          {loc.status === "asking" ? <p className="af-note" role="status">Please allow location access in your browser…</p> : null}
          {loc.status === "locating" ? <p className="af-note" role="status">Locating you and looking up the address…</p> : null}
          {loc.status === "ok" ? (
            <p className="af-note ok" role="status">
              {loc.message}
              {loc.detail ? <small>{loc.detail}</small> : null}
              <small>Location data © OpenStreetMap contributors. Your coordinates are not stored.</small>
            </p>
          ) : null}
          {loc.status === "error" ? <p className="af-note err" role="alert">{loc.message}</p> : null}
        </div>
      </div>

      <div className="af-grid">
        <div className="af-f">
          <label htmlFor={`${p}-name`}>Full name</label>
          <input id={`${p}-name`} ref={f.reg("name")} autoComplete="name" maxLength={60} value={d.name} disabled={disabled}
            onChange={(ev) => f.setField("name", ev.target.value)} onBlur={() => f.blurField("name")}
            aria-invalid={!!e.name} aria-required="true" aria-describedby={e.name ? `${p}-name-err` : undefined} />
          {err(`${p}-name`, e.name ?? "")}
        </div>

        <div className="af-f">
          <label htmlFor={`${p}-phone`}>Mobile number</label>
          <input id={`${p}-phone`} ref={f.reg("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" maxLength={10} value={d.phone} disabled={disabled}
            onChange={(ev) => f.setField("phone", ev.target.value.replace(/\D/g, "").slice(0, 10))}
            onPaste={(ev) => { const t = ev.clipboardData.getData("text"); if (t) { ev.preventDefault(); f.setField("phone", normalizeMobile(t).replace(/\D/g, "").slice(0, 10)); } }}
            onBlur={() => f.blurField("phone")}
            aria-invalid={!!e.phone} aria-required="true" aria-describedby={e.phone ? `${p}-phone-err` : undefined} />
          {err(`${p}-phone`, e.phone ?? "")}
        </div>

        <div className="af-f">
          <label htmlFor={`${p}-pin`}>Pincode</label>
          <input id={`${p}-pin`} ref={f.reg("pincode")} inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" maxLength={6} value={d.pincode} disabled={disabled}
            onChange={(ev) => f.setField("pincode", ev.target.value)} onBlur={() => f.blurField("pincode")}
            aria-invalid={pinInvalid} aria-required="true" aria-describedby={e.pincode ? `${p}-pin-err` : undefined} />
          {err(`${p}-pin`, e.pincode ?? "")}
          {!e.pincode && pin.status === "looking" ? <small className="af-hint">Checking pincode…</small> : null}
          {!e.pincode && pin.status === "found" && pin.place ? <small className="af-hint ok">✓ {pin.place}</small> : null}
          {!e.pincode && pin.status === "notfound" ? <small className="af-hint warn">We couldn&apos;t find this pincode in the India Post directory — please double-check the digits.</small> : null}
        </div>

        <div className="af-f">
          <label htmlFor={`${p}-city`}>City / District</label>
          <input id={`${p}-city`} ref={f.reg("city")} autoComplete="address-level2" maxLength={60} value={d.city} disabled={disabled}
            onChange={(ev) => f.setField("city", ev.target.value)} onBlur={() => f.blurField("city")}
            aria-invalid={!!e.city} aria-required="true" aria-describedby={e.city ? `${p}-city-err` : undefined} />
          {err(`${p}-city`, e.city ?? "")}
        </div>

        <div className={`af-f ${showType ? "" : "full"}`}>
          <label htmlFor={`${p}-state`}>State</label>
          <select id={`${p}-state`} ref={f.reg("state")} autoComplete="address-level1" value={d.state} disabled={disabled}
            onChange={(ev) => f.setField("state", ev.target.value)} onBlur={() => f.blurField("state")}
            aria-invalid={!!stateErr} aria-required="true" aria-describedby={stateErr ? `${p}-state-err` : undefined}>
            <option value="">Select state</option>
            {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {stateErr ? (
            <em className="af-err" id={`${p}-state-err`} role="alert">
              {stateErr}
              {mismatch?.fix ? <button type="button" className="af-fix" onClick={() => f.applyState(mismatch.fix!)}>Use {mismatch.fix}</button> : null}
            </em>
          ) : null}
          {!stateErr && softConflict ? (
            <em className="af-hint warn" role="status" style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 0.6rem", alignItems: "center" }}>
              {softConflict.message}
              <button type="button" className="af-fix" onClick={() => f.applyState(softConflict.state)}>Use {softConflict.state}</button>
            </em>
          ) : null}
        </div>

        {showType ? (
          <div className="af-f">
            <label htmlFor={`${p}-type`}>Address type</label>
            <select id={`${p}-type`} value={d.label} disabled={disabled} onChange={(ev) => f.setField("label", ev.target.value as AddressLabel)}>
              <option>Home</option><option>Work</option><option>Other</option>
            </select>
          </div>
        ) : null}

        <div className="af-f full">
          <label htmlFor={`${p}-l1`}>House no., building, street</label>
          <input id={`${p}-l1`} ref={f.reg("line1")} autoComplete="address-line1" maxLength={150} value={d.line1} disabled={disabled}
            onChange={(ev) => f.setField("line1", ev.target.value)} onBlur={() => f.blurField("line1")}
            aria-invalid={!!e.line1} aria-required="true" aria-describedby={e.line1 ? `${p}-l1-err` : undefined} />
          {err(`${p}-l1`, e.line1 ?? "")}
        </div>

        <div className="af-f full">
          <label htmlFor={`${p}-l2`}>Landmark / area <small>(optional)</small></label>
          <input id={`${p}-l2`} ref={f.reg("line2")} autoComplete="address-line2" maxLength={100} placeholder="e.g. Near City Mall" value={d.line2} disabled={disabled}
            onChange={(ev) => f.setField("line2", ev.target.value)} onBlur={() => f.blurField("line2")}
            aria-invalid={!!e.line2} aria-describedby={e.line2 ? `${p}-l2-err` : undefined} />
          {err(`${p}-l2`, e.line2 ?? "")}
        </div>
      </div>
    </div>
  );
}
