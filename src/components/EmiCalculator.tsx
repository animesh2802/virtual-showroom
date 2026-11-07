"use client";

import { useMemo, useState } from "react";
import { calculateEmi } from "@/lib/emi";
import { formatRupees } from "@/lib/format";

export default function EmiCalculator({ onRoadPrice }: { onRoadPrice: number }) {
    const [downPayment, setDownPayment] = useState(Math.round(onRoadPrice * 0.2));
    const [rate, setRate] = useState(9);
    const [years, setYears] = useState(5);

    const safeDown = Math.min(Math.max(downPayment, 0), onRoadPrice);
    const loan = onRoadPrice - safeDown;

    const result = useMemo(
        () => (loan > 0 ? calculateEmi(loan, rate, years * 12) : null),
        [loan, rate, years]
    );

    const field =
        "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

    return (
        <section className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold">EMI calculator</h2>
            <p className="mt-1 text-sm text-neutral-500">
                Based on the lowest on-road price shown above.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label className="text-sm">
                    Down payment (₹)
                    <input
                        type="number"
                        min={0}
                        max={onRoadPrice}
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
                        className={field}
                    />
                </label>
                <label className="text-sm">
                    Interest rate (% per year)
                    <input
                        type="number"
                        min={0}
                        max={30}
                        step={0.1}
                        value={rate}
                        onChange={(e) =>
                            setRate(Math.min(Math.max(Number(e.target.value) || 0, 0), 30))
                        }
                        className={field}
                    />
                </label>
                <label className="text-sm">
                    Tenure
                    <select
                        value={years}
                        onChange={(e) => setYears(Number(e.target.value))}
                        className={field}
                    >
                        {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                            <option key={y} value={y}>
                                {y} {y === 1 ? "year" : "years"}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-5">
                {result ? (
                    <>
                        <p className="text-sm text-neutral-500">Monthly EMI</p>
                        <p className="text-3xl font-semibold">{formatRupees(result.emi)}</p>
                        <p className="mt-2 text-sm text-neutral-500">
                            Loan {formatRupees(loan)} · Total interest{" "}
                            {formatRupees(result.totalInterest)} · Total payable{" "}
                            {formatRupees(result.totalPayable)}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-neutral-500">
                        No loan needed with this down payment.
                    </p>
                )}
                <p className="mt-3 text-xs text-neutral-400">
                    Illustrative only. The actual rate and EMI depend on the lender.
                </p>
            </div>
        </section>
    );
}