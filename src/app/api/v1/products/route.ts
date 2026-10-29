import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import {
  hydrateProducts,
  slugifyTitle,
  VALID_CONDITIONS,
  VALID_STATUSES,
} from "@/lib/products-helper";
import {
  and,
  asc,
   count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  SQL,
  sql,
} from "drizzle-orm";

export const dynamic = "force-dynamic";

function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();
    const categoryParam = (searchParams.get("category") || "").trim();
    const conditionParam = (searchParams.get("condition") || "").trim();
    const locationParam = (searchParams.get("location") || "").trim();
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const negotiableParam = searchParams.get("negotiable");
    const exchangeParam = searchParams.get("exchange");
    const statusParam = (searchParams.get("status") || "Active").trim();
    const sortParam = (searchParams.get("sort") || "newest").trim();

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      48,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
    );
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    // By default only Active listings appear in public marketplace search
    if (statusParam === "all" && currentUser?.role === "admin") {
      // allow all statuses for admin
    } else if (
      VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
    ) {
      filters.push(eq(products.status, statusParam));
    } else {
      filters.push(eq(products.status, "Active"));
    }

    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      filters.push(
        or(
          ilike(products.title, pattern),
          ilike(products.description, pattern),
          ilike(products.location, pattern)
        )!
      );
    }

    if (categoryParam) {
      const catId = Number(categoryParam);
      if (!Number.isNaN(catId) && catId > 0) {
        filters.push(eq(products.categoryId, catId));
      } else {
        const [catRecord] = await db
          .select()
          .from(categories)
          .where(
            or(
              eq(categories.slug, categoryParam.toLowerCase()),
              ilike(categories.name, categoryParam)
            )
          )
          .limit(1);
        if (catRecord) {
          filters.push(eq(products.categoryId, catRecord.id));
        } else {
          return apiSuccess("Products retrieved successfully", [], 200, {
            page,
            limit,
            total: 0,
            totalPages: 0,
          });
        }
      }
    }

    if (conditionParam) {
      filters.push(eq(products.condition, conditionParam));
    }

    if (locationParam) {
      filters.push(ilike(products.location, `%${escapeLike(locationParam)}%`));
    }

    if (minPriceParam !== null && minPriceParam !== "") {
      const minVal = parseFloat(minPriceParam);
      if (!Number.isNaN(minVal) && minVal >= 0) {
        filters.push(gte(products.price, minVal.toFixed(2)));
      }
    }

    if (maxPriceParam !== null && maxPriceParam !== "") {
      const maxVal = parseFloat(maxPriceParam);
      if (!Number.isNaN(maxVal) && maxVal >= 0) {
        filters.push(lte(products.price, maxVal.toFixed(2)));
      }
    }

    if (negotiableParam === "true") {
      filters.push(eq(products.isNegotiable, true));
    }

    if (exchangeParam === "true") {
      filters.push(
        sql`${products.exchangeDescription} IS NOT NULL AND ${products.exchangeDescription} <> ''`
      );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    let orderByClause = desc(products.createdAt);
    if (sortParam === "price_asc") {
      orderByClause = asc(products.price);
    } else if (sortParam === "price_desc") {
      orderByClause = desc(products.price);
    } else if (sortParam === "popular") {
      orderByClause = desc(products.viewsCount);
    }

    const [totalResult, rows] = await Promise.all([
      db.select({ value: count() }).from(products).where(whereClause),
      db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(orderByClause, desc(products.id))
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalResult[0]?.value ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hydrated = await hydrateProducts(rows, currentUser?.id);

    return apiSuccess("Products retrieved successfully", hydrated, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("Get products error:", err);
    return apiError("Failed to retrieve products", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to create a listing", 401);
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const priceRaw = Number(body.price);
    const categoryId = Number(body.categoryId);
    const condition = String(body.condition || "").trim();
    const location = String(body.location || "").trim();
    const isNegotiable = Boolean(body.isNegotiable);
    const exchangeDescription = body.exchangeDescription
      ? String(body.exchangeDescription).trim()
      : null;
    const status = body.status === "Draft" ? "Draft" : "Active";
    const imageUrls: string[] = Array.isArray(body.images)
      ? body.images
          .map((u: unknown) => String(u || "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

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

    if (Number.isNaN(priceRaw) || priceRaw <= 0 || priceRaw > 999999) {
      errors.push({
        field: "price",
        message: "Price must be a valid positive amount",
      });
    }

    if (!categoryId || Number.isNaN(categoryId)) {
      errors.push({
        field: "categoryId",
        message: "Please select a valid category",
      });
    }

    if (
      !VALID_CONDITIONS.includes(
        condition as (typeof VALID_CONDITIONS)[number]
      )
    ) {
      errors.push({
        field: "condition",
        message:
          "Condition must be one of: Like New, Excellent, Good, or Fair",
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

    const [catRecord] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!catRecord) {
      return apiError("Selected category does not exist", 400, [
        { field: "categoryId", message: "Selected category does not exist" },
      ]);
    }

    const slug = slugifyTitle(title);

    const [created] = await db
      .insert(products)
      .values({
        sellerId: currentUser.id,
        categoryId,
        title,
        slug,
        description,
        price: priceRaw.toFixed(2),
        condition,
        location,
        status,
        isNegotiable,
        exchangeDescription,
      })
      .returning();

    const finalImageUrls =
      imageUrls.length > 0 ? imageUrls : ["/images/placeholder-product.svg"];

    await db.insert(productImages).values(
      finalImageUrls.map((url, idx) => ({
        productId: created.id,
        imageUrl: url,
        altText: `${title} - image ${idx + 1}`,
        isPrimary: idx === 0,
        sortOrder: idx,
      }))
    );

    const [hydrated] = await hydrateProducts([created], currentUser.id);
    return apiSuccess("Listing created successfully", hydrated, 201);
  } catch (err) {
    console.error("Create product error:", err);
    return apiError("Failed to create product listing", 500);
  }
}
