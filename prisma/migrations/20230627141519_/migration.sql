-- CreateEnum
CREATE TYPE "AutoresponseTriggerType" AS ENUM ('EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'STRICT_CONTAINS');

-- CreateTable
CREATE TABLE "autoresponses" (
    "id" TEXT NOT NULL,
    "guild" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerType" "AutoresponseTriggerType" NOT NULL,

    CONSTRAINT "autoresponses_pkey" PRIMARY KEY ("id")
);
