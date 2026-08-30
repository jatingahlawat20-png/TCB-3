import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedRole = role === "TRAINER" ? "TRAINER" : "CLIENT";
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile if trainer
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedRole,
        ...(normalizedRole === "TRAINER"
          ? {
              trainerProfile: {
                create: {
                  specialty: "Fitness & Strength Specialist",
                  experience: 1,
                  price: 999,
                  verified: false,
                  status: "PENDING",
                  isPublic: false,
                  bio: "Certified fitness trainer focused on personalized human-led coaching.",
                  packages: {
                    create: [
                      {
                        name: "1-on-1 Monthly Coaching",
                        description: `Personalized 1-on-1 coaching program designed around your fitness goals with Coach ${name.trim()}.`,
                        duration: "1 Month",
                        price: 999,
                        benefits: [
                          "Custom workout split & periodization",
                          "Nutrition macro targets",
                          "Weekly form check reviews",
                          "Direct in-app messaging",
                          "3-day complimentary chat trial",
                        ],
                        active: true,
                      },
                      {
                        name: "3-Month Body Transformation",
                        description: "Structured progressive overload and body recomposition protocol.",
                        duration: "3 Months",
                        price: 2499,
                        benefits: [
                          "Complete 12-week periodization split",
                          "Weekly technique video analysis",
                          "Bi-weekly nutritional adjustments",
                          "Priority message response",
                          "Full progress milestone tracking",
                        ],
                        active: true,
                      },
                      {
                        name: "Elite Performance & Prep",
                        description: "Maximum accountability program for competitive lifters and rapid transformations.",
                        duration: "6 Months",
                        price: 4499,
                        benefits: [
                          "Comprehensive multi-phase periodization",
                          "Daily accountability check-ins",
                          "Unlimited lift video critiques",
                          "Competition / photoshoot peaking protocol",
                          "Custom supplement and recovery optimization",
                        ],
                        active: true,
                      },
                    ],
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Sign session token
    const token = signAuthToken({
      userId: user.id,
      role: user.role,
    });

    const redirectTo =
      user.role === "TRAINER" ? "/trainer/onboarding" : "/dashboard";

    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user,
        redirectTo,
      },
      { status: 201 }
    );

    // Set persistent session cookie
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}