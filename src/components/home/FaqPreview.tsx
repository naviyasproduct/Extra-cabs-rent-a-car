import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { LinkButton } from "@/components/ui/Button";
import { Grid, Section, Shell } from "@/components/ui/Layout";
import { getFaqs } from "@/lib/data/content";
import { site } from "@/lib/data/site";

/**
 * FAQ. Copy sits on columns 1-4, the accordion on 6-12, leaving one empty
 * column as a gutter so the two blocks read as related but distinct.
 */
export async function FaqPreview() {
  const faqs = await getFaqs();
  const preview = faqs.slice(0, 6);

  return (
    <Section band="paper" id="faq">
      <Shell>
        <Grid>
          <div className="col-span-4 md:col-span-8 lg:col-span-4">
            <p className="eyebrow mb-3">Good to know</p>
            <h2 className="display-lg">Common questions</h2>
            <p className="mt-4 max-w-[36ch] leading-relaxed text-muted">
              The things people ask before their first rental. If yours is not
              here, message us and you will get a straight answer.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/faq" variant="outline">
                All questions
                <ArrowUpRight className="size-4" aria-hidden />
              </LinkButton>
              <a
                href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-white transition-colors hover:bg-charcoal-soft"
              >
                <MessageCircle className="size-4" aria-hidden />
                Ask on WhatsApp
              </a>
            </div>
          </div>

          <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6">
            <Accordion
              items={preview.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
              }))}
              defaultOpenId={preview[0]?.id}
            />
          </div>
        </Grid>
      </Shell>
    </Section>
  );
}
