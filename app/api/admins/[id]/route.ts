import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getPasswordError } from "@/lib/password";
import Admin, { type IAdmin } from "@/models/Admin";

type Context = { params: Promise<{ id: string }> };

const SUPERADMIN_TARGET_MESSAGE = "Superadmin accounts cannot be changed or deleted from the admin panel.";

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id) || id === auth.account.id) return jsonError("Invalid administrator target.", 400);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const set: Partial<Pick<IAdmin, "name" | "isActive" | "passwordHash">> = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length > 100) return jsonError("Names must be 100 characters or fewer.", 400);
    set.name = body.name.trim();
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return jsonError("Invalid account status.", 400);
    set.isActive = body.isActive;
  }
  if (body.password !== undefined) {
    const passwordError = getPasswordError(body.password);
    if (passwordError) return jsonError(passwordError, 400);
    set.passwordHash = await bcrypt.hash(body.password as string, 12);
  }
  if (!Object.keys(set).length) return jsonError("No changes provided.", 400);
  // A password reset or a deactivation signs the account out on every device.
  const revokeSessions = set.passwordHash !== undefined || set.isActive === false;

  try {
    await connectToDatabase();
    const target = await Admin.findById(id).select("role").lean();
    if (!target) return jsonError("Administrator not found.", 404);
    if (target.role === "superadmin") return jsonError(SUPERADMIN_TARGET_MESSAGE, 403);
    const admin = await Admin.findOneAndUpdate(
      { _id: id, role: { $ne: "superadmin" } },
      { $set: set, ...(revokeSessions ? { $inc: { sessionVersion: 1 } } : {}) },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!admin) return jsonError("Administrator not found.", 404);
    await recordAudit(auth.account, {
      action: "admin_updated",
      targetType: "admin",
      targetId: id,
      details: { registrationNumber: admin.registrationNumber, name: set.name, isActive: set.isActive, passwordReset: set.passwordHash !== undefined },
    });
    return NextResponse.json({
      success: true,
      admin: { _id: admin._id.toString(), registrationNumber: admin.registrationNumber, name: admin.name, role: admin.role, isActive: admin.isActive, createdAt: admin.createdAt },
    });
  } catch (error) {
    return serverError("[ADMINS PATCH ERROR]", error, "Unable to update administrator.");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id) || id === auth.account.id) return jsonError("You cannot delete this administrator.", 400);
  try {
    await connectToDatabase();
    const target = await Admin.findById(id).select("role").lean();
    if (!target) return jsonError("Administrator not found.", 404);
    if (target.role === "superadmin") return jsonError(SUPERADMIN_TARGET_MESSAGE, 403);
    const admin = await Admin.findOneAndDelete({ _id: id, role: { $ne: "superadmin" } }).lean();
    if (!admin) return jsonError("Administrator not found.", 404);
    await recordAudit(auth.account, {
      action: "admin_deleted",
      targetType: "admin",
      targetId: id,
      details: { registrationNumber: admin.registrationNumber, role: admin.role },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("[ADMINS DELETE ERROR]", error, "Unable to delete administrator.");
  }
}
