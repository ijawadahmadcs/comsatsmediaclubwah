import { describe, expect, it } from "vitest";
import { buildTeamPerformanceRows } from "@/lib/teamPerformance";

describe("team performance ranking", () => {
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
