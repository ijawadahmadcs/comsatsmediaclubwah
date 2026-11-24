import { recordAudit } from "@/lib/audit";
import { serverError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getTeamPerformance } from "@/lib/teamPerformance";
import { buildTeamPerformancePdf, teamPerformancePdfFilename } from "@/lib/teamPerformancePdf";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const rows = await getTeamPerformance(auth.account.team);
    await recordAudit(auth.account, {
      action: "performance_report_downloaded",
      targetType: "team",
      targetId: auth.account.team,
      details: { memberCount: rows.length, format: "pdf" },
    });
    const pdf = buildTeamPerformancePdf(auth.account.team, rows);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${teamPerformancePdfFilename(auth.account.team)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError("[TEAM LEAD PERFORMANCE PDF ERROR]", error, "Unable to generate the performance PDF.");
  }
}
