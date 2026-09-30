import { NextResponse } from "next/server";
import { serverLruCache } from "../../../lib/lruCache";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", ...serverLruCache.getStats() });
}