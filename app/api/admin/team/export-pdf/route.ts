import { recordAudit } from "@/lib/audit";
import { serverError } from "@/lib/api";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { compareClubMemberIds, ensureClubMemberIds } from "@/lib/teamMembers";
import TeamMember from "@/models/TeamMember";

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

type TeamPdfMember = {
  clubMemberId?: string;
  name: string;
  role: string;
  team?: string;
  department?: string;
  registrationNumber?: string;
};

function buildTeamListPdf(members: TeamPdfMember[]) {
  const pageWidth = 842;
  const pageHeight = 595;
  const rowsPerPage = 16;
  const pages = members.length
    ? Array.from({ length: Math.ceil(members.length / rowsPerPage) }, (_, index) =>
        members.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
      )
    : [[]];
  const generatedDate = new Date().toISOString().slice(0, 10);
  const streams: string[] = [];

  pages.forEach((pageMembers, pageIndex) => {
    const content: string[] = [];
    content.push("0.035 0.06 0.075 rg");
    content.push(`0 0 ${pageWidth} ${pageHeight} re f`);
    content.push("0.09 0.16 0.18 rg");
    content.push(`0 458 ${pageWidth} 137 re f`);
    content.push("0.10 0.78 0.74 rg");
    content.push(`36 553 58 5 re f`);
    content.push(`BT /F2 10 Tf 36 532 Td (COMSATS MEDIA CLUB WAH) Tj ET`);
    content.push(`BT /F2 24 Tf 36 497 Td (Complete Team List) Tj ET`);
    content.push(`BT /F1 9 Tf 36 476 Td (${escapePdfText(`Admin record  |  ${generatedDate}  |  Page ${pageIndex + 1} of ${pages.length}`)}) Tj ET`);

    content.push("0.10 0.78 0.74 rg");
    content.push(`36 438 770 25 re f`);
    content.push("0.03 0.09 0.11 rg");
    content.push(`BT /F2 8 Tf 48 447 Td (CMC ID) Tj ET`);
    content.push(`BT /F2 8 Tf 118 447 Td (NAME) Tj ET`);
    content.push(`BT /F2 8 Tf 300 447 Td (ROLE) Tj ET`);
    content.push(`BT /F2 8 Tf 460 447 Td (TEAM) Tj ET`);
    content.push(`BT /F2 8 Tf 590 447 Td (DEPARTMENT) Tj ET`);
    content.push(`BT /F2 8 Tf 735 447 Td (REGISTRATION) Tj ET`);

    let y = 414;
    if (!pageMembers.length) {
      content.push("0.08 0.14 0.16 rg");
      content.push(`36 390 770 42 re f`);
      content.push("0.65 0.72 0.73 rg");
      content.push(`BT /F1 10 Tf 48 ${y} Td (No team members are available.) Tj ET`);
    } else {
      pageMembers.forEach((member, rowIndex) => {
        const absoluteIndex = pageIndex * rowsPerPage + rowIndex;
        content.push(absoluteIndex % 2 === 0 ? "0.08 0.14 0.16 rg" : "0.06 0.11 0.13 rg");
        content.push(`36 ${y - 7} 770 22 re f`);
        content.push("0.95 0.97 0.97 rg");
        content.push(`BT /F2 8 Tf 48 ${y} Td (${escapePdfText(member.clubMemberId || "-")}) Tj ET`);
        content.push(`BT /F2 8 Tf 118 ${y} Td (${escapePdfText(truncate(member.name, 24))}) Tj ET`);
        content.push("0.72 0.79 0.80 rg");
        content.push(`BT /F1 8 Tf 300 ${y} Td (${escapePdfText(truncate(member.role, 23))}) Tj ET`);
        content.push(`BT /F1 8 Tf 460 ${y} Td (${escapePdfText(truncate(member.team || "-", 18))}) Tj ET`);
        content.push(`BT /F1 8 Tf 590 ${y} Td (${escapePdfText(truncate(member.department || "-", 20))}) Tj ET`);
        content.push(`BT /F1 8 Tf 735 ${y} Td (${escapePdfText(truncate(member.registrationNumber || "-", 14))}) Tj ET`);
        y -= 24;
      });
    }

    content.push("0.55 0.62 0.64 rg");
    content.push(`BT /F1 7 Tf 36 28 Td (CONFIDENTIAL  /  COMSATS MEDIA CLUB WAH  /  COMPLETE TEAM LIST) Tj ET`);
    content.push(`BT /F1 7 Tf 690 28 Td (${escapePdfText(`Generated ${generatedDate}`)}) Tj ET`);
    streams.push(content.join("\n"));
  });

  const fontRegular = 3 + streams.length * 2;
  const fontBold = fontRegular + 1;
  const pageObjectNumbers = streams.map((_, index) => 3 + index * 2);
  const pageReferences = pageObjectNumbers.map((number) => `${number} 0 R`).join(" ");
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
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    await ensureClubMemberIds();
    const members = await TeamMember.find({})
      .select("clubMemberId name role team department registrationNumber")
      .lean();
    const sorted = [...members].sort((left, right) => compareClubMemberIds(left.clubMemberId, right.clubMemberId));
    await recordAudit(auth.account, {
      action: "team_list_exported",
      targetType: "team",
      details: { format: "pdf", memberCount: sorted.length },
    });
    return new Response(buildTeamListPdf(sorted), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=comsats-media-club-team-list.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError("[ADMIN TEAM PDF ERROR]", error, "Unable to generate the team list PDF.");
  }
}
