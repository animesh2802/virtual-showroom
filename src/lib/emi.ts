export type EmiResult = {
    emi: number;
    totalPayable: number;
    totalInterest: number;
};

export function calculateEmi(
    principal: number,
    annualRatePercent: number,
    months: number
): EmiResult {
    if (principal <= 0) throw new RangeError("Loan amount must be positive");
    if (months <= 0) throw new RangeError("Tenure must be at least 1 month");
    if (annualRatePercent < 0) throw new RangeError("Rate cannot be negative");

    const monthlyRate = annualRatePercent / 12 / 100;

    let emi: number;
    if (monthlyRate === 0) {
        emi = principal / months;
    } else {
        const growth = Math.pow(1 + monthlyRate, months);
        emi = (principal * monthlyRate * growth) / (growth - 1);
    }

    const roundedEmi = Math.round(emi);
    const totalPayable = roundedEmi * months;

    return {
        emi: roundedEmi,
        totalPayable,
        totalInterest: Math.max(totalPayable - principal, 0),
    };
}