-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'supervisor', 'iskra', 'accountant', 'engineer');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('rf_site_survey', 'site_maintenance', 'installation_supervising', 'comm_check');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('planned', 'active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "District" AS ENUM ('sulaymaniyah', 'duhok', 'erbil');

-- CreateEnum
CREATE TYPE "ContractorName" AS ENUM ('bim', 'broadcast', 'shandez');

-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('me516', 'me513', 'mt880', 'am550dc', 'am550ct', 'gateway');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('resolved', 'ongoing', 'out_of_scope');

-- CreateEnum
CREATE TYPE "SignalRating" AS ENUM ('bad', 'good', 'perfect');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'denied');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('usd', 'iqd');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('mission_invitation', 'expense_pending', 'expense_approved', 'expense_denied', 'mission_starting', 'target_assigned', 'violation_logged', 'generic');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "InstallationEntryType" AS ENUM ('meter', 'note');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "themePreference" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MissionType" NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'planned',
    "district" "District" NOT NULL,
    "zoneName" TEXT NOT NULL,
    "contractorId" TEXT,
    "referenceFileId" TEXT,
    "expectedGatewayCount" INTEGER,
    "meterTypes" "MeterType"[],
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "slug" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionMember" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionInvitation" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "MissionInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionLog" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gateway" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "coordinatesText" TEXT,
    "korekRating" "SignalRating",
    "zainRating" "SignalRating",
    "asiacellRating" "SignalRating",
    "registeredById" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceMeter" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "enclosureNumber" TEXT,
    "description" TEXT,
    "status" "MaintenanceStatus" NOT NULL,
    "registeredById" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationMeter" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "observation" TEXT,
    "registeredById" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationNote" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "noteText" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMissionSurvey" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "missionRating" INTEGER,
    "generalNotes" TEXT,
    "contractorRating" INTEGER,
    "problemsEncountered" TEXT,
    "personalProblems" TEXT,
    "recurringIssues" TEXT,
    "suggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMissionSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" "ContractorName" NOT NULL,
    "displayName" TEXT NOT NULL,
    "baseScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "district" "District" NOT NULL,
    "place" TEXT NOT NULL,
    "severity" "ViolationSeverity" NOT NULL DEFAULT 'medium',
    "submittedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workstream" "MissionType" NOT NULL,
    "metricLabel" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "visibleToUser" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "targetHitPct" DOUBLE PRECISION NOT NULL,
    "productivity" DOUBLE PRECISION NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "reliability" DOUBLE PRECISION NOT NULL,
    "initiative" DOUBLE PRECISION NOT NULL,
    "collaboration" DOUBLE PRECISION NOT NULL,
    "violationReports" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "lockedExchangeRate" DOUBLE PRECISION NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "denialReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PocketMoneyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PocketMoneyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaEventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AgendaEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileRecord" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "missionId" TEXT,
    "gatewayId" TEXT,
    "maintenanceMeterId" TEXT,
    "installationMeterId" TEXT,
    "installationNoteId" TEXT,
    "expenseId" TEXT,
    "violationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_referenceFileId_key" ON "Mission"("referenceFileId");

-- CreateIndex
CREATE INDEX "Mission_status_idx" ON "Mission"("status");

-- CreateIndex
CREATE INDEX "Mission_type_idx" ON "Mission"("type");

-- CreateIndex
CREATE INDEX "Mission_createdById_idx" ON "Mission"("createdById");

-- CreateIndex
CREATE INDEX "Mission_scheduledStartAt_idx" ON "Mission"("scheduledStartAt");

-- CreateIndex
CREATE INDEX "MissionMember_userId_idx" ON "MissionMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionMember_missionId_userId_key" ON "MissionMember"("missionId", "userId");

-- CreateIndex
CREATE INDEX "MissionInvitation_userId_status_idx" ON "MissionInvitation"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MissionInvitation_missionId_userId_key" ON "MissionInvitation"("missionId", "userId");

