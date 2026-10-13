import * as XLSX from "xlsx";
import { serverError } from "@/lib/api";
import { buildApplicationFilter } from "@/lib/applicationFilters";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { safeSpreadsheetCell } from "@/lib/spreadsheet";
import Application from "@/models/Application";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  try {
    await connectToDatabase();
    const applications = await Application.find(buildApplicationFilter(url.searchParams)).sort({ createdAt: -1 }).lean();
    const rows = applications.map((application) => {
      const row = {
        "Full Name": application.fullName,
        "Registration Number": application.registrationNumber,
        Department: application.department,
        Semester: application.semester,
        "Contact Number": application.contactNumber,
        Email: application.email,
        "Area of Interest": application.areaOfInterest,
        "Why Join": application.motivation,
        Expectations: application.expectations || "",
        Status: application.status || "Pending",
        "Registration Fee": application.paymentStatus || "Unpaid",
        "Submitted At": application.createdAt,
      };
      // XLSX stores strings as text cells, so only CSV needs formula neutralising.
      return format === "csv" ? Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeSpreadsheetCell(value)])) : row;
    });

    await recordAudit(auth.account, {
      action: "applications_exported",
      targetType: "application",
      details: { format, count: rows.length, filters: Object.fromEntries(url.searchParams) },
    });

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));
      return new Response(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=applications.csv", "Cache-Control": "no-store" },
      });
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Applications");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=applications.xlsx",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return serverError("[APPLICATION EXPORT ERROR]", error, "Unable to export applications.");
  }
}
