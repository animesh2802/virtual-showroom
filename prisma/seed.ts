import { PrismaClient, Fuel, Transmission, Role, LeadSource, LeadStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "Demo@1234";
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);

async function main() {
    // Clear in dependency order so the seed can be re-run safely.
    await db.booking.deleteMany();
    await db.lead.deleteMany();
    await db.assignmentRule.deleteMany();
    await db.demoCar.deleteMany();
    await db.variantPrice.deleteMany();
    await db.usedCar.deleteMany();
    await db.variant.deleteMany();
    await db.model.deleteMany();
    await db.user.deleteMany();
    await db.showroom.deleteMany();
    await db.city.deleteMany();

    const cityData = [
        { name: "Lucknow", taxRate: 0.08 },
        { name: "Kanpur", taxRate: 0.09 },
        { name: "Varanasi", taxRate: 0.085 },
    ];
    const cities = await Promise.all(
        cityData.map((c) => db.city.create({ data: { name: c.name } }))
    );

    // Showrooms: assumption, all in Lucknow, names are invented.
    const showrooms = await Promise.all(
        [
            { name: "Gomti Nagar Showroom", address: "Vibhuti Khand, Gomti Nagar, Lucknow" },
            { name: "Aliganj Showroom", address: "Sector J, Aliganj, Lucknow" },
            { name: "Alambagh Showroom", address: "Kanpur Road, Alambagh, Lucknow" },
        ].map((s) => db.showroom.create({ data: s }))
    );

    // Models and variants. Model H ZX automatic matches the brief's sample row.
    const modelsData = [
        {
            name: "Model H", slug: "model-h", bodyType: "SUV",
            description: "A comfortable family SUV with a commanding view of the road.",
            variants: [
                { name: "ZX automatic", slug: "model-h-zx-automatic", fuel: Fuel.PETROL, transmission: Transmission.AUTOMATIC, exShowroom: 1245000 },
                { name: "VX manual", slug: "model-h-vx-manual", fuel: Fuel.PETROL, transmission: Transmission.MANUAL, exShowroom: 1085000 },
            ],
        },
        {
            name: "Model C", slug: "model-c", bodyType: "Sedan",
            description: "A refined sedan built for long highway drives.",
            variants: [
                { name: "VX", slug: "model-c-vx", fuel: Fuel.DIESEL, transmission: Transmission.MANUAL, exShowroom: 1150000 },
                { name: "ZX automatic", slug: "model-c-zx-automatic", fuel: Fuel.DIESEL, transmission: Transmission.AUTOMATIC, exShowroom: 1320000 },
            ],
        },
        {
            name: "Model S", slug: "model-s", bodyType: "Hatchback",
            description: "A compact, easy-to-park city hatchback.",
            variants: [
                { name: "LX", slug: "model-s-lx", fuel: Fuel.PETROL, transmission: Transmission.MANUAL, exShowroom: 925000 },
                { name: "VX automatic", slug: "model-s-vx-automatic", fuel: Fuel.PETROL, transmission: Transmission.AUTOMATIC, exShowroom: 1040000 },
            ],
        },
    ];

    const models = [];
    const variants = [];
    for (const m of modelsData) {
        const model = await db.model.create({
            data: { name: m.name, slug: m.slug, bodyType: m.bodyType, description: m.description },
        });
        models.push(model);
        for (const v of m.variants) {
            const variant = await db.variant.create({
                data: {
                    modelId: model.id,
                    name: v.name,
                    slug: v.slug,
                    fuel: v.fuel,
                    transmission: v.transmission,
                    specs: { seats: 5, bootLitres: 420, mileageKmpl: 18 },
                    photos: [`/images/${m.slug}.jpg`],
                    colours: ["Pearl White", "Steel Grey", "Deep Red"],
                },
            });
            variants.push(variant);

            for (let i = 0; i < cities.length; i++) {
                await db.variantPrice.create({
                    data: {
                        variantId: variant.id,
                        cityId: cities[i].id,
                        exShowroom: v.exShowroom,
                        roadTax: Math.round(v.exShowroom * cityData[i].taxRate),
                        insurance: Math.round(v.exShowroom * 0.035),
                        accessories: 15000,
                        validUntil: new Date("2026-12-31"),
                    },
                });
            }
        }
    }

    const modelBySlug = Object.fromEntries(models.map((m) => [m.slug, m]));
    const usedCars = [
        { stockId: "UC-1182", model: "model-c", variantName: "VX", fuel: Fuel.DIESEL, year: 2022, km: 41200, owners: 1, price: 845000, status: "AVAILABLE", reg: "UP32 AX 1182" },
        { stockId: "UC-1190", model: "model-s", variantName: "LX", fuel: Fuel.PETROL, year: 2021, km: 58600, owners: 2, price: 512000, status: "BOOKED", reg: "UP32 BK 1190" },
        { stockId: "UC-1204", model: "model-h", variantName: "VX manual", fuel: Fuel.PETROL, year: 2023, km: 22800, owners: 1, price: 1020000, status: "AVAILABLE", reg: "UP32 CD 1204" },
        { stockId: "UC-1211", model: "model-c", variantName: "ZX automatic", fuel: Fuel.DIESEL, year: 2020, km: 74300, owners: 2, price: 760000, status: "AVAILABLE", reg: "UP32 EF 1211" },
    ] as const;

    for (const u of usedCars) {
        await db.usedCar.create({
            data: {
                stockId: u.stockId,
                slug: u.stockId.toLowerCase(),
                modelId: modelBySlug[u.model].id,
                variantName: u.variantName,
                fuel: u.fuel,
                year: u.year,
                km: u.km,
                owners: u.owners,
                price: u.price,
                status: u.status,
                registrationNo: u.reg,
                inspectionReport: { overall: "Good", engine: "Pass", brakes: "Pass", tyres: "70% life left", accidentHistory: "None" },
                photos: [`/images/${u.stockId.toLowerCase()}.jpg`],
            },
        });
    }

    // Demo cars: one per showroom.
    for (let i = 0; i < showrooms.length; i++) {
        await db.demoCar.create({
            data: { variantId: variants[i].id, showroomId: showrooms[i].id },
        });
    }

    // Staff. Gomti Nagar has two consultants so "fewest open leads" can be shown.
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await db.user.create({
        data: { name: "Admin User", email: "admin@showroomx.test", passwordHash, role: Role.ADMIN },
    });
    const consultantData = [
        { name: "Ananya Verma", email: "ananya@showroomx.test", showroom: showrooms[0] },
        { name: "Rohit Mishra", email: "rohit@showroomx.test", showroom: showrooms[0] },
        { name: "Sana Khan", email: "sana@showroomx.test", showroom: showrooms[1] },
        { name: "Vikram Singh", email: "vikram@showroomx.test", showroom: showrooms[2] },
    ];
    const consultants = [];
    for (const c of consultantData) {
        consultants.push(
            await db.user.create({
                data: { name: c.name, email: c.email, passwordHash, role: Role.CONSULTANT, showroomId: c.showroom.id },
            })
        );
    }

    // Assignment rules: every consultant covers all models at their showroom.
    for (const c of consultants) {
        for (const m of models) {
            await db.assignmentRule.create({
                data: { showroomId: c.showroomId!, modelId: m.id, userId: c.id },
            });
        }
    }

    // A few leads, including one that has waited too long, to show the timer.
    await db.lead.createMany({
        data: [
            {
                source: LeadSource.WEBSITE, name: "Demo Buyer One", phone: "9000000001",
                message: "Interested in the ZX automatic. What is the on-road price in Lucknow?",
                interestedModelId: models[0].id, showroomId: showrooms[0].id,
                assignedToId: consultants[0].id, status: LeadStatus.NEW,
                consentGivenAt: hoursAgo(2), createdAt: hoursAgo(2),
            },
            {
                source: LeadSource.TEST_DRIVE, name: "Demo Buyer Two", phone: "9000000002",
                message: "Booked a test drive for Saturday.",
                interestedModelId: models[1].id, showroomId: showrooms[1].id,
                assignedToId: consultants[2].id, status: LeadStatus.CONTACTED,
                consentGivenAt: hoursAgo(30), createdAt: hoursAgo(30), firstContactedAt: hoursAgo(29.9),
            },
            {
                source: LeadSource.WEBSITE, name: "Demo Buyer Three", phone: "9000000003",
                message: "Looking for a small hatchback for city use.",
                interestedModelId: models[2].id, showroomId: showrooms[2].id,
                assignedToId: consultants[3].id, status: LeadStatus.NEW,
                consentGivenAt: hoursAgo(0.05), createdAt: hoursAgo(0.05),
            },
        ],
    });

    console.log("Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => db.$disconnect());