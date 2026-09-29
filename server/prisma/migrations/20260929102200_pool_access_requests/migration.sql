-- CreateEnum
CREATE TYPE "PoolAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PoolAccessRequest" (
    "id" UUID NOT NULL,
    "poolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestNote" TEXT,
    "status" "PoolAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolAccessRequest_poolId_userId_key" ON "PoolAccessRequest"("poolId", "userId");

-- CreateIndex
CREATE INDEX "PoolAccessRequest_poolId_status_createdAt_idx" ON "PoolAccessRequest"("poolId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "PoolAccessRequest" ADD CONSTRAINT "PoolAccessRequest_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAccessRequest" ADD CONSTRAINT "PoolAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
