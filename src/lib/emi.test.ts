import { describe, it, expect } from "vitest";
import { calculateEmi } from "./emi";

describe("calculateEmi", () => {
    it("matches a known loan: 10 lakh at 9% for 60 months", () => {
        const result = calculateEmi(1000000, 9, 60);
        expect(result.emi).toBe(20758);
        expect(result.totalPayable).toBe(1245480);
        expect(result.totalInterest).toBe(245480);
    });

    it("matches a second known loan: 5 lakh at 10% for 36 months", () => {
        expect(calculateEmi(500000, 10, 36).emi).toBe(16134);
    });

    it("handles zero interest by splitting the loan evenly", () => {
        const result = calculateEmi(120000, 0, 12);
        expect(result.emi).toBe(10000);
        expect(result.totalInterest).toBe(0);
    });

    it("rejects invalid inputs", () => {
        expect(() => calculateEmi(0, 9, 60)).toThrow();
        expect(() => calculateEmi(100000, 9, 0)).toThrow();
        expect(() => calculateEmi(100000, -1, 12)).toThrow();
    });
});