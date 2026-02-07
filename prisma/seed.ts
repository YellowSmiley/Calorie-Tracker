import { prisma } from "@/lib/prisma";

const defaultFoods = [
    {
        name: "Chicken Breast",
        measurement: "100g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
    },
    {
        name: "Brown Rice",
        measurement: "1 cup cooked",
        calories: 215,
        protein: 5,
        carbs: 45,
        fat: 1.8,
    },
    {
        name: "Broccoli",
        measurement: "1 cup",
        calories: 55,
        protein: 3.7,
        carbs: 11,
        fat: 0.6,
    },
    {
        name: "Eggs",
        measurement: "1 large",
        calories: 78,
        protein: 6,
        carbs: 0.6,
        fat: 5,
    },
    {
        name: "Salmon",
        measurement: "100g",
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 13,
    },
    {
        name: "Oatmeal",
        measurement: "1 cup cooked",
        calories: 150,
        protein: 6,
        carbs: 27,
        fat: 3,
    },
];

async function main() {
    console.log("Start seeding ...");

    // Check if foods already exist
    const count = await prisma.food.count();

    if (count === 0) {
        for (const food of defaultFoods) {
            const created = await prisma.food.create({
                data: food,
            });
            console.log(`Created food with id: ${created.id}`);
        }
    } else {
        console.log(`Foods already seeded (${count} foods found)`);
    }

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
