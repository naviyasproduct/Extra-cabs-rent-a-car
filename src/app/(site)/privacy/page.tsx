import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalBody, type LegalSection } from "@/components/common/LegalBody";
import { addressOneLine, site } from "@/lib/data/site";
import {
  HIRED_RETENTION_DAYS,
  UNHIRED_RETENTION_DAYS,
} from "@/lib/panel/retention-rules";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
  title: "Privacy policy",
  description:
    "What personal information Extra Cabs & Rent a Cars collects, including identity and licence documents, why we need it, who sees it and your rights under Sri Lankan law.",
};

/**
 * Written 2026-09-21 to describe what the system ACTUALLY does, checked
 * against the code rather than assumed. If any of these change, this page is
 * wrong until it is updated:
 *
 *   - The booking form collects name, two phone numbers, email, dates, the
 *     pickup choice, the driver option, notes, and photos of an NIC or
 *     passport plus a driving licence (BookingForm, lib/panel/uploads.ts).
 *   - The contact form collects name, email, phone, subject and message.
 *   - Every booking texts the customer's name, phone number, vehicle and dates
 *     to staff through an SMS gateway (lib/sms/notify.ts).
 *   - There is NO analytics on the site. The earlier draft claimed there was.
 *     Add a clause before adding any.
 *   - The public site sets no cookies of its own. The Google Maps frame in
 *     the footer is Google's, and can set Google's.
 *   - ID photos are deleted on the schedule in lib/panel/retention-rules.ts,
 *     whose day counts clause 5 reads directly, so the page and the code
 *     cannot disagree. The deleting itself runs from the panel's bookings
 *     screen until there is a scheduler (see retention.ts).
 *
 * NOT REVIEWED BY A LAWYER. Sri Lanka's Personal Data Protection Act No. 9 of
 * 2022 applies.
 */
const sections: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "1. Who we are",
    paragraphs: [
      `${site.legalName} ("we", "us") of ${addressOneLine} is responsible for the personal information described here. You can reach us at ${site.email} or on ${site.phone}.`,
    ],
  },
  {
    id: "what-we-collect",
    heading: "2. What we collect",
    paragraphs: [
      "We collect only what we need to rent you a vehicle and to meet our obligations as the owner of that vehicle.",
    ],
    list: [
      "Your name, email address, a phone number and a WhatsApp number",
      "Your booking: the vehicle, dates, pickup or delivery choice, whether you want a driver, and any notes you add",
      "Photos of your NIC (front and back) or passport photo page, and of your driving licence (front and back)",
      "Your NIC or passport number and driving licence number, which our staff note at handover",
      "What you write to us through the contact form or by message",
      "Payment records: what you paid, when and how. We do not take cards, so we hold no card details",
    ],
  },
  {
    id: "why",
    heading: "3. Why we collect it",
    paragraphs: [
      "Identity and licence documents are collected because a vehicle owner must know who is driving, and because our insurance depends on every driver holding a valid licence. Contact details are used to confirm your booking, arrange handover and reach you during the rental.",
      "We do not sell personal information, and we do not use it for advertising.",
    ],
  },
  {
    id: "sharing",
    heading: "4. Who sees it",
    paragraphs: [
      "Your documents are stored privately. They are never published and can only be opened by our staff, who must sign in to see them.",
      "When you book, your name, phone number, the vehicle and your dates are sent by text message to our staff so someone can confirm quickly. That message goes through an SMS provider.",
      "We also share information where we must: with our insurer when a claim is made, and with the police or courts where the law requires it.",
      "Our website and records are held by service providers who host and store them for us. Some of these providers may store data on servers outside Sri Lanka.",
    ],
  },
  {
    id: "retention",
    heading: "5. How long we keep it",
    paragraphs: [
      `Photos of your ID and licence are deleted ${HIRED_RETENTION_DAYS} days after your rental ends. If a booking never becomes a rental, they are deleted ${UNHIRED_RETENTION_DAYS} days after it closes.`,
      "The one exception: if a traffic fine, a damage claim or a dispute about the rental is still open, we keep the photos until it is settled, then delete them.",
      "We keep the booking record itself, including your name, contact details, the rental dates and vehicle, and your ID and licence numbers. This lets us recognise returning customers, answer questions about a past rental, and deal with claims that arrive late. It does not include the photos.",
      "Contact-form messages are deleted once they are no longer needed.",
    ],
  },
  {
    id: "your-rights",
    heading: "6. Your rights",
    paragraphs: [
      "Under Sri Lanka's Personal Data Protection Act No. 9 of 2022 you can ask us what we hold about you, ask us to correct it, ask us to delete anything we are not required to keep, withdraw your consent, and object to how we use it.",
      `Write to ${site.email} and tell us what you would like. We may ask you to confirm who you are before we act, so that nobody else can see or change your information.`,
    ],
  },
  {
    id: "cookies",
    heading: "7. Cookies",
    paragraphs: [
      "This website does not set cookies of its own for visitors, and does not use analytics or advertising trackers.",
      "The map at the bottom of each page is provided by Google Maps. When it loads, Google may set its own cookies and collect information under Google's privacy policy.",
    ],
  },
  {
    id: "changes",
    heading: "8. Changes to this policy",
    paragraphs: [
      "If we change what we collect or how we use it, we will update this page before the change takes effect, and the date at the top will change with it.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description="What we collect, why we need it, and what we will never do with it."
        crumbs={[{ label: "Privacy policy" }]}
        aside={
          <div className="rounded-(--radius-card) bg-surface p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-muted">
              Last updated
            </p>
            <p className="mt-1 font-display text-xl font-bold">21 September 2026</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              We will post any change here before it takes effect.
            </p>
          </div>
        }
      />
      <LegalBody sections={sections} />
    </>
  );
}
