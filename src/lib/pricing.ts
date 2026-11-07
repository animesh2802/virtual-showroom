import { db } from "@/lib/db";
import { calculateOnRoad, type OnRoadPrice } from "@/lib/onroad";

export async function getOnRoadPrice(
    variantId: string,
    cityId: string
): Promise<OnRoadPrice | null> {
    const row = await db.variantPrice.findUnique({
        where: { variantId_cityId: { variantId, cityId } },
    });

    if (!row) return null;
    return calculateOnRoad(row);
}