import { prisma } from "@/lib/prisma";

export interface TrainerEligibilityInput {
  name?: string | null;
  specialty?: string | null;
  bio?: string | null;
  experience?: number | null;
  price?: number | null;
  tags?: string[] | null;
  packages?: Array<{
    name?: string | null;
    duration?: string | null;
    price?: number | null;
    active?: boolean;
  }> | null;
}

export interface CoachEligibilityResult {
  eligible: boolean;
  isEligible: boolean; // backward compatibility
  missingRequirements: string[];
  profileCompleteness: number; // 0 to 100%
}

/**
 * Pure server-side validator for coach eligibility and profile completeness.
 * Evaluates whether a coach has completed all mandatory onboarding requirements
 * to become an ACTIVE, VERIFIED, and public trainer on TCB-3.
 */
export function evaluateCoachEligibility(data: TrainerEligibilityInput): CoachEligibilityResult {
  const missingRequirements: string[] = [];
  let score = 0;

  // 1. Display Name & Basic Info (Weight: 20%)
  const cleanName = data.name ? data.name.trim() : "";
  if (!cleanName || cleanName.length < 2) {
    missingRequirements.push("Professional display name is required (minimum 2 characters).");
  } else {
    score += 20;
  }

  // 2. Specialty / Headline validation (Weight: 15%)
  const cleanSpecialty = data.specialty ? data.specialty.trim() : "";
  if (!cleanSpecialty || cleanSpecialty.length < 3) {
    missingRequirements.push("Primary coaching specialty headline is required (minimum 3 characters).");
  } else {
    score += 15;
  }

  // 3. Meaningful Professional Biography (Weight: 15%)
  const cleanBio = data.bio ? data.bio.trim() : "";
  if (!cleanBio || cleanBio.length < 20) {
    missingRequirements.push("Meaningful professional bio & coaching approach is required (minimum 20 characters).");
  } else {
    score += 15;
  }

  // 4. Years of Experience validation (Weight: 15%, Minimum: 2 years)
  const exp = typeof data.experience === "number" ? data.experience : parseInt(String(data.experience || "0"));
  if (isNaN(exp) || exp < 2) {
    missingRequirements.push("At least 2 years of professional coaching experience is required.");
  } else {
    score += 15;
  }

  // 5. Qualifications & Certifications (Weight: 20%)
  const validTags = Array.isArray(data.tags)
    ? data.tags.filter((t) => typeof t === "string" && t.trim().length > 0 && !t.startsWith("rejection_reason:"))
    : [];
  if (validTags.length === 0) {
    missingRequirements.push("At least one professional certification, credential, or qualification is required.");
  } else {
    score += 20;
  }

  // 6. Active Coaching Packages (Weight: 15%)
  const activePackages = Array.isArray(data.packages)
    ? data.packages.filter(
        (p) =>
          (p.active ?? true) &&
          p.name &&
          p.name.trim().length > 0 &&
          p.duration &&
          p.duration.trim().length > 0 &&
          typeof p.price === "number" &&
          p.price > 0
      )
    : [];
  if (activePackages.length === 0) {
    missingRequirements.push("At least one active coaching package with valid name, duration, and pricing is required.");
  } else {
    score += 15;
  }

  const isEligible = missingRequirements.length === 0;
  const profileCompleteness = isEligible ? 100 : Math.min(score, 90);

  return {
    eligible: isEligible,
    isEligible,
    missingRequirements,
    profileCompleteness,
  };
}

// Re-export as alias for compatibility
export const evaluateTrainerEligibility = evaluateCoachEligibility;

/**
 * Inspects a trainer profile in the database, runs the server eligibility validation,
 * and atomically updates status to ACTIVE, verified to true, and isPublic to true if eligible.
 * If incomplete, sets status to PENDING, verified to false, and isPublic to false.
 */
export async function checkAndActivateTrainer(trainerProfileId: string) {
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      packages: {
        where: { active: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!profile) {
    throw new Error(`TrainerProfile not found for ID: ${trainerProfileId}`);
  }

  const evaluation = evaluateCoachEligibility({
    name: profile.user.name,
    specialty: profile.specialty,
    bio: profile.bio,
    experience: profile.experience,
    price: profile.price,
    tags: profile.tags,
    packages: profile.packages,
  });

  if (evaluation.eligible) {
    // Remove any previous rejection reason tag upon completing valid eligibility
    const cleanTags = profile.tags.filter((t) => !t.startsWith("rejection_reason:"));

    const updatedProfile = await prisma.trainerProfile.update({
      where: { id: profile.id },
      data: {
        status: "ACTIVE",
        verified: true,
        isPublic: true,
        tags: cleanTags,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        packages: { where: { active: true }, orderBy: { price: "asc" } },
      },
    });

    return {
      eligible: true,
      isEligible: true,
      missingRequirements: [],
      profileCompleteness: 100,
      profile: updatedProfile,
    };
  } else {
    const updatedProfile = await prisma.trainerProfile.update({
      where: { id: profile.id },
      data: {
        status: "PENDING",
        verified: false,
        isPublic: false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        packages: { where: { active: true }, orderBy: { price: "asc" } },
      },
    });

    return {
      eligible: false,
      isEligible: false,
      missingRequirements: evaluation.missingRequirements,
      profileCompleteness: evaluation.profileCompleteness,
      profile: updatedProfile,
    };
  }
}
