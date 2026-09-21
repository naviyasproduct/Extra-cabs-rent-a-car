import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalBody, type LegalSection } from "@/components/common/LegalBody";
import { addressOneLine, site } from "@/lib/data/site";
import { KM_PER_DAY } from "@/lib/pricing";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms" },
  title: "Rental terms",
  description:
    "The rental agreement in plain language: who can rent, payment, the security deposit, the 100 km a day allowance, refunds, fuel, insurance and damage.",
};

/**
 * Written 2026-09-21 from the client's own policy: 100 km a day with a
 * per-vehicle rate beyond it, a per-vehicle security deposit returned less
 * deductions, and no refund of the rental charge once paid.
 *
 * NOT REVIEWED BY A LAWYER. Client decisions 2026-09-21: no minimum age (the
 * one-year licence rule stays), and no fixed insurance excess, so the amount
 * is stated on each rental agreement. The breakdown promise and corporate
 * invoicing terms were carried over from the earlier draft, still unconfirmed.
 *
 * Every figure that exists elsewhere is read from there rather than retyped:
 * the allowance from KM_PER_DAY, the business details from site.ts. The
 * per-vehicle rates are deliberately not listed here; they live on each
 * vehicle page, which is what clause 5 points to.
 */
const sections: LegalSection[] = [
  {
    id: "agreement",
    heading: "1. This agreement",
    paragraphs: [
      `These terms are the agreement between you and ${site.legalName} ("we", "us"), of ${addressOneLine}. They apply to every rental, self-drive or with one of our drivers.`,
      "You accept them when you confirm a booking, and again when you sign the rental agreement at handover. Where the signed agreement and these terms differ, the signed agreement applies.",
    ],
  },
  {
    id: "eligibility",
    heading: "2. Who can rent",
    paragraphs: [
      "To rent a vehicle for self-drive you must hold a valid driving licence that has been in force for at least twelve months.",
      "Visitors may drive on an international driving permit endorsed by the Automobile Association of Sri Lanka or the Department of Motor Traffic.",
    ],
    list: [
      "Photos of your NIC (front and back) or passport photo page, uploaded when you book",
      "Photos of your driving licence (front and back), uploaded when you book",
      "The original documents, shown at handover",
      "Every additional driver named on the agreement, with their licence, before the vehicle leaves",
    ],
  },
  {
    id: "booking",
    heading: "3. Bookings and payment",
    paragraphs: [
      "A booking request is not a reservation until we confirm it. We aim to confirm within one hour during office hours, and by the next morning for requests sent overnight.",
      "The rental charge is paid in full before or at handover, by cash or bank transfer. We do not accept cards. Corporate lease customers are invoiced monthly on thirty-day terms.",
      "A hire of a week or longer is charged at the per-day rate for that length, as published in the rate table on the vehicle's page.",
    ],
  },
  {
    id: "no-refunds",
    heading: "4. No refunds",
    paragraphs: [
      "Once paid, the rental charge is not refundable. This applies if you cancel, if you do not collect the vehicle (a no-show), and if you return the vehicle before the end of the booked period. The period you booked is the period you pay for.",
      "The one exception is our own failure: if we cannot provide the vehicle we confirmed, we will offer an equivalent or better vehicle at no extra cost, or return what you paid.",
      "The security deposit is separate from the rental charge and is returned as set out in clause 6.",
    ],
  },
  {
    id: "kilometres",
    heading: "5. Kilometre allowance",
    paragraphs: [
      `Every hire includes ${KM_PER_DAY} km for each day of the rental. A three-day hire includes ${KM_PER_DAY * 3} km, and so on.`,
      "Every kilometre driven beyond the allowance is charged at that vehicle's extra-kilometre rate. The rate is shown on the vehicle's page and on your booking, and the rate at the time you book is the rate you pay.",
      "We record the odometer reading together with you at handover and again on return. The difference between the two readings is the distance driven. Extra kilometres are paid at return or deducted from the security deposit.",
    ],
  },
  {
    id: "deposit",
    heading: "6. Security deposit",
    paragraphs: [
      "Each vehicle has its own security deposit, shown on its page. It is paid at handover, by cash or bank transfer, before the vehicle leaves.",
      "We return the deposit within two working days of the vehicle coming back, less any of the following that apply. If these come to more than the deposit, you pay the difference.",
    ],
    list: [
      "Kilometres driven beyond the allowance",
      "Fuel needed to refill the tank, at pump price plus a refuelling fee",
      "Traffic fines, parking penalties and tolls incurred during the rental",
      "Damage beyond fair wear and tear, as set out in clause 9",
      "Cleaning, where the vehicle is returned unusually dirty or has been smoked in",
    ],
  },
  {
    id: "use",
    heading: "7. Using the vehicle",
    paragraphs: [
      "Vehicles are handed over with a full tank and should be returned full.",
      "You are responsible for the vehicle, and for any traffic or parking offence, from handover until it is returned to us.",
    ],
    list: [
      "Only drivers named on the agreement may drive",
      "No sub-letting or carrying paying passengers without our written consent",
      "No racing, towing, or driving on unsurfaced tracks unless the vehicle is 4WD",
      "No smoking, and no livestock or hazardous goods",
      "Report any accident, theft or damage to us and to the police immediately",
    ],
  },
  {
    id: "extensions",
    heading: "8. Extensions",
    paragraphs: [
      "You can extend a hire if the vehicle is not already booked after you. Ask at least twenty-four hours before your return time. The extra days are charged at the vehicle's rates and add to your kilometre allowance at the same rate per day.",
    ],
  },
  {
    id: "insurance-damage",
    heading: "9. Insurance, damage and breakdowns",
    paragraphs: [
      "Every vehicle carries comprehensive insurance included in the rental rate. In an accident your liability is limited to the policy excess. The excess depends on the vehicle and its policy, and the amount is written on your rental agreement before you drive.",
      "Insurance does not cover damage caused while driving under the influence of alcohol or drugs, while the vehicle is driven by anyone not named on the agreement, during off-road use, or where the driver leaves the scene of an accident. In those cases you are liable for the full cost.",
      "Vehicles are photographed at handover and on return. Damage beyond fair wear and tear is assessed against those photographs and charged at cost, capped at the insurance excess where the incident is covered.",
      "Mechanical breakdowns are our responsibility. Call us and we will send assistance and, if the vehicle cannot be repaired where it stands, deliver a replacement anywhere on the island at no charge.",
    ],
  },
  {
    id: "privacy",
    heading: "10. Your personal information",
    paragraphs: [
      "We collect identity and licence documents because we need to know who is driving our vehicles. How we store and use them is explained in our privacy policy.",
    ],
  },
  {
    id: "law",
    heading: "11. Governing law and contact",
    paragraphs: [
      "These terms are governed by the laws of Sri Lanka.",
      `Questions about these terms: call ${site.phone}, or email ${site.email}.`,
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
            <p className="mt-1 font-display text-xl font-bold">21 September 2026</p>
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
