import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

const APP_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function rewriteRequest(req: NextRequest): NextRequest {
  const { headers, nextUrl: { pathname, search } } = req;
  const host = headers.get("x-forwarded-host") ?? req.nextUrl.host;
  const rawProto = headers.get("x-forwarded-proto") ?? req.nextUrl.protocol;
  const proto = rawProto.split(",")[0].trim();
  const _proto = proto.endsWith(":") ? proto : `${proto}:`;
  const url = new URL(`${_proto}//${host}${APP_BASE}${pathname}${search}`);
  return new NextRequest(url, req);
}

export async function GET(req: NextRequest) {
  return handlers.GET(rewriteRequest(req));
}
export async function POST(req: NextRequest) {
  return handlers.POST(rewriteRequest(req));
}
