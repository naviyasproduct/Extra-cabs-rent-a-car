import { requireStaff } from "@/lib/panel/guard";
import { readData } from "@/lib/panel/store";
import { colomboDateTime } from "@/lib/panel/time";
import { closeEnquiryAction, replyToEnquiryAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };

/**
 * The shared inbox.
 *
 * Replies happen here rather than on a personal phone, which is the only
 * reason the reply count on the team screen means anything. See the plan,
 * section 8.
 */
export default async function PanelEnquiries() {
  await requireStaff();
  const data = readData();

  const staffName = (id: string | null) =>
    id ? (data.staff.find((s) => s.id === id)?.name ?? "Unknown") : "Customer";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display-md">Enquiries</h1>
        <p className="mt-2 max-w-[62ch] text-sm text-muted">
          Reply from here, not from your own phone. That is what makes the
          response times on the team screen real.
        </p>
      </div>

      {data.enquiries.length === 0 ? (
        <p className="bg-tile p-6 text-sm text-muted">
          Nothing yet. Messages sent through the contact form on the website
          land here.
        </p>
      ) : null}

      <div className="flex flex-col gap-px bg-line">
        {data.enquiries.map((enquiry) => (
          <article key={enquiry.id} className="bg-tile p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="font-display text-base font-bold uppercase">
                  {enquiry.subject || "No subject"}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {enquiry.name} · {enquiry.phone}
                  {enquiry.email ? ` · ${enquiry.email}` : ""}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {enquiry.status}
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {enquiry.messages.map((message) => (
                <li
                  key={message.id}
                  className={
                    message.fromStaffId
                      ? "ml-6 bg-brand-tint p-3"
                      : "mr-6 bg-field p-3"
                  }
                >
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {message.body}
                  </p>
                  <p className="mt-1.5 text-xs text-muted">
                    {staffName(message.fromStaffId)} ·{" "}
                    {colomboDateTime(message.at)}
                  </p>
                </li>
              ))}
            </ul>

            {enquiry.status !== "closed" ? (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                <form action={replyToEnquiryAction} className="flex flex-1 items-end gap-2">
                  <input type="hidden" name="id" value={enquiry.id} />
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted">
                      Reply
                    </span>
                    <input
                      name="body"
                      required
                      placeholder="Yes, the Prius is free those dates."
                      className="h-11 w-full bg-field px-3 text-sm text-ink placeholder:text-muted/70"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                  >
                    Send
                  </button>
                </form>

                <form action={closeEnquiryAction}>
                  <input type="hidden" name="id" value={enquiry.id} />
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-field px-4 text-sm font-semibold transition-colors hover:bg-field-hover"
                  >
                    Close
                  </button>
                </form>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
