-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('CRIME', 'MISSING_PERSON', 'SUSPICIOUS_ACTIVITY', 'TRAFFICKING', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MissingStatus" AS ENUM ('ACTIVE', 'FOUND', 'CLOSED');

-- CreateEnum
CREATE TYPE "OfficerRole" AS ENUM ('OFFICER', 'SUPERVISOR', 'ADMIN');

-- CreateTable
CREATE TABLE "AnonymousToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "district" TEXT,
    "municipality" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "status" "ReportStatus" NOT NULL DEFAULT 'RECEIVED',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "anonymousTokenId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "scanStatus" TEXT NOT NULL,
    "safe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissingPerson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "lastSeenLocation" TEXT NOT NULL,
    "district" TEXT,
    "photoObjectKey" TEXT,
    "status" "MissingStatus" NOT NULL DEFAULT 'ACTIVE',
    "anonymousTokenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissingPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "OfficerRole" NOT NULL DEFAULT 'OFFICER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusUpdate" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "note" TEXT,
    "officerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "officerId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ipHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousToken_tokenHash_key" ON "AnonymousToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Report_status_type_priority_idx" ON "Report"("status", "type", "priority");

-- CreateIndex
CREATE INDEX "Report_district_idx" ON "Report"("district");

-- CreateIndex
CREATE UNIQUE INDEX "Media_objectKey_key" ON "Media"("objectKey");

-- CreateIndex
CREATE INDEX "MissingPerson_status_district_idx" ON "MissingPerson"("status", "district");

-- CreateIndex
CREATE UNIQUE INDEX "Officer_badgeNumber_key" ON "Officer"("badgeNumber");

-- CreateIndex
CREATE INDEX "StatusUpdate_reportId_createdAt_idx" ON "StatusUpdate"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_officerId_idx" ON "AuditLog"("officerId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_anonymousTokenId_fkey" FOREIGN KEY ("anonymousTokenId") REFERENCES "AnonymousToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingPerson" ADD CONSTRAINT "MissingPerson_anonymousTokenId_fkey" FOREIGN KEY ("anonymousTokenId") REFERENCES "AnonymousToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusUpdate" ADD CONSTRAINT "StatusUpdate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusUpdate" ADD CONSTRAINT "StatusUpdate_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
