import { describe, it, expect } from "vitest";
import { calculateOnRoad } from "./onroad";

const row = {
    exShowroom: 1245000,
    roadTax: 99600,
    insurance: 43575,
    accessories: 15000,
    validUntil: new Date("2026-12-31T00:00:00Z"),
};

describe("calculateOnRoad", () => {
    it("adds all four components into the total", () => {
        const result = calculateOnRoad(row, new Date("2026-11-06T00:00:00Z"));
        expect(result.total).toBe(1403175);
    });

    it("is not expired before the valid-until date", () => {
        const result = calculateOnRoad(row, new Date("2026-11-06T00:00:00Z"));
        expect(result.isExpired).toBe(false);
    });

    it("is still valid late on the valid-until day", () => {
        const result = calculateOnRoad(row, new Date("2026-12-31T18:00:00Z"));
        expect(result.isExpired).toBe(false);
    });

    it("is expired once the valid-until day has passed", () => {
        const result = calculateOnRoad(row, new Date("2027-01-01T00:00:00Z"));
        expect(result.isExpired).toBe(true);
    });
});