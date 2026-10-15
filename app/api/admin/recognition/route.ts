import { NextResponse } from "next/server";
import { jsonError, serverError } from "@/lib/api";
import { requireApiSuperAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import connectToDatabase from "@/lib/mongodb";
import { findMemberOfPeriod } from "@/lib/memberRecognition";
import RecognitionSetting from "@/models/RecognitionSetting";

const SETTING_KEY = "member-recognition";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const setting = await RecognitionSetting.findOne({ key: SETTING_KEY }).lean();
    const [week, month] = await Promise.all([findMemberOfPeriod(7), findMemberOfPeriod(30)]);
    return NextResponse.json({
      success: true,
      week,
      month,
      revealWeek: setting?.revealWeek ?? false,
      revealMonth: setting?.revealMonth ?? false,
    });
  } catch (error) {
    return serverError("[ADMIN RECOGNITION GET ERROR]", error, "Unable to load recognition settings.");
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request data.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid request data.", 400);
  const input = body as Record<string, unknown>;
  if (input.revealWeek !== undefined && typeof input.revealWeek !== "boolean") return jsonError("revealWeek must be a boolean.", 400);
  if (input.revealMonth !== undefined && typeof input.revealMonth !== "boolean") return jsonError("revealMonth must be a boolean.", 400);
  if (input.revealWeek === undefined && input.revealMonth === undefined) return jsonError("No recognition setting was provided.", 400);

  try {
    await connectToDatabase();
    const set: Record<string, unknown> = { updatedBy: auth.account.id };
    if (input.revealWeek !== undefined) set.revealWeek = input.revealWeek;
    if (input.revealMonth !== undefined) set.revealMonth = input.revealMonth;
    const setting = await RecognitionSetting.findOneAndUpdate(
      { key: SETTING_KEY },
      { $set: set, $setOnInsert: { key: SETTING_KEY } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, runValidators: true },
    ).lean();
    await recordAudit(auth.account, {
      action: "recognition_visibility_updated",
      targetType: "recognition_settings",
      targetId: SETTING_KEY,
      details: { revealWeek: setting.revealWeek, revealMonth: setting.revealMonth },
    });
    return NextResponse.json({ success: true, revealWeek: setting.revealWeek, revealMonth: setting.revealMonth });
  } catch (error) {
    return serverError("[ADMIN RECOGNITION PATCH ERROR]", error, "Unable to update recognition settings.");
  }
}
