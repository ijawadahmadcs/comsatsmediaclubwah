import { recordAudit } from "@/lib/audit";
import { serverError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getTeamPerformance } from "@/lib/teamPerformance";

export const runtime = "nodejs";

function escapePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function buildPdf(team: string, rows: Awaited<ReturnType<typeof getTeamPerformance>>) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const content: string[] = [];

  content.push("0.1 w");
  content.push(`BT /F2 18 Tf ${margin} 545 Td (${escapePdfText(`${team} - Member Performance Ranking`)}) Tj ET`);
  content.push(`BT /F1 9 Tf ${margin} 528 Td (${escapePdfText(`Generated ${new Date().toISOString().slice(0, 10)} | Highest performance first`)}) Tj ET`);
  content.push(`BT /F1 8 Tf ${margin} 514 Td (${escapePdfText("Score combines attendance rate (60%) and average star rating (40%).")}) Tj ET`);

  content.push("0.7 0.7 0.7 RG");
  content.push("0.7 0.7 0.7 rg");
  content.push(`50 505 790 18 re f`);
  content.push(`BT /F2 8 Tf 56 510 Td (Rank) Tj ET`);
  content.push(`BT /F2 8 Tf 90 510 Td (Member) Tj ET`);
  content.push(`BT /F2 8 Tf 310 510 Td (Registration) Tj ET`);
  content.push(`BT /F2 8 Tf 405 510 Td (Present) Tj ET`);
  content.push(`BT /F2 8 Tf 470 510 Td (Attendance) Tj ET`);
  content.push(`BT /F2 8 Tf 555 510 Td (Stars) Tj ET`);
  content.push(`BT /F2 8 Tf 620 510 Td (Score) Tj ET`);

  let y = 480;
  if (!rows.length) {
    content.push(`BT /F1 10 Tf ${margin} ${y} Td (No approved team members or performance records are available.) Tj ET`);
  } else {
    rows.forEach((row, index) => {
      if (y < 55) return;
      content.push(`BT /F1 8 Tf 56 ${y} Td (${index + 1}) Tj ET`);
      content.push(`BT /F1 8 Tf 90 ${y} Td (${escapePdfText(truncate(row.name, 34))}) Tj ET`);
      content.push(`BT /F1 8 Tf 310 ${y} Td (${escapePdfText(truncate(row.registrationNumber, 16))}) Tj ET`);
      content.push(`BT /F1 8 Tf 405 ${y} Td (${row.attendedEvents}/${row.assignedEvents}) Tj ET`);
      content.push(`BT /F1 8 Tf 470 ${y} Td (${row.attendancePercent.toFixed(1)}%) Tj ET`);
      content.push(`BT /F1 8 Tf 555 ${y} Td (${row.averageRating.toFixed(2)} / 5) Tj ET`);
      content.push(`BT /F2 8 Tf 620 ${y} Td (${row.score.toFixed(2)}) Tj ET`);
      content.push(`0.85 0.85 0.85 RG 50 ${y - 7} m 790 ${y - 7} l S`);
      y -= 24;
    });
  }

  content.push(`BT /F1 7 Tf ${margin} 28 Td (${escapePdfText("COMSATS Media Club Wah - Team Lead performance report")}) Tj ET`);

  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}

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
    const pdf = buildPdf(auth.account.team, rows);
    const safeTeam = auth.account.team.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${safeTeam || "team"}-performance-ranking.pdf`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError("[TEAM LEAD PERFORMANCE PDF ERROR]", error, "Unable to generate the performance PDF.");
  }
}
