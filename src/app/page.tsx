import { Hero } from "@/components/home/Hero";
import { BrowseByType } from "@/components/home/BrowseByType";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { FeaturedFleet } from "@/components/home/FeaturedFleet";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyUs } from "@/components/home/WhyUs";
import { Destinations } from "@/components/home/Destinations";
import { Testimonials } from "@/components/home/Testimonials";
import { FaqPreview } from "@/components/home/FaqPreview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedFleet />
      <BrowseByType />
      <ServicesGrid />
      <HowItWorks />
      <WhyUs />
      <Destinations />
      <Testimonials />
      <FaqPreview />
    </>
  );
}
