import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const categoryNames = [
  "Bikes", "Bike Accessories", "Bike Washing Machines", "Washing Machines", "Home Appliances",
  "Home Accessories", "Kitchen", "Electronics", "Clothing", "Shoes", "Bags", "Tools", "Automotive",
  "Sports & Fitness", "Beauty & Personal Care", "Toys & Kids", "Office Products", "Outdoor", "Smart Home", "Other"
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const items: [string, number, number][] = [
  ["Mountain Bike 26 inch", 0, 289], ["Folding City Bike", 0, 249], ["Kids Balance Bike", 0, 79],
  ["Bike Helmet Pro", 1, 29], ["LED Bike Light Set", 1, 14], ["Bike Phone Holder", 1, 9],
  ["Portable Bike Washing Machine Model X", 2, 249], ["Pressure Bike Washer Compact", 2, 189],
  ["Top Load Washing Machine 8kg", 3, 329], ["Mini Twin Tub Washer", 3, 119],
  ["Electric Kettle 1.8L", 4, 24], ["Air Purifier Home", 4, 99],
  ["Storage Basket Set", 5, 18], ["Wall Shelf Floating", 5, 22],
  ["Non-stick Pan 28cm", 6, 19], ["Knife Set 6 pcs", 6, 34], ["Digital Kitchen Scale", 6, 11],
  ["Wireless Earbuds", 7, 27], ["Power Bank 20000mAh", 7, 25], ["Bluetooth Speaker", 7, 32],
  ["Cotton T-Shirt", 8, 12], ["Winter Hoodie", 8, 28], ["Running Shoes", 9, 45], ["Casual Sneakers", 9, 38],
  ["Travel Backpack 35L", 10, 31], ["Cordless Drill Kit", 11, 59], ["Socket Wrench Set", 11, 26],
  ["Car Vacuum Cleaner", 12, 23], ["Dash Camera 1080p", 12, 49], ["Yoga Mat Thick", 13, 16]
];

async function main() {
  const cats = [];
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    cats.push(
      await db.category.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name), sortOrder: i, active: true }
      })
    );
  }

  for (let i = 0; i < items.length; i++) {
    const [name, c, price] = items[i];
    const slug = slugify(name);
    const sale = i % 3 === 0 ? Math.round(price * 0.85) : null;
    await db.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        sku: `VC-${String(i + 1).padStart(4, "0")}`,
        brand: "ValueCart",
        shortDescription: `${name} at an affordable price.`,
        description: `${name}. Demo product description for the ValueCart marketplace.`,
        categoryId: cats[c].id,
        basePrice: price,
        salePrice: sale,
        stock: 50,
        sold: Math.floor(Math.random() * 200),
        status: "ACTIVE",
        featured: i % 5 === 0,
        images: { create: [{ url: `https://picsum.photos/seed/${slug}/600/600`, alt: name, sortOrder: 0 }] }
      }
    });
  }

  await db.siteSetting.upsert({
    where: { key: "USDT_DISPLAY_RATE" },
    update: {},
    create: { key: "USDT_DISPLAY_RATE", value: process.env.USDT_DISPLAY_RATE ?? "1" }
  });

  await db.shippingZone.deleteMany();
  await db.shippingZone.create({
    data: { name: "Worldwide", countries: ["*"], charge: 5, freeAbove: 100, minDays: 7, maxDays: 21 }
  });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: "Admin", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 12) }
    });
  }
}

main().finally(() => db.$disconnect());
