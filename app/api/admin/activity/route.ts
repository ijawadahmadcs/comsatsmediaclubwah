import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Log from "@/models/Log";

const PAGE_SIZE = 50;

/** GET /api/admin/activity?page=1 — the audit trail, newest first (superadmin only). */
export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  const requestedPage = Number.parseInt(new URL(request.url).searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10_000) : 1;
  try {
    await connectToDatabase();
    const [entries, total] = await Promise.all([
      Log.find().sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
      Log.countDocuments(),
    ]);
    return NextResponse.json({
      success: true,
      page,
      pageSize: PAGE_SIZE,
      total,
      entries: entries.map((entry) => ({
        _id: entry._id.toString(),
        action: entry.action,
        actorId: entry.adminId?.toString(),
        actorRole: entry.actorRole,
        actorRegistrationNumber: entry.actorRegistrationNumber,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    return serverError("[ACTIVITY GET ERROR]", error, "Unable to load activity.");
  }
}
