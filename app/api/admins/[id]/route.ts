import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const current = await requireApiSuperAdmin();
  if (!current) return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id) || id === current.id) return NextResponse.json({ success: false, message: "Invalid administrator target." }, { status: 400 });
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body?.name === "string") updates.name = body.name.trim();
    if (typeof body?.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body?.password === "string") { if (body.password.length < 8) return NextResponse.json({ success: false, message: "Password must be at least 8 characters." }, { status: 400 }); updates.passwordHash = await bcrypt.hash(body.password, 12); }
    await connectToDatabase();
    const admin = await Admin.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator not found." }, { status: 404 });
    return NextResponse.json({ success: true, admin: { _id: admin._id, registrationNumber: admin.registrationNumber, name: admin.name, role: admin.role, isActive: admin.isActive, createdAt: admin.createdAt } });
  } catch { return NextResponse.json({ success: false, message: "Unable to update administrator." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  const current = await requireApiSuperAdmin();
  if (!current) return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id) || id === current.id) return NextResponse.json({ success: false, message: "You cannot delete this administrator." }, { status: 400 });
  try { await connectToDatabase(); const admin = await Admin.findByIdAndDelete(id); if (!admin) return NextResponse.json({ success: false, message: "Administrator not found." }, { status: 404 }); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ success: false, message: "Unable to delete administrator." }, { status: 500 }); }
}