"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * FAQ accordion. Rows are separated by hairline rules rather than boxed in
 * borders, which keeps the list flush with the grid column it sits in.
 */
export function Accordion({
  items,
  defaultOpenId,
  className,
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className={cn("w-full", className)}>
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} id={item.id}>
            {index > 0 ? <div className="rule" /> : null}
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`${item.id}-panel`}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-brand-bright">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300",
                    isOpen ? "rotate-45 bg-brand text-white" : "bg-surface-alt text-ink",
                  )}
                  aria-hidden
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={`${item.id}-panel`}
              hidden={!isOpen}
              className="pb-6 pr-14 text-[0.9375rem] leading-relaxed text-muted"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
