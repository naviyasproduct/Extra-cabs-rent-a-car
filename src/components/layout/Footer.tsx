import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Shell } from "@/components/ui/Layout";
import { footerNav, site } from "@/lib/data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-ink text-white">
      {/* The CTA slab overlaps the seam between the page and the footer, which
          ties the two bands together instead of stacking them. */}
      <Shell className="relative z-10 [transform:translateY(calc(var(--overlap)*-1))]">
        <div className="rounded-(--radius-shell) bg-brand p-8 lg:p-12">
          <Grid className="items-center">
            <div className="col-span-4 md:col-span-8 lg:col-span-7">
              <h2 className="display-lg text-white">Ready when you are</h2>
              <p className="mt-4 max-w-[46ch] text-white/80">
                Tell us the dates and where you need the vehicle. We confirm most
                bookings within the hour, seven days a week.
              </p>
            </div>
            <div className="col-span-4 mt-8 flex flex-wrap gap-3 md:col-span-8 lg:col-span-5 lg:mt-0 lg:justify-end">
              <LinkButton href="/booking" variant="light" size="lg" arrow>
                Book a vehicle
              </LinkButton>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white/15 px-8 font-semibold text-white transition-colors hover:bg-white/25"
              >
                <Phone className="size-4" aria-hidden />
                Call us
              </a>
            </div>
          </Grid>
        </div>
      </Shell>

      {/* Negative margin claws back the space the overlap borrowed, so the
          footer keeps the same internal rhythm as every other band. */}
      <Shell className="mt-[calc(var(--overlap)*-1)] pb-10 pt-(--section-y)">
        <Grid>
          <div className="col-span-4 md:col-span-8 lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-5 max-w-[38ch] text-[0.9375rem] leading-relaxed text-white/55">
              {site.description}
            </p>

            <ul className="mt-7 space-y-3 text-[0.9375rem]">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="text-white/70">
                  {site.address.line1}, {site.address.line2}, {site.address.city}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-brand" aria-hidden />
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="text-white/70 transition-colors hover:text-white"
                >
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-brand" aria-hidden />
                <a
                  href={`mailto:${site.email}`}
                  className="text-white/70 transition-colors hover:text-white"
                >
                  {site.email}
                </a>
              </li>
            </ul>
          </div>

          {footerNav.map((group) => (
            <div key={group.title} className="col-span-2 lg:col-span-2">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-white/40">
                {group.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-white/65 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Grid>

        <div className="mt-12 h-px bg-white/10" />

        <Grid className="mt-6 items-center">
          <p className="col-span-4 text-sm text-white/40 md:col-span-5 lg:col-span-6">
            © {year} {site.legalName}. All rights reserved.
          </p>
          <ul className="col-span-4 flex flex-wrap gap-x-5 gap-y-2 md:col-span-3 lg:col-span-6 lg:justify-end">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
                >
                  {social.label}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </Grid>
      </Shell>
    </footer>
  );
}
