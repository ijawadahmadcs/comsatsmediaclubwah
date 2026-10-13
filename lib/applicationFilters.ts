import type { QueryFilter } from "mongoose";
import type { IApplication } from "@/models/Application";

export const MAX_SEARCH_LENGTH = 100;

const SEARCH_FIELDS = ["fullName", "registrationNumber", "email", "department", "areaOfInterest"] as const;

/** Escapes user input so it matches literally inside a MongoDB $regex. */
export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the MongoDB filter for the admin Applications list and the export, so both always
 * return the same records. "Pending" and "Unpaid" include older records with no value set.
 */
export function buildApplicationFilter(params: URLSearchParams): QueryFilter<IApplication> {
  const read = (key: string) => {
    const value = params.get(key)?.trim();
    return value && value !== "All" ? value : null;
  };
  const conditions: QueryFilter<IApplication>[] = [];

  const status = read("status");
  if (status) conditions.push({ status: status === "Pending" ? { $in: ["Pending", null] } : status } as QueryFilter<IApplication>);

  const paymentStatus = read("paymentStatus");
  if (paymentStatus) {
    conditions.push({ paymentStatus: paymentStatus === "Unpaid" ? { $in: ["Unpaid", null] } : paymentStatus } as QueryFilter<IApplication>);
  }

  for (const field of ["department", "semester", "areaOfInterest"] as const) {
    const value = read(field);
    if (value) conditions.push({ [field]: value } as QueryFilter<IApplication>);
  }

  const search = params.get("search")?.trim().slice(0, MAX_SEARCH_LENGTH);
  if (search) {
    const pattern = escapeRegex(search);
    conditions.push({ $or: SEARCH_FIELDS.map((field) => ({ [field]: { $regex: pattern, $options: "i" } })) } as QueryFilter<IApplication>);
  }

  return conditions.length ? { $and: conditions } : {};
}
