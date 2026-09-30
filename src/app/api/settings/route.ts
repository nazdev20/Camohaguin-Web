import { NextResponse } from "next/server";

export const revalidate = 600;

const settings = {
  barangay_name: "Barangay Camohaguin",
  municipality: "Gumaca",
  province: "Quezon",
  emergency_phone: "(042) 317-8890",
  office_hours: "Monday to Friday: 8:00 AM - 5:00 PM",
  tanod_hotline: "0917-889-1122",
  police_hotline: "(042) 317-6222",
  bfp_hotline: "(042) 317-6111",
  rhu_hotline: "(042) 317-5444",
};

export function GET() {
  return NextResponse.json(
    { data: settings, source: "vercel_serverless" },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}