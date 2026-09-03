"use client";

import { useState } from "react";
import { CircleCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";

const subjects = [
  "General enquiry",
  "Self-drive rental",
  "Cab with a driver",
  "Airport transfer",
  "Wedding car",
  "Long-term lease",
  "Feedback or complaint",
];

/**
 * Contact form. Front end only — `submit` is the single seam where a POST to
 * /api/contact goes once the backend exists.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: subjects[0],
    message: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    // BACKEND SEAM: POST `form` to /api/contact here.
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-(--radius-card) bg-surface p-8 text-center lg:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-tint text-brand">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-6 font-display text-2xl font-bold uppercase">
          Message sent
        </h2>
        <p className="mx-auto mt-3 max-w-[42ch] leading-relaxed text-muted">
          Thanks {form.name.split(" ")[0] || "for getting in touch"}. We reply to
          everything within one working day, usually much sooner. If it is
          urgent, call us instead.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-7"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", phone: "", subject: subjects[0], message: "" });
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-(--radius-card) bg-surface p-6 lg:p-8">
      <h2 className="font-display text-xl font-bold uppercase">Send us a message</h2>
      <p className="mt-2 text-muted">
        Tell us what you need and we will come back with a straight answer and a
        price.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name">
          <Input
            id="contact-name"
            required
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            autoComplete="name"
          />
        </Field>

        <Field label="Phone" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            type="tel"
            required
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            placeholder="+94 77 000 0000"
            autoComplete="tel"
          />
        </Field>

        <Field label="Email" htmlFor="contact-email" className="sm:col-span-2">
          <Input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field label="Subject" htmlFor="contact-subject" className="sm:col-span-2">
          <Select
            id="contact-subject"
            value={form.subject}
            onChange={(event) => set("subject", event.target.value)}
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Message" htmlFor="contact-message" className="sm:col-span-2">
          <Textarea
            id="contact-message"
            rows={5}
            required
            value={form.message}
            onChange={(event) => set("message", event.target.value)}
            placeholder="Dates, vehicle, pickup location, anything else we should know…"
          />
        </Field>
      </div>

      <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto">
        <Send className="size-4" aria-hidden />
        Send message
      </Button>
    </form>
  );
}
