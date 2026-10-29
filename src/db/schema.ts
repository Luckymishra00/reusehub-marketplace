import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    profileImage: text("profile_image"),
    bio: text("bio"),
    location: varchar("location", { length: 120 }),
    role: varchar("role", { length: 20 }).notNull().default("user"), // 'user' | 'admin'
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }).default("Package"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("categories_name_idx").on(table.name),
    uniqueIndex("categories_slug_idx").on(table.slug),
  ]
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    condition: varchar("condition", { length: 40 }).notNull(), // 'Like New' | 'Excellent' | 'Good' | 'Fair'
    location: varchar("location", { length: 120 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("Active"), // 'Draft' | 'Active' | 'Reserved' | 'Sold' | 'Archived'
    isNegotiable: boolean("is_negotiable").notNull().default(false),
    exchangeDescription: text("exchange_description"),
    viewsCount: integer("views_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_seller_idx").on(table.sellerId),
    index("products_category_idx").on(table.categoryId),
    index("products_status_idx").on(table.status),
    index("products_condition_idx").on(table.condition),
    index("products_created_at_idx").on(table.createdAt),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("product_images_product_idx").on(table.productId)]
);

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("favorites_user_product_idx").on(table.userId, table.productId),
    index("favorites_user_idx").on(table.userId),
    index("favorites_product_idx").on(table.productId),
  ]
);

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    buyerId: integer("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("conversations_unique_idx").on(
      table.productId,
      table.buyerId,
      table.sellerId
    ),
    index("conversations_buyer_idx").on(table.buyerId),
    index("conversations_seller_idx").on(table.sellerId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageText: text("message_text").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_sender_idx").on(table.senderId),
  ]
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    reviewerId: integer("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    rating: integer("rating").notNull(), // 1 to 5
    comment: text("comment").notNull(),
    isVerifiedExchange: boolean("is_verified_exchange").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reviews_reviewer_seller_product_idx").on(
      table.reviewerId,
      table.sellerId,
      table.productId
    ),
    index("reviews_seller_idx").on(table.sellerId),
  ]
);

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("new"), // 'new' | 'read' | 'archived'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_token_hash_idx").on(table.tokenHash),
    index("password_reset_user_idx").on(table.userId),
  ]
);
