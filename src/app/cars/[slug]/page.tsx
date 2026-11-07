import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { calculateOnRoad } from "@/lib/onroad";
import { formatRupees } from "@/lib/format";
import EmiCalculator from "@/components/EmiCalculator";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ city?: string }>;
};

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const model = await db.model.findUnique({ where: { slug } });
    if (!model) return {};
    return {
        title: `${model.name}: variants, on-road price and test drive`,
        description: model.description,
    };
}

export default async function ModelPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { city: cityParam } = await searchParams;

    const cities = await db.city.findMany({ orderBy: { name: "asc" } });
    const city =
        cities.find((c) => c.name.toLowerCase() === cityParam?.toLowerCase()) ??
        cities.find((c) => c.name === "Lucknow") ??
        cities[0];
    if (!city) notFound();

    const model = await db.model.findUnique({
        where: { slug },
        include: {
            variants: {
                orderBy: { name: "asc" },
                include: { prices: { where: { cityId: city.id } } },
            },
        },
    });
    if (!model) notFound();

    const variants = model.variants.map((v) => ({
        ...v,
        price: v.prices[0] ? calculateOnRoad(v.prices[0]) : null,
    }));

    const pricedTotals = variants.flatMap((v) => (v.price ? [v.price.total] : []));
    const lowestTotal = pricedTotals.length ? Math.min(...pricedTotals) : null;

    return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            <p className="text-sm text-neutral-500">{model.bodyType}</p>
            <h1 className="text-4xl font-semibold tracking-tight">{model.name}</h1>
            <p className="mt-3 max-w-2xl text-neutral-600">{model.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-500">Prices for</span>
                {cities.map((c) => (
                    <Link
                        key={c.id}
                        href={`/cars/${model.slug}?city=${encodeURIComponent(c.name)}`}
                        className={`rounded-full border px-3 py-1 text-sm ${c.id === city.id
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
                            }`}
                    >
                        {c.name}
                    </Link>
                ))}
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
                {variants.map((v) => (
                    <article key={v.id} className="rounded-xl border border-neutral-200 p-6">
                        <h2 className="text-xl font-semibold">{v.name}</h2>
                        <p className="text-sm text-neutral-500">
                            {v.fuel.charAt(0) + v.fuel.slice(1).toLowerCase()} ·{" "}
                            {v.transmission.charAt(0) + v.transmission.slice(1).toLowerCase()}
                        </p>

                        {v.price ? (
                            <>
                                <dl className="mt-5 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-neutral-500">Ex-showroom</dt>
                                        <dd>{formatRupees(v.price.exShowroom)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-neutral-500">Road tax</dt>
                                        <dd>{formatRupees(v.price.roadTax)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-neutral-500">Insurance</dt>
                                        <dd>{formatRupees(v.price.insurance)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-neutral-500">Accessories</dt>
                                        <dd>{formatRupees(v.price.accessories)}</dd>
                                    </div>
                                    <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
                                        <dt>On-road price in {city.name}</dt>
                                        <dd>{formatRupees(v.price.total)}</dd>
                                    </div>
                                </dl>

                                <p className="mt-4 text-xs text-neutral-500">
                                    Valid until{" "}
                                    {v.price.validUntil.toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "UTC",
                                    })}
                                    . Prices may change without notice.
                                </p>
                                {v.price.isExpired && (
                                    <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                        This price list has expired. Please confirm the current
                                        price with the showroom.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="mt-5 text-sm text-neutral-500">
                                A price for {city.name} isn&apos;t available yet.
                            </p>
                        )}
                    </article>
                ))}
            </div>

            {lowestTotal !== null && (
                <div className="mt-10">
                    <EmiCalculator key={lowestTotal} onRoadPrice={lowestTotal} />
                </div>
            )}
        </main>
    );
}