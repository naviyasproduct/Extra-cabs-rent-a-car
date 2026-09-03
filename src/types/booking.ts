import type { ServiceSlug } from "./service";

export type BookingStep = "trip" | "vehicle" | "details" | "review";

export interface BookingDraft {
  serviceType: ServiceSlug;
  pickupLocation: string;
  dropoffLocation: string;
  sameReturnLocation: boolean;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  carSlug: string | null;
  withDriver: boolean;
  extras: string[];
  fullName: string;
  email: string;
  phone: string;
  nic: string;
  licenceNumber: string;
  notes: string;
}

export interface BookingExtra {
  id: string;
  label: string;
  description: string;
  /** LKR per day. 0 means included at no charge. */
  pricePerDay: number;
}
