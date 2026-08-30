import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export type AuthPayload = {
  userId: string;
  role: "CLIENT" | "TRAINER" | "ADMIN";
};

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_for_dev_change_in_prod";
const COOKIE_NAME = "token";

/**
 * Sign a JWT authentication token for a user
 */
export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Verify and decode a JWT authentication token
 */
export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (decoded && decoded.userId && decoded.role) {
      return {
        userId: decoded.userId,
        role: decoded.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set the authentication cookie on a response
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Clear the authentication cookie on a response
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Get the currently authenticated user for Server Components & Actions
 */
export async function getCurrentUser(req?: Request | any) {
  try {
    let token: string | undefined;

    if (req && typeof req.headers?.get === "function") {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
        if (match) {
          token = match[1];
        }
      }
      const authHeader = req.headers.get("authorization");
      if (!token && authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(COOKIE_NAME)?.value;
      } catch {
        // outside request scope
      }
    }

    if (!token) {
      return null;
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        trainerProfile: {
          select: {
            id: true,
            bio: true,
            specialty: true,
            experience: true,
            price: true,
            verified: true,
            status: true,
            isPublic: true,
            tags: true,
            avatarUrl: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Server Component guard: require authentication and optional role match
 */
export async function requireUser(allowedRoles?: Array<"CLIENT" | "TRAINER" | "ADMIN">) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === "TRAINER") {
      redirect("/trainer/dashboard");
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return user;
}
