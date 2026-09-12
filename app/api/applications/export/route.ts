import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireApiAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";

function buildFilter(searchParams: URLSearchParams) {
  const filter: Record<string, unknown> = {};
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const semester = searchParams.get("semester");
  const areaOfInterest = searchParams.get("areaOfInterest");
  const search = searchParams.get("search");
  if (status && status !== "All") filter.status = status;
  if (department && department !== "All") filter.department = department;
  if (semester && semester !== "All") filter.semester = semester;
  if (areaOfInterest && areaOfInterest !== "All") filter.areaOfInterest = areaOfInterest;
  if (search) filter.$or = ["fullName", "registrationNumber", "email", "department", "areaOfInterest"].map((field) => ({ [field]: { $regex: search, $options: "i" } }));
  return filter;
}

export async function GET(request: Request) {
  if (!(await requireApiAdmin())) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const applications = await Application.find(buildFilter(url.searchParams)).sort({ createdAt: -1 }).lean();
    const rows = applications.map((application) => ({ "Full Name": application.fullName, "Registration Number": application.registrationNumber, Department: application.department, Semester: application.semester, "Contact Number": application.contactNumber, Email: application.email, "Area of Interest": application.areaOfInterest, "Why Join": application.motivation, Expectations: application.expectations || "", Status: application.status || "Pending", "Submitted At": application.createdAt }));
    const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
    if (format === "csv") {
      const sheet = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=applications.csv" } });
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Applications");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new Response(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=applications.xlsx" } });
  } catch { return NextResponse.json({ success: false, message: "Unable to export applications." }, { status: 500 }); }
}
