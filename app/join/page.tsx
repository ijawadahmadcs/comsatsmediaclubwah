"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import {
  APPLICATION_FIELD_LIMITS as LIMITS,
  APPLICATION_IMAGE_MAX_BYTES,
  APPLICATION_IMAGE_TYPES,
  APPLICATION_INTERESTS,
} from "@/lib/applicationRules";
import { resizeImageFile } from "@/lib/resizeImage";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
// Photos are shrunk in the browser before upload, so larger originals are fine here.
const MAX_ORIGINAL_IMAGE_BYTES = 15 * 1024 * 1024;
const FORM_FIELDS = [
  "fullName",
  "registrationNumber",
  "department",
  "semester",
  "contactNumber",
  "email",
  "areaOfInterest",
  "motivation",
  "expectations",
] as const;

export default function JoinPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({
    type: "" as "success" | "error" | "",
    text: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  // Release the previous preview URL whenever it changes, and on unmount.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function clearImage() {
    setImageFile(null);
    setImagePreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function rejectImage(text: string) {
    clearImage();
    setFormMessage({ type: "error", text });
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      clearImage();
      return;
    }
    if (!(APPLICATION_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      rejectImage("Please choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
      rejectImage("The image must be 15 MB or smaller.");
      return;
    }
    setIsProcessingImage(true);
    try {
      const resized = await resizeImageFile(file);
      if (resized.size > APPLICATION_IMAGE_MAX_BYTES) {
        rejectImage("This image is too large to upload. Please choose a smaller one.");
        return;
      }
      setImageFile(resized);
      setImagePreview(URL.createObjectURL(resized));
      setFormMessage({ type: "", text: "" });
    } finally {
      setIsProcessingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isProcessingImage) {
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setFormMessage({ type: "error", text: "Please complete the security check." });
      return;
    }

    const form = event.currentTarget;
    const source = new FormData(form);
    const payload = new FormData();
    for (const field of FORM_FIELDS) {
      const value = source.get(field);
      payload.set(field, typeof value === "string" ? value.trim() : "");
    }
    if (imageFile) payload.set("image", imageFile);
    if (turnstileToken) payload.set("turnstileToken", turnstileToken);

    setIsSubmitting(true);
    setFormMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        body: payload,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit application.");
      }

      form.reset();
      clearImage();
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
      // Each CAPTCHA token can only be verified once.
      if (turnstileSiteKey) setTurnstileResetKey((key) => key + 1);
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
                    name="fullName"
                    placeholder="Enter your full name"
                    required
                    maxLength={LIMITS.fullName}
                    autoComplete="name"
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
                    maxLength={LIMITS.registrationNumber}
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
                    maxLength={LIMITS.department}
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
                    name="contactNumber"
                    placeholder="03XX-XXXXXXX"
                    required
                    maxLength={LIMITS.contactNumber}
                    autoComplete="tel"
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
                    maxLength={LIMITS.email}
                    autoComplete="email"
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
                  Area you&apos;re interested in
                </label>

                <select
                  name="areaOfInterest"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#101216] px-5 py-4 text-sm text-white/60 outline-none transition focus:border-white/30"
                >
                  <option value="" disabled>
                    Select your area of interest
                  </option>

                  {APPLICATION_INTERESTS.map((interest) => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  ))}
                </select>

              </div>
            </div>


            {/* PROFILE IMAGE */}
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/30">
                Profile Image
              </p>
              <label className="block max-w-xl">
                <span className="mb-2 block text-sm text-white/55">
                  Upload a profile image (optional)
                </span>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={APPLICATION_IMAGE_TYPES.join(",")}
                  onChange={(event) => void handleImageChange(event)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:text-black"
                />
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt="Selected profile preview"
                    width={96}
                    height={96}
                    unoptimized
                    className="mt-4 h-24 w-24 rounded-xl border border-white/10 object-cover"
                  />
                )}
                <p className="mt-2 text-xs text-white/30">
                  {isProcessingImage ? "Preparing your photo..." : "JPEG, PNG, or WEBP. Large photos are resized automatically."}
                </p>
              </label>
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
                    maxLength={LIMITS.motivation}
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
                    maxLength={LIMITS.expectations}
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

              {turnstileSiteKey && (
                <div className="mb-6">
                  <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} resetKey={turnstileResetKey} />
                </div>
              )}

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
                disabled={isSubmitting || isProcessingImage}
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
            You don&apos;t need
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
                Your ideas matter, whether they&apos;re behind a camera or
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
