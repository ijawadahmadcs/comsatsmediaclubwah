import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { isDuplicateKeyError, isNonEmptyString, jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getPasswordError } from "@/lib/password";
import { InvalidTeamError, publicTeamLead, updateTeamLead } from "@/lib/teamlead";
import Admin from "@/models/Admin";

type Context = { params: Promise<{ id: string }> };

const notFound = () => jsonError("Team Lead not found.", 404);

export async function GET(_request: Request, { params }: Context) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  try {
    await connectToDatabase();
    const admin = await Admin.findOne({ _id: id, role: "teamlead" }).lean();
    if (!admin) return notFound();
    return NextResponse.json({ success: true, teamLead: publicTeamLead(admin) });
  } catch (error) {
    return serverError("[TEAM LEAD GET ERROR]", error, "Unable to load Team Lead.");
  }
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);

  const updates: Parameters<typeof updateTeamLead>[1] = {};
  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name) || body.name.trim().length > 100) return jsonError("Name must be 1-100 characters.", 400);
    updates.name = body.name;
  }
  if (body.registrationNumber !== undefined) {
    if (!isNonEmptyString(body.registrationNumber) || body.registrationNumber.trim().length > 40) return jsonError("Invalid registration number.", 400);
    updates.registrationNumber = body.registrationNumber;
  }
  if (body.team !== undefined) {
    if (!isNonEmptyString(body.team)) return jsonError("Invalid Team Lead team.", 400);
    updates.team = body.team;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return jsonError("Invalid account status.", 400);
    updates.isActive = body.isActive;
  }
  if (body.password !== undefined) {
    const passwordError = getPasswordError(body.password);
    if (passwordError) return jsonError(passwordError, 400);
    updates.password = body.password as string;
  }
  if (!Object.keys(updates).length) return jsonError("No changes provided.", 400);

  try {
    await connectToDatabase();
    const updated = await updateTeamLead(id, updates);
    if (!updated) return notFound();
    await recordAudit(auth.account, {
      action: "teamlead_updated",
      targetType: "admin",
      targetId: id,
      details: {
        registrationNumber: updated.registrationNumber,
        name: updates.name,
        team: updates.team,
        isActive: updates.isActive,
        passwordReset: updates.password !== undefined,
      },
    });
    return NextResponse.json({ success: true, teamLead: publicTeamLead(updated) });
  } catch (error) {
    if (isDuplicateKeyError(error)) return jsonError("Registration number already exists.", 409);
    if (error instanceof InvalidTeamError) return jsonError(error.message, 400);
    return serverError("[TEAM LEAD UPDATE ERROR]", error, "Unable to update Team Lead.");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  try {
    await connectToDatabase();
    const deleted = await Admin.findOneAndDelete({ _id: id, role: "teamlead" }).lean();
    if (!deleted) return notFound();
    await recordAudit(auth.account, {
      action: "teamlead_deleted",
      targetType: "admin",
      targetId: id,
      details: { registrationNumber: deleted.registrationNumber, team: deleted.team },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("[TEAM LEAD DELETE ERROR]", error, "Unable to delete Team Lead.");
  }
}
