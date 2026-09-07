import { requireStaff } from "@/lib/panel/guard";
import { readData } from "@/lib/panel/store";
import { colomboDateTime } from "@/lib/panel/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity" };

/**
 * The audit log in plain language.
 *
 * An employee sees only their own entries; the owner sees everyone's. Every
 * write in the panel appends here, including the failed ones worth knowing
 * about, like a code typed into the wrong person's session.
 */
export default async function PanelActivity() {
  const user = await requireStaff();
  const data = readData();

  const entries = [...data.audit]
    .reverse()
    .filter((entry) => user.role === "owner" || entry.staffId === user.id);

  const staffName = (id: string) =>
    data.staff.find((s) => s.id === id)?.name ?? "Unknown";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display-md">Activity</h1>
        <p className="mt-2 text-sm text-muted">
          {user.role === "owner"
            ? "Everything anyone has done, newest first."
            : "Everything you have done, newest first."}
        </p>
      </div>

      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-3 first:border-t-0"
          >
            <span className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">
                {staffName(entry.staffId)}
              </span>{" "}
              {entry.summary}
              {entry.accessRequestId ? (
                <span className="ml-2 text-xs uppercase tracking-[0.1em] text-brand-bright">
                  under a window
                </span>
              ) : null}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {colomboDateTime(entry.at)}
            </span>
          </li>
        ))}
        {entries.length === 0 ? (
          <li className="py-3 text-sm text-muted">Nothing recorded yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
