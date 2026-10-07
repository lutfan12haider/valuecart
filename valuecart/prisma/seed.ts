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
  // Bikes
  ["Mountain Bike 26 inch Pro", 0, 1299], ["Folding City Bike Elite", 0, 1099], ["Carbon Road Bike", 0, 2499],
  ["Electric Mountain Bike 500W", 0, 3200], ["Kids Balance Bike Premium", 0, 1050],
  // Bike Accessories
  ["Bike Helmet Pro Carbon", 1, 1200], ["LED Bike Light Set Pro", 1, 1100], ["Bike Phone Holder Mount", 1, 1000],
  // Bike Washing Machines
  ["Portable Bike Washing Machine Model X", 2, 1499], ["Pressure Bike Washer Compact", 2, 1250],
  // Washing Machines
  ["Top Load Washing Machine 12kg", 3, 1800], ["Front Load Washing Machine 8kg", 3, 2200],
  ["Mini Twin Tub Washer", 3, 1050],
  // Home Appliances
  ["Smart Air Purifier HEPA", 4, 1300], ["Inverter Split AC 1.5 Ton", 4, 2800],
  // Home Accessories
  ["Smart Home Storage System", 5, 1100], ["Premium Wall Shelf Set", 5, 1050],
  // Kitchen
  ["Professional Kitchen Knife Set", 6, 1200], ["Smart Coffee Machine Espresso", 6, 1800],
  ["Digital Kitchen Scale Pro", 6, 1000],
  // Electronics
  ["Wireless Noise Cancelling Earbuds", 7, 1500], ["Power Bank 40000mAh Fast Charge", 7, 1100],
  ["Bluetooth Speaker Waterproof Pro", 7, 1200], ["4K Action Camera", 7, 2200],
  // Clothing
  ["Premium Winter Jacket", 8, 1100], ["Running Shoes Pro Edition", 9, 1300],
  // Bags
  ["Travel Backpack 50L Pro", 10, 1050],
  // Tools
  ["Cordless Drill Kit Professional", 11, 1400], ["Socket Wrench Set 150pcs", 11, 1100],
  // Automotive
  ["Dash Camera 4K Dual Lens", 12, 1200], ["Car Vacuum Cleaner Pro", 12, 1000],
  // Sports
  ["Yoga Mat Premium Thick", 13, 1000], ["Treadmill Electric Foldable", 13, 3500]
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

  // Clear old products before reseeding with new prices
  await db.cartItem.deleteMany();
  await db.orderItem.updateMany({ data: { productId: null } });
  await db.productImage.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();

  for (let i = 0; i < items.length; i++) {
    const [name, c, price] = items[i];
    const slug = slugify(name);
    const sale = i % 3 === 0 ? Math.round(price * 0.88) : null;
    await db.product.create({
      data: {
        name,
        slug,
        sku: `VC-${String(i + 1).padStart(4, "0")}`,
        brand: "ValueCart",
        shortDescription: `${name} — premium quality at a competitive price.`,
        description: `${name}. High-quality product available on the ValueCart marketplace. Ships worldwide with tracking.`,
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
    data: { name: "Worldwide", countries: ["*"], charge: 25, freeAbove: 2000, minDays: 7, maxDays: 21 }
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
