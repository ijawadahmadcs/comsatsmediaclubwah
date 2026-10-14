import { describe, expect, it } from "vitest";
import { validateApplicationSubmission } from "@/lib/applicationRules";
import { parseEventDate, parseEventInput, parseMemberIds } from "@/lib/eventInput";
import { getPasswordError } from "@/lib/password";
import { parseMemberInput } from "@/lib/teamMemberInput";

const MEMBER_ID = "507f1f77bcf86cd799439011";

describe("getPasswordError", () => {
  it("accepts a 12-character password", () => {
    expect(getPasswordError("correct horse")).toBeNull();
  });

  it.each([
    ["a missing password", undefined],
    ["a short password", "short-pass1"],
    ["leading spaces", "  long enough password"],
    ["trailing spaces", "long enough password  "],
    // bcrypt ignores everything after 72 bytes; 25 three-byte characters are 75 bytes.
    ["more than 72 bytes", "€".repeat(25)],
  ])("rejects %s", (_label, password) => {
    expect(getPasswordError(password)).not.toBeNull();
  });
});

describe("validateApplicationSubmission", () => {
  const valid = {
    fullName: "  Ayesha Khan ",
    registrationNumber: "fa23-bcs-001 ",
    department: "Computer Science",
    semester: "3",
    contactNumber: "0300-1234567",
    email: "Ayesha@Example.com",
    areaOfInterest: "Photography",
    motivation: "I love taking photos.",
  };

  it("trims and normalizes a valid application", () => {
    const result = validateApplicationSubmission(valid);
    expect(result).toEqual({
      data: expect.objectContaining({ fullName: "Ayesha Khan", registrationNumber: "FA23-BCS-001", email: "ayesha@example.com" }),
    });
  });

  it.each([
    ["a missing required field", { motivation: "   " }],
    ["a non-string field", { fullName: { $gt: "" } }],
    ["an over-long field", { motivation: "x".repeat(2001) }],
    ["an invalid registration number", { registrationNumber: "<script>" }],
    ["an out-of-range semester", { semester: "13" }],
    ["an invalid phone number", { contactNumber: "12345" }],
    ["an invalid email address", { email: "not-an-email" }],
    ["an area of interest that is not offered", { areaOfInterest: "Hacking" }],
  ])("rejects %s", (_label, change) => {
    expect(validateApplicationSubmission({ ...valid, ...change })).toHaveProperty("error");
  });
});

describe("event input", () => {
  it("requires a time zone so dates are not shifted by the server's zone", () => {
    expect(parseEventDate("2026-10-20T15:00")).toBeNull();
    expect(parseEventDate("2026-10-20T10:00:00.000Z")?.toISOString()).toBe("2026-10-20T10:00:00.000Z");
    expect(parseEventDate("2026-10-20T15:00:00+05:00")?.toISOString()).toBe("2026-10-20T10:00:00.000Z");
  });

  it.each(["1999-12-31T23:00:00Z", "2101-01-01T00:00:00Z", "not a dateZ", 1760000000000])("rejects %j", (value) => {
    expect(parseEventDate(value)).toBeNull();
  });

  it("validates and de-duplicates member ids", () => {
    expect(parseMemberIds([MEMBER_ID, MEMBER_ID])).toEqual([MEMBER_ID]);
    expect(parseMemberIds(["not-an-id"])).toBeNull();
    expect(parseMemberIds([{ $ne: null }])).toBeNull();
    expect(parseMemberIds(MEMBER_ID)).toBeNull();
    expect(parseMemberIds(Array.from({ length: 501 }, () => MEMBER_ID))).toBeNull();
  });

  it("requires a title and date when creating an event", () => {
    expect(parseEventInput({ title: "Orientation" }, "create")).toHaveProperty("error");
    expect(parseEventInput({ title: "  Orientation ", date: "2026-10-20T10:00:00Z" }, "create")).toEqual({
      title: "Orientation",
      date: new Date("2026-10-20T10:00:00Z"),
    });
  });

  it("only changes the fields sent when updating an event", () => {
    expect(parseEventInput({ description: " Bring cameras " }, "update")).toEqual({ description: "Bring cameras" });
    expect(parseEventInput({ title: "x".repeat(151) }, "update")).toHaveProperty("error");
  });
});

describe("parseMemberInput", () => {
  it("requires a name and role when creating a member", () => {
    expect(parseMemberInput({ name: "Ali" }, "create")).toHaveProperty("error");
    expect(parseMemberInput({ name: " Ali ", role: "Member" }, "create")).toEqual({ set: { name: "Ali", role: "Member" }, unset: {} });
  });

  it("clears emptied optional fields and resets a cleared display order to 0", () => {
    expect(parseMemberInput({ bio: "", semester: "", order: "" }, "update")).toEqual({
      set: { order: 0 },
      unset: { bio: "", semester: "" },
    });
  });

  it("does not allow clearing the name or role", () => {
    expect(parseMemberInput({ name: "  " }, "update")).toHaveProperty("error");
  });

  it.each(["javascript:alert(1)", "instagram.com/club", "https://exa mple.com"])("rejects the social link %j", (link) => {
    expect(parseMemberInput({ instagram: link }, "update")).toHaveProperty("error");
  });

  it("accepts http(s) social links", () => {
    expect(parseMemberInput({ linkedin: "https://www.linkedin.com/in/someone" }, "update")).toEqual({
      set: { linkedin: "https://www.linkedin.com/in/someone" },
      unset: {},
    });
  });

  it.each([
    ["a semester outside 1-12", { semester: 13 }],
    ["a fractional display order", { order: 1.5 }],
    ["a non-string field", { name: ["Ali"] }],
    ["an over-long field", { bio: "x".repeat(1001) }],
  ])("rejects %s", (_label, body) => {
    expect(parseMemberInput(body, "update")).toHaveProperty("error");
  });
});
