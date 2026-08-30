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

export interface TrainerEligibilityResult {
  isEligible: boolean;
  missingRequirements: string[];
}

/**
 * Pure server-side validator for coach eligibility.
 * Evaluates whether a coach has completed all mandatory onboarding requirements
 * to become an ACTIVE, marketplace-visible trainer.
 */
export function evaluateTrainerEligibility(data: TrainerEligibilityInput): TrainerEligibilityResult {
  const missingRequirements: string[] = [];

  // 1. Display Name validation
  const cleanName = data.name ? data.name.trim() : "";
  if (!cleanName || cleanName.length < 2) {
    missingRequirements.push("Professional display name is required (minimum 2 characters).");
  }

  // 2. Specialty / Headline validation
  const cleanSpecialty = data.specialty ? data.specialty.trim() : "";
  if (!cleanSpecialty || cleanSpecialty.length < 3) {
    missingRequirements.push("Primary coaching specialty is required (minimum 3 characters).");
  }

  // 3. Meaningful Professional Biography
  const cleanBio = data.bio ? data.bio.trim() : "";
  if (!cleanBio || cleanBio.length < 20) {
    missingRequirements.push("Meaningful professional bio & coaching approach is required (minimum 20 characters).");
  }

  // 4. Years of Experience validation
  const exp = typeof data.experience === "number" ? data.experience : parseInt(String(data.experience || "0"));
  if (isNaN(exp) || exp < 1) {
    missingRequirements.push("Years of professional experience is required (minimum 1 year).");
  }

  // 5. Qualifications, Certifications, or Focus Tags
  const validTags = Array.isArray(data.tags)
    ? data.tags.filter((t) => typeof t === "string" && t.trim().length > 0 && !t.startsWith("rejection_reason:"))
    : [];
  if (validTags.length === 0) {
    missingRequirements.push("At least one qualification, certification, or focus area tag is required.");
  }

  // 6. Active Coaching Packages
  const activePackages = Array.isArray(data.packages)
    ? data.packages.filter((p) => (p.active ?? true) && p.name && p.name.trim().length > 0 && p.duration && p.duration.trim().length > 0 && typeof p.price === "number" && p.price > 0)
    : [];
  if (activePackages.length === 0) {
    missingRequirements.push("At least one active coaching package with valid name, duration, and price is required.");
  }

  return {
    isEligible: missingRequirements.length === 0,
    missingRequirements,
  };
}

/**
 * Inspects a trainer profile in the database, runs the server eligibility validation,
 * and atomically updates their status to ACTIVE and isPublic to true if eligible,
 * or PENDING and isPublic to false if incomplete.
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

  const evaluation = evaluateTrainerEligibility({
    name: profile.user.name,
    specialty: profile.specialty,
    bio: profile.bio,
    experience: profile.experience,
    price: profile.price,
    tags: profile.tags,
    packages: profile.packages,
  });

  if (evaluation.isEligible) {
    // Remove any previous rejection reason tag upon completing valid eligibility
    const cleanTags = profile.tags.filter((t) => !t.startsWith("rejection_reason:"));

    const updatedProfile = await prisma.trainerProfile.update({
      where: { id: profile.id },
      data: {
        status: "ACTIVE",
        isPublic: true,
        tags: cleanTags,
        // DO NOT set verified to true automatically (verified is reserved for admin certification audits)
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        packages: { where: { active: true }, orderBy: { price: "asc" } },
      },
    });

    return {
      isEligible: true,
      missingRequirements: [],
      profile: updatedProfile,
    };
  } else {
    const updatedProfile = await prisma.trainerProfile.update({
      where: { id: profile.id },
      data: {
        status: "PENDING",
        isPublic: false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        packages: { where: { active: true }, orderBy: { price: "asc" } },
      },
    });

    return {
      isEligible: false,
      missingRequirements: evaluation.missingRequirements,
      profile: updatedProfile,
    };
  }
}
