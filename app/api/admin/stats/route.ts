import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { findVisibleMembers } from "@/lib/teamMembers";
import Application from "@/models/Application";

export async function GET() {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const [members, totalApplications, pendingApplications, acceptedApplications, recentApplications] = await Promise.all([
      findVisibleMembers(),
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ["Pending", null] } }),
      Application.countDocuments({ status: "Accepted" }),
      Application.find().sort({ createdAt: -1 }).limit(5).select("fullName registrationNumber areaOfInterest status createdAt").lean(),
    ]);
    return NextResponse.json({
      success: true,
      totalTeamMembers: members.length,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      recentApplications: recentApplications.map((application) => ({ ...application, status: application.status || "Pending" })),
    });
  } catch (error) {
    return serverError("[ADMIN STATS ERROR]", error, "Unable to load dashboard statistics.");
  }
}
