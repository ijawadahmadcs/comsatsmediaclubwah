import { describe, expect, it } from "vitest";
import { buildTeamPerformanceRows } from "@/lib/teamPerformance";
import { buildClubMemberIdOrder } from "@/lib/teamMembers";
import mongoose from "mongoose";

describe("team performance ranking", () => {
  it("assigns IDs by hierarchy and skips advisors", () => {
    const member = (name: string, role: string) => ({
      _id: new mongoose.Types.ObjectId(),
      name,
      role,
      createdAt: new Date("2026-01-01"),
    });
    const members = [
      member("Regular One", "General Member"),
      member("Advisor", "Faculty Advisor"),
      member("Photography Lead", "Photography Lead"),
      member("President", "President"),
      member("Vice President", "Vice President"),
      member("General Secretary", "General Secretary"),
      member("Treasurer", "Treasurer"),
      member("Media Secretary", "Media/Communications Secretary"),
      member("Videography Lead", "Videography Lead"),
      member("Regular Two", "General Member"),
    ];

    const { ordered, advisors } = buildClubMemberIdOrder(members);

    expect(ordered.slice(0, 5).map((item) => item.name)).toEqual([
      "President",
      "Vice President",
      "General Secretary",
      "Treasurer",
      "Media Secretary",
    ]);
    expect(ordered.slice(5, 7).map((item) => item.name)).toEqual([
      "Photography Lead",
      "Videography Lead",
    ]);
    expect(advisors.map((item) => item.name)).toEqual(["Advisor"]);
  });

  it("ranks members by attendance and star rating, best first", () => {
    const members = [
      { _id: { toString: () => "1" }, name: "Ayesha", role: "Member" },
      { _id: { toString: () => "2" }, name: "Bilal", role: "Member" },
      { _id: { toString: () => "3" }, name: "Zara", role: "Member" },
    ];
    const event = (ratingKey: string, rating: number) => ({
      assignedMembers: [{ toString: () => "1" }, { toString: () => "2" }, { toString: () => "3" }],
      attendance: [{ toString: () => "1" }, { toString: () => "2" }, { toString: () => "3" }],
      ratings: { [ratingKey]: rating },
    });

    const rows = buildTeamPerformanceRows(members, [
      event("1", 5),
      event("2", 4),
      event("3", 3),
    ]);

    expect(rows.map((row) => row.name)).toEqual(["Ayesha", "Bilal", "Zara"]);
    expect(rows[0].averageRating).toBe(5);
    expect(rows[0].attendancePercent).toBe(100);
    expect(rows[0].score).toBe(100);
  });

  it("includes members with no events and places them after active members", () => {
    const rows = buildTeamPerformanceRows(
      [
        { _id: { toString: () => "1" }, name: "Active", role: "Member" },
        { _id: { toString: () => "2" }, name: "Inactive", role: "Member" },
      ],
      [{
        assignedMembers: [{ toString: () => "1" }],
        attendance: [{ toString: () => "1" }],
        ratings: { "1": 4 },
      }],
    );

    expect(rows.map((row) => row.name)).toEqual(["Active", "Inactive"]);
    expect(rows[1].assignedEvents).toBe(0);
    expect(rows[1].score).toBe(0);
  });
});
