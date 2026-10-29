import { db } from "@/db";
import {
  users,
  categories,
  products,
  productImages,
  favorites,
  conversations,
  messages,
  reviews,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { count } from "drizzle-orm";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }
  seedPromise = runSeed().catch((err) => {
    console.error("Seed error:", err);
    seedPromise = null;
  });
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const existingCategories = await db.select({ value: count() }).from(categories);
  if ((existingCategories[0]?.value ?? 0) > 0) {
    return;
  }

  // 1. Seed Categories
  const categoryData = [
    {
      name: "Electronics",
      slug: "electronics",
      description: "Cameras, audio gear, laptops, tablets, and studio devices.",
      icon: "Camera",
    },
    {
      name: "Furniture",
      slug: "furniture",
      description: "Mid-century chairs, solid wood tables, shelving, and lighting.",
      icon: "Armchair",
    },
    {
      name: "Fashion",
      slug: "fashion",
      description: "Pre-loved coats, heritage denim, linen garments, and footwear.",
      icon: "Shirt",
    },
    {
      name: "Home and Kitchen",
      slug: "home-and-kitchen",
      description: "Cast-iron cookware, ceramic tableware, espresso tools, and decor.",
      icon: "Coffee",
    },
    {
      name: "Books",
      slug: "books",
      description: "Art monographs, architecture hardcovers, fiction, and rare editions.",
      icon: "BookOpen",
    },
    {
      name: "Sports and Fitness",
      slug: "sports-and-fitness",
      description: "Road bicycles, camping gear, climbing packs, and home gym equipment.",
      icon: "Bike",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Mechanical watches, leather totes, sunglasses, and everyday carry.",
      icon: "Watch",
    },
    {
      name: "Appliances",
      slug: "appliances",
      description: "Stand mixers, burr grinders, air purifiers, and countertop tools.",
      icon: "Sparkles",
    },
    {
      name: "Toys and Games",
      slug: "toys-and-games",
      description: "Wooden puzzles, strategy board games, and collector sets.",
      icon: "Gamepad2",
    },
    {
      name: "Other",
      slug: "other",
      description: "Musical instruments, craft supplies, and unique curiosities.",
      icon: "Package",
    },
  ];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();

  const catMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // 2. Seed Users
  const defaultPasswordHash = await hashPassword("Password123!");

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        fullName: "Clara Vance",
        email: "clara@reusehub.demo",
        passwordHash: defaultPasswordHash,
        profileImage:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        bio: "Industrial designer & slow-living advocate in Portland. Giving studio furniture, ceramic tableware, and analog cameras a second chapter.",
        location: "Portland, OR",
        role: "user",
        isActive: true,
      },
      {
        fullName: "Marcus Chen",
        email: "marcus@reusehub.demo",
        passwordHash: defaultPasswordHash,
        profileImage:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        bio: "Audio engineer and cyclist based in Seattle. Every piece of gear I list is tested, cleaned, and packed with care.",
        location: "Seattle, WA",
        role: "user",
        isActive: true,
      },
      {
        fullName: "Elena Rostova",
        email: "elena@reusehub.demo",
        passwordHash: defaultPasswordHash,
        profileImage:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        bio: "Curating natural fiber wardrobe staples, architectural books, and heirloom kitchen tools from Austin.",
        location: "Austin, TX",
        role: "user",
        isActive: true,
      },
      {
        fullName: "Julian Mercer (Admin)",
        email: "admin@reusehub.demo",
        passwordHash: defaultPasswordHash,
        profileImage:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        bio: "ReUseHub Marketplace Trust & Sustainability Steward.",
        location: "San Francisco, CA",
        role: "admin",
        isActive: true,
      },
    ])
    .returning();

  const [clara, marcus, elena] = insertedUsers;

  // 3. Seed 16 Curated Second-Hand Products
  const sampleProducts = [
    {
      sellerId: marcus.id,
      categoryId: catMap.get("electronics")!,
      title: "Fujifilm X100V Silver Digital Rangefinder Camera",
      slug: "fujifilm-x100v-silver-digital-rangefinder-camera",
      description:
        "Meticulously cared for Fujifilm X100V in classic silver finish. Shutter count is just 4,200 clicks. Includes original box, leather half-case, lens hood adapter, and Haoge square metal hood. Sensor and viewfinder glass are spotless.",
      price: "680.00",
      condition: "Like New",
      location: "Seattle, WA",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Open to partial trade for Leica M-mount lenses or studio monitors.",
      viewsCount: 142,
      images: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: clara.id,
      categoryId: catMap.get("furniture")!,
      title: "Mid-Century Danish Teak Lounge Chair in Bouclé",
      slug: "mid-century-danish-teak-lounge-chair-in-boucle",
      description:
        "Authentic 1960s Danish solid teak frame lounge chair recently reupholstered in warm oatmeal wool bouclé. Joinery is tight and freshly oiled with natural beeswax finish. Effortless silhouette for a reading corner.",
      price: "420.00",
      condition: "Excellent",
      location: "Portland, OR",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Would consider swapping for a solid oak dining bench or ceramic floor lamp.",
      viewsCount: 98,
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: elena.id,
      categoryId: catMap.get("home-and-kitchen")!,
      title: "Le Creuset 5.5 Qt Round Dutch Oven — Warm Sand",
      slug: "le-creuset-5-5-qt-round-dutch-oven-warm-sand",
      description:
        "Enameled cast iron Dutch oven in the timeless Dune / Warm Sand colorway. Used a handful of times for sourdough baking; interior enamel has zero chips or crazing. Comes with stainless steel knob installed.",
      price: "215.00",
      condition: "Excellent",
      location: "Austin, TX",
      status: "Active",
      isNegotiable: false,
      exchangeDescription: null,
      viewsCount: 116,
      images: [
        "https://images.unsplash.com/photo-1584990347449-a2d4c2c044c9?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: clara.id,
      categoryId: catMap.get("appliances")!,
      title: "Fellow Ode Brew Grinder Gen 2 — Matte Black",
      slug: "fellow-ode-brew-grinder-gen-2-matte-black",
      description:
        "Single-dose flat burr coffee grinder with Gen 2 brew burrs and anti-static ionizer. Purchased 9 months ago, cleaned weekly with Grindz tablets. Produces remarkably uniform grounds for pour-over, AeroPress, and batch brew.",
      price: "230.00",
      condition: "Like New",
      location: "Portland, OR",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Open to exchange for an espresso machine or Stagg EKG Pro kettle.",
      viewsCount: 87,
      images: [
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: elena.id,
      categoryId: catMap.get("fashion")!,
      title: "Margaret Howell Heavyweight Irish Linen Chore Jacket (M)",
      slug: "margaret-howell-heavyweight-irish-linen-chore-jacket",
      description:
        "Unstructured boxy workwear jacket woven in heavy espresso-taupe Irish linen. Corozo nut buttons, deep patch pockets, and relaxed shoulders. Worn gently for one spring season; steamed and stored on wide cedar hanger.",
      price: "165.00",
      condition: "Excellent",
      location: "Austin, TX",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Happy to swap for size 38 Birkenstock Boston clogs or raw selvedge denim.",
      viewsCount: 73,
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: marcus.id,
      categoryId: catMap.get("electronics")!,
      title: "Teenage Engineering TP-7 Field Recorder & Synthesizer Gear",
      slug: "teenage-engineering-portable-studio-synthesizer",
      description:
        "Precision aluminum portable audio device and tactile studio controller. Battery holds 100% charge, motorized reel responds smoothly, includes braided USB-C cable and protective felt sleeve.",
      price: "540.00",
      condition: "Like New",
      location: "Seattle, WA",
      status: "Active",
      isNegotiable: false,
      exchangeDescription: null,
      viewsCount: 109,
      images: [
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: clara.id,
      categoryId: catMap.get("books")!,
      title: "Dieter Rams: As Little Design as Possible (Phaidon Hardcover)",
      slug: "dieter-rams-as-little-design-as-possible-hardcover",
      description:
        "Comprehensive monograph by Sophie Lovell with foreword by Jonathan Ive. Clothbound hardcover edition in crisp condition with zero spine creasing or annotations. Essential industrial design reference.",
      price: "58.00",
      condition: "Like New",
      location: "Portland, OR",
      status: "Active",
      isNegotiable: false,
      exchangeDescription: "Will trade for Architecture or Typography monographs.",
      viewsCount: 64,
      images: [
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: marcus.id,
      categoryId: catMap.get("sports-and-fitness")!,
      title: "Specialized Diverge Elite E5 Gravel Bicycle (56cm)",
      slug: "specialized-diverge-elite-e5-gravel-bicycle-56cm",
      description:
        "Shimano GRX 400 2x10 drivetrain with hydraulic disc brakes and Pathfinder tubeless tires. Tuned last month at local bike co-op; new bar tape in terracotta brown. Ready for commuter trails or weekend bikepacking.",
      price: "650.00",
      condition: "Good",
      location: "Seattle, WA",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Open to trade for a folding commuter bike or Concept2 rower.",
      viewsCount: 134,
      images: [
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: elena.id,
      categoryId: catMap.get("accessories")!,
      title: "Vegetable-Tanned Bridle Leather Architectural Tote Bag",
      slug: "vegetable-tanned-bridle-leather-architectural-tote",
      description:
        "Hand-stitched full-grain saddle leather tote that has developed a warm caramel patina. Fits a 16-inch laptop plus sketchbook. Solid brass rivets and interior key leash.",
      price: "135.00",
      condition: "Good",
      location: "Austin, TX",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: null,
      viewsCount: 91,
      images: [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: clara.id,
      categoryId: catMap.get("home-and-kitchen")!,
      title: "Set of 6 Hand-Thrown Stoneware Espresso & Matcha Bowls",
      slug: "set-of-6-hand-thrown-stoneware-espresso-matcha-bowls",
      description:
        "Wheel-thrown speckled clay vessels glazed in satin oatmeal and iron oxide rim. Dishwasher safe and stackable. Crafted by a Willamette Valley ceramic studio.",
      price: "78.00",
      condition: "Like New",
      location: "Portland, OR",
      status: "Active",
      isNegotiable: false,
      exchangeDescription: "Open to swap for linen table runners or beeswax tapers.",
      viewsCount: 52,
      images: [
        "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: marcus.id,
      categoryId: catMap.get("electronics")!,
      title: "Sennheiser HD 650 Open-Back Reference Studio Headphones",
      slug: "sennheiser-hd-650-open-back-reference-studio-headphones",
      description:
        "Warm, fatigue-free acoustic signature ideal for mixing and vinyl listening. Replaced velour earpads 2 months ago. Includes both 1/4-inch stock cable and balanced 4.4mm Pentaconn cable.",
      price: "210.00",
      condition: "Excellent",
      location: "Seattle, WA",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Would trade for a Shure SM7B microphone or DAC/Amp stack.",
      viewsCount: 83,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: elena.id,
      categoryId: catMap.get("furniture")!,
      title: "Solid White Oak Floating Entryway Bench (48 inch)",
      slug: "solid-white-oak-floating-entryway-bench-48-inch",
      description:
        "Mortise-and-tenon joinery with slatted lower shoe shelf. Finished in zero-VOC hardwax oil. Minor surface scuff on one leg that blends into the natural wood grain.",
      price: "275.00",
      condition: "Good",
      location: "Austin, TX",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: null,
      viewsCount: 69,
      images: [
        "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: clara.id,
      categoryId: catMap.get("toys-and-games")!,
      title: "Hand-Carved Walnut & Maple Championship Chess Set",
      slug: "hand-carved-walnut-and-maple-championship-chess-set",
      description:
        "Staunton-weighted wooden pieces with felted bases and a 19-inch inlaid walnut/maple board. Includes dovetailed storage box with brass clasps.",
      price: "110.00",
      condition: "Excellent",
      location: "Portland, OR",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: "Happy to trade for Catan 3D or vintage mechanical puzzles.",
      viewsCount: 47,
      images: [
        "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: marcus.id,
      categoryId: catMap.get("accessories")!,
      title: "Seiko SARB033 Mechanical Automatic Dress Watch",
      slug: "seiko-sarb033-mechanical-automatic-dress-watch",
      description:
        "Discontinued JDM classic with 6R15 movement, sapphire crystal, and exhibition caseback. Running within +4 sec/day. Includes original stainless bracelet and an olive suede strap.",
      price: "460.00",
      condition: "Good",
      location: "Seattle, WA",
      status: "Active",
      isNegotiable: true,
      exchangeDescription: null,
      viewsCount: 121,
      images: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: elena.id,
      categoryId: catMap.get("other")!,
      title: "Vintage Brass Botanical Press & Herbarium Kit",
      slug: "vintage-brass-botanical-press-and-herbarium-kit",
      description:
        "Heavy solid brass wingnuts with birch plywood pressing boards and 24 fresh sheets of cotton rag blotting paper. Great for pressing wildflowers and studio botanical studies.",
      price: "44.00",
      condition: "Fair",
      location: "Austin, TX",
      status: "Active",
      isNegotiable: false,
      exchangeDescription: "Will trade for ceramic planters or watercolour cold-press blocks.",
      viewsCount: 39,
      images: [
        "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=1000&q=80",
      ],
    },
    {
      sellerId: clara.id,
      categoryId: catMap.get("furniture")!,
      title: "Artemide Nessino Table Lamp — Translucent Warm Orange",
      slug: "artemide-nessino-table-lamp-translucent-warm-orange",
      description:
        "Iconic 1960s Giancarlo Mattioli space-age mushroom lamp. Casts a warm ambient glow across bookshelves or bedside tables. Includes four warm-dim LED bulbs.",
      price: "190.00",
      condition: "Like New",
      location: "Portland, OR",
      status: "Sold",
      isNegotiable: false,
      exchangeDescription: null,
      viewsCount: 155,
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80",
      ],
    },
  ];

  const insertedProducts = [];
  for (const item of sampleProducts) {
    const { images, ...productFields } = item;
    const [createdProduct] = await db
      .insert(products)
      .values(productFields)
      .returning();
    insertedProducts.push(createdProduct);

    const imageRows = images.map((url, idx) => ({
      productId: createdProduct.id,
      imageUrl: url,
      altText: `${createdProduct.title} - view ${idx + 1}`,
      isPrimary: idx === 0,
      sortOrder: idx,
    }));
    await db.insert(productImages).values(imageRows);
  }

  // 4. Seed Favorites
  await db.insert(favorites).values([
    { userId: clara.id, productId: insertedProducts[0].id },
    { userId: clara.id, productId: insertedProducts[2].id },
    { userId: clara.id, productId: insertedProducts[4].id },
    { userId: marcus.id, productId: insertedProducts[1].id },
    { userId: marcus.id, productId: insertedProducts[3].id },
    { userId: elena.id, productId: insertedProducts[0].id },
  ]);

  // 5. Seed Conversations & Messages
  const [conv1] = await db
    .insert(conversations)
    .values({
      productId: insertedProducts[0].id, // Fujifilm X100V owned by Marcus
      buyerId: clara.id,
      sellerId: marcus.id,
    })
    .returning();

  await db.insert(messages).values([
    {
      conversationId: conv1.id,
      senderId: clara.id,
      messageText:
        "Hi Marcus! Is the Fujifilm X100V still available? I have a pair of Genelec 8010A studio monitors if you are still open to a partial swap.",
      readAt: new Date(Date.now() - 3600_000),
    },
    {
      conversationId: conv1.id,
      senderId: marcus.id,
      messageText:
        "Hey Clara! Yes, it is available and in spotless shape. I would definitely be interested in hearing more about the Genelecs—do they come with the iso-pods?",
      readAt: null,
    },
  ]);

  const [conv2] = await db
    .insert(conversations)
    .values({
      productId: insertedProducts[1].id, // Danish Teak Chair owned by Clara
      buyerId: elena.id,
      sellerId: clara.id,
    })
    .returning();

  await db.insert(messages).values([
    {
      conversationId: conv2.id,
      senderId: elena.id,
      messageText:
        "Hello Clara! The bouclé reupholstery on this teak lounge chair looks gorgeous. What is the seat height from the floor?",
      readAt: null,
    },
  ]);

  // 6. Seed Reviews
  await db.insert(reviews).values([
    {
      reviewerId: elena.id,
      sellerId: clara.id,
      productId: insertedProducts[15].id, // Sold Artemide Lamp
      rating: 5,
      comment:
        "Clara packed the Artemide lamp with museum-grade care and shipped the same afternoon. Looks even better in person!",
      isVerifiedExchange: true,
    },
    {
      reviewerId: clara.id,
      sellerId: marcus.id,
      productId: insertedProducts[10].id,
      rating: 5,
      comment:
        "Marcus is a super knowledgeable audio seller. Honest condition description and quick communication.",
      isVerifiedExchange: true,
    },
    {
      reviewerId: marcus.id,
      sellerId: elena.id,
      productId: insertedProducts[2].id,
      rating: 5,
      comment:
        "Picked up cookware from Elena—spotless condition exactly as photographed. Highly recommended community member.",
      isVerifiedExchange: true,
    },
  ]);
}
