import Link from "next/link";
import { CircleAlert, Eye, EyeOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import { requireStaff, canWrite } from "@/lib/panel/guard";
import { staffVehicles } from "@/lib/fleet";
import { openWindowFor, pendingRequestFor, SCOPES } from "@/lib/panel/window";
import { formatPrice } from "@/lib/utils";
import {
  createVehicleAction,
  deleteVehicleAction,
  requestWindowAction,
  setVehicleAvailabilityAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fleet" };

export default async function PanelFleet({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; show?: string }>;
}) {
  const { error, show } = await searchParams;
  const user = await requireStaff();
  const showDeleted = show === "deleted";

  const vehicles = await staffVehicles(showDeleted);
  const open = user.role === "employee" ? openWindowFor(user.id) : null;
  const pending = user.role === "employee" ? pendingRequestFor(user.id) : null;

  const canCreate = canWrite(user, "fleet.create");
  const canDelete = canWrite(user, "fleet.delete");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-md">Fleet</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-muted">
            Marking a vehicle booked takes it off the website immediately.
            Customers do not see it in the list at all until it is free again.
          </p>
        </div>
        <Link
          href={showDeleted ? "/panel/fleet" : "/panel/fleet?show=deleted"}
          className="rounded-full bg-field px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-field-hover"
        >
          {showDeleted ? "Hide removed" : "Show removed"}
        </Link>
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 bg-brand-tint px-4 py-3 text-sm font-medium text-brand-bright">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {/* Employees ask for a window here */}
      {user.role === "employee" && !open && !pending ? (
        <section className="bg-tile p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em]">
            Ask for edit access
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm text-muted">
            The owner gets a six digit code and reads it to you. It opens a 45
            minute window for the one job you picked, then locks itself.
          </p>

          <form action={requestWindowAction} className="mt-4 grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)_auto]">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">
                What do you need
              </span>
              <select
                name="scope"
                className="h-11 bg-field px-3 text-sm text-ink"
                defaultValue="fleet.update"
              >
                {SCOPES.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">
                Why
              </span>
              <input
                name="reason"
                required
                maxLength={200}
                placeholder="New Aqua joined the fleet today"
                className="h-11 bg-field px-3 text-sm text-ink placeholder:text-muted/70"
              />
            </label>

            <button
              type="submit"
              className="h-11 self-end rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Ask the owner
            </button>
          </form>
        </section>
      ) : null}

      {/* Add a vehicle */}
      {canCreate ? (
        <section className="bg-tile p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
            <Plus className="size-4 text-brand-bright" aria-hidden />
            Add a vehicle
          </h2>
          <form action={createVehicleAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Name" name="name" placeholder="Toyota Axio" required />
            <FormField label="Brand" name="brand" placeholder="Toyota" />
            <FormField label="Year" name="year" type="number" placeholder="2019" />
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">Category</span>
              <select name="category" className="h-11 bg-field px-3 text-sm" defaultValue="sedan">
                {["micro", "hatchback", "sedan", "suv", "van", "luxury", "electric"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <FormField label="Seats" name="seats" type="number" placeholder="5" />
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">Fuel</span>
              <select name="fuel" className="h-11 bg-field px-3 text-sm" defaultValue="petrol">
                {["petrol", "diesel", "hybrid", "electric"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">Transmission</span>
              <select name="transmission" className="h-11 bg-field px-3 text-sm" defaultValue="automatic">
                <option value="automatic">automatic</option>
                <option value="manual">manual</option>
              </select>
            </label>
            <FormField label="Daily rate LKR" name="daily" type="number" placeholder="9500" />
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Add to the fleet
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* The list */}
      <section className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              {["Vehicle", "Rate", "Seats", "On the website", ""].map((h) => (
                <th
                  key={h}
                  className="border-b border-line pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map(({ car, deletedAt, addedInPanel }) => (
              <tr key={car.slug} className="border-b border-line-strong/30">
                <td className="py-3 pr-4">
                  <Link
                    href={`/panel/fleet/${car.slug}`}
                    className="font-display text-base font-bold uppercase hover:text-brand-bright"
                  >
                    {car.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {car.category}
                    {addedInPanel ? " · added here" : ""}
                    {deletedAt ? " · removed" : ""}
                  </p>
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {formatPrice(car.pricing.daily)}
                </td>
                <td className="py-3 pr-4 tabular-nums">{car.specs.seats}</td>
                <td className="py-3 pr-4">
                  {deletedAt ? (
                    <span className="text-xs uppercase tracking-[0.1em] text-muted">
                      Removed
                    </span>
                  ) : car.available ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-success">
                      <Eye className="size-3.5" aria-hidden />
                      Listed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-bright">
                      <EyeOff className="size-3.5" aria-hidden />
                      Booked, hidden
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {!deletedAt ? (
                      <form action={setVehicleAvailabilityAction}>
                        <input type="hidden" name="slug" value={car.slug} />
                        <input
                          type="hidden"
                          name="available"
                          value={car.available ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-field px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-field-hover"
                        >
                          {car.available ? "Mark booked" : "Mark free"}
                        </button>
                      </form>
                    ) : null}

                    {canDelete ? (
                      <form action={deleteVehicleAction}>
                        <input type="hidden" name="slug" value={car.slug} />
                        <input
                          type="hidden"
                          name="restore"
                          value={deletedAt ? "true" : "false"}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-full bg-field px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-field-hover"
                        >
                          {deletedAt ? (
                            <>
                              <RotateCcw className="size-3.5" aria-hidden />
                              Restore
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-3.5" aria-hidden />
                              Remove
                            </>
                          )}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="h-11 bg-field px-3 text-sm text-ink placeholder:text-muted/70"
      />
    </label>
  );
}
