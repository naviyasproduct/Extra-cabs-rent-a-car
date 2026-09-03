"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { Logo } from "./Logo";
import { LinkButton } from "@/components/ui/Button";
import { mainNav, site } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/**
 * Floating pill navbar.
 *
 * Sits inside the same shell width as every other section, so its left edge
 * lines up with the hero copy and the footer columns below it. Lifts onto a
 * solid surface once the page scrolls.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Escape closes the mobile sheet and any open dropdown.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock the page behind the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const openWithDelayCancel = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  };

  const closeWithDelay = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 140);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4">
      <div className="shell">
        <nav
          className={cn(
            "pointer-events-auto flex h-16 items-center justify-between gap-4 rounded-full pl-5 pr-2 transition-all duration-300 sm:pl-6 lg:h-[4.5rem]",
            scrolled || mobileOpen
              ? "bg-surface shadow-(--shadow-nav)"
              : "bg-surface/85 backdrop-blur-md",
          )}
        >
          <Logo />

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              const hasChildren = Boolean(item.children?.length);

              if (!hasChildren) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative rounded-full px-4 py-2.5 text-[0.9375rem] font-medium transition-colors duration-200",
                        active ? "text-brand" : "text-ink-soft hover:text-ink",
                      )}
                    >
                      {item.label}
                      {active ? (
                        <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-brand" />
                      ) : null}
                    </Link>
                  </li>
                );
              }

              const open = openDropdown === item.label;

              return (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => openWithDelayCancel(item.label)}
                  onMouseLeave={closeWithDelay}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setOpenDropdown(open ? null : item.label)}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[0.9375rem] font-medium transition-colors duration-200",
                      active || open ? "text-brand" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                      aria-hidden
                    />
                    {active ? (
                      <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-brand" />
                    ) : null}
                  </button>

                  <div
                    className={cn(
                      "absolute left-1/2 top-full w-[22rem] -translate-x-1/2 pt-3 transition-all duration-200",
                      open
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0",
                    )}
                  >
                    <div className="rounded-(--radius-card) bg-surface p-2 shadow-(--shadow-lift)">
                      {item.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-(--radius-inner) px-4 py-3 transition-colors duration-200 hover:bg-surface-alt"
                        >
                          <span className="block text-[0.9375rem] font-semibold">
                            {child.label}
                          </span>
                          {child.description ? (
                            <span className="mt-0.5 block text-sm leading-snug text-muted">
                              {child.description}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Right-hand actions */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="hidden items-center gap-2 rounded-full px-4 py-2.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:text-brand xl:flex"
            >
              <Phone className="size-4" aria-hidden />
              {site.phone}
            </a>
            <LinkButton href="/booking" size="sm" className="hidden h-11 px-5 sm:inline-flex">
              Book now
            </LinkButton>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="grid size-11 place-items-center rounded-full bg-surface-alt text-ink transition-colors hover:bg-line lg:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          "pointer-events-auto fixed inset-x-0 bottom-0 top-[5.25rem] z-40 overflow-y-auto transition-all duration-300 lg:hidden",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="shell pb-10">
          <div
            className={cn(
              "rounded-(--radius-shell) bg-surface p-3 shadow-(--shadow-lift) transition-transform duration-300",
              mobileOpen ? "translate-y-0" : "-translate-y-3",
            )}
          >
            <ul>
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-(--radius-inner) px-4 py-3.5 font-display text-xl font-semibold uppercase tracking-tight transition-colors",
                      isActive(item.href)
                        ? "bg-surface-alt text-brand"
                        : "text-ink hover:bg-surface-alt",
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children?.length ? (
                    <ul className="mb-1 ml-4 mt-1 space-y-0.5">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block rounded-(--radius-inner) px-4 py-2.5 text-[0.9375rem] text-muted transition-colors hover:bg-surface-alt hover:text-ink"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-3 grid gap-2 p-1">
              <LinkButton href="/booking" size="lg" className="w-full">
                Book a vehicle
              </LinkButton>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-surface-alt font-semibold text-ink"
              >
                <Phone className="size-4" aria-hidden />
                {site.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scrim behind the mobile sheet */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 -z-10 bg-ink/25 transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden
      />
    </header>
  );
}
