# ReUseHub — Full-Stack Second-Hand Marketplace

**Give Pre-Loved Items a New Life.** ReUseHub is a full-stack second-hand goods exchange and resale marketplace where users can discover, buy, sell, and swap pre-owned products.

---

## 1. Architecture & Technology Stack

- **Frontend**: React 19, Next.js App Router, TypeScript/JSX, Tailwind CSS v4, Lucide React icons, custom `AuthContext` state & toast notification system.
- **Backend API**: RESTful API endpoints under `/api/v1/*` with standardized JSON responses (`{ success, message, data, pagination, errors }`), rate limiting, ownership authorization, and multipart file upload validation.
- **Authentication & Security**: `bcryptjs` password hashing, signed HMAC-SHA256 JWT tokens stored in `HttpOnly` cookies (and accepted via `Authorization: Bearer <token>`), SHA-256 hashed password reset tokens, and strict server-side ownership checks.
- **Database**: Relational SQL schema managed with Drizzle ORM (`src/db/schema.ts`) and version-controlled SQL DDL (`migrations/schema.sql`), plus repeatable idempotent seeding (`src/db/seed.ts`).

---

## 2. Database Design & Entity Relationships (ER)

1. **`users`**: Stores registered members and administrators (`id`, `full_name`, `email` UNIQUE, `password_hash`, `profile_image`, `bio`, `location`, `role`, `is_active`, `created_at`, `updated_at`).
2. **`categories`**: Stores marketplace departments (`id`, `name` UNIQUE, `slug` UNIQUE, `description`, `icon`, `is_active`, `created_at`).
3. **`products`**: Stores product listings (`id`, `seller_id` FK → `users.id`, `category_id` FK → `categories.id`, `title`, `slug` UNIQUE, `description`, `price` DECIMAL(10,2), `condition`, `location`, `status`, `is_negotiable`, `exchange_description`, `views_count`, `created_at`, `updated_at`).
4. **`product_images`**: Stores multiple gallery images per product (`id`, `product_id` FK → `products.id` ON DELETE CASCADE, `image_url`, `alt_text`, `is_primary`, `sort_order`, `created_at`).
5. **`favorites`**: Stores user wishlist items (`id`, `user_id` FK → `users.id`, `product_id` FK → `products.id`, UNIQUE `(user_id, product_id)`).
6. **`conversations`**: Buyer–seller threads linked to a specific listing (`id`, `product_id` FK → `products.id`, `buyer_id` FK → `users.id`, `seller_id` FK → `users.id`, UNIQUE `(product_id, buyer_id, seller_id)`).
7. **`messages`**: Individual chat messages (`id`, `conversation_id` FK → `conversations.id` ON DELETE CASCADE, `sender_id` FK → `users.id`, `message_text`, `read_at`, `created_at`).
8. **`reviews`**: Seller ratings and reviews (`id`, `reviewer_id` FK → `users.id`, `seller_id` FK → `users.id`, `product_id` FK → `products.id`, `rating` 1–5, `comment`, `is_verified_exchange`, `created_at`).
9. **`contact_messages`**: Validated support inquiries (`id`, `name`, `email`, `subject`, `message`, `status`, `created_at`).
10. **`password_reset_tokens`**: SHA-256 hashed recovery tokens (`id`, `user_id` FK → `users.id`, `token_hash`, `expires_at`, `used_at`, `created_at`).

---

