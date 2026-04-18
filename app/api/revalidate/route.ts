import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return Response.json(
      { error: "REVALIDATE_SECRET not configured" },
      { status: 500 },
    );
  }
  const provided = request.nextUrl.searchParams.get("secret");
  if (provided !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  revalidateTag("sheets", "max");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
