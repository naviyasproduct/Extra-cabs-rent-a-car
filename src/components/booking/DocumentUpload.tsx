"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, FileText, Loader2, Upload, X } from "lucide-react";
import {
  bookingDocumentTicketAction,
  confirmBookingDocumentAction,
} from "@/app/panel/actions";
import { cn } from "@/lib/utils";
import type { DocumentSlot, UploadedDocument } from "@/types";

/**
 * One document slot: pick a file, it uploads immediately, and what comes back
 * is an id the booking carries.
 *
 * Uploading on pick rather than on submit is deliberate. These are phone
 * photographs over a Sri Lankan mobile connection, and holding four of them to
 * send in one request at the end means a long silent wait and one failure that
 * loses all four. This way each is its own small transfer with its own error.
 *
 * The preview is a local object URL, not a fetch of what was stored: the
 * customer is checking they picked the right side of the card, and the stored
 * copy is not readable without a staff session anyway.
 *
 * **The file goes straight to storage, not through this site.** A Vercel
 * function accepts 4.5MB of request body, and a phone photograph of an NIC is
 * routinely more than that, so the old route failed for real customers on real
 * phones. The server signs a one-off upload URL, the browser uploads to it,
 * and the server then checks the bytes that landed.
 */
export function DocumentUpload({
  slot,
  label,
  hint,
  accept,
  value,
  onChange,
}: {
  slot: DocumentSlot;
  label: string;
  hint: string;
  accept: string;
  value: UploadedDocument | undefined;
  onChange: (slot: DocumentSlot, document: UploadedDocument | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);

  // An object URL is a live handle into the browser's memory. Without this it
  // leaks on every replaced file and on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPercent(0);

    try {
      const ticket = await bookingDocumentTicketAction(slot);
      if (!ticket.ok) {
        setError(ticket.error);
        onChange(slot, undefined);
        return;
      }

      // XMLHttpRequest, not fetch: these are big files on mobile data and
      // fetch cannot report upload progress. A silent wait reads as broken.
      const status = await new Promise<number>((resolve) => {
        const request = new XMLHttpRequest();
        request.open("PUT", ticket.url);
        request.setRequestHeader("content-type", file.type || "application/octet-stream");
        request.setRequestHeader("x-upsert", "false");
        request.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setPercent(Math.round((event.loaded / event.total) * 100));
          }
        });
        request.addEventListener("load", () => resolve(request.status));
        request.addEventListener("error", () => resolve(0));
        request.send(file);
      });

      if (status < 200 || status >= 300) {
        setError("That did not upload. Check your connection and try again.");
        onChange(slot, undefined);
        return;
      }

      const result = await confirmBookingDocumentAction({
        id: ticket.id,
        slot,
        fileName: file.name,
      });
      if (result.ok) {
        setPreview((current) => {
          if (current) URL.revokeObjectURL(current);
          return file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        });
        onChange(slot, result.document);
      } else {
        setError(result.error);
        onChange(slot, undefined);
      }
    } catch {
      setError("That did not upload. Check your connection and try again.");
      onChange(slot, undefined);
    } finally {
      setBusy(false);
      // Clear the input so picking the SAME file again still fires a change.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setError(null);
    onChange(slot, undefined);
  }

  const inputId = `upload-${slot}`;

  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between gap-2 font-display text-[0.9375rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
        <span>{label}</span>
        <span className="font-sans text-sm normal-case tracking-normal text-brand-bright">
          Required
        </span>
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0])}
        disabled={busy}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-(--radius-inner) bg-field p-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-(--radius-chip) bg-charcoal">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- a blob:
              // URL from the customer's own device. next/image cannot optimise
              // one and would only add a round trip.
              <img src={preview} alt="" className="size-full object-cover" />
            ) : (
              <FileText className="size-5 text-brand-bright" aria-hidden />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <CircleCheck className="size-4 shrink-0 text-brand-bright" aria-hidden />
              Uploaded
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted">
              {value.fileName} · {(value.size / 1024).toFixed(0)}KB
            </span>
          </span>

          <span className="flex shrink-0 gap-1">
            <label
              htmlFor={inputId}
              className="grid size-9 cursor-pointer place-items-center rounded-full bg-field-hover text-ink-soft transition-colors hover:text-ink"
              title={`Replace ${label}`}
            >
              <Upload className="size-4" aria-hidden />
              <span className="sr-only">Replace {label}</span>
            </label>
            <button
              type="button"
              onClick={clear}
              className="grid size-9 place-items-center rounded-full bg-field-hover text-ink-soft transition-colors hover:text-ink"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Remove {label}</span>
            </button>
          </span>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-(--radius-inner) bg-field p-4 transition-colors duration-200 hover:bg-field-hover",
            busy && "pointer-events-none opacity-70",
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white">
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-4" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">
              {busy ? `Uploading ${percent}%` : "Choose a photo"}
            </span>
            <span className="mt-0.5 block text-sm text-muted">{hint}</span>
          </span>
        </label>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-brand-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}
