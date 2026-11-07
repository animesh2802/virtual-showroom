export type PriceRow = {
    exShowroom: number;
    roadTax: number;
    insurance: number;
    accessories: number;
    validUntil: Date;
};

export type OnRoadPrice = PriceRow & {
    total: number;
    isExpired: boolean;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function calculateOnRoad(
    row: PriceRow,
    now: Date = new Date()
): OnRoadPrice {
    const total =
        row.exShowroom + row.roadTax + row.insurance + row.accessories;

    const isExpired = now.getTime() >= row.validUntil.getTime() + ONE_DAY_MS;

    return {
        exShowroom: row.exShowroom,
        roadTax: row.roadTax,
        insurance: row.insurance,
        accessories: row.accessories,
        validUntil: row.validUntil,
        total,
        isExpired,
    };
}