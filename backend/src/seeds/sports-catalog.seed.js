import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model.js";
import { RoleModel } from "../models/role.model.js";
import { CategoryModel } from "../models/category.model.js";
import { ProductModel } from "../models/product.model.js";
import { VariantModel } from "../models/variant.model.js";
import { InventoryModel } from "../models/inventory.model.js";
import { seedDefaultCoupons } from "../services/coupon.service.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";

export const seedSportsMarketplace = async () => {
  console.log("🌱 Starting Sports Materials Marketplace Seeding...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for seeding.");

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const adminPasswordHash = await bcrypt.hash("Admin1234!", saltRounds);
  const buyerPasswordHash = await bcrypt.hash("Buyer1234!", saltRounds);

  // 1. Seed or update Admin User
  let adminUser = await UserModel.findOne({ email: "admin@sportmarket.com" });
  if (!adminUser) {
    adminUser = await UserModel.create({
      email: "admin@sportmarket.com",
      passwordHash: adminPasswordHash,
      firstName: "Marketplace",
      lastName: "Administrator",
      phoneNumber: "+12025550100",
      city: "Chicago",
      country: "USA",
    });
    await RoleModel.create({
      userId: adminUser.userId,
      roleType: "ADMIN",
    });
    console.log("✅ Created Admin user (admin@sportmarket.com)");
  }

  // 2. Seed Customer Buyer User
  let customerUser = await UserModel.findOne({ email: "athlete@sportmarket.com" });
  if (!customerUser) {
    customerUser = await UserModel.create({
      email: "athlete@sportmarket.com",
      passwordHash: buyerPasswordHash,
      firstName: "Marcus",
      lastName: "Ronaldo",
      phoneNumber: "+12025550150",
      city: "Denver",
      country: "USA",
    });
    await RoleModel.create({
      userId: customerUser.userId,
      roleType: "CUSTOMER",
    });
    console.log("✅ Created Customer user (athlete@sportmarket.com)");
  }

  // 3. Seed Dynamic Categories
  const categoryTree = [
    {
      name: "Team Sports",
      slug: "team-sports",
      description: "Football, basketball, volleyball and team sports equipment.",
      iconUrl: "/icons/categories/team-sports.svg",
      imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
      displayOrder: 1,
      children: [
        {
          name: "Football",
          slug: "football",
          description: "Match balls, training gear, boots, and pitch accessories.",
          imageUrl: "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=800&q=80",
          displayOrder: 1,
        },
        {
          name: "Basketball",
          slug: "basketball",
          description: "Indoor & outdoor basketballs, rims, nets, and apparel.",
          imageUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80",
          displayOrder: 2,
        },
      ],
    },
    {
      name: "Racket Sports",
      slug: "racket-sports",
      description: "Tennis, badminton, padel, and squash rackets and gear.",
      iconUrl: "/icons/categories/racket-sports.svg",
      imageUrl: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
      displayOrder: 2,
      children: [
        {
          name: "Tennis",
          slug: "tennis",
          description: "Performance tennis rackets, strings, balls, and bags.",
          imageUrl: "https://images.unsplash.com/photo-1617083934555-563d527e2897?auto=format&fit=crop&w=800&q=80",
          displayOrder: 1,
        },
        {
          name: "Badminton",
          slug: "badminton",
          description: "High tension badminton rackets, shuttlecocks, and grips.",
          imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
          displayOrder: 2,
        },
      ],
    },
    {
      name: "Fitness & Strength",
      slug: "fitness-strength",
      description: "Weights, barbells, benches, resistance gear, and cardio.",
      iconUrl: "/icons/categories/fitness.svg",
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      displayOrder: 3,
      children: [
        {
          name: "Free Weights & Barbells",
          slug: "free-weights-barbells",
          description: "Olympic barbells, bumper plates, cast iron dumbbells.",
          imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
          displayOrder: 1,
        },
        {
          name: "Cardio Machines",
          slug: "cardio-machines",
          description: "Treadmills, rowers, air bikes, and stair climbers.",
          imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80",
          displayOrder: 2,
        },
      ],
    },
    {
      name: "Combat & Martial Arts",
      slug: "combat-sports",
      description: "Boxing gloves, headgear, shin guards, and heavy bags.",
      iconUrl: "/icons/categories/combat.svg",
      imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
      displayOrder: 4,
      children: [
        {
          name: "Boxing Gear",
          slug: "boxing-gear",
          description: "Sparring gloves, training mitts, wraps, and speed bags.",
          imageUrl: "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80",
          displayOrder: 1,
        },
      ],
    },
  ];

  const categoryMap = {};

  for (const rootCat of categoryTree) {
    let root = await CategoryModel.findOne({ slug: rootCat.slug });
    if (!root) {
      root = await CategoryModel.create({
        name: rootCat.name,
        slug: rootCat.slug,
        description: rootCat.description,
        iconUrl: rootCat.iconUrl,
        imageUrl: rootCat.imageUrl,
        displayOrder: rootCat.displayOrder,
        parentCategoryId: null,
      });
      console.log(`✅ Created Root Category: ${rootCat.name}`);
    } else {
      await CategoryModel.updateOne(
        { slug: rootCat.slug },
        { $set: { imageUrl: rootCat.imageUrl, iconUrl: rootCat.iconUrl } },
      );
    }
    categoryMap[rootCat.slug] = root;

    if (rootCat.children) {
      for (const childCat of rootCat.children) {
        let child = await CategoryModel.findOne({ slug: childCat.slug });
        if (!child) {
          child = await CategoryModel.create({
            name: childCat.name,
            slug: childCat.slug,
            description: childCat.description,
            imageUrl: childCat.imageUrl,
            displayOrder: childCat.displayOrder,
            parentCategoryId: root.categoryId,
          });
          console.log(`  └─ Created Subcategory: ${childCat.name}`);
        } else {
          await CategoryModel.updateOne(
            { slug: childCat.slug },
            { $set: { imageUrl: childCat.imageUrl } },
          );
        }
        categoryMap[childCat.slug] = child;
      }
    }
  }

  // 5. Seed Sports Products with Variants & Inventory
  const sportsProducts = [
    {
      sku: "PRO-WIL-PS97",
      name: "Wilson Pro Staff 97 v14 Tennis Racket",
      description:
        "The iconic choice of advanced players seeking ultimate precision and classic control.",
      longDescription:
        "Engineered with Braid 45 construction for enhanced pocketing feel and unbelievable stability at impact. 97 sq in head size with a 16x19 string pattern.",
      basePrice: 269.0,
      categorySlug: "tennis",
      sportType: ["tennis", "racket-sports"],
      gearCategory: "EQUIPMENT",
      brand: "Wilson",
      skillLevel: "ADVANCED",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1617083934555-563d527e2897?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        unstrungWeightGrams: 315,
        balanceMm: 310,
        headSizeSqIn: 97,
        stringPattern: "16x19",
        material: "Graphite / Kevlar",
      },
      variants: [
        {
          variantName: "Grip Size 2 (4 1/4 inches)",
          sku: "PRO-WIL-PS97-G2",
          price: 269.0,
          weightKg: 0.32,
          attributes: { gripSize: "4 1/4", color: "Bronze / Carbon" },
          stock: 18,
        },
        {
          variantName: "Grip Size 3 (4 3/8 inches)",
          sku: "PRO-WIL-PS97-G3",
          price: 269.0,
          weightKg: 0.32,
          attributes: { gripSize: "4 3/8", color: "Bronze / Carbon" },
          stock: 25,
        },
      ],
    },
    {
      sku: "APX-NKE-FLIGHT",
      name: "Nike Flight Premier Match Official Football",
      description:
        "FIFA Quality Pro certified official match ball with Aerowsculpt molded grooves.",
      longDescription:
        "Refined over 8 years and 1,700 hours of testing, Nike Aerowsculpt technology uses molded grooves to disrupt airflow across the ball for 30% truer flight.",
      basePrice: 165.0,
      categorySlug: "football",
      sportType: ["football", "team-sports"],
      gearCategory: "EQUIPMENT",
      brand: "Nike",
      skillLevel: "PROFESSIONAL",
      genderAgeGroup: "ALL",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        certification: "FIFA Quality Pro",
        construction: "4-panel thermal bonded",
        material: "37% Synthetic Leather, 33% Rubber, 20% Polyester, 10% Cotton",
      },
      variants: [
        {
          variantName: "Official Match Ball - Size 5 (White / Polar Blue)",
          sku: "APX-NKE-FLIGHT-SZ5-WHT",
          price: 165.0,
          weightKg: 0.43,
          attributes: { size: "Size 5", color: "White / Polar Blue" },
          stock: 35,
        },
        {
          variantName: "Official Match Ball - Size 5 (Hi-Vis Yellow)",
          sku: "APX-NKE-FLIGHT-SZ5-YEL",
          price: 165.0,
          weightKg: 0.43,
          attributes: { size: "Size 5", color: "Hi-Vis Yellow" },
          stock: 20,
        },
      ],
    },
    {
      sku: "IRN-OLY-20KG",
      name: "IronGrip 20kg Hard-Chrome Olympic Barbell",
      description:
        "Commercial-grade Olympic barbell tested to 215,000 PSI with premium needle bearings.",
      longDescription:
        "Forged from alloy steel with calibrated 28mm shaft diameter, precision volcano knurling, and 4 needle bearings per sleeve for effortless spin during Olympic lifts.",
      basePrice: 349.0,
      categorySlug: "free-weights-barbells",
      sportType: ["gym", "strength", "crossfit"],
      gearCategory: "EQUIPMENT",
      brand: "IronGrip",
      skillLevel: "ALL",
      genderAgeGroup: "UNISEX",
      isBulky: true, // Heavy freight shipping item
      images: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        weightKg: 20,
        lengthCm: 220,
        shaftDiameterMm: 28,
        sleeveDiameterMm: 50,
        maxCapacityKg: 700,
        tensileStrengthPsi: 215000,
      },
      variants: [
        {
          variantName: "Hard Chrome Finish - 20kg",
          sku: "IRN-OLY-20KG-CHR",
          price: 349.0,
          weightKg: 20.0,
          attributes: { finish: "Hard Chrome", weightKg: 20 },
          stock: 14,
        },
        {
          variantName: "Black Oxide Shaft / Chrome Sleeves - 20kg",
          sku: "IRN-OLY-20KG-BLK",
          price: 379.0,
          weightKg: 20.0,
          attributes: { finish: "Black Oxide", weightKg: 20 },
          stock: 9,
        },
      ],
    },
    {
      sku: "APX-EVR-PRO-16",
      name: "Everlast Pro Style Elite Training Boxing Gloves",
      description:
        "Shielded sparring and bag gloves designed with dual-collar support and antimicrobial lining.",
      longDescription:
        "High-density multi-layered foam padding absorbs punch shock while the ergonomic fist shape keeps hands properly aligned to prevent wrist strain.",
      basePrice: 65.0,
      categorySlug: "boxing-gear",
      sportType: ["boxing", "combat-sports"],
      gearCategory: "PROTECTIVE",
      brand: "Everlast",
      skillLevel: "INTERMEDIATE",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        closure: "Full wrist wrap with hook-and-loop",
        lining: "EverFresh antimicrobial treatment",
        padding: "Closed-cell multi-density foam",
      },
      variants: [
        {
          variantName: "14 oz - Matte Black / Gold",
          sku: "APX-EVR-14OZ-BLK",
          price: 65.0,
          weightKg: 0.5,
          attributes: { sizeOunces: 14, color: "Matte Black / Gold" },
          stock: 30,
        },
        {
          variantName: "16 oz - Sparring Heavy (Matte Black / Red)",
          sku: "APX-EVR-16OZ-RED",
          price: 69.0,
          weightKg: 0.6,
          attributes: { sizeOunces: 16, color: "Matte Black / Red" },
          stock: 22,
        },
      ],
    },
    {
      sku: "PRO-BAB-PA-RAFA",
      name: "Babolat Pure Aero Rafa Origin Tennis Racket",
      description:
        "Engineered to Rafael Nadal's exact specifications with explosive spin potential.",
      longDescription:
        "Aeromodular frame geometry combined with FSI Spin open string pattern delivers unmatched heavy spin and penetrating court depth.",
      basePrice: 289.0,
      categorySlug: "tennis",
      sportType: ["tennis", "racket-sports"],
      gearCategory: "EQUIPMENT",
      brand: "Babolat",
      skillLevel: "ADVANCED",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        unstrungWeightGrams: 317,
        headSizeSqIn: 100,
        stringPattern: "16x19",
        material: "Graphite",
      },
      variants: [
        {
          variantName: "Grip Size 2 (4 1/4 inches)",
          sku: "PRO-BAB-PA-G2",
          price: 289.0,
          weightKg: 0.32,
          attributes: { gripSize: "4 1/4", color: "Yellow / Purple" },
          stock: 15,
        },
        {
          variantName: "Grip Size 3 (4 3/8 inches)",
          sku: "PRO-BAB-PA-G3",
          price: 289.0,
          weightKg: 0.32,
          attributes: { gripSize: "4 3/8", color: "Yellow / Purple" },
          stock: 20,
        },
      ],
    },
    {
      sku: "PRO-YNX-AX99P",
      name: "Yonex Astrox 99 Pro Badminton Racket",
      description:
        "Head-heavy powerhouse racket favored by world-class singles competitors.",
      longDescription:
        "Rotational Generator System with Namd graphite in the shaft produces overwhelming steep smashes and rapid shot recovery.",
      basePrice: 239.0,
      categorySlug: "badminton",
      sportType: ["badminton", "racket-sports"],
      gearCategory: "EQUIPMENT",
      brand: "Yonex",
      skillLevel: "PROFESSIONAL",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        weightGrams: 83,
        balance: "Head Heavy",
        flex: "Stiff",
      },
      variants: [
        {
          variantName: "4U (83g) / G5 - Cherry Sunburst",
          sku: "PRO-YNX-AX99P-4U",
          price: 239.0,
          weightKg: 0.09,
          attributes: { weightClass: "4U", gripSize: "G5" },
          stock: 25,
        },
      ],
    },
    {
      sku: "APX-ADI-PRED-ELITE",
      name: "Adidas Predator Elite Firm Ground Football Boots",
      description:
        "Precision striking boots with Strikeskin rubber fins and Primeknit collar.",
      longDescription:
        "Designed to find the back of the net with maximum swerve and ball control on dry natural grass pitches.",
      basePrice: 279.0,
      categorySlug: "football",
      sportType: ["football", "team-sports"],
      gearCategory: "FOOTWEAR",
      brand: "Adidas",
      skillLevel: "PROFESSIONAL",
      genderAgeGroup: "MEN",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        soleplate: "Controlframe 2.0 Firm Ground",
        upper: "HybridTouch 2.0 with Strikeskin fins",
      },
      variants: [
        {
          variantName: "Size 8",
          sku: "APX-ADI-PRED-80",
          price: 279.0,
          weightKg: 0.42,
          attributes: { size: "8" },
          stock: 10,
        },
        {
          variantName: "Size 8.5",
          sku: "APX-ADI-PRED-85",
          price: 279.0,
          weightKg: 0.43,
          attributes: { size: "8.5" },
          stock: 14,
        },
        {
          variantName: "Size 9",
          sku: "APX-ADI-PRED-90",
          price: 279.0,
          weightKg: 0.44,
          attributes: { size: "9" },
          stock: 18,
        },
        {
          variantName: "Size 9.5",
          sku: "APX-ADI-PRED-95",
          price: 279.0,
          weightKg: 0.45,
          attributes: { size: "9.5" },
          stock: 22,
        },
        {
          variantName: "Size 10",
          sku: "APX-ADI-PRED-100",
          price: 279.0,
          weightKg: 0.46,
          attributes: { size: "10" },
          stock: 20,
        },
        {
          variantName: "Size 10.5",
          sku: "APX-ADI-PRED-105",
          price: 279.0,
          weightKg: 0.47,
          attributes: { size: "10.5" },
          stock: 16,
        },
        {
          variantName: "Size 11",
          sku: "APX-ADI-PRED-110",
          price: 279.0,
          weightKg: 0.48,
          attributes: { size: "11" },
          stock: 12,
        },
        {
          variantName: "Size 11.5",
          sku: "APX-ADI-PRED-115",
          price: 279.0,
          weightKg: 0.49,
          attributes: { size: "11.5" },
          stock: 8,
        },
        {
          variantName: "Size 12",
          sku: "APX-ADI-PRED-120",
          price: 279.0,
          weightKg: 0.50,
          attributes: { size: "12" },
          stock: 6,
        },
      ],
    },
    {
      sku: "APX-WIL-EVO-SZ7",
      name: "Wilson Evolution Game Basketball (Official Size 7)",
      description:
        "The #1 indoor game basketball in America with microfiber composite cover.",
      longDescription:
        "Laid-in composite channels and cushion core carcass provide the softest feel and superior grip trusted by varsity and college programs.",
      basePrice: 79.0,
      categorySlug: "basketball",
      sportType: ["basketball", "team-sports"],
      gearCategory: "EQUIPMENT",
      brand: "Wilson",
      skillLevel: "ALL",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        size: "Official Size 7 (29.5 inches)",
        channelConstruction: "Laid-in composite leather",
        courtType: "Indoor Only",
      },
      variants: [
        {
          variantName: "Official Size 7 - Classic Amber",
          sku: "APX-WIL-EVO-SZ7-AMB",
          price: 79.0,
          weightKg: 0.62,
          attributes: { size: "Size 7", color: "Classic Amber" },
          stock: 45,
        },
      ],
    },
    {
      sku: "IRN-ROG-BMP-20",
      name: "Rogue Urethane Olympic Bumper Plates (20kg Pair)",
      description:
        "Precision-machined Olympic weightlifting plates with dead-blow bounce.",
      longDescription:
        "Forged stainless steel center hubs encased in ultra-durable high-durometer urethane to withstand tens of thousands of drops.",
      basePrice: 215.0,
      categorySlug: "free-weights-barbells",
      sportType: ["gym", "strength", "crossfit"],
      gearCategory: "EQUIPMENT",
      brand: "IronGrip",
      skillLevel: "ALL",
      genderAgeGroup: "UNISEX",
      isBulky: true,
      images: [
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        diameterMm: 450,
        insertCollarMm: 50.4,
      },
      variants: [
        {
          variantName: "20kg Pair - Blue Urethane",
          sku: "IRN-ROG-BMP-20-BLU",
          price: 215.0,
          weightKg: 40.0,
          attributes: { weightPairKg: 40, color: "Blue" },
          stock: 18,
        },
      ],
    },
    {
      sku: "IRN-C2-ROW-ERG",
      name: "Concept2 RowErg Commercial Indoor Rowing Machine",
      description:
        "The gold standard in full-body cardiovascular rowing with PM5 Performance Monitor.",
      longDescription:
        "Air-resistance flywheel delivers smooth, quiet operation that responds to your stroke intensity. Connects via Bluetooth to heart rate monitors and fitness apps.",
      basePrice: 1150.0,
      categorySlug: "cardio-machines",
      sportType: ["fitness", "cardio", "rowing"],
      gearCategory: "EQUIPMENT",
      brand: "IronGrip",
      skillLevel: "ALL",
      genderAgeGroup: "ALL",
      isBulky: true,
      images: [
        "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        monitor: "PM5 Performance Monitor",
        weightCapacityKg: 227,
        frameLengthCm: 244,
        resistanceType: "Air Flywheel with Damper 1-10",
      },
      variants: [
        {
          variantName: "Standard 14 inch Seat Height - Matte Black",
          sku: "IRN-C2-ROW-ERG-STD",
          price: 1150.0,
          weightKg: 26.0,
          attributes: { seatHeight: "14 inches", color: "Matte Black" },
          stock: 8,
        },
      ],
    },
    {
      sku: "APX-VNM-CHAL-HG",
      name: "Venum Challenger 2.0 Full Face Combat Headgear",
      description:
        "Ultra-lightweight high-density foam headguard providing 360-degree cranial and cheek protection.",
      longDescription:
        "Engineered in Thailand with 100% Skintex synthetic leather and flexible two-way hook-and-loop closure for zero slippage during hard sparring.",
      basePrice: 59.0,
      categorySlug: "boxing-gear",
      sportType: ["boxing", "combat-sports"],
      gearCategory: "PROTECTIVE",
      brand: "Venum",
      skillLevel: "INTERMEDIATE",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        closure: "Two-way velcro rear closure",
        padding: "Multi-layered triple density contour foam",
      },
      variants: [
        {
          variantName: "One Size Fits Most - Black / White",
          sku: "APX-VNM-CHAL-HG-BLK",
          price: 59.0,
          weightKg: 0.4,
          attributes: { size: "Universal", color: "Black / White" },
          stock: 28,
        },
      ],
    },
    {
      sku: "APX-VNM-ELT-14",
      name: "Venum Elite Training Boxing Gloves",
      description:
        "Handmade in Thailand with premium semi-leather and triple-density foam for unmatched shock absorption.",
      longDescription:
        "Ergonomically designed to promote proper fist closure and wrist protection with reinforced palm and reinforced seams for long-lasting combat durability.",
      basePrice: 59.0,
      categorySlug: "boxing-gear",
      sportType: ["boxing", "combat-sports"],
      gearCategory: "PROTECTIVE",
      brand: "Venum",
      skillLevel: "ALL",
      genderAgeGroup: "UNISEX",
      isBulky: false,
      images: [
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80",
      ],
      specifications: {
        origin: "Handmade in Thailand",
        material: "100% Skintex Premium Semi-Leather",
        padding: "Triple-density shock foam",
      },
      variants: [
        {
          variantName: "14 oz - Matte Black / Gold",
          sku: "APX-VNM-14OZ-GLD",
          price: 59.0,
          weightKg: 0.5,
          attributes: { sizeOunces: 14, color: "Matte Black / Gold" },
          stock: 25,
        },
      ],
    },
  ];

  for (const item of sportsProducts) {
    const category = categoryMap[item.categorySlug];

    if (!category) {
      console.warn(`Skipping product ${item.name}: Category not found.`);
      continue;
    }

    let product = await ProductModel.findOne({ sku: item.sku });
    if (!product) {
      product = await ProductModel.create({
        categoryId: category.categoryId,
        sellerId: null,
        name: item.name,
        description: item.description,
        longDescription: item.longDescription,
        basePrice: item.basePrice,
        sku: item.sku,
        sportType: item.sportType,
        gearCategory: item.gearCategory,
        brand: item.brand,
        skillLevel: item.skillLevel,
        genderAgeGroup: item.genderAgeGroup,
        isBulky: item.isBulky,
        specifications: item.specifications,
        images: item.images || [],
        createdBy: adminUser.userId,
        rating: 4.9,
      });
      console.log(`✅ Created Product: ${item.name} (${item.brand})`);
    } else {
      await ProductModel.updateOne(
        { sku: item.sku },
        {
          $set: {
            images: item.images || [],
          },
        },
      );
      console.log(`🔄 Updated Product Images: ${item.name}`);
    }

    for (const v of item.variants) {
      let variant = await VariantModel.findOne({ sku: v.sku });
      if (!variant) {
        variant = await VariantModel.create({
          productId: product.productId,
          variantName: v.variantName,
          sku: v.sku,
          price: v.price,
          weightKg: v.weightKg,
          attributes: v.attributes,
        });

        await InventoryModel.create({
          variantId: variant.variantId,
          quantityOnHand: v.stock,
          quantityReserved: 0,
          quantityAvailable: v.stock,
          reorderLevel: 5,
          reorderQuantity: 20,
          warehouseLocation: "CENTRAL-WH-A1",
        });
        console.log(
          `  └─ Created Variant: ${v.variantName} [Stock: ${v.stock}]`,
        );
      }
    }
  }

  // 4. Seed Default Sports Coupons
  await seedDefaultCoupons();
  console.log("✅ Seeded Default Sports Marketplace Coupons (SPORT10, FREESHIP, FITNESS25)");

  console.log("🎉 Sports Materials Marketplace Seeding Completed!");
};

// Allow direct CLI execution: node src/seeds/sports-catalog.seed.js
if (process.argv[1]?.endsWith("sports-catalog.seed.js")) {
  seedSportsMarketplace()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Seeding failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
