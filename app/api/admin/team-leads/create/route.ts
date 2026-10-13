import { NextResponse } from "next/server";
import { isDuplicateKeyError, isNonEmptyString, jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getPasswordError } from "@/lib/password";
import { InvalidTeamError, createTeamLead, publicTeamLead } from "@/lib/teamlead";

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const { name, registrationNumber, password, team, isActive } = body;
  if (
    !isNonEmptyString(name) || name.trim().length > 100 ||
    !isNonEmptyString(registrationNumber) || registrationNumber.trim().length > 40 ||
    !isNonEmptyString(team) ||
    (isActive !== undefined && typeof isActive !== "boolean")
  ) {
    return jsonError("Name, registration number and team are required.", 400);
  }
  const passwordError = getPasswordError(password);
  if (passwordError) return jsonError(passwordError, 400);

  try {
    await connectToDatabase();
    const admin = await createTeamLead({ name, registrationNumber, password: password as string, team, isActive: isActive !== false });
    await recordAudit(auth.account, {
      action: "teamlead_created",
      targetType: "admin",
      targetId: admin._id.toString(),
      details: { registrationNumber: admin.registrationNumber, name: admin.name, team: admin.team },
    });
    return NextResponse.json({ success: true, teamLead: publicTeamLead(admin) }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) return jsonError("Registration number already exists.", 409);
    if (error instanceof InvalidTeamError) return jsonError(error.message, 400);
    return serverError("[TEAM LEAD CREATE ERROR]", error, "Unable to create Team Lead.");
  }
}
