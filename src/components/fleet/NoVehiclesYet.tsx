import { MessageCircle, Phone } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/**
 * What the site shows while no vehicle is listed.
 *
 * The catalogue ships empty (2026-09-21) and staff add the fleet through the
 * panel after launch, so "no vehicles" is a real state, not an error. Without
 * this the home grid was blank under "Pick your ride", /fleet offered filters
 * over nothing and said "Nothing matches that combination", and /booking
 * reached a vehicle step with no vehicles and could never continue.
 *
 * It sends people to the phone and WhatsApp, which is how the business takes
 * most bookings anyway.
 */
export function NoVehiclesYet({
  title = "Our fleet is being listed",
  className,
}: {
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-tile p-8 text-center lg:p-12", className)}>
      <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
      <p className="mx-auto mt-3 max-w-[46ch] text-muted">
        Vehicles are being added to the website now. Call or WhatsApp us and we
        will tell you what is available for your dates.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LinkButton href={`tel:${site.phone.replace(/\s/g, "")}`}>
          <Phone className="size-4" aria-hidden />
          {site.phone}
        </LinkButton>
        <LinkButton
          href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          variant="outline"
        >
          <MessageCircle className="size-4" aria-hidden />
          WhatsApp
        </LinkButton>
      </div>
    </div>
  );
}
