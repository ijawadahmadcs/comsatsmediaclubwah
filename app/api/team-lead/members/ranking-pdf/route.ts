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
  const rowsPerPage = 18;
  const pageRows = rows.length ? Array.from({ length: Math.ceil(rows.length / rowsPerPage) }, (_, pageIndex) =>
    rows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage),
  ) : [[]];
  const generatedDate = new Date().toISOString().slice(0, 10);
  const totalScore = rows.length
    ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length
    : 0;
  const topMember = rows[0];
  const streams: string[] = [];

  pageRows.forEach((currentRows, pageIndex) => {
    const content: string[] = [];

    content.push("0.035 0.06 0.075 rg");
    content.push(`0 0 ${pageWidth} ${pageHeight} re f`);
    content.push("0.09 0.16 0.18 rg");
    content.push(`0 458 ${pageWidth} 137 re f`);
    content.push("0.10 0.78 0.74 rg");
    content.push(`36 553 58 5 re f`);
    content.push(`BT /F2 10 Tf 36 532 Td (${escapePdfText("COMSATS MEDIA CLUB WAH")}) Tj ET`);
    content.push(`BT /F2 24 Tf 36 497 Td (${escapePdfText(truncate(`${team} Performance`, 34))}) Tj ET`);
    content.push(`BT /F1 9 Tf 36 476 Td (${escapePdfText(`Member ranking report  |  ${generatedDate}  |  Page ${pageIndex + 1} of ${pageRows.length}`)}) Tj ET`);

    if (pageIndex === 0) {
      content.push("0.10 0.78 0.74 rg");
      content.push(`620 515 186 42 re f`);
      content.push("0.03 0.09 0.11 rg");
      content.push(`BT /F1 7 Tf 632 542 Td (TOP MEMBER) Tj ET`);
      content.push(`BT /F2 11 Tf 632 525 Td (${escapePdfText(truncate(topMember?.name || "No records", 21))}) Tj ET`);

      content.push("0.08 0.14 0.16 rg");
      content.push(`36 438 242 32 re f`);
      content.push(`250 438 242 32 re f`);
      content.push(`464 438 242 32 re f`);
      content.push("0.55 0.62 0.64 rg");
      content.push(`BT /F1 7 Tf 48 454 Td (MEMBERS) Tj ET`);
      content.push(`BT /F1 7 Tf 262 454 Td (TEAM SCORE) Tj ET`);
      content.push(`BT /F1 7 Tf 476 454 Td (RANKING BASIS) Tj ET`);
      content.push("0.95 0.97 0.97 rg");
      content.push(`BT /F2 11 Tf 48 442 Td (${rows.length}) Tj ET`);
      content.push(`BT /F2 11 Tf 262 442 Td (${totalScore.toFixed(1)} / 100) Tj ET`);
      content.push(`BT /F2 11 Tf 476 442 Td (60% attendance + 40% stars) Tj ET`);
    }

    const tableTop = pageIndex === 0 ? 416 : 438;
    content.push("0.10 0.78 0.74 rg");
    content.push(`36 ${tableTop - 25} 770 25 re f`);
    content.push("0.03 0.09 0.11 rg");
    content.push(`BT /F2 8 Tf 48 ${tableTop - 16} Td (RANK) Tj ET`);
    content.push(`BT /F2 8 Tf 108 ${tableTop - 16} Td (MEMBER) Tj ET`);
    content.push(`BT /F2 8 Tf 328 ${tableTop - 16} Td (CLUB ID) Tj ET`);
    content.push(`BT /F2 8 Tf 458 ${tableTop - 16} Td (PRESENT) Tj ET`);
    content.push(`BT /F2 8 Tf 530 ${tableTop - 16} Td (ATTENDANCE) Tj ET`);
    content.push(`BT /F2 8 Tf 645 ${tableTop - 16} Td (STARS) Tj ET`);
    content.push(`BT /F2 8 Tf 728 ${tableTop - 16} Td (SCORE) Tj ET`);

    let y = tableTop - 49;
    if (!rows.length) {
      content.push("0.08 0.14 0.16 rg");
      content.push(`36 ${y - 18} 770 42 re f`);
      content.push("0.65 0.72 0.73 rg");
      content.push(`BT /F1 10 Tf 48 ${y} Td (No approved team members or performance records are available.) Tj ET`);
    } else {
      currentRows.forEach((row, rowIndex) => {
        const absoluteIndex = pageIndex * rowsPerPage + rowIndex;
        const rowHeight = 20;
        content.push(absoluteIndex % 2 === 0 ? "0.08 0.14 0.16 rg" : "0.06 0.11 0.13 rg");
        content.push(`36 ${y - 5} 770 ${rowHeight} re f`);
        if (absoluteIndex < 3) {
          content.push("0.10 0.78 0.74 rg");
          content.push(`36 ${y - 5} 4 ${rowHeight} re f`);
        }

        content.push("0.95 0.97 0.97 rg");
        content.push(`BT /F2 9 Tf 48 ${y} Td (${absoluteIndex + 1}) Tj ET`);
        content.push(`BT /F2 9 Tf 108 ${y} Td (${escapePdfText(truncate(row.name, 29))}) Tj ET`);
        content.push("0.72 0.79 0.80 rg");
        content.push(`BT /F1 8 Tf 328 ${y} Td (${escapePdfText(truncate(row.clubMemberId, 16))}) Tj ET`);
        content.push(`BT /F1 8 Tf 458 ${y} Td (${row.attendedEvents}/${row.assignedEvents}) Tj ET`);
        content.push(`BT /F1 8 Tf 530 ${y} Td (${row.attendancePercent.toFixed(1)}%) Tj ET`);
        content.push("0.98 0.78 0.32 rg");
        content.push(`BT /F2 9 Tf 645 ${y} Td (${row.averageRating.toFixed(2)} / 5) Tj ET`);
        content.push("0.95 0.97 0.97 rg");
        content.push(`BT /F2 9 Tf 728 ${y} Td (${row.score.toFixed(1)}) Tj ET`);
        y -= rowHeight + 2;
      });
    }

    content.push("0.55 0.62 0.64 rg");
    content.push(`BT /F1 7 Tf 36 28 Td (CONFIDENTIAL  /  COMSATS MEDIA CLUB WAH  /  TEAM LEAD PERFORMANCE REPORT) Tj ET`);
    content.push(`BT /F1 7 Tf 690 28 Td (${escapePdfText(`Generated ${generatedDate}`)}) Tj ET`);
    streams.push(content.join("\n"));
  });

  const fontRegular = 3 + streams.length * 2;
  const fontBold = fontRegular + 1;
  const pageObjectNumbers = streams.map((_, index) => 3 + index * 2);
  const pageReferences = pageObjectNumbers.map((pageObjectNumber) => `${pageObjectNumber} 0 R`).join(" ");
  const objects: Array<string | undefined> = new Array(fontBold + 1);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageReferences}] /Count ${streams.length} >>`;

  streams.forEach((stream, index) => {
    const pageObjectNumber = pageObjectNumbers[index];
    const contentObjectNumber = pageObjectNumber + 1;
    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
  });

  objects[fontRegular] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBold] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    if (!objects[index]) throw new Error(`Missing PDF object ${index}`);
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
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