-- CreateIndex
CREATE INDEX "MissionLog_missionId_createdAt_idx" ON "MissionLog"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "Gateway_missionId_idx" ON "Gateway"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Gateway_missionId_gatewayId_key" ON "Gateway"("missionId", "gatewayId");

-- CreateIndex
CREATE INDEX "MaintenanceMeter_missionId_idx" ON "MaintenanceMeter"("missionId");

-- CreateIndex
CREATE INDEX "InstallationMeter_missionId_idx" ON "InstallationMeter"("missionId");

-- CreateIndex
CREATE INDEX "InstallationNote_missionId_createdAt_idx" ON "InstallationNote"("missionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostMissionSurvey_missionId_key" ON "PostMissionSurvey"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_name_key" ON "Contractor"("name");

-- CreateIndex
CREATE INDEX "Violation_contractorId_idx" ON "Violation"("contractorId");

-- CreateIndex
CREATE INDEX "Violation_createdAt_idx" ON "Violation"("createdAt");

-- CreateIndex
CREATE INDEX "Target_userId_idx" ON "Target"("userId");

-- CreateIndex
CREATE INDEX "Target_startDate_endDate_idx" ON "Target"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "BonusScoreSnapshot_userId_periodEnd_idx" ON "BonusScoreSnapshot"("userId", "periodEnd");

-- CreateIndex
CREATE INDEX "Expense_submittedById_status_idx" ON "Expense"("submittedById", "status");

-- CreateIndex
CREATE INDEX "Expense_status_createdAt_idx" ON "Expense"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PocketMoneyTransaction_userId_createdAt_idx" ON "PocketMoneyTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgendaEvent_startAt_endAt_idx" ON "AgendaEvent"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaEventAttendee_eventId_userId_key" ON "AgendaEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Holiday_startDate_endDate_idx" ON "Holiday"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "FileRecord_category_idx" ON "FileRecord"("category");

-- CreateIndex
CREATE INDEX "FileRecord_uploadedById_idx" ON "FileRecord"("uploadedById");

-- CreateIndex
CREATE INDEX "FileRecord_missionId_idx" ON "FileRecord"("missionId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_referenceFileId_fkey" FOREIGN KEY ("referenceFileId") REFERENCES "FileRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionMember" ADD CONSTRAINT "MissionMember_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionMember" ADD CONSTRAINT "MissionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionInvitation" ADD CONSTRAINT "MissionInvitation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionInvitation" ADD CONSTRAINT "MissionInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionInvitation" ADD CONSTRAINT "MissionInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionLog" ADD CONSTRAINT "MissionLog_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionLog" ADD CONSTRAINT "MissionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gateway" ADD CONSTRAINT "Gateway_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gateway" ADD CONSTRAINT "Gateway_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceMeter" ADD CONSTRAINT "MaintenanceMeter_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceMeter" ADD CONSTRAINT "MaintenanceMeter_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMeter" ADD CONSTRAINT "InstallationMeter_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMeter" ADD CONSTRAINT "InstallationMeter_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationNote" ADD CONSTRAINT "InstallationNote_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationNote" ADD CONSTRAINT "InstallationNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMissionSurvey" ADD CONSTRAINT "PostMissionSurvey_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMissionSurvey" ADD CONSTRAINT "PostMissionSurvey_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusScoreSnapshot" ADD CONSTRAINT "BonusScoreSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PocketMoneyTransaction" ADD CONSTRAINT "PocketMoneyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PocketMoneyTransaction" ADD CONSTRAINT "PocketMoneyTransaction_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEvent" ADD CONSTRAINT "AgendaEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEventAttendee" ADD CONSTRAINT "AgendaEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AgendaEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEventAttendee" ADD CONSTRAINT "AgendaEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_maintenanceMeterId_fkey" FOREIGN KEY ("maintenanceMeterId") REFERENCES "MaintenanceMeter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_installationMeterId_fkey" FOREIGN KEY ("installationMeterId") REFERENCES "InstallationMeter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_installationNoteId_fkey" FOREIGN KEY ("installationNoteId") REFERENCES "InstallationNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "Violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
