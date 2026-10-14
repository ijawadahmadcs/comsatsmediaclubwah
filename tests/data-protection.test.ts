import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildApplicationFilter, escapeRegex } from "@/lib/applicationFilters";
import { isOwnCloudinaryImageUrl, parseOwnCloudinaryUrl } from "@/lib/cloudinary";
import { detectImageType } from "@/lib/fileSignature";
import { getClientIp } from "@/lib/rateLimit";
import { safeSpreadsheetCell } from "@/lib/spreadsheet";
import { toPublicMembers, type MemberRecord } from "@/lib/teamMembers";

const CLOUD = "club-cloud";
const OWN_IMAGE = `https://res.cloudinary.com/${CLOUD}/image/upload/v1700000000/media-club/team/abc_123.jpg`;

beforeAll(() => {
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", CLOUD);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("application search filter", () => {
  it("escapes regular expression syntax so searches match literally (no ReDoS)", () => {
    const pattern = escapeRegex("(a+)+$ [x] .*");
    expect(new RegExp(pattern).test("(a+)+$ [x] .*")).toBe(true);
    expect(new RegExp(pattern).test("aaaa")).toBe(false);
  });

  it("returns an empty filter when nothing is selected", () => {
    expect(buildApplicationFilter(new URLSearchParams("status=All&search=%20"))).toEqual({});
  });

  it('includes records with no status or payment value under "Pending" and "Unpaid"', () => {
    expect(buildApplicationFilter(new URLSearchParams("status=Pending&paymentStatus=Unpaid"))).toEqual({
      $and: [{ status: { $in: ["Pending", null] } }, { paymentStatus: { $in: ["Unpaid", null] } }],
    });
  });

  it("caps the search length", () => {
    const filter = buildApplicationFilter(new URLSearchParams({ search: "a".repeat(500) })) as {
      $and: [{ $or: { fullName?: { $regex: string } }[] }];
    };
    expect(filter.$and[0].$or[0].fullName?.$regex).toHaveLength(100);
  });
});

describe("CSV export cells", () => {
  it.each(["=HYPERLINK(\"http://evil\")", "+1+1", "-2+3", "@SUM(A1)", "  =1+1", "\t=1", "\r=1"])(
    "neutralizes the formula %j",
    (value) => {
      expect(safeSpreadsheetCell(value)).toBe(`'${value}`);
    },
  );

  it.each(["Ayesha Khan", "a=b", "03001234567", 42, null])("leaves %j unchanged", (value) => {
    expect(safeSpreadsheetCell(value)).toBe(value);
  });
});

describe("detectImageType", () => {
  const bytes = (...values: number[]) => new Uint8Array(values);
  const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0));

  it("recognizes JPEG, PNG and WEBP by their first bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("image/png");
    expect(detectImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))).toBe("image/webp");
  });

  it("rejects other files, whatever MIME type the browser claimed", () => {
    expect(detectImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectImageType(bytes(...ascii("<svg onload=alert(1)>")))).toBeNull();
    expect(detectImageType(bytes(0xff, 0xd8))).toBeNull();
  });
});

describe("Cloudinary URL checks", () => {
  it("parses original uploads on this account", () => {
    expect(parseOwnCloudinaryUrl(OWN_IMAGE)).toEqual({ resourceType: "image", publicId: "media-club/team/abc_123", format: "jpg" });
    expect(parseOwnCloudinaryUrl(`https://res.cloudinary.com/${CLOUD}/video/upload/media-club/work/clip.mp4`)).toEqual({
      resourceType: "video",
      publicId: "media-club/work/clip",
      format: "mp4",
    });
  });

  it.each([
    ["another account", "https://res.cloudinary.com/someone-else/image/upload/v1/a.jpg"],
    ["plain http", OWN_IMAGE.replace("https:", "http:")],
    ["another host", "https://evil.example/club-cloud/image/upload/v1/a.jpg"],
    ["a query string", `${OWN_IMAGE}?x=1`],
    ["a fetch URL that proxies another site", `https://res.cloudinary.com/${CLOUD}/image/fetch/https://evil.example/a.jpg`],
    ["a transformation", `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,w_100/v1/a.jpg`],
    ["path traversal", `https://res.cloudinary.com/${CLOUD}/image/upload/../../someone-else/a.jpg`],
    ["a non-string", { url: OWN_IMAGE }],
  ])("rejects %s", (_label, value) => {
    expect(parseOwnCloudinaryUrl(value)).toBeNull();
  });

  it("only treats JPEG, PNG and WEBP images as displayable images", () => {
    expect(isOwnCloudinaryImageUrl(OWN_IMAGE)).toBe(true);
    expect(isOwnCloudinaryImageUrl(OWN_IMAGE.replace(".jpg", ".svg"))).toBe(false);
    expect(isOwnCloudinaryImageUrl(`https://res.cloudinary.com/${CLOUD}/video/upload/v1/a.mp4`)).toBe(false);
  });
});

describe("toPublicMembers", () => {
  const member = (fields: Partial<MemberRecord>): MemberRecord =>
    ({
      _id: new Types.ObjectId(),
      name: "Member",
      role: "Member",
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...fields,
    }) as MemberRecord;

  it("never publishes registration numbers, departments or application links", () => {
    const published = toPublicMembers([
      member({ registrationNumber: "FA23-BCS-001", department: "CS", applicationId: new Types.ObjectId(), bio: "Hi" }),
    ]);
    // What the API actually sends (JSON drops undefined fields).
    const [sent] = JSON.parse(JSON.stringify(published));
    expect(Object.keys(sent).sort()).toEqual(["_id", "group", "name", "order", "role"]);
  });

  it("publishes phone numbers for core office-bearers only", () => {
    const [president, lead, general] = toPublicMembers([
      member({ role: "President", contactNumber: "0300-0000001" }),
      member({ role: "Photography Lead", contactNumber: "0300-0000002" }),
      member({ role: "Member", contactNumber: "0300-0000003" }),
    ]);
    expect(president).toMatchObject({ group: "core", contactNumber: "0300-0000001" });
    expect(lead).toMatchObject({ group: "lead" });
    expect(lead.contactNumber).toBeUndefined();
    expect(general.contactNumber).toBeUndefined();
  });

  it("drops photos that are not uploads on the club's Cloudinary account", () => {
    const [own, external] = toPublicMembers([member({ image: OWN_IMAGE }), member({ image: "https://evil.example/tracker.png" })]);
    expect(own.image).toBe(OWN_IMAGE);
    expect(external.image).toBeUndefined();
  });

  it("does not list a leader a second time under general members", () => {
    const published = toPublicMembers([
      member({ name: "Sara", role: "Treasurer", registrationNumber: "FA22-BBA-010" }),
      member({ name: "Sara", role: "Member", registrationNumber: "fa22-bba-010 " }),
    ]);
    expect(published.map((entry) => entry.group)).toEqual(["core"]);
  });
});

describe("getClientIp", () => {
  const request = (headers: Record<string, string>) => new Request("https://club.example", { headers });

  it("prefers x-real-ip, then the first x-forwarded-for address", () => {
    expect(getClientIp(request({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" }))).toBe("203.0.113.7");
    expect(getClientIp(request({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(getClientIp(request({}))).toBe("unknown");
  });
});
