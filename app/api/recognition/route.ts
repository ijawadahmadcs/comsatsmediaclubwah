import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import { findMemberOfPeriod } from "@/lib/memberRecognition";
import RecognitionSetting from "@/models/RecognitionSetting";

export async function GET() {
  try {
    await connectToDatabase();
    const setting = await RecognitionSetting.findOne({ key: "member-recognition" }).lean();
    const [week, month] = await Promise.all([
      setting?.revealWeek ? findMemberOfPeriod(7) : Promise.resolve(null),
      setting?.revealMonth ? findMemberOfPeriod(30) : Promise.resolve(null),
    ]);
    return NextResponse.json({ success: true, week, month });
  } catch (error) {
    return serverError("[RECOGNITION GET ERROR]", error, "Unable to load member recognition.");
  }
}
