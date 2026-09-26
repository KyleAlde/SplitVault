-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('POOL_CREATED', 'POOL_UPDATED', 'CATEGORY_CREATED', 'CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONTRIBUTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPool" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalBudget" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPoolMember" (
    "poolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONTRIBUTOR',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetPoolMember_pkey" PRIMARY KEY ("poolId","userId")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "poolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#425b9a',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" UUID NOT NULL,
    "poolId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "claimantId" UUID NOT NULL,
    "reviewerId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "userId" UUID NOT NULL,
    "poolId" UUID,
    "claimId" UUID,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "BudgetPool_createdAt_idx" ON "BudgetPool"("createdAt");

-- CreateIndex
CREATE INDEX "BudgetPoolMember_userId_idx" ON "BudgetPoolMember"("userId");

-- CreateIndex
CREATE INDEX "Category_poolId_idx" ON "Category"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_poolId_name_key" ON "Category"("poolId", "name");

-- CreateIndex
CREATE INDEX "ExpenseClaim_poolId_status_idx" ON "ExpenseClaim"("poolId", "status");

-- CreateIndex
CREATE INDEX "ExpenseClaim_claimantId_idx" ON "ExpenseClaim"("claimantId");

-- CreateIndex
CREATE INDEX "ExpenseClaim_categoryId_idx" ON "ExpenseClaim"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_claimId_key" ON "Receipt"("claimId");

-- CreateIndex
CREATE INDEX "AuditLog_poolId_createdAt_idx" ON "AuditLog"("poolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BudgetPoolMember" ADD CONSTRAINT "BudgetPoolMember_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPoolMember" ADD CONSTRAINT "BudgetPoolMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ExpenseClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "BudgetPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
