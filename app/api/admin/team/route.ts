import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";

/**
 * GET /api/admin/team — every team member with all fields (staff only), plus the accepted
 * applications that do not have a team member yet.
 */
export async function GET() {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const [members, acceptedApplications] = await Promise.all([
      TeamMember.find().sort({ order: 1, createdAt: 1 }).lean(),
      Application.find({ status: "Accepted" })
        .select("fullName registrationNumber department areaOfInterest")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const linkedApplicationIds = members.flatMap((member) => (member.applicationId ? [member.applicationId] : []));
    const linkedApplications = linkedApplicationIds.length
      ? await Application.find({ _id: { $in: linkedApplicationIds } }).select("status").lean()
      : [];
    const statusByApplication = new Map(linkedApplications.map((application) => [application._id.toString(), application.status || "Pending"]));
    const memberApplicationIds = new Set(linkedApplicationIds.map(String));
    // Older members were matched to applications by registration number only.
    const unlinkedRegistrations = new Set(
      members.filter((member) => !member.applicationId && member.registrationNumber).map((member) => member.registrationNumber!.trim().toUpperCase()),
    );

    return NextResponse.json({
      success: true,
      members: members.map((member) => {
        const applicationStatus = member.applicationId ? statusByApplication.get(member.applicationId.toString()) ?? "Deleted" : undefined;
        return {
          ...member,
          applicationStatus,
          // Members created from an application are hidden from the public site unless it is Accepted.
          isPublic: !member.applicationId || applicationStatus === "Accepted",
        };
      }),
      acceptedApplicants: acceptedApplications.filter(
        (application) =>
          !memberApplicationIds.has(application._id.toString()) &&
          !unlinkedRegistrations.has(application.registrationNumber.trim().toUpperCase()),
      ),
    });
  } catch (error) {
    return serverError("[ADMIN TEAM GET ERROR]", error, "Unable to load team members.");
  }
}
