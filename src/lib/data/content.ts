import type {
  BookingExtra,
  Faq,
  Location,
} from "@/types";
import { addressOneLine, site } from "@/lib/data/site";

/* -------------------------------------------------------------------------- */
/* Pickup / drop-off locations                                                 */
/* -------------------------------------------------------------------------- */

const locations: Location[] = [
  {
    id: "loc-01",
    name: "Heiyanthuduwa office",
    type: "branch",
    // Read from site.ts, never retyped: this card was still showing the old
    // placeholder landline after site.ts had moved on.
    address: addressOneLine,
    hours: site.hours.office,
    phone: site.phone,
  },
];

export async function getLocations(): Promise<Location[]> {
  return locations;
}

/** Flat list used by the pickup / drop-off selects. */
export const locationNames: string[] = locations.map((l) => l.name);


/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

const faqs: Faq[] = [
  {
    id: "faq-01",
    category: "requirements",
    question: "What do I need to rent a car for self-drive?",
    answer:
      "A valid Sri Lankan driving licence, or an international driving permit endorsed by the AA of Sri Lanka if you are visiting. You will also need your NIC or passport, and to have held your licence for at least one year. You upload photos of your ID and licence when you book, and bring the originals to handover.",
  },
  {
    id: "faq-02",
    category: "booking",
    question: "How far in advance should I book?",
    answer:
      "Two to three days is comfortable for most vehicles. For weekends, school holidays, the April new year period and December, book at least two weeks ahead. Wedding cars are usually reserved a month or more in advance.",
  },
  {
    id: "faq-03",
    category: "payment",
    question: "How much is the security deposit and when do I get it back?",
    answer:
      "Each vehicle has its own security deposit, shown on its page. It is paid at handover and returned within two working days of the vehicle coming back, less any extra kilometres, missing fuel, traffic fines or damage.",
  },
  {
    id: "faq-04",
    category: "payment",
    question: "Which payment methods do you accept?",
    answer:
      "Cash or bank transfer. We do not take cards. Corporate customers on a lease are invoiced monthly on 30-day terms.",
  },
  {
    id: "faq-05",
    category: "vehicle",
    question: "Is insurance included in the price?",
    answer:
      "Yes. Every vehicle carries comprehensive insurance in the daily rate. In an accident your liability is capped at the policy excess, which depends on the vehicle and is written on your rental agreement before you drive. Damage from drink-driving, driving without a valid licence or off-road use is not covered.",
  },
  {
    id: "faq-06",
    category: "vehicle",
    question: "What happens if the car breaks down?",
    answer:
      "Call the 24-hour number on the key fob. We send roadside assistance and, if the vehicle cannot be fixed where it stands, we deliver a replacement to you anywhere on the island at no charge.",
  },
  {
    id: "faq-07",
    category: "booking",
    question: "Do you deliver the vehicle?",
    answer:
      "Delivery and collection are free anywhere in Colombo and the suburbs. Outside that, delivery is charged by distance and quoted before you confirm. Airport handovers are free with any booking of three days or more.",
  },
  {
    id: "faq-08",
    category: "vehicle",
    question: "Is there a kilometre limit?",
    answer:
      "Yes. Every hire includes 100 km for each day of the rental, so a three-day hire includes 300 km. Every kilometre beyond that is charged at the vehicle's extra-kilometre rate, shown on its page. We read the odometer together at handover and on return.",
  },
  {
    id: "faq-09",
    category: "booking",
    question: "Can I extend my rental once it has started?",
    answer:
      "Yes, as long as the vehicle is not already booked after you. Call or message us at least 24 hours before your return time and we will extend at the same daily rate.",
  },
  {
    id: "faq-10",
    category: "payment",
    question: "What is your cancellation policy?",
    answer:
      "Once a booking is confirmed, the rental charge is not refundable. That covers cancellations, no-shows and vehicles returned early. The security deposit is separate: it is returned after the vehicle comes back, less any deductions.",
  },
  {
    id: "faq-11",
    category: "requirements",
    question: "Can someone else drive the car I rented?",
    answer:
      "Additional drivers can be added at no cost, but they must be named on the agreement and present their licence at handover. An unnamed driver invalidates the insurance.",
  },
  {
    id: "faq-12",
    category: "vehicle",
    question: "Do the cars come with a full tank?",
    answer:
      "Every vehicle is handed over full and should be returned full. If it comes back short we charge the fuel at pump price plus a small refuelling fee.",
  },
];

export async function getFaqs(): Promise<Faq[]> {
  return faqs;
}

export const faqCategoryLabels: Record<Faq["category"], string> = {
  booking: "Booking",
  requirements: "Requirements",
  payment: "Payment & deposit",
  vehicle: "The vehicle",
};

/* -------------------------------------------------------------------------- */
/* Booking extras                                                              */
/* -------------------------------------------------------------------------- */

export const bookingExtras: BookingExtra[] = [
  {
    id: "extra-driver",
    label: "Professional driver",
    description: "One of our licensed drivers takes the wheel for the whole hire.",
    pricePerDay: 5000,
  },
];

/* -------------------------------------------------------------------------- */
/* How it works                                                                */
/* -------------------------------------------------------------------------- */

export const bookingSteps = [
  {
    step: "01",
    title: "Pick your dates",
    description:
      "Tell us where and when you need the vehicle. Enter it on the site or send us a WhatsApp message, whichever is easier.",
  },
  {
    step: "02",
    title: "Choose the vehicle",
    description:
      "Browse the fleet with live availability for your dates and pick the car, van or SUV that fits the trip.",
  },
  {
    step: "03",
    title: "Confirm and pay",
    description:
      "We confirm within the hour. Pay by cash or bank transfer and the vehicle is held for you.",
  },
  {
    step: "04",
    title: "Drive away",
    description:
      "Collect from our office or let us deliver to your door. Ten minutes of paperwork and the keys are yours.",
  },
];

/* -------------------------------------------------------------------------- */
/* Why choose us                                                               */
/* -------------------------------------------------------------------------- */

export const differentiators = [
  {
    icon: "shield",
    title: "Insurance in the price",
    description:
      "Comprehensive cover on every vehicle, with the excess stated on your agreement before you drive, never discovered after.",
  },
  {
    icon: "tag",
    title: "The quoted price is the price",
    description:
      "No airport surcharge, no weekend loading, no cleaning fee at the end. What we quote is what you pay.",
  },
  {
    icon: "clock",
    title: "Answered around the clock",
    description:
      "A real person on the phone at 3 am, and roadside assistance anywhere on the island.",
  },
  {
    icon: "sparkle",
    title: "Genuinely clean vehicles",
    description:
      "Washed inside and out, fuelled and safety-checked before every single handover. No exceptions.",
  },
  {
    icon: "map",
    title: "Delivered where you are",
    description:
      "Free delivery and collection across Colombo, and to the airport on longer bookings.",
  },
  {
    icon: "wrench",
    title: "Serviced on schedule",
    description:
      "Every vehicle follows the manufacturer service interval, logged and verifiable.",
  },
];
