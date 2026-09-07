import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { BrowseByType } from "@/components/home/BrowseByType";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { FeaturedFleet, SHOWCASE_COUNT } from "@/components/home/FeaturedFleet";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyUs } from "@/components/home/WhyUs";
import { Testimonials } from "@/components/home/Testimonials";
import { FaqPreview } from "@/components/home/FaqPreview";
import { JsonLd } from "@/components/common/JsonLd";
import { itemListLd } from "@/lib/seo";
import { publicShowcaseCars } from "@/lib/fleet";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default async function HomePage() {
  const showcase = await publicShowcaseCars(SHOWCASE_COUNT);

  return (
    <>
      <JsonLd
        data={itemListLd(
          "Vehicles available to rent",
          "/",
          showcase.map((car) => ({
            name: car.name,
            path: `/fleet/${car.slug}`,
          })),
        )}
      />

      <Hero />
      <FeaturedFleet />
      <BrowseByType />
      <ServicesGrid />
      <HowItWorks />
      <WhyUs />
      <Testimonials />
      <FaqPreview />
    </>
  );
}
