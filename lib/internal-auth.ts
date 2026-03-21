import { NextResponse } from "next/server";

export function validateInternalRequest(request: Request): NextResponse | null {
  const secret = process.env.INTERNAL_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_CRON_SECRET is not configured" }, { status: 500 });
  }

  const provided = request.headers.get("x-internal-secret");
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
