import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";

function publicAdmin(admin: { _id: { toString(): string }; registrationNumber: string; name?: string; role: string; isActive: boolean; createdAt: Date }) {
  return { _id: admin._id.toString(), registrationNumber: admin.registrationNumber, name: admin.name, role: admin.role, isActive: admin.isActive, createdAt: admin.createdAt };
}

export async function GET() {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  try { await connectToDatabase(); const admins = await Admin.find().sort({ createdAt: 1 }).lean(); return NextResponse.json({ success: true, admins: admins.map(publicAdmin) }); }
  catch { return NextResponse.json({ success: false, message: "Unable to load administrators." }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body?.registrationNumber !== "string" || typeof body?.password !== "string" || body.password.length < 8) return NextResponse.json({ success: false, message: "Registration number and a password of at least 8 characters are required." }, { status: 400 });
    await connectToDatabase();
    const admin = await Admin.create({ registrationNumber: body.registrationNumber, passwordHash: await bcrypt.hash(body.password, 12), name: typeof body.name === "string" ? body.name : undefined, role: "admin" });
    return NextResponse.json({ success: true, admin: publicAdmin(admin) }, { status: 201 });
  } catch (error) { const duplicate = error instanceof Error && error.message.includes("duplicate"); return NextResponse.json({ success: false, message: duplicate ? "That registration number already exists." : "Unable to create administrator." }, { status: duplicate ? 409 : 500 }); }
}