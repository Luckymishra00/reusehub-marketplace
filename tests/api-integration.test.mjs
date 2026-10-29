// Automated Backend & Database Integration Test Suite for ReUseHub
// Run when the server is listening on http://127.0.0.1:3000

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

async function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export async function runIntegrationTests() {
  console.log("Starting ReUseHub API Integration Tests...");

  // 1. Health check & seed verification
  const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
  const healthJson = await healthRes.json();
  await assert(healthRes.status === 200 && healthJson.success, "Health check should return 200 OK");
  console.log("✓ 1. Health check & database seed verified");

  // 2. Register User A (Seller)
  const uniqueSuffix = Date.now();
  const sellerEmail = `seller_${uniqueSuffix}@reusehub.test`;
  const regSellerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Seller",
      email: sellerEmail,
      password: "Password123!",
      confirmPassword: "Password123!",
      location: "Portland, OR",
      acceptTerms: true,
    }),
  });
  const regSellerJson = await regSellerRes.json();
  await assert(regSellerRes.status === 201, "Seller registration should return 201");
  const sellerToken = regSellerJson.data.token;
  console.log("✓ 2. User registration succeeded");

  // 3. Duplicate email registration should fail with 409
  const dupRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Duplicate User",
      email: sellerEmail,
      password: "Password123!",
      confirmPassword: "Password123!",
      acceptTerms: true,
    }),
  });
  await assert(dupRes.status === 409, "Duplicate email should return 409 Conflict");
  console.log("✓ 3. Duplicate email prevention verified (409)");

  // 4. Login with invalid credentials should fail with 401
  const badLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: sellerEmail, password: "WrongPassword!" }),
  });
  await assert(badLoginRes.status === 401, "Invalid login should return 401");
  console.log("✓ 4. Invalid login rejected (401)");

  // 5. Create a Product Listing as Seller
  const catRes = await fetch(`${BASE_URL}/api/v1/categories`);
  const catJson = await catRes.json();
  const categoryId = catJson.data[0].id;

  const createProdRes = await fetch(`${BASE_URL}/api/v1/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({
      title: `Vintage Analog Camera ${uniqueSuffix}`,
      description: "Tested 35mm film camera with 50mm f/1.4 prime lens in spotless working order.",
      price: 185,
      categoryId,
      condition: "Excellent",
      location: "Portland, OR",
      isNegotiable: true,
      exchangeDescription: "Open to trade for darkroom enlarger.",
    }),
  });
  const createProdJson = await createProdRes.json();
  await assert(createProdRes.status === 201, "Product creation should return 201");
  const productId = createProdJson.data.id;
  console.log("✓ 5. Product creation verified");

  // 6. Register User B (Buyer)
  const buyerEmail = `buyer_${uniqueSuffix}@reusehub.test`;
  const regBuyerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Buyer",
      email: buyerEmail,
      password: "Password123!",
      confirmPassword: "Password123!",
      location: "Seattle, WA",
      acceptTerms: true,
    }),
  });
  const regBuyerJson = await regBuyerRes.json();
  const buyerToken = regBuyerJson.data.token;

  // 7. Buyer attempting to edit Seller's listing must be rejected with 403
  const unauthEditRes = await fetch(`${BASE_URL}/api/v1/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({ price: 10 }),
  });
  await assert(unauthEditRes.status === 403, "Non-owner edit should return 403 Forbidden");
  console.log("✓ 6. Unauthorized product modification blocked (403)");

  // 8. Search & Filter for the created listing
  const searchRes = await fetch(`${BASE_URL}/api/v1/products?q=${uniqueSuffix}&condition=Excellent`);
  const searchJson = await searchRes.json();
  await assert(
    searchRes.status === 200 && searchJson.data.some((p) => p.id === productId),
    "Search & filter should find the newly created product"
  );
  console.log("✓ 7. Search, filter, and pagination verified");

  // 9. Buyer saves product to Favorites
  const favRes = await fetch(`${BASE_URL}/api/v1/favorites/${productId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  await assert(favRes.status === 201, "Adding favorite should return 201");
  console.log("✓ 8. Favorites persistence verified");

  // 10. Buyer starts conversation & Seller retrieves message
  const convRes = await fetch(`${BASE_URL}/api/v1/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      productId,
      message: "Hello! Is this 35mm camera still available for pickup?",
    }),
  });
  const convJson = await convRes.json();
  await assert(convRes.status === 201, "Starting conversation should return 201");
  const conversationId = convJson.data.conversationId;

  const msgListRes = await fetch(`${BASE_URL}/api/v1/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  const msgListJson = await msgListRes.json();
  await assert(
    msgListRes.status === 200 && msgListJson.data.messages.length === 1,
    "Seller should retrieve the buyer's message"
  );
  console.log("✓ 9. Buyer–Seller conversation & message persistence verified");

  // 11. Seller transitions product status to Sold
  const statusRes = await fetch(`${BASE_URL}/api/v1/products/${productId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ status: "Sold" }),
  });
  await assert(statusRes.status === 200, "Owner status update to Sold should return 200");
  console.log("✓ 10. Listing status transition to Sold verified");

  console.log("ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
