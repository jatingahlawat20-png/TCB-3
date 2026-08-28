import { prisma } from "@/lib/prisma";
import { trainers as staticTrainers, type Trainer } from "@/data/trainers";

export type TrainerFilterOptions = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

export async function getAllTrainers(options?: TrainerFilterOptions): Promise<Trainer[]> {
  try {
    const dbProfiles = await prisma.trainerProfile.findMany({
      where: {
        status: "ACTIVE",
        verified: true,
        isPublic: true,
      },
      include: {
        user: true,
        packages: {
          where: { active: true },
          orderBy: { price: "asc" },
        },
      },
      orderBy: { user: { createdAt: "asc" } },
    });

    if (dbProfiles.length === 0) {
      return staticTrainers;
    }

    const mapped: Trainer[] = dbProfiles.map((tp) => {
      const u = tp.user;
      // Find matching static trainer by name or id prefix for consistent media assets
      const staticMatch = staticTrainers.find(
        (st) =>
          st.name.toLowerCase() === u.name.toLowerCase() ||
          u.id === `trainer_${st.id}` ||
          tp.id === `profile_${st.id}` ||
          String(st.id) === u.id
      );

      // Determine clean URL ID (prefer static integer ID if matched, else cuid)
      const displayId = staticMatch ? staticMatch.id : u.id;

      // Tags from DB or fallback
      const tags =
        tp.tags && tp.tags.length > 0
          ? tp.tags
          : staticMatch?.tags || [
              tp.specialty || "Strength",
              "Personalized Plan",
              "Form Checks",
            ];

      // Image from DB avatarUrl, static match, or default
      const image =
        tp.avatarUrl ||
        staticMatch?.image ||
        "/images/trainers/aryan-singh.jpg";

      return {
        id: displayId,
        name: u.name,
        specialty: tp.specialty || staticMatch?.specialty || "Fitness & Strength Specialist",
        rating: tp.rating || staticMatch?.rating || 4.9,
        clients: tp.clientsCount || staticMatch?.clients || 150,
        experience: `${tp.experience || parseInt(staticMatch?.experience || "5") || 5} Years`,
        price: tp.price || (tp.packages[0]?.price || staticMatch?.price || 999),
        image,
        tags,
        bio: tp.bio || staticMatch?.bio || "Certified fitness coach on TCB-3.",
        verified: tp.verified,
        status: tp.status,
        packages: tp.packages,
      };
    });

    // Apply optional server-side filters if provided
    if (options) {
      const { search, category, minPrice, maxPrice } = options;
      return mapped.filter((trainer) => {
        if (search) {
          const q = search.trim().toLowerCase();
          const match =
            trainer.name.toLowerCase().includes(q) ||
            trainer.specialty.toLowerCase().includes(q) ||
            trainer.tags.some((t) => t.toLowerCase().includes(q)) ||
            trainer.bio.toLowerCase().includes(q);
          if (!match) return false;
        }

        if (category && category !== "All") {
          const cat = category.trim().toLowerCase();
          const matchCat =
            trainer.tags.some((t) => t.toLowerCase() === cat) ||
            (cat === "muscle gain" && trainer.specialty.toLowerCase().includes("strength")) ||
            (cat === "weight loss" && trainer.specialty.toLowerCase().includes("fat loss")) ||
            trainer.specialty.toLowerCase().includes(cat);
          if (!matchCat) return false;
        }

        if (typeof minPrice === "number" && trainer.price < minPrice) return false;
        if (typeof maxPrice === "number" && trainer.price > maxPrice) return false;

        return true;
      });
    }

    return mapped;
  } catch (error) {
    console.error("Error fetching all trainers from DB:", error);
    return staticTrainers;
  }
}

export async function getTrainerById(
  id: string,
  options?: { allowUnverified?: boolean }
): Promise<Trainer | null> {
  try {
    const normalizedId = String(id).trim();
    const allowUnverified = options?.allowUnverified ?? false;

    // 1. Try resolving from Database
    const profile = await prisma.trainerProfile.findFirst({
      where: {
        OR: [
          { id: normalizedId },
          { id: `profile_${normalizedId}` },
          { userId: normalizedId },
          { userId: `trainer_${normalizedId}` },
          { user: { id: normalizedId } },
          { user: { name: { equals: decodeURIComponent(normalizedId), mode: "insensitive" } } },
        ],
        ...(allowUnverified ? {} : { status: "ACTIVE", verified: true }),
      },
      include: {
        user: true,
        packages: {
          where: { active: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (profile) {
      const staticMatch = staticTrainers.find(
        (st) =>
          st.name.toLowerCase() === profile.user.name.toLowerCase() ||
          profile.userId === `trainer_${st.id}` ||
          profile.id === `profile_${st.id}` ||
          String(st.id) === profile.user.id
      );

      const displayId = staticMatch ? staticMatch.id : profile.user.id;
      const tags =
        profile.tags && profile.tags.length > 0
          ? profile.tags
          : staticMatch?.tags || [
              profile.specialty || "Strength",
              "Personalized Plan",
              "Form Checks",
            ];

      const image =
        profile.avatarUrl ||
        staticMatch?.image ||
        "/images/trainers/aryan-singh.jpg";

      return {
        id: displayId,
        name: profile.user.name,
        specialty: profile.specialty || staticMatch?.specialty || "Fitness & Strength Specialist",
        rating: profile.rating || staticMatch?.rating || 4.9,
        clients: profile.clientsCount || staticMatch?.clients || 150,
        experience: `${profile.experience || parseInt(staticMatch?.experience || "5") || 5} Years`,
        price: profile.price || (profile.packages[0]?.price || staticMatch?.price || 999),
        image,
        tags,
        bio: profile.bio || staticMatch?.bio || "Certified fitness trainer on TCB-3.",
        verified: profile.verified,
        status: profile.status,
        packages: profile.packages,
      };
    }

    // 2. Fallback to static trainers array (only if ID matches and trainer exists in static)
    const staticMatch = staticTrainers.find(
      (st) => String(st.id) === normalizedId || st.name.toLowerCase() === normalizedId.toLowerCase()
    );

    return staticMatch || null;
  } catch (error) {
    console.error(`Error resolving trainer ${id}:`, error);
    const staticMatch = staticTrainers.find((st) => String(st.id) === String(id));
    return staticMatch || null;
  }
}
