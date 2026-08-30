import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { trainers as staticTrainers } from "@/data/trainers";

export async function seedTrainersIfEmpty() {
  try {
    const defaultPassword = await bcrypt.hash("trainer123456", 12);

    const officialTrainerUserIds: string[] = [];

    for (const st of staticTrainers) {
      const email = `${st.name.toLowerCase().replace(/\s+/g, ".")}@tcb3.fitness`;
      const trainerUserId = `trainer_${st.id}`;
      const trainerProfileId = `profile_${st.id}`;
      officialTrainerUserIds.push(trainerUserId);

      let user = await prisma.user.findUnique({
        where: { email },
        include: { trainerProfile: { include: { packages: true } } },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: trainerUserId,
            name: st.name,
            email,
            password: defaultPassword,
            role: "TRAINER",
            trainerProfile: {
              create: {
                id: trainerProfileId,
                bio: st.bio,
                specialty: st.specialty,
                experience: parseInt(st.experience) || 5,
                price: st.price || 999,
                verified: true,
                status: "ACTIVE",
                isPublic: true,
                rating: st.rating || 4.9,
                clientsCount: st.clients || 200,
                avatarUrl: st.image,
                tags: st.tags,
              },
            },
          },
          include: { trainerProfile: { include: { packages: true } } },
        });
      } else {
        // Update existing official trainer profile to ACTIVE & VERIFIED with complete metadata
        if (user.trainerProfile) {
          await prisma.trainerProfile.update({
            where: { id: user.trainerProfile.id },
            data: {
              bio: st.bio,
              specialty: st.specialty,
              experience: parseInt(st.experience) || 5,
              price: st.price || 999,
              verified: true,
              status: "ACTIVE",
              isPublic: true,
              rating: st.rating || 4.9,
              clientsCount: st.clients || 200,
              avatarUrl: st.image,
              tags: st.tags,
            },
          });
        } else {
          await prisma.trainerProfile.create({
            data: {
              id: trainerProfileId,
              userId: user.id,
              bio: st.bio,
              specialty: st.specialty,
              experience: parseInt(st.experience) || 5,
              price: st.price || 999,
              verified: true,
              status: "ACTIVE",
              isPublic: true,
              rating: st.rating || 4.9,
              clientsCount: st.clients || 200,
              avatarUrl: st.image,
              tags: st.tags,
            },
          });
        }
      }
    }

    // Ensure all official trainer IDs are verified and active
    await prisma.trainerProfile.updateMany({
      where: {
        userId: {
          in: officialTrainerUserIds,
        },
      },
      data: {
        status: "ACTIVE",
        verified: true,
        isPublic: true,
      },
    });

    // Ensure all ACTIVE TrainerProfiles in the database have default coaching packages
    const activeTrainerProfiles = await prisma.trainerProfile.findMany({
      where: { status: "ACTIVE", verified: true },
      include: { packages: true, user: true },
    });

    for (const tp of activeTrainerProfiles) {
      if (tp.packages.length === 0) {
        await prisma.coachingPackage.createMany({
          data: [
            {
              trainerId: tp.id,
              name: "1-on-1 Monthly Coaching",
              description: `Personalized 1-on-1 programming designed around your goals with Coach ${tp.user.name}.`,
              duration: "1 Month",
              price: 999,
              benefits: [
                "Personalized periodized training program",
                "Nutrition guidance & macro targets",
                "Weekly form video reviews",
                "Direct in-app messaging with coach",
                "3-day complimentary initial trial",
              ],
              active: true,
            },
            {
              trainerId: tp.id,
              name: "3-Month Body Transformation",
              description: "Structured progressive overload and body recomposition protocol.",
              duration: "3 Months",
              price: 2499,
              benefits: [
                "Complete 12-week periodization split",
                "Weekly technique & lifting video analysis",
                "Bi-weekly nutritional & caloric adjustments",
                "Priority response in direct chat (<4 hours)",
                "Full progress milestone tracking",
              ],
              active: true,
            },
            {
              trainerId: tp.id,
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
        });
      }
    }

    const totalActive = await prisma.trainerProfile.count({
      where: { status: "ACTIVE", verified: true },
    });

    console.log(`Database synchronized: ${totalActive} active verified coaches in public marketplace.`);
    return {
      success: true,
      message: `Synchronized ${totalActive} active & verified trainer profiles.`,
      activeTrainersCount: totalActive,
    };
  } catch (error) {
    console.error("Error seeding trainers and packages:", error);
    return { error: "Failed to seed trainers and packages" };
  }
}
