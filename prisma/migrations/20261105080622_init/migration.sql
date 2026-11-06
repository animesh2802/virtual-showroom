-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "Fuel" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "UsedCarStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'SOLD');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'TEST_DRIVE', 'TRADE_IN', 'PORTAL_CSV', 'WALK_IN');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'TEST_DRIVE_BOOKED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "showroomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Showroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "Showroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "specs" JSONB NOT NULL,
    "photos" TEXT[],
    "colours" TEXT[],

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantPrice" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "exShowroom" INTEGER NOT NULL,
    "roadTax" INTEGER NOT NULL,
    "insurance" INTEGER NOT NULL,
    "accessories" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsedCar" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "year" INTEGER NOT NULL,
    "km" INTEGER NOT NULL,
    "owners" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "UsedCarStatus" NOT NULL DEFAULT 'AVAILABLE',
    "registrationNo" TEXT NOT NULL,
    "inspectionReport" JSONB NOT NULL,
    "photos" TEXT[],

    CONSTRAINT "UsedCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoCar" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,

    CONSTRAINT "DemoCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "interestedModelId" TEXT,
    "showroomId" TEXT,
    "assignedToId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "consentGivenAt" TIMESTAMP(3),
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstContactedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "aiDraft" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "demoCarId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentRule" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AssignmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_slug_key" ON "Model"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_slug_key" ON "Variant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VariantPrice_variantId_cityId_key" ON "VariantPrice"("variantId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "UsedCar_stockId_key" ON "UsedCar"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "UsedCar_slug_key" ON "UsedCar"("slug");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_status_idx" ON "Lead"("assignedToId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_demoCarId_startTime_key" ON "Booking"("demoCarId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentRule_showroomId_modelId_userId_key" ON "AssignmentRule"("showroomId", "modelId", "userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantPrice" ADD CONSTRAINT "VariantPrice_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantPrice" ADD CONSTRAINT "VariantPrice_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedCar" ADD CONSTRAINT "UsedCar_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoCar" ADD CONSTRAINT "DemoCar_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoCar" ADD CONSTRAINT "DemoCar_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_interestedModelId_fkey" FOREIGN KEY ("interestedModelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_demoCarId_fkey" FOREIGN KEY ("demoCarId") REFERENCES "DemoCar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
