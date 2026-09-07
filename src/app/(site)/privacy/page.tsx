import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalBody, type LegalSection } from "@/components/common/LegalBody";
import { addressOneLine, site } from "@/lib/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
  title: "Privacy policy",
  description:
    "What personal information Extra Cabs & Rent a Cars collects, why we collect it, how long we keep it and who we share it with.",
};

/**
 * PLACEHOLDER COPY. Realistic starting point for the demo - have it reviewed
 * before the site goes live.
 */
const sections: LegalSection[] = [
  {
    id: "what-we-collect",
    heading: "1. What we collect",
    paragraphs: [
      "We collect only what we need to rent you a vehicle and to meet our obligations as a vehicle owner.",
    ],
    list: [
      "Your name, phone number and email address",
      "Your NIC or passport number and a copy of your driving licence",
      "Booking details: dates, locations, vehicle and any extras",
      "Payment records, though card numbers are handled by our payment provider and never stored by us",
      "Basic website analytics such as pages viewed and approximate location",
    ],
  },
  {
    id: "why",
    heading: "2. Why we collect it",
    paragraphs: [
      "Identity and licence details are collected because the law requires a vehicle owner to know who is driving. Contact details are used to confirm bookings, arrange handovers and reach you during a rental.",
      "We do not sell personal information, and we do not share it for advertising purposes.",
    ],
  },
  {
    id: "sharing",
    heading: "3. Who we share it with",
    paragraphs: [
      "We share personal information only where it is necessary: with our insurer when a claim is made, with the police or courts where we are legally required to, and with our payment provider to process a transaction.",
      "Our drivers see only the details they need for your booking: your name, phone number, pickup point and destination.",
    ],
  },
  {
    id: "retention",
    heading: "4. How long we keep it",
    paragraphs: [
      "Rental agreements and the identity documents attached to them are kept for seven years, which is the period we are required to be able to produce them for.",
      "Booking enquiries that do not result in a rental are deleted after twelve months. Marketing contacts are removed as soon as you ask.",
    ],
  },
  {
    id: "your-rights",
    heading: "5. Your rights",
    paragraphs: [
      "You can ask us what we hold about you, ask for a correction, or ask us to delete anything we are not legally required to keep. Write to us and we will respond within thirty days.",
    ],
  },
  {
    id: "cookies",
    heading: "6. Cookies",
    paragraphs: [
      "This site uses a small number of cookies to remember your preferences and to measure how many people visit which pages. None of them track you across other websites, and none are used for advertising.",
    ],
  },
  {
    id: "contact",
    heading: "7. Contacting us about privacy",
    paragraphs: [
      `Questions about this policy can go to ${site.email}, or by post to ${addressOneLine}.`,
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
            <p className="mt-1 font-display text-xl font-bold">1 September 2026</p>
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
