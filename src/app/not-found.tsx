import { LinkButton } from "@/components/ui/Button";
import { Shell } from "@/components/ui/Layout";

/**
 * Global 404, for URLs that match no route at all.
 *
 * Deliberately bare. Next embeds this component in the payload of every page,
 * so pulling the navbar and footer in here would ship the whole footer twice on
 * every request. Site routes that call notFound() get (site)/not-found.tsx
 * instead, which inherits the real chrome.
 */
export default function NotFound() {
  return (
    <section className="pb-(--section-y) pt-[calc(4.75rem+var(--gap))] sm:pt-[calc(5.5rem+var(--gap))]">
      <Shell>
        <div className="rounded-(--radius-shell) bg-surface-alt px-6 py-20 text-center sm:px-8 lg:py-28">
          <p className="font-display text-[6rem] font-extrabold leading-none text-brand-bright lg:text-[9rem]">
            404
          </p>
          <h1 className="display-md mt-4">This road goes nowhere</h1>
          <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed text-muted">
            The page you were looking for has moved or never existed. The fleet is
            still where you left it.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <LinkButton href="/" size="lg">
              Back to home
            </LinkButton>
            <LinkButton href="/fleet" variant="light" size="lg">
              Browse the fleet
            </LinkButton>
          </div>
        </div>
      </Shell>
    </section>
  );
}
