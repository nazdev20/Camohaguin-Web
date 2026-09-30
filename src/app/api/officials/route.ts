import { NextResponse } from "next/server";

export const revalidate = 600;

const officials = [
  { name: "Hon. Nelson T. De Chavez", position: "Punong Barangay", term: "2023-Present" },
  { name: "Hon. Maria L. Santos", position: "Barangay Kagawad - Peace & Order", term: "2023-Present" },
  { name: "Hon. Roberto C. Tan", position: "Barangay Kagawad - Health & Sanitation", term: "2023-Present" },
  { name: "Hon. Elena S. Ramos", position: "Barangay Secretary", term: "2023-Present" },
  { name: "Hon. Juan P. Mercado", position: "Barangay Treasurer", term: "2023-Present" },
];

export function GET() {
  return NextResponse.json(
    { data: officials, source: "vercel_serverless" },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}