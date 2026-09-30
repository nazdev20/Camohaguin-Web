import { NextResponse } from "next/server";
import { INITIAL_ANNOUNCEMENTS } from "../../../services/mockData";

export const revalidate = 300;

export function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const rawLimit = searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 10;
  const limit = Number.isNaN(parsedLimit) ? 10 : parsedLimit;

  return NextResponse.json(
    {
      data: INITIAL_ANNOUNCEMENTS.slice(0, limit),
      source: "vercel_serverless",
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}