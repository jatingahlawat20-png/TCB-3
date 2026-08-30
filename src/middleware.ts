import { NextResponse, type NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_for_dev_change_in_prod";

async function verifyToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const b64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const binarySig = atob(b64 + pad);
    const signature = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      signature[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!isValid) return null;

    const payloadBinary = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadBinary);

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload as { userId: string; role: "CLIENT" | "TRAINER" | "ADMIN" };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/get-started" ||
    pathname === "/signup";

  const isClientDashboard = pathname.startsWith("/dashboard");
  const isTrainerDashboard = pathname.startsWith("/trainer");
  const isAdminDashboard = pathname.startsWith("/admin");
  const isMessages = pathname.startsWith("/messages");
  const isWorkouts = pathname.startsWith("/workouts");
  const isNutrition = pathname.startsWith("/nutrition");
  const isSessions = pathname.startsWith("/sessions");

  if (
    !isAuthPage &&
    !isClientDashboard &&
    !isTrainerDashboard &&
    !isAdminDashboard &&
    !isMessages &&
    !isWorkouts &&
    !isNutrition &&
    !isSessions
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  // If already authenticated and visiting login/signup/get-started, redirect to dashboard
  if (isAuthPage) {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const dest =
          payload.role === "TRAINER"
            ? "/trainer/dashboard"
            : payload.role === "ADMIN"
            ? "/admin"
            : "/dashboard";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  // Role-based Access Control
  if (isClientDashboard) {
    if (payload.role === "TRAINER") {
      return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
    }
  }

  if (isWorkouts) {
    if (payload.role === "TRAINER") {
      return NextResponse.redirect(new URL("/trainer/programs", request.url));
    }
  }

  if (isNutrition) {
    if (payload.role === "TRAINER") {
      return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
    }
  }

  if (isTrainerDashboard) {
    if (payload.role === "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isAdminDashboard) {
    if (payload.role !== "ADMIN") {
      const fallback =
        payload.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/get-started",
    "/signup",
    "/dashboard/:path*",
    "/trainer/:path*",
    "/admin/:path*",
    "/messages/:path*",
    "/workouts/:path*",
    "/nutrition/:path*",
    "/sessions/:path*",
  ],
};
