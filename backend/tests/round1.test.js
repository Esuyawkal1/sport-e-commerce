import test from "node:test";
import assert from "node:assert/strict";
import { RoleModel } from "../src/models/role.model.js";
import { VendorProfileModel } from "../src/models/vendorProfile.model.js";
import { CategoryModel } from "../src/models/category.model.js";
import { ProductModel } from "../src/models/product.model.js";
import { VariantModel } from "../src/models/variant.model.js";
import { requireRole } from "../src/middleware/auth.middleware.js";

test("Round 1: RoleModel supports SELLER, ADMIN, and CUSTOMER roles", () => {
  const roleEnum = RoleModel.schema.path("roleType").enumValues;
  assert.ok(roleEnum.includes("SELLER"), "RoleModel should include SELLER role");
  assert.ok(roleEnum.includes("ADMIN"), "RoleModel should include ADMIN role");
  assert.ok(
    roleEnum.includes("CUSTOMER"),
    "RoleModel should include CUSTOMER role",
  );
});

test("Round 1: VendorProfileModel schema has all required sports marketplace fields", () => {
  const paths = VendorProfileModel.schema.paths;
  assert.ok(paths.vendorId, "vendorId path should exist");
  assert.ok(paths.userId, "userId path should exist");
  assert.ok(paths.storeName, "storeName path should exist");
  assert.ok(paths.slug, "slug path should exist");
  assert.ok(
    paths.sportsSpecialization,
    "sportsSpecialization path should exist",
  );
  assert.ok(paths.isVerified, "isVerified path should exist");
  assert.ok(paths.commissionRate, "commissionRate path should exist");

  const instance = new VendorProfileModel({
    userId: "test-user-123",
    storeName: "Peak Athletics",
    slug: "peak-athletics",
    contactEmail: "info@peakathletics.com",
  });

  assert.equal(instance.isVerified, false);
  assert.equal(instance.commissionRate, 0.1);
  assert.equal(instance.rating, 0);
});

test("Round 1: CategoryModel schema supports dynamic admin attributes & hierarchy", () => {
  const paths = CategoryModel.schema.paths;
  assert.ok(paths.categoryId, "categoryId should exist");
  assert.ok(paths.parentCategoryId, "parentCategoryId should exist");
  assert.ok(paths.iconUrl, "iconUrl should exist");
  assert.ok(paths.imageUrl, "imageUrl should exist");
  assert.ok(paths.displayOrder, "displayOrder should exist");
  assert.ok(paths.metadata, "metadata should exist");

  const rootCat = new CategoryModel({
    name: "Team Sports",
    slug: "team-sports",
    iconUrl: "/icons/team.svg",
    displayOrder: 1,
  });

  assert.equal(rootCat.name, "Team Sports");
  assert.equal(rootCat.parentCategoryId, null);
  assert.equal(rootCat.isActive, true);
  assert.equal(rootCat.displayOrder, 1);
});

test("Round 1: ProductModel includes sports marketplace taxonomy and bulky equipment flag", () => {
  const paths = ProductModel.schema.paths;
  assert.ok(paths.sellerId, "sellerId path should exist");
  assert.ok(paths.sportType, "sportType path should exist");
  assert.ok(paths.gearCategory, "gearCategory path should exist");
  assert.ok(paths.brand, "brand path should exist");
  assert.ok(paths.skillLevel, "skillLevel path should exist");
  assert.ok(paths.isBulky, "isBulky path should exist");
  assert.ok(paths.specifications, "specifications path should exist");

  const gearCategories = paths.gearCategory.enumValues;
  assert.ok(gearCategories.includes("EQUIPMENT"));
  assert.ok(gearCategories.includes("APPAREL"));
  assert.ok(gearCategories.includes("PROTECTIVE"));

  const product = new ProductModel({
    categoryId: "cat-123",
    sellerId: "vendor-456",
    name: "Olympic 20kg Barbell",
    basePrice: 299,
    sku: "TEST-BARBELL-20KG",
    sportType: ["gym", "strength"],
    gearCategory: "EQUIPMENT",
    brand: "IronGrip",
    isBulky: true,
    specifications: { weightKg: 20, maxLoadKg: 700 },
  });

  assert.equal(product.isBulky, true);
  assert.equal(product.brand, "IronGrip");
  assert.equal(product.specifications.weightKg, 20);
});

test("Round 1: VariantModel tracks weightKg and sports variant attributes", () => {
  const paths = VariantModel.schema.paths;
  assert.ok(paths.weightKg, "weightKg path should exist");
  assert.ok(paths.attributes, "attributes path should exist");

  const variant = new VariantModel({
    productId: "prod-123",
    variantName: "Grip Size 3 (4 3/8)",
    sku: "TEST-RKT-G3",
    price: 249.99,
    weightKg: 0.32,
    attributes: { gripSize: "4 3/8", stringPattern: "16x19" },
  });

  assert.equal(variant.weightKg, 0.32);
  assert.equal(variant.attributes.gripSize, "4 3/8");
});

test("Round 1: requireRole middleware authorizes allowed roles and rejects unauthorized ones", async () => {
  const middleware = requireRole("ADMIN");

  // 1. Unauthenticated test
  let resStatus = null;
  let resJson = null;
  const mockRes = {
    status: (code) => {
      resStatus = code;
      return {
        json: (data) => {
          resJson = data;
        },
      };
    },
  };

  await middleware({}, mockRes, () => {});
  assert.equal(resStatus, 401);

  // 2. Forbidden test (User is CUSTOMER, endpoint requires ADMIN)
  const customerReq = {
    user: {
      userId: "user-1",
      email: "cust@sport.com",
      roles: ["CUSTOMER"],
    },
  };
  await middleware(customerReq, mockRes, () => {});
  assert.equal(resStatus, 403);
  assert.match(resJson.message, /Access denied/);

  // 3. Authorized test (User is ADMIN)
  let nextCalled = false;
  const adminReq = {
    user: {
      userId: "user-2",
      email: "admin@sport.com",
      roles: ["ADMIN"],
    },
  };
  await middleware(adminReq, mockRes, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});
