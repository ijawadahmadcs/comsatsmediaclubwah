// Rules for membership applications, shared by the join form (client) and the API (server).

export const APPLICATION_INTERESTS = [
  "Photography",
  "Videography",
  "Graphic Design",
  "Video Editing",
  "Content Creation",
  "Digital Storytelling",
] as const;

export const APPLICATION_FIELD_LIMITS = {
  fullName: 100,
  registrationNumber: 40,
  department: 100,
  contactNumber: 20,
  email: 254,
  areaOfInterest: 50,
  motivation: 2000,
  expectations: 2000,
} as const;

export const APPLICATION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Stays under Vercel's 4.5 MB request-body limit with room for the form fields.
// The join form shrinks photos in the browser first, so real uploads are far smaller.
export const APPLICATION_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export type ApplicationSubmission = {
  fullName: string;
  registrationNumber: string;
  department: string;
  semester: string;
  contactNumber: string;
  email: string;
  areaOfInterest: string;
  motivation: string;
  expectations?: string;
};

const FIELD_LABELS: Record<keyof typeof APPLICATION_FIELD_LIMITS, string> = {
  fullName: "Full name",
  registrationNumber: "Registration number",
  department: "Department",
  contactNumber: "Contact number",
  email: "Email address",
  areaOfInterest: "Area of interest",
  motivation: "Motivation",
  expectations: "Expectations",
};

const REQUIRED_FIELDS = [
  "fullName",
  "registrationNumber",
  "department",
  "semester",
  "contactNumber",
  "email",
  "areaOfInterest",
  "motivation",
] as const;

/** Uppercases and removes spaces, so "fa23-bcs-001 " and "FA23-BCS-001" are the same applicant. */
export function normalizeApplicantRegistrationNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function validateApplicationSubmission(
  input: Record<string, unknown>,
): { data: ApplicationSubmission } | { error: string } {
  const text = (key: string) => (typeof input[key] === "string" ? (input[key] as string).trim() : "");

  if (REQUIRED_FIELDS.some((field) => !text(field))) return { error: "Please complete all required fields." };

  for (const [field, limit] of Object.entries(APPLICATION_FIELD_LIMITS) as [keyof typeof APPLICATION_FIELD_LIMITS, number][]) {
    if (text(field).length > limit) return { error: `${FIELD_LABELS[field]} must be ${limit} characters or fewer.` };
  }

  const registrationNumber = normalizeApplicantRegistrationNumber(text("registrationNumber"));
  if (!/^[A-Z0-9][A-Z0-9/-]*$/.test(registrationNumber)) {
    return { error: "Please enter a valid registration number (e.g. FA23-BCS-001)." };
  }

  const semester = text("semester");
  if (!/^(?:[1-9]|1[0-2])$/.test(semester)) return { error: "Please select a valid semester." };

  const contactNumber = text("contactNumber");
  if (!/^\+?\d{10,15}$/.test(contactNumber.replace(/[\s()-]/g, ""))) {
    return { error: "Please provide a valid contact number (e.g. 0300-1234567)." };
  }

  const email = text("email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please provide a valid email address." };

  const areaOfInterest = text("areaOfInterest");
  if (!(APPLICATION_INTERESTS as readonly string[]).includes(areaOfInterest)) {
    return { error: "Please choose an area of interest from the list." };
  }

  return {
    data: {
      fullName: text("fullName"),
      registrationNumber,
      department: text("department"),
      semester,
      contactNumber,
      email,
      areaOfInterest,
      motivation: text("motivation"),
      expectations: text("expectations") || undefined,
    },
  };
}
