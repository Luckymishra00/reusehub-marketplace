import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  categories,
  productImages,
  products,
  reviews,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import {
  hydrateProducts,
  VALID_CONDITIONS,
  VALID_STATUSES,
} from "@/lib/products-helper";
import { and, avg, count, desc, eq, ne, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const productId = Number(id);
    if (Number.isNaN(productId) || productId <= 0) {
      return apiError("Invalid product ID", 400);
    }

    const currentUser = await getAuthenticatedUser(req);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return apiError("Product listing not found", 404);
    }

    // Increment view counter asynchronously
    await db
      .update(products)
      .set({ viewsCount: sql`${products.viewsCount} + 1` })
      .where(eq(products.id, productId));

    const [hydrated] = await hydrateProducts([product], currentUser?.id);

    // Seller rating summary
    const [ratingSummary] = await db
      .select({
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.sellerId, product.sellerId));

    // Related products from same category
    const relatedRaw = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, product.categoryId),
          eq(products.status, "Active"),
          ne(products.id, product.id)
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(4);

    const related = await hydrateProducts(relatedRaw, currentUser?.id);

    return apiSuccess("Product details retrieved", {
      ...hydrated,
      sellerRating: {
        average: ratingSummary?.avgRating
          ? Number(Number(ratingSummary.avgRating).toFixed(1))
          : 5.0,
        count: ratingSummary?.reviewCount ?? 0,
      },
      relatedProducts: related,
    });
  } catch (err) {
    console.error("Get product detail error:", err);
    return apiError("Failed to retrieve product details", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await context.params;
    const productId = Number(id);
    if (Number.isNaN(productId) || productId <= 0) {
      return apiError("Invalid product ID", 400);
    }

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return apiError("Product listing not found", 404);
    }

    if (
      existing.sellerId !== currentUser.id &&
      currentUser.role !== "admin"
    ) {
      return apiError(
        "You do not have permission to edit another seller's listing",
        403
      );
    }

    const body = await req.json();
    const title =
      body.title !== undefined ? String(body.title).trim() : existing.title;
    const description =
      body.description !== undefined
        ? String(body.description).trim()
        : existing.description;
    const priceNum =
      body.price !== undefined ? Number(body.price) : Number(existing.price);
    const categoryId =
      body.categoryId !== undefined
        ? Number(body.categoryId)
        : existing.categoryId;
    const condition =
      body.condition !== undefined
        ? String(body.condition).trim()
        : existing.condition;
    const location =
      body.location !== undefined
        ? String(body.location).trim()
        : existing.location;
    const status =
      body.status !== undefined ? String(body.status).trim() : existing.status;
    const isNegotiable =
      body.isNegotiable !== undefined
        ? Boolean(body.isNegotiable)
        : existing.isNegotiable;
    const exchangeDescription =
      body.exchangeDescription !== undefined
        ? body.exchangeDescription
          ? String(body.exchangeDescription).trim()
          : null
        : existing.exchangeDescription;

    const errors: Array<{ field: string; message: string }> = [];

    if (!title || title.length < 4 || title.length > 180) {
      errors.push({
        field: "title",
        message: "Title must be between 4 and 180 characters",
      });
    }
    if (!description || description.length < 15) {
      errors.push({
        field: "description",
        message: "Description must be at least 15 characters",
      });
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      errors.push({
        field: "price",
        message: "Price must be a valid positive amount",
      });
    }
    if (
      !VALID_CONDITIONS.includes(
        condition as (typeof VALID_CONDITIONS)[number]
      )
    ) {
      errors.push({
        field: "condition",
        message: "Invalid condition selected",
      });
    }
    if (
      !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      errors.push({
        field: "status",
        message: "Invalid listing status",
      });
    }
    if (!location || location.length < 2) {
      errors.push({
        field: "location",
        message: "Location is required",
      });
    }

    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const [catCheck] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!catCheck) {
      return apiError("Category not found", 400);
    }

    const [updated] = await db
      .update(products)
      .set({
        title,
        description,
        price: priceNum.toFixed(2),
        categoryId,
        condition,
        location,
        status,
        isNegotiable,
        exchangeDescription,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    // If new images array is explicitly passed in body.images, sync images
    if (Array.isArray(body.images) && body.images.length > 0) {
      const cleanUrls = body.images
        .map((u: unknown) => String(u || "").trim())
        .filter(Boolean)
        .slice(0, 5);

      if (cleanUrls.length > 0) {
        await db
          .delete(productImages)
          .where(eq(productImages.productId, productId));
        await db.insert(productImages).values(
          cleanUrls.map((url: string, idx: number) => ({
            productId,
            imageUrl: url,
            altText: `${title} - image ${idx + 1}`,
            isPrimary: idx === 0,
            sortOrder: idx,
          }))
        );
      }
    }

    const [hydrated] = await hydrateProducts([updated], currentUser.id);
    return apiSuccess("Listing updated successfully", hydrated);
  } catch (err) {
    console.error("Update product error:", err);
    return apiError("Failed to update product listing", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await context.params;
    const productId = Number(id);
    if (Number.isNaN(productId) || productId <= 0) {
      return apiError("Invalid product ID", 400);
    }

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return apiError("Product listing not found", 404);
    }

    if (
      existing.sellerId !== currentUser.id &&
      currentUser.role !== "admin"
    ) {
      return apiError(
        "You do not have permission to delete another seller's listing",
        403
      );
    }

    await db.delete(products).where(eq(products.id, productId));
    return apiSuccess("Listing deleted permanently", { id: productId });
  } catch (err) {
    console.error("Delete product error:", err);
    return apiError("Failed to delete product listing", 500);
  }
}
