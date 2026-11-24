import { recordAudit } from "@/lib/audit";
import { jsonError, serverError } from "@/lib/api";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getTeamPerformance } from "@/lib/teamPerformance";
import { buildTeamPerformancePdf, teamPerformancePdfFilename } from "@/lib/teamPerformancePdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  const team = new URL(request.url).searchParams.get("team");
  if (!team || !team.trim() || team.length > 100) {
    return jsonError("A valid team is required.", 400);
  }

  try {
    await connectToDatabase();
    const rows = await getTeamPerformance(team);
    await recordAudit(auth.account, {
      action: "performance_report_downloaded",
      targetType: "team",
      targetId: team,
      details: { memberCount: rows.length, format: "pdf" },
    });
    return new Response(buildTeamPerformancePdf(team, rows), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${teamPerformancePdfFilename(team)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError("[ADMIN TEAM PERFORMANCE PDF ERROR]", error, "Unable to generate the performance PDF.");
  }
}
