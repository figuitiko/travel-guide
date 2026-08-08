-- Add nullable detailed cost categories so existing recommendations remain readable.
ALTER TABLE "TripRecommendation" ADD COLUMN "flightEstimate" DECIMAL(12,2);
ALTER TABLE "TripRecommendation" ADD COLUMN "foodEstimate" DECIMAL(12,2);
