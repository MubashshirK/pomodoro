import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up"]);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  const session = await auth();

  if (isPublic) {
    if (session?.user) {
      return NextResponse.redirect(new URL("/timer", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const url = new URL("/sign-in", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|serwist|manifest.json|icon-.*|apple-touch-icon|favicon-.*|pwa-.*|sounds|offline).*)",
  ],
};
