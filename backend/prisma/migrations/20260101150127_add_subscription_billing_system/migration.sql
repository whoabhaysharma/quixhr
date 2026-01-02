/*
  Warnings:

  - You are about to drop the column `firstCheckIn` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `lastCheckOut` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `totalMinutes` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `punchTime` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `AttendanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Calendar` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `CalendarHoliday` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `CalendarHoliday` table. All the data in the column will be lost.
  - You are about to drop the column `rule` on the `CalendarWeeklyRule` table. All the data in the column will be lost.
  - You are about to drop the column `weekNumbers` on the `CalendarWeeklyRule` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `invitedBy` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `annualAllowance` on the `LeavePolicy` table. All the data in the column will be lost.
  - You are about to drop the column `calendarId` on the `LeavePolicy` table. All the data in the column will be lost.
  - You are about to drop the column `canCarryForward` on the `LeavePolicy` table. All the data in the column will be lost.
  - You are about to drop the column `maxCarryOver` on the `LeavePolicy` table. All the data in the column will be lost.
  - You are about to drop the column `totalDays` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `LeaveBalance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[calendarId,date]` on the table `CalendarHoliday` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leaveGradeId,leaveType]` on the table `LeavePolicy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `timestamp` to the `AttendanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `CalendarHoliday` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strategy` to the `CalendarWeeklyRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `CalendarWeeklyRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joiningDate` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveGradeId` to the `LeavePolicy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDays` to the `LeavePolicy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daysTaken` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'GRACE_PERIOD');

-- CreateEnum
CREATE TYPE "RuleStrategy" AS ENUM ('CYCLIC', 'POSITIONAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "LedgerEvent" AS ENUM ('ACCRUAL', 'CONSUMPTION', 'ADJUSTMENT', 'IMPORT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ORG_ADMIN';

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_invitedBy_fkey";

-- DropForeignKey
ALTER TABLE "LeaveBalance" DROP CONSTRAINT "LeaveBalance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "LeavePolicy" DROP CONSTRAINT "LeavePolicy_calendarId_fkey";

-- DropIndex
DROP INDEX "CalendarHoliday_calendarId_startDate_idx";

-- DropIndex
DROP INDEX "LeavePolicy_calendarId_leaveType_key";

-- DropIndex
DROP INDEX "LeaveRequest_employeeId_startDate_endDate_idx";

-- DropIndex
DROP INDEX "LeaveRequest_status_idx";

-- DropIndex
DROP INDEX "Notification_userId_isRead_idx";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "firstCheckIn",
DROP COLUMN "lastCheckOut",
DROP COLUMN "totalMinutes",
ADD COLUMN     "checkIn" TIMESTAMP(3),
ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "isEarlyOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overtimeMins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workMinutes" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "AttendanceLog" DROP COLUMN "punchTime",
DROP COLUMN "source",
ADD COLUMN     "gpsCoords" JSONB,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Calendar" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "CalendarHoliday" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "isOptional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CalendarWeeklyRule" DROP COLUMN "rule",
DROP COLUMN "weekNumbers",
ADD COLUMN     "interval" INTEGER DEFAULT 1,
ADD COLUMN     "positions" INTEGER[],
ADD COLUMN     "referenceDate" TIMESTAMP(3),
ADD COLUMN     "strategy" "RuleStrategy" NOT NULL,
ADD COLUMN     "type" "WeeklyRuleType" NOT NULL;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
ADD COLUMN     "logoUrl" TEXT,
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "createdAt",
DROP COLUMN "name",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "leaveGradeId" TEXT;

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "invitedBy";

-- AlterTable
ALTER TABLE "LeavePolicy" DROP COLUMN "annualAllowance",
DROP COLUMN "calendarId",
DROP COLUMN "canCarryForward",
DROP COLUMN "maxCarryOver",
ADD COLUMN     "carryForward" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leaveGradeId" TEXT NOT NULL,
ADD COLUMN     "maxCarryAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDays" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "totalDays",
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "daysTaken" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "emailVerified",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPasswordResetRequest" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- DropTable
DROP TABLE "LeaveBalance";

-- DropEnum
DROP TYPE "AttendanceType";

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxEmployees" INTEGER NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "priceYearly" DOUBLE PRECISION NOT NULL,
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerSignature" TEXT,
    "gatewayResponse" JSONB,
    "billingCycle" "BillingCycle",
    "notes" TEXT,
    "failureReason" TEXT,
    "failureCode" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "billingAddress" JSONB,
    "lineItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveGrade" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LeaveGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveAllocation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "allocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveLedger" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" "LedgerEvent" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "leaveRequestId" TEXT,

    CONSTRAINT "LeaveLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_companyId_key" ON "Subscription"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerOrderId_key" ON "Payment"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveAllocation_employeeId_year_leaveType_key" ON "LeaveAllocation"("employeeId", "year", "leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarHoliday_calendarId_date_key" ON "CalendarHoliday"("calendarId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_leaveGradeId_leaveType_key" ON "LeavePolicy"("leaveGradeId", "leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_leaveGradeId_fkey" FOREIGN KEY ("leaveGradeId") REFERENCES "LeaveGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveGrade" ADD CONSTRAINT "LeaveGrade_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_leaveGradeId_fkey" FOREIGN KEY ("leaveGradeId") REFERENCES "LeaveGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAllocation" ADD CONSTRAINT "LeaveAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedger" ADD CONSTRAINT "LeaveLedger_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
