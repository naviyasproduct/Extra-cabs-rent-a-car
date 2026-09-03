import { Grid, Section, Shell } from "@/components/ui/Layout";

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
}

/**
 * Shared body for /terms and /privacy: a sticky contents rail on columns 1-3
 * and the prose on 5-12, on the same grid as every other page.
 */
export function LegalBody({ sections }: { sections: LegalSection[] }) {
  return (
    <Section band="paper">
      <Shell>
        <Grid className="items-start">
          <nav className="col-span-4 md:col-span-8 lg:col-span-3" aria-label="Contents">
            <div className="rounded-(--radius-card) bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                On this page
              </h2>
              <ul className="mt-4 space-y-2.5">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-[0.9375rem] text-ink-soft transition-colors hover:text-brand"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="col-span-4 mt-(--gap) md:col-span-8 lg:col-span-8 lg:col-start-5 lg:mt-0">
            <div className="rounded-(--radius-card) bg-surface p-6 lg:p-10">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  {index > 0 ? <div className="rule my-8" /> : null}
                  <h2 className="font-display text-2xl font-bold uppercase">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="mt-4 leading-relaxed text-ink-soft"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.list ? (
                    <ul className="mt-5 space-y-2.5">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span
                            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                          <span className="text-ink-soft">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </Grid>
      </Shell>
    </Section>
  );
}
