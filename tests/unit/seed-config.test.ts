import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('seed configuration', () => {
  it('loads dotenv before constructing PrismaPg', () => {
    const seed = readFileSync('prisma/seed.ts', 'utf8');
    expect(seed.indexOf("import 'dotenv/config';")).toBeGreaterThanOrEqual(0);
    expect(seed.indexOf("import 'dotenv/config';")).toBeLessThan(seed.indexOf("new PrismaPg"));
  });
});
