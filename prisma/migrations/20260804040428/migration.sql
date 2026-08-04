-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "travelers" INTEGER NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "accommodation" TEXT NOT NULL,
    "tripLengthDays" INTEGER NOT NULL,
    "earliestDeparture" DATE NOT NULL,
    "latestReturn" DATE NOT NULL,
    "flexibility" TEXT NOT NULL,
    "interests" TEXT[],
    "pace" TEXT NOT NULL,
    "generationStatus" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "generationVersion" TEXT NOT NULL,
    "sanitizedError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripRecommendation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "whyItFits" TEXT[],
    "practicalNotes" TEXT[],
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "accommodationEstimate" DECIMAL(12,2) NOT NULL,
    "transitEstimate" DECIMAL(12,2) NOT NULL,
    "experienceEstimate" DECIMAL(12,2) NOT NULL,
    "bufferEstimate" DECIMAL(12,2) NOT NULL,
    "totalEstimatedCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "estimatedCost" DECIMAL(12,2) NOT NULL,
    "notes" TEXT[],

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelFeedback" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "recommendationId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "anonymousId" TEXT,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelRequest_generationStatus_idx" ON "TravelRequest"("generationStatus");

-- CreateIndex
CREATE INDEX "TravelRequest_createdAt_idx" ON "TravelRequest"("createdAt");

-- CreateIndex
CREATE INDEX "TripRecommendation_requestId_idx" ON "TripRecommendation"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "TripRecommendation_requestId_rank_key" ON "TripRecommendation"("requestId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_recommendationId_day_key" ON "ItineraryDay"("recommendationId", "day");

-- CreateIndex
CREATE INDEX "PriceAlert_normalizedEmail_idx" ON "PriceAlert"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_recommendationId_normalizedEmail_key" ON "PriceAlert"("recommendationId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "TravelFeedback_requestId_idx" ON "TravelFeedback"("requestId");

-- CreateIndex
CREATE INDEX "TravelFeedback_recommendationId_idx" ON "TravelFeedback"("recommendationId");

-- CreateIndex
CREATE INDEX "RateLimitAttempt_key_scope_createdAt_idx" ON "RateLimitAttempt"("key", "scope", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitAttempt_requestId_scope_createdAt_idx" ON "RateLimitAttempt"("requestId", "scope", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_anonymousId_idx" ON "AnalyticsEvent"("anonymousId");

-- AddForeignKey
ALTER TABLE "TripRecommendation" ADD CONSTRAINT "TripRecommendation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "TripRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "TripRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelFeedback" ADD CONSTRAINT "TravelFeedback_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelFeedback" ADD CONSTRAINT "TravelFeedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "TripRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
