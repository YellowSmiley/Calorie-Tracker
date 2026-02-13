import { prisma } from "@/lib/prisma";
import { Food } from "@prisma/client";

const defaultFoods: Food[] = [
  {
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    createdAt: new Date(),
    createdBy: "seed",
    defaultServingAmount: 100,
    defaultServingDescription: "100g",
    measurementAmount: 100,
    fibre: 0,
    id: "1",
    measurementType: "weight",
    saturates: 1,
    salt: 0.1,
    sugars: 0,
    updatedAt: new Date(),
  },
  {
    name: "Brown Rice",
    calories: 215,
    protein: 5,
    carbs: 45,
    fat: 1.8,
    createdAt: new Date(),
    createdBy: "seed",
    defaultServingAmount: 100,
    defaultServingDescription: "100g",
    measurementAmount: 100,
    fibre: 0,
    id: "2",
    measurementType: "weight",
    saturates: 1,
    salt: 0.1,
    sugars: 0,
    updatedAt: new Date(),
  },
  {
    name: "Broccoli",
    calories: 55,
    protein: 3.7,
    carbs: 11,
    fat: 0.6,
    createdAt: new Date(),
    createdBy: "seed",
    defaultServingAmount: 100,
    defaultServingDescription: "100g",
    measurementAmount: 100,
    fibre: 0,
    id: "3",
    measurementType: "weight",
    saturates: 1,
    salt: 0.1,
    sugars: 0,
    updatedAt: new Date(),
  },
  {
    name: "Eggs",
    calories: 78,
    protein: 6,
    carbs: 0.6,
    fat: 5,
    createdAt: new Date(),
    createdBy: "seed",
    defaultServingAmount: 100,
    defaultServingDescription: "100g",
    measurementAmount: 100,
    fibre: 0,
    id: "4",
    measurementType: "weight",
    saturates: 1,
    salt: 0.1,
    sugars: 0,
    updatedAt: new Date(),
  },
  {
    name: "Salmon",
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 13,
    createdAt: new Date(),
    createdBy: "seed",
    defaultServingAmount: 100,
    defaultServingDescription: "100g",
    measurementAmount: 100,
    fibre: 0,
    id: "5",
    measurementType: "weight",
    saturates: 1,
    salt: 0.1,
    sugars: 0,
    updatedAt: new Date(),
  },
  {
    name: "Oatmeal",
    calories: 150,
    protein: 6,
    carbs: 27,
    fat: 3,
    createdAt: new Date(),
    createdBy: "seed",
    defaultServingAmount: 100,
    defaultServingDescription: "100g",
    measurementAmount: 100,
    fibre: 0,
    id: "6",
    measurementType: "weight",
    saturates: 1,
    salt: 0.1,
    sugars: 0,
    updatedAt: new Date(),
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
