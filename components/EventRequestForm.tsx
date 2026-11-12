"use client";

import { FormEvent, useCallback, useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function EventRequestForm() {
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const handleTurnstileToken = useCallback(
    (token: string) => setTurnstileToken(token),
    [],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (turnstileSiteKey && !turnstileToken) {
      setMessage({
        type: "error",
        text: "Please complete the security check.",
      });
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startsAt = form.get("startsAt");
    const endsAt = form.get("endsAt");
    const payload = Object.fromEntries(form.entries());
    if (typeof startsAt !== "string" || typeof endsAt !== "string") return;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setMessage({
        type: "error",
        text: "Please choose a valid ending time after the starting time.",
      });
      return;
    }
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch("/api/event-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          requestedPersons: Number(payload.requestedPersons),
          turnstileToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success)
        throw new Error(
          result.message || "Unable to submit the coverage request.",
        );
      formElement.reset();
      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to submit the coverage request.",
      });
    } finally {
      setSubmitting(false);
      if (turnstileSiteKey) {
        setTurnstileToken("");
        setResetKey((key) => key + 1);
      }
    }
  }

  return (
    <section id="request-coverage" className="my-6 px-4 sm:px-6">
      <div className="rounded-[2rem]  border border-blue-200/10 bg-[#0b0d10] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-200/60">
          Event coverage
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          Request our team for your event.
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
          Societies and university event organizers can send their event details
          to us using this form. Our team will review your request and get back to you as soon as possible. Please provide accurate information to help us serve you better.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
          We will respond to your request within 24-48 hours.
        </p>
        <form onSubmit={submit} className="mt-10 grid gap-5 md:grid-cols-2">
          <Field label="Name of event" name="eventName" required />
          <Field label="Society organizing the event" name="society" required />
          <Field label="Location / room number" name="location" required />
          <Field label="Student lead name" name="studentLeadName" required />
          <Field
            label="Student lead contact"
            name="studentLeadContact"
            required
            type="tel"
          />
          <Field label="Faculty lead name (optional)" name="facultyLeadName" />
          <Field
            label="Starting date and time"
            name="startsAt"
            required
            type="datetime-local"
          />
          <Field
            label="Ending date and time"
            name="endsAt"
            required
            type="datetime-local"
          />
          <label className="block text-sm text-white/65">
            Required team
            <select
              name="requestedTeam"
              required
              defaultValue="Photography"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-white/30"
            >
              <option value="Photography">Photography only</option>
              <option value="Videography">Videography only</option>
              <option value="Both">Both photography and videography</option>
            </select>
          </label>
          <Field
            label="Number of persons required"
            name="requestedPersons"
            required
            type="number"
            min="1"
            max="100"
          />
          {turnstileSiteKey && (
            <div className="md:col-span-2">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                resetKey={resetKey}
                onToken={handleTurnstileToken}
              />
            </div>
          )}
          {message.text && (
            <p
              className={`md:col-span-2 text-sm ${message.type === "success" ? "text-emerald-300" : "text-red-300"}`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-gray-100 disabled:opacity-50"
          >
            {submitting ? "Sending request..." : "Request team"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  required = false,
  type = "text",
  min,
  max,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block text-sm text-white/65">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-white/30"
      />
    </label>
  );
}
