# TripPossible Destination Intent — Design

## Goal
Let travelers control how broad destination discovery should be while preserving the surprise of random recommendations.

## User experience
Add a destination-intent section near the start of the planner with four modes:

- **Surprise me** (default): select destinations from a broad global pool, excluding the departure city and obvious nearby destinations by default.
- **Country**: choose a country; all three recommendations stay within it.
- **Region**: choose a region such as Europe, South America, or Southeast Asia; all three recommendations stay within that region.
- **Place in mind**: enter a destination; all three recommendations are centered on that place, with different trip styles.

The planner review summarizes the selected intent. Existing users and existing requests remain compatible because Surprise me is the default.

## Recommendation behavior
The generator applies geographic constraints before random selection. It then chooses three diverse results (culture/food, nature/adventure, and relaxed/slow travel). Randomness is seeded from the request identity so a retry is stable, while regeneration receives a fresh seed and can produce a new set. Exact-place requests may use nearby neighborhoods or distinct itinerary angles rather than unrelated destinations.

## Architecture and data flow
- Add nullable destination-intent fields to `TravelRequest`: mode, country/region value, and optional place text.
- Extend shared Zod input contracts and `TravelRequestInput`.
- Keep Server Actions as adapters; service validation remains authoritative.
- Pass intent to both mock and OpenAI generators. OpenAI output is still validated against the requested scope.
- Persist intent with the request so results and regeneration are reproducible.
- Use a curated destination catalog with country/region metadata; do not rely on live geocoding in Week 1.

## Validation and errors
- Country and region values must come from the supported catalog.
- Place text is trimmed and bounded; empty place text is invalid only in Place in mind mode.
- Country/region modes reject recommendations outside the selected scope.
- Surprise me prevents the origin city and nearby-origin fallback destinations unless the user explicitly chooses a domestic/nearby scope.
- Client errors remain generic; provider details stay server-side.

## Testing
- Schema tests for each mode and conditional fields.
- Catalog tests for country/region membership and origin exclusion.
- Generator tests for exactly three results, diversity, deterministic retry, fresh regeneration, and scope enforcement.
- RTL tests for mode switching, conditional controls, review summary, and keyboard interaction.
- Playwright coverage for Surprise me, country selection, and place-in-mind journeys.

## Week 1 boundaries
No live geocoding, maps, booking integrations, or destination availability claims. The catalog is intentionally small and curated; it can expand based on recommendation-opened, feedback, and alert-signup signals.
