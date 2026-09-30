import { NextResponse } from "next/server";
import { INITIAL_SERVICES } from "../../../services/mockData";

export const revalidate = 600;

export function GET() {
  return NextResponse.json(
    { data: INITIAL_SERVICES, source: "vercel_serverless" },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}