## 3. REST API Endpoints (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Application & database connectivity health check |
| `POST` | `/api/v1/auth/register` | Register a new user account with bcrypt password hashing |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue JWT session |
| `POST` | `/api/v1/auth/logout` | Clear authentication session |
| `GET` | `/api/v1/auth/me` | Retrieve current authenticated user profile |
| `POST` | `/api/v1/auth/forgot-password` | Generate SHA-256 hashed password reset token |
| `POST` | `/api/v1/auth/reset-password` | Reset password using valid token |
| `GET` | `/api/v1/categories` | List all active categories with active item counts |
| `GET` | `/api/v1/products` | Search, filter, sort, and paginate active marketplace listings |
| `POST` | `/api/v1/products` | Create a new product listing (authenticated) |
| `GET` | `/api/v1/products/mine` | Retrieve all listings owned by the current user |
| `GET` | `/api/v1/products/:id` | Retrieve product details, gallery, seller rating, and related items |
| `PATCH` | `/api/v1/products/:id` | Update a listing (owner or admin only) |
| `DELETE` | `/api/v1/products/:id` | Permanently delete a listing (owner or admin only) |
| `PATCH` | `/api/v1/products/:id/status` | Transition listing status (`Draft`, `Active`, `Reserved`, `Sold`, `Archived`) |
| `POST` | `/api/v1/products/:id/images` | Add an image to a listing (owner only, max 5) |
| `DELETE` | `/api/v1/products/:id/images/:imageId` | Remove an image from a listing (owner only) |
| `PATCH` | `/api/v1/products/:id/images/:imageId/primary` | Set primary cover image for a listing (owner only) |
| `POST` | `/api/v1/uploads` | Multipart image upload (JPEG/PNG/WebP, magic-byte validated, max 5MB) |
| `GET` | `/api/v1/users/:id` | Public seller profile, active/sold listings, and reviews |
| `PATCH` | `/api/v1/users/me` | Update current user profile settings |
| `DELETE` | `/api/v1/users/me` | Deactivate account and archive listings |
| `PATCH` | `/api/v1/users/me/password` | Change password after verifying current password |
| `GET` | `/api/v1/favorites` | List saved favorite products |
| `POST` | `/api/v1/favorites/:productId` | Add product to favorites |
| `DELETE` | `/api/v1/favorites/:productId` | Remove product from favorites |
| `GET` | `/api/v1/conversations` | List user's buyer–seller conversations with unread counts |
| `POST` | `/api/v1/conversations` | Start or retrieve a conversation for a product |
| `GET` | `/api/v1/conversations/:id/messages` | Retrieve messages for a conversation (participant only) |
| `POST` | `/api/v1/conversations/:id/messages` | Send a message in a conversation (participant only) |
| `PATCH` | `/api/v1/conversations/:id/read` | Mark conversation messages as read |
| `POST` | `/api/v1/reviews` | Submit a seller review |
| `POST` | `/api/v1/contact` | Persist a contact support inquiry |
| `GET` | `/api/v1/dashboard` | Retrieve real user dashboard statistics & recent activity |
| `GET` | `/api/v1/admin/dashboard` | Retrieve admin stewardship metrics (admin role required) |

---

## 4. Development Demo Accounts

The database seed automatically creates these development-only demo accounts (all use password `Password123!`):

- **Clara Vance (Seller)**: `clara@reusehub.demo` / `Password123!`
- **Marcus Chen (Seller)**: `marcus@reusehub.demo` / `Password123!`
- **Elena Rostova (Seller)**: `elena@reusehub.demo` / `Password123!`
- **Julian Mercer (Admin)**: `admin@reusehub.demo` / `Password123!`

---

## 5. Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` based on `.env.example`.
3. Push the relational schema to the database:
   ```bash
   npx drizzle-kit push
   ```
4. Start the development server (automatically seeds initial categories and demo listings on first request):
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   npm run start
   ```

---

## 6. Deployment Readiness & Known Limitations

- **File Uploads**: Local multipart uploads are saved to `public/uploads/` with server-generated UUID filenames and magic-byte validation. On cloud hosts with ephemeral filesystems, configure persistent volume storage or replace the upload handler with an S3/Cloudinary storage adapter.
- **Email Delivery**: Password reset tokens are cryptographically generated, SHA-256 hashed, and stored in `password_reset_tokens`. Because an external SMTP provider is not configured by default, the `/forgot-password` flow explicitly informs the user and provides the development reset link directly.
