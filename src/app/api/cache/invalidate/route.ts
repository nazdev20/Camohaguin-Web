import { NextResponse } from "next/server";
import { serverLruCache } from "../../../../lib/lruCache";

export const dynamic = "force-dynamic";

export async function POST() {
  const invalidatedCount = serverLruCache.getStats().size;
  serverLruCache.clear();

  return NextResponse.json({
    success: true,
    invalidatedCount,
    remainingSize: 0,
  });
}