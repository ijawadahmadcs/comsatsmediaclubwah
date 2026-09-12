import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";

export async function GET() {
  if (!(await requireApiAdmin())) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  try {
    await connectToDatabase();
    const [totalTeamMembers, totalApplications, pendingApplications, acceptedApplications, recentApplications] = await Promise.all([
      TeamMember.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ $or: [{ status: "Pending" }, { status: { $exists: false } }] }),
      Application.countDocuments({ status: "Accepted" }),
      Application.find().sort({ createdAt: -1 }).limit(5).select("fullName registrationNumber areaOfInterest status createdAt").lean(),
    ]);
    return NextResponse.json({ success: true, totalTeamMembers, totalApplications, pendingApplications, acceptedApplications, recentApplications: recentApplications.map((application) => ({ ...application, status: application.status || "Pending" })) });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load dashboard statistics." }, { status: 500 });
  }
}