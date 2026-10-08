import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";
import { getTeamScope } from "@/lib/teamScope";

export async function getApprovedTeamMemberIds(team: string) {
  const applications = await Application.find({
    status: "Accepted",
    areaOfInterest: { $in: getTeamScope(team) },
  })
    .select("_id registrationNumber")
    .lean();

  if (!applications.length) return [];

  const applicationIds = applications.map((application) => application._id);
  const registrationNumbers = applications.map((application) => application.registrationNumber);
  const members = await TeamMember.find({
    $or: [
      { applicationId: { $in: applicationIds } },
      { registrationNumber: { $in: registrationNumbers } },
    ],
  })
    .select("_id")
    .lean();

  return members.map((member) => member._id.toString());
}
