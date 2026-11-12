# Express Backend API spec Overview

This API spec  is built strictly in accordance with the repository governance guidelines (Express, Node.js, MongoDB/Mongoose, Clean Architecture) and the e-commerce database entity relationship schema.

---

## 1. Authentication Routes (`/api/v1/auth`)

### 1.1 User Registration
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/auth/register`
* **Request Body Validation Schema**:
  ```json
  {
    "type": "object",
    "required": ["email", "password", "firstName", "lastName"],
    "properties": {
      "email": { "type": "string", "format": "email" },
      "password": { "type": "string", "minLength": 8 },
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "phoneNumber": { "type": "string" },
      "address": { "type": "string" },
      "city": { "type": "string" },
      "state": { "type": "string" },
      "postalCode": { "type": "string" },
      "country": { "type": "string" }
    }
  }
  ```
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+15551234567",
        "address": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "postalCode": "62701",
        "country": "USA",
        "isActive": true,
        "createdAt": "2026-10-27T13:00:00.000Z",
        "updatedAt": "2026-10-27T13:00:00.000Z"
      },
      "role": {
        "roleId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "roleType": "CUSTOMER",
        "assignedAt": "2026-10-27T13:00:00.000Z"
      }
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Email address user@example.com is already registered."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "An unexpected server error occurred during user registration."
    }
    ```

### 1.2 User Login
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/auth/login`
* **Request Body Validation Schema**:
  ```json
  {
    "type": "object",
    "required": ["email", "password"],
    "properties": {
      "email": { "type": "string", "format": "email" },
      "password": { "type": "string" }
    }
  }
  ```
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "isActive": true
      },
      "roles": [
        {
          "roleId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
          "roleType": "CUSTOMER",
          "assignedAt": "2026-10-27T13:00:00.000Z"
        }
      ]
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Invalid email or password format."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "An unexpected error occurred during login authentication."
    }
    ```

---

## 2. Product Catalog Browsing Routes (`/api/v1/categories`, `/api/v1/products`)

### 2.1 List Categories
* **HTTP Method**: `GET`
* **Route Path**: `/api/v1/categories`
* **Request Body Validation Schema**: N/A (Accepts optional query parameters: `isActive` [boolean], `parentCategoryId` [UUID string])
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "categories": [
        {
          "categoryId": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
          "name": "Electronics",
          "description": "Gadgets and electronic equipment",
          "slug": "electronics",
          "parentCategoryId": null,
          "isActive": true,
          "createdAt": "2026-10-27T10:00:00.000Z"
        }
      ]
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Invalid query parameter format for parentCategoryId."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Failed to retrieve category catalog."
    }
    ```

### 2.2 List Products
* **HTTP Method**: `GET`
* **Route Path**: `/api/v1/products`
* **Request Body Validation Schema**: N/A (Accepts optional query parameters: `categoryId` [UUID], `slug` [string], `page` [integer], `limit` [integer])
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "products": [
        {
          "productId": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
          "categoryId": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
          "name": "Wireless Headphones",
          "description": "Noise-canceling over-ear headphones",
          "longDescription": "High fidelity audio with up to 30 hours of battery life...",
          "basePrice": 199.99,
          "sku": "PROD-WIRELESS-HEADPHONES",
          "isActive": true,
          "createdAt": "2026-10-27T10:30:00.000Z",
          "updatedAt": "2026-10-27T10:30:00.000Z",
          "createdBy": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
        }
      ],
      "page": 1,
      "limit": 10,
      "total": 1
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Invalid query parameter page or limit."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Failed to retrieve products list."
    }
    ```

