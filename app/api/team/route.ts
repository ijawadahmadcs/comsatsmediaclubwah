import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import { isOwnCloudinaryImageUrl } from "@/lib/cloudinary";
import connectToDatabase from "@/lib/mongodb";
import { parseMemberInput } from "@/lib/teamMemberInput";
import { findVisibleMembers, toPublicMembers } from "@/lib/teamMembers";
import TeamMember from "@/models/TeamMember";

/** Public team list for the Team and Home pages: public fields only. Admins use /api/admin/team. */
export async function GET() {
  try {
    await connectToDatabase();
    const members = toPublicMembers(await findVisibleMembers());
    return NextResponse.json({ success: true, members });
  } catch (error) {
    return serverError("[TEAM GET ERROR]", error, "Unable to load team members.");
  }
}

export async function POST(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const parsed = parseMemberInput(body, "create");
  if ("error" in parsed) return jsonError(parsed.error, 400);
  if (parsed.set.image && !isOwnCloudinaryImageUrl(parsed.set.image)) {
    return jsonError("Photos must be uploaded through the admin panel.", 400);
  }

  try {
    await connectToDatabase();
    const member = await TeamMember.create(parsed.set);
    await recordAudit(auth.account, {
      action: "team_member_created",
      targetType: "team_member",
      targetId: member._id.toString(),
      details: { name: member.name, role: member.role },
    });
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    return serverError("[TEAM POST ERROR]", error, "Unable to create team member.");
  }
}
