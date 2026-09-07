import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalBody, type LegalSection } from "@/components/common/LegalBody";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms" },
  title: "Rental terms",
  description:
    "The rental agreement in plain language: eligibility, deposits, insurance, kilometre limits, fuel, damage and cancellation.",
};

/**
 * PLACEHOLDER COPY. These terms are written as a realistic starting point for
 * the demo - have them reviewed by the company's lawyer before going live.
 */
const sections: LegalSection[] = [
  {
    id: "eligibility",
    heading: "1. Who can rent",
    paragraphs: [
      "To rent a vehicle for self-drive you must be at least 23 years old and hold a valid driving licence that has been in force for at least twelve months.",
      "Visitors may drive on an international driving permit, provided it has been endorsed by the Automobile Association of Sri Lanka or the Department of Motor Traffic. We can arrange that endorsement on your behalf if you give us notice.",
    ],
    list: [
      "Valid driving licence or endorsed international permit",
      "NIC or passport for identification",
      "A second form of address verification for first-time customers",
      "All additional drivers named on the agreement before the vehicle leaves",
    ],
  },
  {
    id: "booking",
    heading: "2. Bookings and confirmation",
    paragraphs: [
      "A booking request is not a reservation until we confirm it. We aim to confirm within one hour during office hours and by the next morning for requests received overnight.",
      "The vehicle shown on your confirmation is the vehicle we hold for you. If it becomes unavailable through damage or a delayed return, we will offer an equivalent or better vehicle at no extra cost, or a full refund.",
    ],
  },
  {
    id: "payment",
    heading: "3. Payment and deposit",
    paragraphs: [
      "The rental charge is payable in full before or at handover. We accept cash, bank transfer, and credit or debit cards. Corporate lease customers are invoiced monthly on thirty-day terms.",
      "A refundable security deposit is collected at handover and returned within two working days of the vehicle coming back in the condition it left in. The deposit amount for each vehicle is published on its page.",
    ],
  },
  {
    id: "insurance",
    heading: "4. Insurance and liability",
    paragraphs: [
      "Every vehicle carries comprehensive insurance included in the rental rate. In the event of an accident your liability is limited to the policy excess, which is LKR 25,000 for most of the fleet. Zero-excess cover can be added for a daily charge.",
      "Insurance does not cover damage caused while driving under the influence of alcohol or drugs, while the vehicle is driven by anyone not named on the agreement, during off-road use, or where the driver leaves the scene of an accident.",
    ],
  },
  {
    id: "use",
    heading: "5. Using the vehicle",
    paragraphs: [
      "Every rental includes unlimited kilometres. There is no distance allowance and no per-kilometre charge.",
      "Vehicles are handed over with a full tank and should be returned full. Vehicles returned short are charged at pump price plus a refuelling fee. Smoking in any vehicle incurs a cleaning charge.",
    ],
    list: [
      "No sub-letting or commercial passenger transport without written consent",
      "No racing, towing, or driving on unsurfaced tracks unless the vehicle is 4WD",
      "No transport of livestock or hazardous goods",
      "Report any accident, theft or damage to us and to the police immediately",
    ],
  },
  {
    id: "extensions",
    heading: "6. Extensions and early returns",
    paragraphs: [
      "Extensions are granted where the vehicle is not already booked afterwards. Request an extension at least twenty-four hours before your return time and the same daily rate applies.",
      "Early returns are welcome, but the rental period booked is the period charged. Weekly and monthly rates are not re-priced to a daily rate on an early return.",
    ],
  },
  {
    id: "cancellation",
    heading: "7. Cancellation",
    paragraphs: [
      "Cancel more than forty-eight hours before pickup and any amount paid is refunded in full. Between forty-eight and twenty-four hours we retain twenty-five percent of the rental. Within twenty-four hours, or in the case of a no-show, the first rental day is charged.",
      "Wedding car bookings cancelled within seven days of the date are charged fifty percent, because the vehicle is blocked out for the whole day.",
    ],
  },
  {
    id: "damage",
    heading: "8. Damage and breakdowns",
    paragraphs: [
      "Vehicles are photographed at handover and on return. Damage beyond fair wear and tear is assessed against those photographs and charged at cost, capped at the insurance excess where the incident is covered.",
      "Mechanical breakdowns are our responsibility. Call the number on the key fob and we will send assistance and, if the vehicle cannot be repaired where it stands, deliver a replacement anywhere on the island at no charge.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Rental terms"
        description="The agreement you sign at handover, written the way we would explain it over the phone."
        crumbs={[{ label: "Rental terms" }]}
        aside={
          <div className="rounded-(--radius-card) bg-surface p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-muted">
              Last updated
            </p>
            <p className="mt-1 font-display text-xl font-bold">1 September 2026</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              These terms apply to every rental. The signed agreement at handover
              takes precedence where the two differ.
            </p>
          </div>
        }
      />
      <LegalBody sections={sections} />
    </>
  );
}
