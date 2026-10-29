import { db } from "@/db";
import {
  categories,
  favorites,
  productImages,
  products,
  users,
} from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export const VALID_CONDITIONS = [
  "Like New",
  "Excellent",
  "Good",
  "Fair",
] as const;

export const VALID_STATUSES = [
  "Draft",
  "Active",
  "Reserved",
  "Sold",
  "Archived",
] as const;

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 140);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base || "item"}-${suffix}`;
}

export async function hydrateProducts(
  rawProducts: Array<typeof products.$inferSelect>,
  currentUserId?: number | null
) {
  if (rawProducts.length === 0) return [];

  const productIds = rawProducts.map((p) => p.id);
  const sellerIds = Array.from(new Set(rawProducts.map((p) => p.sellerId)));
  const categoryIds = Array.from(new Set(rawProducts.map((p) => p.categoryId)));

  const [allImages, allSellers, allCategories, userFavorites] =
    await Promise.all([
      db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          profileImage: users.profileImage,
          location: users.location,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(inArray(users.id, sellerIds)),
      db
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds)),
      currentUserId
        ? db
            .select()
            .from(favorites)
            .where(eq(favorites.userId, currentUserId))
        : Promise.resolve([]),
    ]);

  const imagesByProduct = new Map<
    number,
    Array<typeof productImages.$inferSelect>
  >();
  for (const img of allImages) {
    const list = imagesByProduct.get(img.productId) || [];
    list.push(img);
    imagesByProduct.set(img.productId, list);
  }

  const sellerMap = new Map(allSellers.map((s) => [s.id, s]));
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
  const favProductIds = new Set(userFavorites.map((f) => f.productId));

  return rawProducts.map((p) => {
    const imgs = imagesByProduct.get(p.id) || [];
    const primary = imgs.find((i) => i.isPrimary) || imgs[0];
    const cat = categoryMap.get(p.categoryId);
    const seller = sellerMap.get(p.sellerId);

    return {
      ...p,
      price: Number(p.price),
      primaryImage: primary?.imageUrl || "/images/placeholder-product.svg",
      images:
        imgs.length > 0
          ? imgs
          : [
              {
                id: 0,
                productId: p.id,
                imageUrl: "/images/placeholder-product.svg",
                altText: p.title,
                isPrimary: true,
                sortOrder: 0,
                createdAt: p.createdAt,
              },
            ],
      category: cat
        ? { id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon }
        : null,
      seller: seller
        ? {
            id: seller.id,
            fullName: seller.fullName,
            profileImage: seller.profileImage,
            location: seller.location,
            createdAt: seller.createdAt,
          }
        : null,
      isFavorited: favProductIds.has(p.id),
    };
  });
}
