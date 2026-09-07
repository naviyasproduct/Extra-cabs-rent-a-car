import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, CircleCheck, Lock } from "lucide-react";
import { requireStaff, canWrite } from "@/lib/panel/guard";
import { vehicleBySlug } from "@/lib/fleet";
import { readData } from "@/lib/panel/store";
import { colomboDateTime } from "@/lib/panel/time";
import { updateVehicleAction } from "../../actions";

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
  const editable = canWrite(user, "fleet.update") || canWrite(user, "pricing.update");

  const history = readData()
    .audit.filter((a) => a.entity === "vehicle" && a.entityId === slug)
    .slice(-10)
    .reverse();

  const staffName = (id: string) =>
    readData().staff.find((s) => s.id === id)?.name ?? "Unknown";

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

        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" name="name" defaultValue={car.name} />
          <Field label="Seats" name="seats" type="number" defaultValue={car.specs.seats} />
          <Field label="Doors" name="doors" type="number" defaultValue={car.specs.doors} />
          <Field label="Daily rate LKR" name="daily" type="number" defaultValue={car.pricing.daily} />
          <Field label="Weekly rate LKR" name="weekly" type="number" defaultValue={car.pricing.weekly} />
          <Field label="Monthly rate LKR" name="monthly" type="number" defaultValue={car.pricing.monthly} />
          <Field label="Deposit LKR" name="deposit" type="number" defaultValue={car.pricing.deposit} />

          <label className="flex items-center gap-2.5 self-end pb-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={car.featured}
              className="size-4 accent-brand"
            />
            <span className="text-ink-soft">Show on the home page</span>
          </label>
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
