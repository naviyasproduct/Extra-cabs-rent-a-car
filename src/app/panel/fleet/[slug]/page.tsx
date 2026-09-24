import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, CircleCheck, Lock } from "lucide-react";
import { requireStaff, canWrite } from "@/lib/panel/guard";
import { vehicleBySlug } from "@/lib/fleet";
import { auditForEntity, listStaff } from "@/lib/panel/db";
import { colomboDateTime } from "@/lib/panel/time";
import { MAX_VEHICLE_FEATURES, MAX_VEHICLE_IMAGES, MAX_VEHICLE_VIDEOS } from "@/types";
import { CarImage } from "@/components/common/CarImage";
import { mediaUploadsConfigured } from "@/lib/panel/vehicle-media";
import { RateEditor } from "@/components/panel/RateEditor";
import { MediaUploader } from "@/components/panel/MediaUploader";
import { cloudinaryPosterUrl } from "@/lib/cloudinary";
import {
  makePhotoPrimaryAction,
  removeVehicleMediaAction,
  updateVehicleAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function PanelVehicle({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { slug } = await params;
  const { error, saved } = await searchParams;

  const user = await requireStaff();
  const vehicle = await vehicleBySlug(slug);
  if (!vehicle) notFound();

  const { car } = vehicle;
  const photosConfigured = mediaUploadsConfigured();
  const [canUpdate, canPrice, canPhotos, history, staff] = await Promise.all([
    // With the slug: a window granted for THIS vehicle must unlock it.
    canWrite(user, "fleet.update", slug),
    canWrite(user, "pricing.update", slug),
    canWrite(user, "fleet.photos", slug),
    // The ten most recent changes to this vehicle, newest first.
    auditForEntity("vehicle", slug, 10),
    listStaff(),
  ]);
  const editable = canUpdate || canPrice;

  const staffName = (id: string) =>
    id === "system" ? "Automatic" : (staff.find((s) => s.id === id)?.name ?? "Unknown");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/panel/fleet"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand-bright"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the fleet
        </Link>
        <h1 className="display-md mt-4">{car.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {car.brand} · {car.year} · {car.category} ·{" "}
          {car.available ? "listed on the website" : "hidden from the website"}
        </p>
      </div>

      {saved ? (
        <p className="flex items-center gap-2 bg-success/12 px-4 py-3 text-sm font-medium text-success">
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          Saved. The website is already showing the change.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="flex items-center gap-2 bg-brand-tint px-4 py-3 text-sm font-medium text-brand-bright">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {!editable ? (
        <p className="flex items-center gap-2 bg-field px-4 py-3 text-sm text-ink-soft">
          <Lock className="size-4 shrink-0 text-muted" aria-hidden />
          These fields are locked. Ask the owner for a code on the fleet screen.
        </p>
      ) : null}

      <form action={updateVehicleAction} className="flex flex-col gap-6">
        <input type="hidden" name="slug" value={car.slug} />

        <fieldset disabled={!editable} className="flex flex-col gap-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" name="name" defaultValue={car.name} />
            <Field label="Seats" name="seats" type="number" defaultValue={car.specs.seats} />
            <Field label="Doors" name="doors" type="number" defaultValue={car.specs.doors} />

            {/* Fuel is editable here, not frozen at creation, because the
                catalogue vehicles were shipped with "hybrid" recorded as their
                fuel and that had to be correctable without a deploy. */}
            <SelectField
              label="Fuel"
              name="fuel"
              defaultValue={car.specs.fuel}
              options={["petrol", "diesel", "electric"]}
            />


            <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
              <input
                type="checkbox"
                name="hybrid"
                defaultChecked={car.specs.hybrid}
                className="size-4 accent-brand"
              />
              <span className="text-ink-soft">Hybrid</span>
            </label>

            <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={car.featured}
                className="size-4 accent-brand"
              />
              <span className="text-ink-soft">Show on the home page</span>
            </label>
          </div>

          {/* Rates. The table here is the table on the vehicle page. */}
          <div>
            <legend className="font-display text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Rates in LKR
            </legend>
            <div className="rule mt-2 mb-4" />

            <div className="flex flex-col gap-4">
              <RateEditor
                initialDaily={car.pricing.daily}
                initialTiers={car.pricing.tiers}
              />
              <div className="grid max-w-[33rem] gap-4 sm:grid-cols-2">
                <Field
                  label="Deposit LKR"
                  name="deposit"
                  type="number"
                  defaultValue={car.pricing.deposit}
                />
                {/* LKR per km beyond 100 km a day. Clear it to show "ask us". */}
                <Field
                  label="Extra km, LKR per km"
                  name="extraKm"
                  type="number"
                  defaultValue={car.pricing.extraKm ?? ""}
                />
              </div>
            </div>
          </div>

          {/* The copy the customer reads. Editable here as well as on create,
              because a description you cannot correct is a bug, and the
              catalogue vehicles never had an edit route for theirs at all. */}
          <div>
            <legend className="font-display text-xs font-bold uppercase tracking-[0.14em] text-muted">
              What the customer reads
            </legend>
            <div className="rule mt-2 mb-4" />

            <div className="flex flex-col gap-4">
              <Field label="Tagline" name="tagline" defaultValue={car.tagline} />

              <TextArea
                label="About this vehicle"
                name="description"
                rows={4}
                defaultValue={car.description}
                hint="One paragraph. This is the About this vehicle section on the vehicle page."
              />

              <TextArea
                label="Features and equipment"
                name="features"
                rows={7}
                defaultValue={car.features.join("\n")}
                hint={`One feature per line, up to ${MAX_VEHICLE_FEATURES}. A bullet or dash at the start of a line is stripped for you.`}
              />
            </div>
          </div>
        </fieldset>

        {editable ? (
          <div>
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Save changes
            </button>
            <p className="mt-2 text-xs text-muted">
              Changing any rate needs a pricing window, which is a separate
              permission from editing the rest of the details.
            </p>
          </div>
        ) : null}
      </form>

      {/* Photographs and video. Their own permission: an employee can be
          trusted with pictures without being handed the rates. */}
      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
          Photos
        </h2>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          Up to {MAX_VEHICLE_IMAGES}. The first one is what customers see on the
          fleet grid, so put the best exterior shot first. Landscape photos in
          daylight work best. They upload straight from this device to our image
          service, so a large photo from a phone is fine.
        </p>

        {!photosConfigured ? (
          <p className="mt-4 bg-warning/12 px-4 py-3 text-sm text-warning">
            Uploads are not configured on this deployment yet.
          </p>
        ) : null}

        {car.images.length === 0 ? (
          <p className="mt-4 bg-tile p-5 text-sm text-muted">
            No photos yet. The vehicle shows a placeholder tile on the website
            until the first one is added.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {car.images.map((publicId, index) => (
              <li key={publicId} className="flex flex-col gap-2">
                <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
                  <CarImage
                    src={publicId}
                    alt={`${car.name}, photo ${index + 1}`}
                    sizes="(max-width: 640px) 100vw, 20vw"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                      Main
                    </span>
                  ) : null}
                </div>
                {canPhotos ? (
                  <div className="flex flex-wrap gap-2">
                    {index > 0 ? (
                      <form action={makePhotoPrimaryAction}>
                        <input type="hidden" name="slug" value={car.slug} />
                        <input type="hidden" name="publicId" value={publicId} />
                        <button
                          type="submit"
                          className="rounded-full bg-field px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-field-hover"
                        >
                          Make main
                        </button>
                      </form>
                    ) : null}
                    <form action={removeVehicleMediaAction}>
                      <input type="hidden" name="slug" value={car.slug} />
                      <input type="hidden" name="publicId" value={publicId} />
                      <input type="hidden" name="kind" value="image" />
                      <button
                        type="submit"
                        className="rounded-full bg-field px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-field-hover"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canPhotos && photosConfigured ? (
          <MediaUploader
            slug={car.slug}
            kind="image"
            mode="attach"
            remaining={MAX_VEHICLE_IMAGES - car.images.length}
          />
        ) : null}

        {!canPhotos ? (
          <p className="mt-4 flex items-center gap-2 bg-field px-4 py-3 text-sm text-ink-soft">
            <Lock className="size-4 shrink-0 text-muted" aria-hidden />
            Photos are locked. Ask the owner for a code with the Change photos
            permission.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
          Video
        </h2>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          Optional, up to {MAX_VEHICLE_VIDEOS}. A slow walk around the car and a
          look inside sells a vehicle better than any photograph. Customers see
          a still picture until they press play, so a video costs them nothing
          unless they want it.
        </p>

        {car.videos.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {car.videos.map((video, index) => (
              <li key={video.id} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- the
                    poster is already a Cloudinary transform at this size, so
                    next/image would put a second optimiser in front of it. */}
                <img
                  src={cloudinaryPosterUrl(video.id, { width: 320 })}
                  alt={`${car.name}, video ${index + 1}`}
                  className="aspect-[4/3] w-full bg-charcoal object-cover"
                />
                {canPhotos ? (
                  <form action={removeVehicleMediaAction}>
                    <input type="hidden" name="slug" value={car.slug} />
                    <input type="hidden" name="publicId" value={video.id} />
                    <input type="hidden" name="kind" value="video" />
                    <button
                      type="submit"
                      className="rounded-full bg-field px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-field-hover"
                    >
                      Remove
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {canPhotos && photosConfigured ? (
          <MediaUploader
            slug={car.slug}
            kind="video"
            mode="attach"
            remaining={MAX_VEHICLE_VIDEOS - car.videos.length}
          />
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted">
          History for this vehicle
        </h2>
        <ul className="mt-4 flex flex-col">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-2.5 first:border-t-0"
            >
              <span className="text-sm text-ink-soft">
                <span className="font-semibold text-ink">
                  {staffName(entry.staffId)}
                </span>{" "}
                {entry.summary}
              </span>
              <span className="text-xs tabular-nums text-muted">
                {colomboDateTime(entry.at)}
              </span>
            </li>
          ))}
          {history.length === 0 ? (
            <li className="py-3 text-sm text-muted">
              Nothing has been changed on this vehicle yet.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

/** Prose fields. Full width: a paragraph in a third of a row is unusable. */
function TextArea({
  label,
  name,
  rows,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  rows: number;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="bg-field p-3 text-sm leading-relaxed text-ink disabled:opacity-50"
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 bg-field px-3 text-sm text-ink disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-11 bg-field px-3 text-sm text-ink disabled:opacity-50"
      />
    </label>
  );
}
