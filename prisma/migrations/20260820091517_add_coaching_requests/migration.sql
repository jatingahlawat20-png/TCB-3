-- CreateEnum
CREATE TYPE "CoachingRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CoachingRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" "CoachingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachingRequest_clientId_idx" ON "CoachingRequest"("clientId");

-- CreateIndex
CREATE INDEX "CoachingRequest_trainerId_idx" ON "CoachingRequest"("trainerId");

-- CreateIndex
CREATE INDEX "CoachingRequest_status_idx" ON "CoachingRequest"("status");

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
