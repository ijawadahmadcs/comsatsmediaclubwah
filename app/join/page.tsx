"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Check } from "lucide-react";

const interests = [
  "Photography",
  "Videography",
  "Graphic Design",
  "Video Editing",
  "Content Creation",
  "Digital Storytelling"
];

export default function JoinPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({
    type: "" as "success" | "error" | "",
    text: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    const payload = Object.fromEntries(
      Object.entries({
        fullName: values.name,
        registrationNumber: values.registrationNumber,
        department: values.department,
        semester: values.semester,
        contactNumber: values.phone,
        email: values.email,
        areaOfInterest: values.interest,
        motivation: values.motivation,
        expectations: values.expectations,
      }).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    );

    setIsSubmitting(true);
    setFormMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit application.");
      }

      form.reset();
      setFormMessage({ type: "success", text: result.message });
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Unable to submit application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* APPLICATION FORM */}
      <section
        id="application"
        className="mt-4 sm:mt-0 p-5"
      >
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="max-w-3xl">

            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              Application
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Tell us about
              <br />
              <span className="text-white/30">
                yourself.
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-white/40">
              Fill out the form below to express your interest in becoming
              part of the COMSATS Media Club.
            </p>

          </div>


          <form className="mt-14 space-y-10" onSubmit={handleSubmit}>

            {/* PERSONAL INFORMATION */}
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/30">
                Personal Information
              </p>

              <div className="grid gap-5 md:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>


                {/* REG NO */}
                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Registration Number
                  </label>

                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="e.g. FA23-BCS-001"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>


                {/* DEPARTMENT */}
                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Computer Science"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>


                {/* SEMESTER */}
                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Current Semester
                  </label>

                  <select
                    name="semester"
                    required
                    defaultValue=""
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#101216] px-5 py-4 text-sm text-white/60 outline-none transition focus:border-white/30"
                  >
                    <option value="" disabled>
                      Select semester
                    </option>

                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Semester {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>


            {/* CONTACT */}
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/30">
                Contact Information
              </p>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Contact Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="03XX-XXXXXXX"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="yourname@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

              </div>
            </div>


            {/* INTEREST */}
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/30">
                Creative Interest
              </p>

              <div className="max-w-xl">

                <label className="mb-2 block text-sm text-white/55">
                  Area you're interested in
                </label>

                <select
                  name="interest"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#101216] px-5 py-4 text-sm text-white/60 outline-none transition focus:border-white/30"
                >
                  <option value="" disabled>
                    Select your area of interest
                  </option>

                  {interests.map((interest) => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  ))}
                </select>

              </div>
            </div>


            {/* MOTIVATION */}
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/30">
                Your Motivation
              </p>

              <div className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    Why do you want to join the Media Club?
                  </label>

                  <textarea
                    name="motivation"
                    rows={5}
                    required
                    placeholder="Tell us what motivates you to join..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm text-white/55">
                    What do you expect from the Media Club?
                  </label>

                  <textarea
                    name="expectations"
                    rows={5}
                    placeholder="Tell us what you'd like to learn, experience, or contribute..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

              </div>
            </div>


            {/* SUBMIT */}
            <div className="border-t border-white/10 pt-8">

              <p className="mb-6 max-w-xl text-xs leading-6 text-white/25">
                By submitting this form, you confirm that the information
                provided is accurate and that you are interested in becoming
                part of the COMSATS Media Club.
              </p>

              {formMessage.text && (
                <p
                  role="status"
                  className={`mb-6 text-sm ${formMessage.type === "success" ? "text-emerald-300" : "text-red-300"}`}
                >
                  {formMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

            </div>

          </form>

        </div>
      </section>


      {/* WHAT WE VALUE */}
      <section className="m-4 mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">

          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            What We Value
          </p>

          <h2 className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            You don't need
            <br />
            <span className="text-white/30">
              to know everything.
            </span>
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">

            <div>
              <p className="text-lg font-medium">
                Curiosity
              </p>

              <p className="mt-3 text-sm leading-7 text-white/35">
                A willingness to explore, learn, and try something new.
              </p>
            </div>

            <div>
              <p className="text-lg font-medium">
                Creativity
              </p>

              <p className="mt-3 text-sm leading-7 text-white/35">
                Your ideas matter, whether they're behind a camera or
                outside the box.
              </p>
            </div>

            <div>
              <p className="text-lg font-medium">
                Commitment
              </p>

              <p className="mt-3 text-sm leading-7 text-white/35">
                The willingness to contribute, collaborate, and grow with
                the team.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="h-4 sm:h-5" />

    </>
  );
}