import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateCoachEligibility, checkAndActivateTrainer } from "@/lib/trainer-eligibility";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "TRAINER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.trainerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        packages: {
          orderBy: { price: "asc" },
        },
      },
    });

    const eligibility = profile
      ? evaluateCoachEligibility({
          name: profile.user.name,
          specialty: profile.specialty,
          bio: profile.bio,
          experience: profile.experience,
          price: profile.price,
          tags: profile.tags,
          packages: profile.packages,
        })
      : { eligible: false, isEligible: false, missingRequirements: ["Trainer profile has not been created yet."], profileCompleteness: 0 };

    return NextResponse.json({
      success: true,
      profile,
      eligible: eligibility.eligible,
      isEligible: eligibility.isEligible,
      missingRequirements: eligibility.missingRequirements,
      profileCompleteness: eligibility.profileCompleteness,
    });
  } catch (error: any) {
    console.error("Error fetching trainer profile:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error fetching profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "TRAINER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      specialty,
      experience,
      price,
      bio,
      tags,
      avatarUrl,
      packages: incomingPackages,
    } = body;

    // Update user display name if provided
    if (name && typeof name === "string" && name.trim().length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    const parsedExp = typeof experience === "number" ? experience : parseInt(String(experience || "0"));
    const parsedPrice = typeof price === "number" ? price : parseFloat(String(price || "0"));
    const cleanBio = typeof bio === "string" ? bio.trim() : "";
    const cleanSpecialty = typeof specialty === "string" ? specialty.trim() : "";
    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => (typeof t === "string" ? t.trim() : "")).filter((t: string) => t.length > 0 && !t.startsWith("rejection_reason:"))
      : [];

    // 1. Initial upsert of TrainerProfile
    const trainerProfile = await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {
        specialty: cleanSpecialty || null,
        experience: !isNaN(parsedExp) && parsedExp > 0 ? parsedExp : null,
        price: !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : null,
        bio: cleanBio || null,
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : null,
        tags: cleanTags,
      },
      create: {
        userId: user.id,
        specialty: cleanSpecialty || null,
        experience: !isNaN(parsedExp) && parsedExp > 0 ? parsedExp : null,
        price: !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : null,
        bio: cleanBio || null,
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : null,
        tags: cleanTags,
        status: "PENDING",
        verified: false,
        isPublic: false,
        rating: 4.9,
        clientsCount: 0,
      },
      include: {
        packages: true,
      },
    });

    // 2. Process custom packages if supplied in body
    if (Array.isArray(incomingPackages) && incomingPackages.length > 0) {
      for (const pkg of incomingPackages) {
        const pkgPrice = typeof pkg.price === "number" ? pkg.price : parseFloat(String(pkg.price || "0"));
        if (!pkg.name || isNaN(pkgPrice) || pkgPrice <= 0) continue;

        if (pkg.id && !pkg.id.startsWith("temp_")) {
          // Update existing package
          await prisma.coachingPackage.updateMany({
            where: { id: pkg.id, trainerId: trainerProfile.id },
            data: {
              name: String(pkg.name).trim(),
              description: String(pkg.description || "").trim(),
              duration: String(pkg.duration || "1 Month").trim(),
              price: pkgPrice,
              benefits: Array.isArray(pkg.benefits) ? pkg.benefits : [],
              active: pkg.active ?? true,
            },
          });
        } else {
          // Create new package
          await prisma.coachingPackage.create({
            data: {
              trainerId: trainerProfile.id,
              name: String(pkg.name).trim(),
              description: String(pkg.description || "").trim(),
              duration: String(pkg.duration || "1 Month").trim(),
              price: pkgPrice,
              benefits: Array.isArray(pkg.benefits) ? pkg.benefits : ["Personalized coaching", "Direct chat"],
              active: pkg.active ?? true,
            },
          });
        }
      }
    } else if (parsedPrice && parsedPrice > 0) {
      // If no custom package array, ensure default packages exist or update price
      if (trainerProfile.packages.length === 0) {
        const displayName = (name && name.trim()) || user.name;
        await prisma.coachingPackage.createMany({
          data: [
            {
              trainerId: trainerProfile.id,
              name: "1-on-1 Monthly Coaching",
              description: `Personalized 1-on-1 coaching program designed around your fitness goals with Coach ${displayName}.`,
              duration: "1 Month",
              price: parsedPrice,
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
              trainerId: trainerProfile.id,
              name: "3-Month Body Transformation",
              description: "Structured progressive overload and body recomposition protocol.",
              duration: "3 Months",
              price: Math.round(parsedPrice * 2.5),
              benefits: [
                "Complete 12-week periodization split",
                "Weekly technique video analysis",
                "Bi-weekly nutritional adjustments",
                "Priority message response (<4 hrs)",
                "Full progress milestone tracking",
              ],
              active: true,
            },
            {
              trainerId: trainerProfile.id,
              name: "Elite Performance & Prep",
              description: "Maximum accountability program for competitive lifters and rapid transformations.",
              duration: "6 Months",
              price: Math.round(parsedPrice * 4.5),
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
        });
      } else {
        // Update monthly package price if present
        const monthlyPkg = trainerProfile.packages.find((p) => p.duration === "1 Month" || p.name.includes("Monthly"));
        if (monthlyPkg) {
          await prisma.coachingPackage.update({
            where: { id: monthlyPkg.id },
            data: { price: parsedPrice },
          });
        }
      }
    }

    // 3. Server-side eligibility check and automatic activation
    const activationResult = await checkAndActivateTrainer(trainerProfile.id);

    return NextResponse.json({
      success: true,
      eligible: activationResult.eligible,
      isEligible: activationResult.isEligible,
      missingRequirements: activationResult.missingRequirements,
      profileCompleteness: activationResult.profileCompleteness,
      profile: activationResult.profile,
      message: activationResult.eligible
        ? "Trainer profile is complete and has been automatically verified and activated in the public marketplace!"
        : "Profile saved. Complete all mandatory requirements to become active and visible in the marketplace.",
    });
  } catch (error: any) {
    console.error("Error updating trainer profile:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error saving profile" },
      { status: 500 }
    );
  }
}
