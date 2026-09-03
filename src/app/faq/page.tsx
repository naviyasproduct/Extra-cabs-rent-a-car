import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion } from "@/components/ui/Accordion";
import { Grid, Section, Shell } from "@/components/ui/Layout";
import { faqCategoryLabels, getFaqs } from "@/lib/data/content";
import { site } from "@/lib/data/site";
import type { Faq } from "@/types";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Requirements, deposits, insurance, kilometre limits and cancellation — the questions people ask before renting from us.",
};

const order: Faq["category"][] = ["booking", "requirements", "payment", "vehicle"];

export default async function FaqPage() {
  const faqs = await getFaqs();

  const grouped = order
    .map((category) => ({
      category,
      label: faqCategoryLabels[category],
      items: faqs.filter((faq) => faq.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Questions, answered"
        description="Everything people ask before their first rental. If yours is not here, call or message us and you will get a straight answer."
        crumbs={[{ label: "FAQ" }]}
        aside={
          <div className="rounded-(--radius-card) bg-surface p-6">
            <h2 className="font-display text-lg font-bold uppercase">
              Still not sure?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              We would rather answer a question now than have you find out at
              handover.
            </p>
            <a
              href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <MessageCircle className="size-4" aria-hidden />
              Message on WhatsApp
            </a>
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface-alt font-semibold transition-colors hover:bg-line"
            >
              <Phone className="size-4 text-brand" aria-hidden />
              {site.phone}
            </a>
          </div>
        }
      />

      <Section band="paper">
        <Shell>
          <div className="grid gap-(--section-y)">
            {grouped.map((group) => (
              <Grid key={group.category} id={group.category} className="items-start">
                <div className="col-span-4 md:col-span-8 lg:col-span-4">
                  <h2 className="display-md">{group.label}</h2>
                  <p className="mt-3 text-muted">
                    {group.items.length} question
                    {group.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6">
                  <div className="rounded-(--radius-card) bg-surface px-6 lg:px-8">
                    <Accordion
                      items={group.items.map((faq) => ({
                        id: faq.id,
                        question: faq.question,
                        answer: faq.answer,
                      }))}
                    />
                  </div>
                </div>
              </Grid>
            ))}
          </div>
        </Shell>
      </Section>
    </>
  );
}