### 2.3 Get Product Details
* **HTTP Method**: `GET`
* **Route Path**: `/api/v1/products/:productId`
* **Request Body Validation Schema**: N/A
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "productId": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      "categoryId": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      "name": "Wireless Headphones",
      "description": "Noise-canceling over-ear headphones",
      "longDescription": "High fidelity audio with up to 30 hours of battery life...",
      "basePrice": 199.99,
      "sku": "PROD-WIRELESS-HEADPHONES",
      "isActive": true,
      "createdAt": "2026-10-27T10:30:00.000Z",
      "updatedAt": "2026-10-27T10:30:00.000Z",
      "createdBy": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "variants": [
        {
          "variantId": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
          "productId": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
          "variantName": "Matte Black",
          "sku": "VAR-HEADPHONES-BLK",
          "price": 199.99,
          "costPrice": 120.00,
          "attributes": { "color": "Black", "connectivity": "Bluetooth 5.2" },
          "createdAt": "2026-10-27T10:35:00.000Z",
          "updatedAt": "2026-10-27T10:35:00.000Z",
          "inventory": {
            "inventoryId": "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
            "quantityOnHand": 50,
            "quantityReserved": 5,
            "quantityAvailable": 45,
            "reorderLevel": 10,
            "reorderQuantity": 25,
            "warehouseLocation": "Aisle 4, Shelf B"
          }
        }
      ]
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Invalid product ID format."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Error retrieving product detail."
    }
    ```

---

## 3. Cart Mutation Routes (`/api/v1/cart`)

### 3.1 Get Active Cart
* **HTTP Method**: `GET`
* **Route Path**: `/api/v1/cart`
* **Request Body Validation Schema**: N/A (Requires Authorization Bearer Token)
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "cartId": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
      "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "totalItems": 2,
      "subtotalAmount": 399.98,
      "taxAmount": 32.00,
      "discountAmount": 0.00,
      "totalAmount": 431.98,
      "cartStatus": "ACTIVE",
      "createdAt": "2026-10-27T11:00:00.000Z",
      "updatedAt": "2026-10-27T11:05:00.000Z",
      "expiresAt": "2026-11-03T11:00:00.000Z",
      "items": [
        {
          "cartItemId": "22eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
          "cartId": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
          "variantId": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
          "quantity": 2,
          "unitPrice": 199.99,
          "lineTotal": 399.98,
          "addedAt": "2026-10-27T11:05:00.000Z",
          "updatedAt": "2026-10-27T11:05:00.000Z"
        }
      ]
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Authorization token missing or invalid."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Failed to fetch active shopping cart."
    }
    ```

### 3.2 Add Item to Cart
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/cart/items`
* **Request Body Validation Schema**:
  ```json
  {
    "type": "object",
    "required": ["variantId", "quantity"],
    "properties": {
      "variantId": { "type": "string", "format": "uuid" },
      "quantity": { "type": "integer", "minimum": 1 }
    }
  }
  ```
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "cart": {
        "cartId": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
        "totalItems": 2,
        "subtotalAmount": 399.98,
        "taxAmount": 32.00,
        "discountAmount": 0.00,
        "totalAmount": 431.98,
        "cartStatus": "ACTIVE",
        "updatedAt": "2026-10-27T11:05:00.000Z"
      },
      "addedItem": {
        "cartItemId": "22eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
        "cartId": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
        "variantId": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
        "quantity": 2,
        "unitPrice": 199.99,
        "lineTotal": 399.98,
        "addedAt": "2026-10-27T11:05:00.000Z",
        "updatedAt": "2026-10-27T11:05:00.000Z"
      }
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Requested quantity exceeds quantityAvailable in inventory."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Unable to add item to shopping cart."
    }
    ```

### 3.3 Update Cart Item Quantity
* **HTTP Method**: `PATCH`
* **Route Path**: `/api/v1/cart/items/:cartItemId`
* **Request Body Validation Schema**:
  ```json
  {
    "type": "object",
    "required": ["quantity"],
    "properties": {
      "quantity": { "type": "integer", "minimum": 1 }
    }
  }
  ```
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "cart": {
        "cartId": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
        "totalItems": 3,
        "subtotalAmount": 599.97,
        "taxAmount": 48.00,
        "discountAmount": 0.00,
        "totalAmount": 647.97,
        "updatedAt": "2026-10-27T11:10:00.000Z"
      },
      "updatedItem": {
        "cartItemId": "22eebc99-9c0b-4ef8-bb6d-6bb9bd380a88",
        "quantity": 3,
        "unitPrice": 199.99,
        "lineTotal": 599.97,
        "updatedAt": "2026-10-27T11:10:00.000Z"
      }
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Quantity must be an integer greater than zero."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Error updating cart item quantity."
    }
    ```

### 3.4 Remove Item from Cart
* **HTTP Method**: `DELETE`
* **Route Path**: `/api/v1/cart/items/:cartItemId`
* **Request Body Validation Schema**: N/A
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "success": true,
      "message": "Cart item successfully removed.",
      "cart": {
        "cartId": "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
        "totalItems": 0,
        "subtotalAmount": 0.00,
        "taxAmount": 0.00,
        "discountAmount": 0.00,
        "totalAmount": 0.00,
        "updatedAt": "2026-10-27T11:15:00.000Z"
      }
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Cart item with ID 22eebc99-9c0b-4ef8-bb6d-6bb9bd380a88 not found."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Error removing item from cart."
    }
    ```

---

## 4. Stripe Checkout Routes (`/api/v1/checkout`)

