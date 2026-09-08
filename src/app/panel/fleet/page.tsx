import Link from "next/link";
import { CircleAlert, Eye, EyeOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import { requireStaff, canWrite } from "@/lib/panel/guard";
import { staffVehicles } from "@/lib/fleet";
import { openWindowFor, pendingRequestFor, SCOPES } from "@/lib/panel/window";
import { formatPrice } from "@/lib/utils";
import { MAX_VEHICLE_FEATURES } from "@/types";
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
          <p className="mt-2 max-w-[70ch] text-sm text-muted">
            Everything the vehicle page shows is here. Anything left blank falls
            back to a sensible default, except the two copy boxes: leave those
            empty and the vehicle page renders an empty section.
          </p>

          <form action={createVehicleAction} className="mt-5 flex flex-col gap-7">
            <Group title="The vehicle">
              <FormField label="Name" name="name" placeholder="Toyota Axio" required />
              <FormField label="Brand" name="brand" placeholder="Toyota" />
              <FormField label="Year" name="year" type="number" placeholder="2019" />
              <SelectField
                label="Category"
                name="category"
                defaultValue="sedan"
                options={["micro", "hatchback", "sedan", "suv", "van", "luxury", "electric"]}
              />
              <FormField label="Seats" name="seats" type="number" placeholder="5" />
              <FormField label="Doors" name="doors" type="number" placeholder="5" />
              <FormField label="Luggage bags" name="luggage" type="number" placeholder="2" />
              <SelectField
                label="Fuel"
                name="fuel"
                defaultValue="petrol"
                options={["petrol", "diesel", "hybrid", "electric"]}
              />
              <SelectField
                label="Transmission"
                name="transmission"
                defaultValue="automatic"
                options={["automatic", "manual"]}
              />
              <FormField label="Engine cc" name="engineCc" type="number" placeholder="1500" />
            </Group>

            <Group title="Rates in LKR">
              <FormField label="Daily" name="daily" type="number" placeholder="9500" />
              <FormField label="Weekly" name="weekly" type="number" placeholder="Blank: 6x daily" />
              <FormField label="Monthly" name="monthly" type="number" placeholder="Blank: 24x daily" />
              <FormField label="Deposit" name="deposit" type="number" placeholder="30000" />
              <FormField
                label="With a driver, per day"
                name="withDriverDaily"
                type="number"
                placeholder="Blank: self drive only"
              />
            </Group>

            {/* The two sections a customer actually reads. Both are prose, so
                both are full width: a paragraph in a quarter column is
                unusable. */}
            <Group title="What the customer reads">
              <div className="sm:col-span-2 lg:col-span-4">
                <FormField
                  label="Tagline"
                  name="tagline"
                  placeholder="The one line that sits under the vehicle name"
                />
              </div>

              <TextArea
                label="About this vehicle"
                name="description"
                rows={4}
                placeholder="Our flagship. Booked most often as a decorated wedding car or for executive airport pickups. Supplied with a uniformed chauffeur as standard."
                hint="One paragraph. This is the About this vehicle section on the vehicle page."
              />

              <TextArea
                label="Features and equipment"
                name="features"
                rows={7}
                placeholder={"Chauffeur included\nNappa leather interior\nAmbient cabin lighting\nRear window blinds\nComplimentary wedding decoration\nBottled water and tissues"}
                hint={`One feature per line, up to ${MAX_VEHICLE_FEATURES}. A bullet or dash at the start of a line is stripped for you.`}
              />
            </Group>

            <div>
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

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="font-display text-xs font-bold uppercase tracking-[0.14em] text-muted">
        {title}
      </legend>
      <div className="rule mt-2 mb-4" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </fieldset>
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
        className="h-11 bg-field px-3 text-sm text-ink"
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

/** Prose fields. Always full width: a paragraph in a quarter column is unusable. */
function TextArea({
  label,
  name,
  rows,
  placeholder,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  rows: number;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
      <span className="text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="bg-field p-3 text-sm leading-relaxed text-ink placeholder:text-muted/70"
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
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
