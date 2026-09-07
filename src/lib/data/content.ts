import type {
  BookingExtra,
  Faq,
  Location,
  Testimonial,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Pickup / drop-off locations                                                 */
/* -------------------------------------------------------------------------- */

const locations: Location[] = [
  {
    id: "loc-01",
    name: "Heiyanthuduwa office",
    type: "branch",
    address: "653 Samurdhi Mawatha, Heiyanthuduwa",
    hours: "Mon to Sat, 8.00 am to 8.00 pm",
    phone: "+94 11 234 5678",
  },
];

export async function getLocations(): Promise<Location[]> {
  return locations;
}

/** Flat list used by the pickup / drop-off selects. */
export const locationNames: string[] = locations.map((l) => l.name);


/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

const testimonials: Testimonial[] = [
  {
    id: "tst-01",
    name: "Dilani Perera",
    role: "Rented for a family trip",
    location: "Colombo 05",
    rating: 5,
    quote:
      "Booked the C-HR for four days to Ella. The car arrived at our gate washed and full, and when we had a question about the route the office picked up on the first ring. Nothing was added to the bill at the end.",
    vehicle: "Toyota C-HR, 4 days",
  },
  {
    id: "tst-02",
    name: "Marcus Hoffmann",
    role: "Visitor from Germany",
    location: "Berlin",
    rating: 5,
    quote:
      "Our flight landed two hours late at 3 am and the driver was still there with the name board, no extra charge. That alone made the whole trip start well.",
    vehicle: "Airport transfer to Negombo",
  },
  {
    id: "tst-03",
    name: "Nuwan Jayasuriya",
    role: "Operations manager",
    location: "Rajagiriya",
    rating: 5,
    quote:
      "We lease three vehicles from Extra for the sales team. One invoice a month, servicing handled, and a replacement car turns up the same day whenever one goes in. It replaced a lot of admin.",
    vehicle: "Long-term lease, 3 vehicles",
  },
  {
    id: "tst-04",
    name: "Fathima Rizwan",
    role: "Rented for a wedding",
    location: "Dehiwala",
    rating: 5,
    quote:
      "The E-Class was decorated exactly in the colours we asked for and the chauffeur had already driven the route the day before. He got us to the hotel to the minute.",
    vehicle: "Mercedes-Benz E-Class, wedding",
  },
  {
    id: "tst-05",
    name: "Sanjeewa Bandara",
    role: "Rented for a group tour",
    location: "Kurunegala",
    rating: 4,
    quote:
      "Ten of us in the KDH for six days around the cultural triangle. The van was comfortable, the AC held up, and our driver knew every shortcut around the afternoon traffic.",
    vehicle: "Toyota KDH Hiace, 6 days",
  },
  {
    id: "tst-06",
    name: "Amara Silva",
    role: "First-time renter",
    location: "Mount Lavinia",
    rating: 5,
    quote:
      "I was nervous about the deposit and the paperwork but everything was explained before I paid anything. The deposit came back to my account two days after I returned the car.",
    vehicle: "Suzuki Wagon R, 2 days",
  },
];

export async function getTestimonials(): Promise<Testimonial[]> {
  return testimonials;
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

const faqs: Faq[] = [
  {
    id: "faq-01",
    category: "requirements",
    question: "What do I need to rent a car for self-drive?",
    answer:
      "A valid Sri Lankan driving licence, or an international driving permit endorsed by the AA of Sri Lanka if you are visiting. You will also need your NIC or passport, and to be at least 23 years old with one year of driving experience. We take a copy of the documents at handover and return them with the vehicle.",
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
      "The refundable deposit runs from LKR 20,000 for a micro car to LKR 150,000 for the luxury range, and it is listed on every vehicle page. It is refunded within two working days of the vehicle being returned in the same condition.",
  },
  {
    id: "faq-04",
    category: "payment",
    question: "Which payment methods do you accept?",
    answer:
      "Cash, bank transfer, and all major credit and debit cards. Corporate customers on a lease are invoiced monthly on 30-day terms.",
  },
  {
    id: "faq-05",
    category: "vehicle",
    question: "Is insurance included in the price?",
    answer:
      "Yes. Every vehicle carries comprehensive insurance in the daily rate. In an accident your liability is capped at the policy excess, which is LKR 25,000 for most of the fleet. Damage from drink-driving, driving without a valid licence or off-road use is not covered.",
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
      "No. Every rental includes unlimited kilometres at no extra charge. Drive as far as the trip needs and the daily rate is all you pay.",
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
      "Cancel more than 48 hours before pickup and you are refunded in full. Between 48 and 24 hours we retain 25 percent. Inside 24 hours, or a no-show, the first day is charged.",
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
    pricePerDay: 6500,
  },
  {
    id: "extra-child-seat",
    label: "Child seat",
    description: "Rear-facing or booster, fitted before handover.",
    pricePerDay: 800,
  },
  {
    id: "extra-gps",
    label: "GPS navigation unit",
    description: "Offline maps of the whole island, no data needed.",
    pricePerDay: 500,
  },
  {
    id: "extra-wifi",
    label: "Portable WiFi router",
    description: "Unlimited 4G for up to five devices.",
    pricePerDay: 900,
  },
  {
    id: "extra-full-cover",
    label: "Zero-excess cover",
    description: "Reduces your accident liability from LKR 25,000 to nil.",
    pricePerDay: 1500,
  },
  {
    id: "extra-delivery",
    label: "Delivery and collection",
    description: "Free inside Colombo, quoted by distance elsewhere.",
    pricePerDay: 0,
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
      "We confirm within the hour. Pay the deposit by card, transfer or cash and your booking is locked in.",
  },
  {
    step: "04",
    title: "Drive away",
    description:
      "Collect from a branch or let us deliver to your door. Ten minutes of paperwork and the keys are yours.",
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
      "Comprehensive cover on every vehicle, with the excess published up front instead of buried in the agreement.",
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
