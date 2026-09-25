"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { cloudinaryPosterUrl, cloudinaryUrl, type MediaKind } from "@/lib/cloudinary";
import { attachVehicleMediaAction, uploadTicketAction } from "@/app/panel/actions";

/**
 * Picks files and sends them **straight to Cloudinary**, never through this
 * site's server.
 *
 * A Vercel function may receive 4.5MB of request body and refuses anything
 * larger, so the old path (file to a server action, server action to
 * Cloudinary) could not carry an ordinary phone photograph in production, let
 * alone a video. The browser gets a short-lived signed ticket instead and
 * uploads on its own. See lib/panel/vehicle-media.ts.
 *
 * Two modes, because there are two moments staff add pictures:
 *
 *   "attach"   the vehicle exists. Each file is recorded on it as it lands,
 *              so closing the tab half way through loses nothing.
 *   "collect"  the add form, where there is no vehicle yet. Uploads are held
 *              in hidden fields and saved with the rest of the form. Files
 *              from a form nobody submits are cleaned up by the orphan sweep.
 */

interface Uploaded {
  publicId: string;
  version: string;
  signature: string;
}

interface Job {
  id: number;
  name: string;
  percent: number;
  error?: string;
}

export function MediaUploader({
  slug,
  kind,
  remaining,
  mode,
  fieldName,
}: {
  /** Null on the add form: the vehicle has no slug until it is saved. */
  slug: string | null;
  kind: MediaKind;
  /** How many more files may be added. At zero the picker is not rendered. */
  remaining: number;
  mode: "attach" | "collect";
  /** Hidden field name in collect mode. Ignored in attach mode. */
  fieldName?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const nextJobId = useRef(0);
  const [collected, setCollected] = useState<Uploaded[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);

  const noun = kind === "video" ? "video" : "photo";
  const left = remaining - (mode === "collect" ? collected.length : 0);

  function update(id: number, patch: Partial<Job>) {
    setJobs((all) => all.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  /**
   * One file, one request, with real progress.
   *
   * XMLHttpRequest rather than fetch: a 60MB video over a Sri Lankan mobile
   * connection takes long enough that a spinner with no number reads as
   * broken, and fetch cannot report upload progress.
   */
  function send(file: File, ticket: Awaited<ReturnType<typeof uploadTicketAction>>, jobId: number) {
    return new Promise<Uploaded | null>((resolve) => {
      if (!ticket || "error" in ticket) {
        update(jobId, { error: ticket?.error ?? "Uploads are not configured." });
        resolve(null);
        return;
      }

      const body = new FormData();
      body.set("file", file);
      body.set("api_key", ticket.apiKey);
      body.set("signature", ticket.signature);
      // Exactly the parameters that were signed, nothing added or left out.
      for (const [key, value] of Object.entries(ticket.params)) {
        body.set(key, value);
      }

      const request = new XMLHttpRequest();
      request.open("POST", ticket.endpoint);
      request.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          update(jobId, { percent: Math.round((event.loaded / event.total) * 100) });
        }
      });
      request.addEventListener("load", () => {
        let payload: {
          public_id?: string;
          version?: number;
          signature?: string;
          error?: { message?: string };
        } = {};
        try {
          payload = JSON.parse(request.responseText) as typeof payload;
        } catch {
          update(jobId, { error: `Cloudinary replied with HTTP ${request.status}.` });
          resolve(null);
          return;
        }
        if (!payload.public_id || !payload.version || !payload.signature) {
          update(jobId, { error: payload.error?.message ?? "That upload did not go through." });
          resolve(null);
          return;
        }
        resolve({
          publicId: payload.public_id,
          version: String(payload.version),
          signature: payload.signature,
        });
      });
      request.addEventListener("error", () => {
        update(jobId, { error: "The connection dropped. Try again." });
        resolve(null);
      });
      request.send(body);
    });
  }

  async function handle(files: FileList) {
    setBusy(true);
    // Sliced rather than refused: picking six photographs when five fit
    // should keep five, not throw the whole selection away.
    const chosen = [...files].slice(0, Math.max(left, 0));

    for (const file of chosen) {
      const jobId = nextJobId.current++;
      setJobs((all) => [...all, { id: jobId, name: file.name, percent: 0 }]);

      const ticket = await uploadTicketAction(slug, kind);
      if (!ticket || "error" in ticket) {
        update(jobId, { error: ticket?.error ?? "Uploads are not configured." });
        continue;
      }
      if (file.size > ticket.maxBytes) {
        const limit = Math.round(ticket.maxBytes / 1024 / 1024);
        update(jobId, {
          error: `That ${noun} is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${limit}MB.`,
        });
        continue;
      }

      const uploaded = await send(file, ticket, jobId);
      if (!uploaded) continue;

      if (mode === "collect") {
        setCollected((all) => [...all, uploaded]);
        setJobs((all) => all.filter((job) => job.id !== jobId));
      } else {
        const result = await attachVehicleMediaAction({
          slug: slug ?? "",
          kind,
          ...uploaded,
        });
        if (result?.error) {
          update(jobId, { error: result.error });
        } else {
          setJobs((all) => all.filter((job) => job.id !== jobId));
          router.refresh();
        }
      }
    }

    setBusy(false);
    // Cleared, or picking the same file again fires no change event and the
    // retry looks broken.
    if (input.current) input.current.value = "";
  }

  return (
    <div className="mt-4">
      {mode === "collect" && collected.length > 0 ? (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {collected.map((item) => (
            <li key={item.publicId} className="relative">
              <input type="hidden" name={fieldName} value={JSON.stringify(item)} />
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary
                  delivers the resize; next/image here would add a second
                  optimiser in front of a URL that is already exactly the
                  right size. */}
              <img
                src={
                  kind === "video"
                    ? cloudinaryPosterUrl(item.publicId, { width: 320 })
                    : cloudinaryUrl(item.publicId, { width: 320 })
                }
                alt=""
                className="aspect-[4/3] w-full bg-charcoal object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setCollected((all) => all.filter((entry) => entry.publicId !== item.publicId))
                }
                aria-label={`Remove this ${noun}`}
                className="absolute right-1 top-1 rounded-full bg-charcoal/90 p-1.5 text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {jobs.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-2">
          {jobs.map((job) => (
            <li key={job.id} className="bg-field px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-ink-soft">{job.name}</span>
                <span className={job.error ? "text-brand-bright" : "text-muted"}>
                  {job.error ? "Failed" : `${job.percent}%`}
                </span>
              </div>
              {job.error ? (
                <p className="mt-1 text-brand-bright" role="alert">
                  {job.error}
                </p>
              ) : (
                <div className="mt-2 h-1 w-full bg-charcoal" aria-hidden>
                  <div
                    className="h-1 bg-brand transition-[width] duration-200"
                    style={{ width: `${job.percent}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {left > 0 ? (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-field px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-field-hover">
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {busy ? "Uploading" : `Choose ${kind === "video" ? "a video" : "photos"}`}
          <input
            ref={input}
            type="file"
            className="sr-only"
            accept={kind === "video" ? "video/*" : "image/*"}
            multiple={kind === "image"}
            disabled={busy}
            onChange={(event) => {
              const files = event.target.files;
              if (files && files.length > 0) void handle(files);
            }}
          />
        </label>
      ) : null}

      <p className="mt-2 text-xs text-muted">
        {kind === "video"
          ? "MP4 or MOV, up to 100MB. Keep it under a minute: a slow walk around the car, then the inside."
          : "JPG, PNG or HEIC, up to 10MB each. You can pick several at once."}
      </p>
    </div>
  );
}
