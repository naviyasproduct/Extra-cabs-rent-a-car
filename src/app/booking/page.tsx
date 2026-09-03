import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BookingForm } from "@/components/booking/BookingForm";
import { Section, Shell } from "@/components/ui/Layout";
import { getCars } from "@/lib/data/cars";

export const metadata: Metadata = {
  title: "Book a vehicle",
  description:
    "Request a self-drive rental, a cab with a driver, an airport transfer or a wedding car. No payment taken until we confirm availability.",
};

export default async function BookingPage() {
  const cars = await getCars();

  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Reserve your vehicle"
        description="Four short steps. We confirm most requests within the hour and take no payment until the vehicle is held for you."
        crumbs={[{ label: "Booking" }]}
      />

      <Section band="paper">
        <Shell>
          <Suspense
            fallback={
              <div className="rounded-(--radius-card) bg-surface p-12 text-center text-muted">
                Loading the booking form…
              </div>
            }
          >
            <BookingForm cars={cars} />
          </Suspense>
        </Shell>
      </Section>
    </>
  );
}
