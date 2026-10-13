import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isDuplicateKeyError, jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { normalizeRegistrationNumber, requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getPasswordError } from "@/lib/password";
import Admin, { type IAdmin } from "@/models/Admin";

type AdminRecord = Pick<IAdmin, "registrationNumber" | "name" | "role" | "isActive" | "createdAt"> & { _id: { toString(): string } };

function publicAdmin(admin: AdminRecord) {
  return { _id: admin._id.toString(), registrationNumber: admin.registrationNumber, name: admin.name, role: admin.role, isActive: admin.isActive, createdAt: admin.createdAt };
}

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const admins = await Admin.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, admins: admins.map(publicAdmin) });
  } catch (error) {
    return serverError("[ADMINS GET ERROR]", error, "Unable to load administrators.");
  }
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const body = await readJsonObject(request);
  const registrationNumber = typeof body?.registrationNumber === "string" ? normalizeRegistrationNumber(body.registrationNumber) : "";
  if (!registrationNumber || registrationNumber.length > 40) return jsonError("A valid registration number is required.", 400);
  if (body?.name !== undefined && (typeof body.name !== "string" || body.name.trim().length > 100)) {
    return jsonError("Names must be 100 characters or fewer.", 400);
  }
  const passwordError = getPasswordError(body?.password);
  if (passwordError) return jsonError(passwordError, 400);
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : undefined;

  try {
    await connectToDatabase();
    const admin = await Admin.create({ registrationNumber, passwordHash: await bcrypt.hash(body?.password as string, 12), name, role: "admin" });
    await recordAudit(auth.account, { action: "admin_created", targetType: "admin", targetId: admin._id.toString(), details: { registrationNumber, name } });
    return NextResponse.json({ success: true, admin: publicAdmin(admin) }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) return jsonError("That registration number already exists.", 409);
    return serverError("[ADMINS POST ERROR]", error, "Unable to create administrator.");
  }
}
