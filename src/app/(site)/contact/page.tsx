import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/common/ContactForm";
import { Grid, Section, SectionHeader, Shell } from "@/components/ui/Layout";
import { getLocations } from "@/lib/data/content";
import { addressLines, site } from "@/lib/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
  title: "Contact",
  description:
    "Call, message or visit Extra Cabs & Rent a Cars at 653 Samurdhi Mawatha, Heiyanthuduwa. We also deliver the vehicle to you.",
};

export default async function ContactPage() {
  const locations = await getLocations();

  const channels = [
    {
      icon: Phone,
      label: "Call the office",
      value: site.phone,
      href: `tel:${site.phone.replace(/\s/g, "")}`,
      note: site.hours.office,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: site.whatsapp,
      href: `https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`,
      note: "Usually the fastest reply",
    },
    {
      icon: Mail,
      label: "Email bookings",
      value: site.bookingEmail,
      href: `mailto:${site.bookingEmail}`,
      note: "Replies within one working day",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to a person"
        description="No ticket system and no chatbot. Call, message or walk into a branch and you will be speaking to someone who can actually confirm a vehicle."
        crumbs={[{ label: "Contact" }]}
        aside={
          <div className="p-6">
            <span className="grid size-12 place-items-center rounded-(--radius-inner) bg-brand">
              <Clock className="size-6" aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-lg font-bold uppercase">
              Roadside assistance
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {site.hours.support}. If you are renting from us and something goes
              wrong, this number is answered at any hour.
            </p>
            <a
              href={`tel:${site.phoneAlt.replace(/\s/g, "")}`}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white font-semibold text-charcoal transition-colors hover:bg-ink"
            >
              <Phone className="size-4 text-brand-bright" aria-hidden />
              {site.phoneAlt}
            </a>
          </div>
        }
      />

      {/* Channels */}
      <Section band="paper" spacing="top">
        <Shell>
          <Grid>
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                className="group col-span-4 rounded-(--radius-card) bg-surface p-6 transition-shadow duration-300 hover:shadow-(--shadow-lift) md:col-span-4 lg:col-span-4"
              >
                <span className="grid size-12 place-items-center rounded-(--radius-inner) bg-brand-tint text-brand-bright transition-colors group-hover:bg-brand group-hover:text-white">
                  <channel.icon className="size-6" aria-hidden />
                </span>
                <p className="mt-5 text-sm uppercase tracking-[0.14em] text-muted">
                  {channel.label}
                </p>
                <p className="mt-1.5 font-display text-xl font-bold">{channel.value}</p>
                <p className="mt-2 text-sm text-muted">{channel.note}</p>
              </a>
            ))}
          </Grid>
        </Shell>
      </Section>

      {/* Form + address */}
      <Section band="paper">
        <Shell>
          <Grid className="items-start">
            <div className="col-span-4 md:col-span-8 lg:col-span-7">
              <ContactForm />
            </div>

            <div className="col-span-4 mt-(--gap) md:col-span-8 lg:col-span-5 lg:mt-0">
              <div className="rounded-(--radius-card) bg-surface-alt p-6 lg:p-8">
                <h2 className="font-display text-xl font-bold uppercase">
                  Head office
                </h2>
                <address className="mt-5 not-italic leading-relaxed text-ink-soft">
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>

                <div className="rule my-6" />

                <dl className="space-y-4 text-[0.9375rem]">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                    <div>
                      <dt className="font-semibold">Office hours</dt>
                      <dd className="text-muted">{site.hours.office}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                    <div>
                      <dt className="font-semibold">Support line</dt>
                      <dd className="text-muted">{site.hours.support}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                    <div>
                      <dt className="font-semibold">General enquiries</dt>
                      <dd className="text-muted">{site.email}</dd>
                    </div>
                  </div>
                </dl>

                {/* Map slot. Drop an embed or a static map image in here when
                    the real address is confirmed. */}
                <div className="mt-6 grid aspect-[16/10] place-items-center rounded-(--radius-inner) bg-line/50 text-center">
                  <div className="px-6">
                    <MapPin className="mx-auto size-7 text-muted" aria-hidden />
                    <p className="mt-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                      Map goes here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Grid>
        </Shell>
      </Section>

      {/* Branches */}
      <Section band="alt">
        <Shell>
          <SectionHeader
            eyebrow="Branches"
            title="Four places to collect"
            description="Plus free delivery anywhere inside Colombo, and delivery by arrangement across the rest of the island."
          />

          <Grid className="mt-8">
            {locations.map((location) => (
              <div
                key={location.id}
                className="col-span-4 bg-tile p-6 md:col-span-8 lg:col-span-6"
              >
                <h3 className="font-display text-lg font-bold uppercase leading-tight">
                  {location.name}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                  {location.address}
                </p>
                <div className="rule my-5" />
                <p className="text-sm text-muted">{location.hours}</p>
                <a
                  href={`tel:${location.phone.replace(/\s/g, "")}`}
                  className="mt-1 inline-block font-display font-semibold transition-colors hover:text-brand-bright"
                >
                  {location.phone}
                </a>
              </div>
            ))}
          </Grid>
        </Shell>
      </Section>
    </>
  );
}
