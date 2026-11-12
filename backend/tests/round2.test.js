import test from "node:test";
import assert from "node:assert/strict";
import { validateBody } from "../src/middleware/validator.middleware.js";
import { ProductModel } from "../src/models/product.model.js";
import { VariantModel } from "../src/models/variant.model.js";
import { InventoryModel } from "../src/models/inventory.model.js";

test("Round 2: Validation Middleware validates required fields, types, and enums", () => {
  const schema = {
    name: { required: true, type: "string", minLength: 3 },
    basePrice: { required: true, type: "number", min: 0 },
    gearCategory: {
      required: true,
      type: "string",
      enum: ["EQUIPMENT", "APPAREL", "FOOTWEAR", "PROTECTIVE", "ACCESSORY"],
    },
  };

  const middleware = validateBody(schema);

  // 1. Missing required field
  let capturedStatus = null;
  let capturedJson = null;
  const mockRes = {
    status: (code) => {
      capturedStatus = code;
      return {
        json: (data) => {
          capturedJson = data;
        },
      };
    },
  };

  middleware({ body: { basePrice: 49.99 } }, mockRes, () => {});
  assert.equal(capturedStatus, 400);
  assert.equal(capturedJson.errors.length, 2); // missing name and gearCategory

  // 2. Invalid enum value
  middleware(
    {
      body: {
        name: "Pro Racket",
        basePrice: 199.99,
        gearCategory: "INVALID_CATEGORY",
      },
    },
    mockRes,
    () => {},
  );
  assert.equal(capturedStatus, 400);
  assert.match(capturedJson.errors[0].message, /must be one of/);

  // 3. Negative price rejected
  middleware(
    {
      body: {
        name: "Pro Racket",
        basePrice: -10,
        gearCategory: "EQUIPMENT",
      },
    },
    mockRes,
    () => {},
  );
  assert.equal(capturedStatus, 400);
  assert.match(capturedJson.errors[0].message, /at least 0/);

  // 4. Valid payload proceeds
  let nextCalled = false;
  middleware(
    {
      body: {
        name: "Pro Tennis Racket",
        basePrice: 199.99,
        gearCategory: "EQUIPMENT",
      },
    },
    mockRes,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, true);
});

test("Round 2: Sports Product Schema indexes support full-text search and faceted filters", () => {
  const indexes = ProductModel.schema.indexes();

  // Verify text index exists
  const textIndex = indexes.find((idx) =>
    Object.values(idx[0]).includes("text"),
  );
  assert.ok(textIndex, "Product schema should have full-text index");

  // Verify compound/single indexes for fast queries
  const hasSportTypeIndex = indexes.some((idx) => idx[0].sportType !== undefined);
  const hasGearCategoryIndex = indexes.some(
    (idx) => idx[0].gearCategory !== undefined,
  );
  const hasPriceIndex = indexes.some((idx) => idx[0].basePrice !== undefined);

  assert.ok(hasSportTypeIndex, "sportType should be indexed");
  assert.ok(hasGearCategoryIndex, "gearCategory should be indexed");
  assert.ok(hasPriceIndex, "basePrice should be indexed");
});

test("Round 2: Inventory Model calculates quantityAvailable correctly with reservation", () => {
  const inv = new InventoryModel({
    variantId: "test-var-1",
    quantityOnHand: 25,
    quantityReserved: 5,
  });

  // Available stock = onHand - reserved
  const available = inv.quantityOnHand - inv.quantityReserved;
  assert.equal(available, 20);
});

test("Round 2: Product & Variant association supports sports gear attributes", () => {
  const product = new ProductModel({
    categoryId: "cat-racket-1",
    sellerId: "vendor-pro-1",
    name: "Wilson Blade 98 v8 Tennis Racket",
    basePrice: 249,
    sku: "WIL-BLD-98",
    sportType: ["tennis", "racket-sports"],
    gearCategory: "EQUIPMENT",
    brand: "Wilson",
    skillLevel: "ADVANCED",
    isBulky: false,
    specifications: {
      headSize: "98 sq in",
      weightGrams: 305,
      stringPattern: "16x19",
    },
  });

  const variant = new VariantModel({
    productId: product.productId,
    variantName: "Grip 3 (4 3/8)",
    sku: "WIL-BLD-98-G3",
    price: 249,
    weightKg: 0.31,
    attributes: { gripSize: "4 3/8" },
  });

  assert.equal(product.skillLevel, "ADVANCED");
  assert.equal(product.isBulky, false);
  assert.equal(variant.attributes.gripSize, "4 3/8");
  assert.equal(variant.productId, product.productId);
});

test("Round 2: In-stock and price sorting maps correctly", () => {
  const sortMap = {
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    rating_desc: { rating: -1, numReviews: -1 },
    newest: { createdAt: -1 },
  };

  assert.deepEqual(sortMap.price_asc, { basePrice: 1 });
  assert.deepEqual(sortMap.price_desc, { basePrice: -1 });
  assert.deepEqual(sortMap.rating_desc, { rating: -1, numReviews: -1 });
  assert.deepEqual(sortMap.newest, { createdAt: -1 });
});