### 4.1 Create Payment Intent & Order Session
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/checkout/create-intent`
* **Request Body Validation Schema**:
  ```json
  {
    "type": "object",
    "required": ["cartId", "shippingAddress", "billingAddress", "shippingMethod", "paymentMethod"],
    "properties": {
      "cartId": { "type": "string", "format": "uuid" },
      "shippingAddress": { "type": "string" },
      "billingAddress": { "type": "string" },
      "shippingMethod": { "type": "string" },
      "paymentMethod": { 
        "type": "string", 
        "enum": ["CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "OTHER"] 
      }
    }
  }
  ```
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "order": {
        "orderId": "33eebc99-9c0b-4ef8-bb6d-6bb9bd380a99",
        "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "orderNumber": "ORD-20261027-001",
        "orderStatus": "PENDING",
        "subtotalAmount": 399.98,
        "taxAmount": 32.00,
        "shippingAmount": 10.00,
        "discountAmount": 0.00,
        "totalAmount": 441.98,
        "shippingAddress": "123 Main St, Springfield, IL 62701, USA",
        "billingAddress": "123 Main St, Springfield, IL 62701, USA",
        "shippingMethod": "Standard Ground",
        "orderDate": "2026-10-27T12:00:00.000Z",
        "createdAt": "2026-10-27T12:00:00.000Z"
      },
      "transaction": {
        "transactionId": "44eebc99-9c0b-4ef8-bb6d-6bb9bd380b00",
        "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "orderId": "33eebc99-9c0b-4ef8-bb6d-6bb9bd380a99",
        "transactionType": "PAYMENT",
        "paymentMethod": "CREDIT_CARD",
        "amount": 441.98,
        "transactionStatus": "PENDING",
        "referenceId": "pi_3Mtw42LkdIwHu7ix08a2k1A3",
        "createdAt": "2026-10-27T12:00:00.000Z"
      },
      "clientSecret": "pi_3Mtw42LkdIwHu7ix08a2k1A3_secret_q1w2e3r4t5y6u7i8o9p0"
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Cart status is not ACTIVE or totalItems is 0."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Failed to create Stripe payment intent."
    }
    ```

### 4.2 Stripe Webhook Event Handler
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/checkout/webhook`
* **Request Body Validation Schema**:
  ```json
  {
    "type": "object",
    "required": ["id", "type", "data"],
    "properties": {
      "id": { "type": "string" },
      "type": { "type": "string" },
      "data": {
        "type": "object",
        "required": ["object"],
        "properties": {
          "object": {
            "type": "object",
            "required": ["id", "amount", "status", "metadata"],
            "properties": {
              "id": { "type": "string" },
              "amount": { "type": "integer" },
              "status": { "type": "string" },
              "metadata": {
                "type": "object",
                "required": ["orderId", "userId"],
                "properties": {
                  "orderId": { "type": "string", "format": "uuid" },
                  "userId": { "type": "string", "format": "uuid" }
                }
              }
            }
          }
        }
      }
    }
  }
  ```
* **Server Responses**:
  * **200 OK**:
    ```json
    {
      "received": true,
      "orderId": "33eebc99-9c0b-4ef8-bb6d-6bb9bd380a99",
      "orderStatus": "CONFIRMED",
      "cartStatus": "CONVERTED",
      "transactionStatus": "COMPLETED"
    }
    ```
  * **400 Bad Request**:
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Invalid Stripe webhook signature or payload schema."
    }
    ```
  * **500 Internal Server Error**:
    ```json
    {
      "status": 500,
      "error": "Internal Server Error",
      "message": "Error processing webhook event and updating database state."
    }
    ```


---

## 5. Sports Materials Marketplace Extensions (Rounds 1–5)

### 5.1 Seller Registration (`/api/v1/auth/register-seller`)
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/auth/register-seller`
* **Access**: Public
* **Payload**:
  ```json
  {
    "email": "vendor@sportmarket.com",
    "password": "Password123!",
    "firstName": "David",
    "lastName": "Sterling",
    "storeName": "Apex Athletic Gear",
    "sportsSpecialization": ["football", "running", "boxing"],
    "contactPhone": "+12025550188"
  }
  ```
* **Responses**: `201 Created` with JWT token and vendor profile; `400 Bad Request` on duplicate or validation error.

---

### 5.2 Dynamic Admin Categories (`/api/v1/admin/categories`)
* **Access**: Restricted (`ADMIN` role)
* `GET /api/v1/admin/categories`: Retrieve complete hierarchy with active/inactive status and display orders.
* `POST /api/v1/admin/categories`: Dynamically create root or child sports categories (`name`, `slug`, `parentCategoryId`, `iconUrl`, `displayOrder`).
* `PUT /api/v1/admin/categories/:categoryId`: Update category details and hierarchy.
* `DELETE /api/v1/admin/categories/:categoryId`: Safely deactivate or remove category.

---

### 5.3 Advanced Faceted Search & Facets (`/api/v1/products`, `/api/v1/facets`)
* **GET `/api/v1/facets`**: Aggregates available sports categories, brands, gear categories, and price ranges.
* **GET `/api/v1/products`**:
  * Query parameters:
    * `search`: Text query across name, brand, description, and sport tags.
    * `sport`: Filter by sport(s) (comma-separated, e.g. `tennis,badminton`).
    * `gearCategory`: `EQUIPMENT`, `APPAREL`, `FOOTWEAR`, `PROTECTIVE`, `ACCESSORY`.
    * `brand`: Case-insensitive brand filter.
    * `skillLevel`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `PROFESSIONAL`, `ALL`.
    * `isBulky`: `true` / `false` (freight equipment vs standard parcels).
    * `minPrice`, `maxPrice`: Numeric price range boundaries.
    * `inStockOnly`: `true` to filter items with available inventory.
    * `sort`: `price_asc`, `price_desc`, `rating_desc`, `newest`.
    * `page`, `limit`: Pagination parameters.

---

### 5.4 Vendor Self-Service Catalog & Inventory (`/api/v1/vendor`)
* **Access**: Restricted (`SELLER` or `ADMIN` role)
* `POST /api/v1/vendor/products`: Create sports equipment, variants, and initial inventory atomically.
* `GET /api/v1/vendor/products`: View vendor's catalog with embedded variants and stock quantities.
* `GET /api/v1/vendor/products/:productId`: Detailed product view (ownership verified).
* `PUT /api/v1/vendor/products/:productId`: Update specifications, images, and prices.
* `DELETE /api/v1/vendor/products/:productId`: Soft-deactivate product.
* `PATCH /api/v1/vendor/inventory/:variantId`: Adjust stock quantities (delta or absolute), reorder levels, and warehouse bays.

---

### 5.5 Multi-Vendor Cart, Shipping & Coupons (`/api/v1/cart`)
* **GET `/api/v1/cart`**: Returns enriched items grouped by vendor (`vendorGroups`), individual vendor delivery subtotals, bulky freight classification, and calculated tax/discounts.
* **POST `/api/v1/cart/items`**: Add variant to cart with live inventory verification.
* **POST `/api/v1/cart/coupon`**: Apply promo coupon (`SPORT10`, `FREESHIP`, `FITNESS25`).
* **DELETE `/api/v1/cart/coupon`**: Remove applied coupon.
* **POST `/api/v1/cart/reserve`**: Temporarily reserve inventory for 15 minutes during checkout.
* **DELETE `/api/v1/cart/reserve/:reservationId`**: Manually release reservation.

---

### 5.6 Checkout & Order Splitting (`/api/v1/checkout/process`)
* **HTTP Method**: `POST`
* **Route Path**: `/api/v1/checkout/process`
* **Payload**:
  ```json
  {
    "shippingAddress": { "street": "456 Stadium Way", "city": "Denver", "country": "USA" },
    "paymentMethod": "CREDIT_CARD",
    "idempotencyKey": "uniq_order_key_884930",
    "reservationId": "optional-reservation-uuid"
  }
  ```
* **Behavior**:
  1. Checks `idempotencyKey` in transaction ledger to prevent double-charging.
  2. Permanently commits inventory.
  3. Creates Master Order and splits items into isolated `VendorSubOrder` packages.
  4. Deducts marketplace commission and computes net vendor payouts.
  5. Clears active cart.

---

### 5.7 Multi-Package Tracking & Vendor Fulfillment
* **GET `/api/v1/orders/:orderId/track`**: Buyer dashboard tracking multiple packages, carriers, and dispatch timelines.
* **GET `/api/v1/vendor/orders`**: Vendor lists incoming orders assigned to their store.
* **PATCH `/api/v1/vendor/orders/:subOrderId/status`**: Vendor updates fulfillment status (`CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`) and attaches carrier & tracking number. Rolls up master order status automatically.
* **GET `/api/v1/vendor/settlements`**: Vendor financial ledger tracking gross revenue, marketplace commissions, settled earnings, and pending balances.

---

### 5.8 Sports Equipment Reviews & Ratings (`/api/v1/products/:productId/reviews`)
* **GET `/api/v1/products/:productId/reviews`**: Public endpoint returning paginated reviews, rating distribution histogram, and sports metrics averages (`durability`, `comfort`, `performance`, `valueForMoney`).
* **POST `/api/v1/products/:productId/reviews`**: Verified buyer review submission, auto-recalculating product rating cache.
