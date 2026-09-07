import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Grid, Shell } from "@/components/ui/Layout";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Every inner page opens with this, which is what keeps the top of the site
 * consistent: same clearance under the floating navbar, same slab, same
 * column positions for the title and the side slot.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs = [],
  aside,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  /** Right-hand slot on columns 9-12. */
  aside?: ReactNode;
  /** Optional block rendered below the header inside the same slab. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className="pt-[calc(4.75rem+var(--gap))] sm:pt-[calc(5.5rem+var(--gap))]">
      <Shell>
        <div
          className={cn(
            "rounded-(--radius-shell) bg-surface-alt px-6 py-10 sm:px-8 lg:px-12 lg:py-14",
            className,
          )}
        >
          {crumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="mb-7">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                <li>
                  <Link href="/" className="transition-colors hover:text-brand-bright">
                    Home
                  </Link>
                </li>
                {crumbs.map((crumb) => (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    <ChevronRight className="size-3.5 text-line-strong" aria-hidden />
                    {crumb.href ? (
                      <Link href={crumb.href} className="transition-colors hover:text-brand-bright">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-ink">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <Grid className="items-end">
            <div className="col-span-4 md:col-span-8 lg:col-span-7">
              {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
              <h1 className="display-lg">{title}</h1>
              {description ? (
                <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-ink-soft">
                  {description}
                </p>
              ) : null}
            </div>
            {aside ? (
              <div className="col-span-4 mt-8 md:col-span-8 lg:col-span-4 lg:col-start-9 lg:mt-0">
                {aside}
              </div>
            ) : null}
          </Grid>

          {children}
        </div>
      </Shell>
    </section>
  );
}
