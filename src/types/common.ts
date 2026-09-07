export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  quote: string;
  /** Rented vehicle, shown as context under the quote. */
  vehicle: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: "booking" | "requirements" | "payment" | "vehicle";
}

export interface Location {
  id: string;
  name: string;
  type: "branch" | "airport" | "delivery";
  address: string;
  hours: string;
  phone: string;
}

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  children?: NavLink[];
}
