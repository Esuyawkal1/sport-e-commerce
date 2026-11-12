erDiagram
  USERS ||--o{ TRANSACTIONS : "settledBy ||--o{ ROLES : has}}
  USERS ||--o{ SHOPPING_CARTS : owns
  USERS ||--o{ ORDERS : places
  USERS ||--o{ TRANSACTIONS : initiates
  PRODUCTS ||--o{ PRODUCT_VARIANTS : contains
  PRODUCTS ||--o{ CATEGORIES : belongsTo
  PRODUCTS ||--o{ INVENTORY : tracks
  SHOPPING_CARTS ||--o{ CART_ITEMS : contains
  CART_ITEMS ||--o{ PRODUCT_VARIANTS : references
  ORDERS ||--o{ ORDER_ITEMS : contains
  ORDER_ITEMS ||--o{ PRODUCT_VARIANTS : includes
  ORDERS ||"

  USERS {
    UUID userId PK
    STRING email UK
    STRING passwordHash
    STRING firstName
    STRING lastName
    STRING phoneNumber
    TEXT address
    STRING city
    STRING state
    STRING postalCode
    STRING country
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
    BOOLEAN isActive
  }

  ROLES {
    UUID roleId PK
    UUID userId FK
    ENUM roleType "ADMIN, CUSTOMER"
    TIMESTAMP assignedAt
    TIMESTAMP revokedAt
  }

  CATEGORIES {
    UUID categoryId PK
    STRING name UK
    TEXT description
    STRING slug UK
    UUID parentCategoryId FK "nullable"
    BOOLEAN isActive
    TIMESTAMP createdAt
  }

  PRODUCTS {
    UUID productId PK
    UUID categoryId FK
    STRING name
    TEXT description
    TEXT longDescription
    DECIMAL basePrice
    STRING sku UK
    BOOLEAN isActive
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
    UUID createdBy FK "Users.userId"
  }

  PRODUCT_VARIANTS {
    UUID variantId PK
    UUID productId FK
    STRING variantName
    STRING sku UK
    DECIMAL price
    DECIMAL costPrice
    TEXT attributes "JSON object"
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
  }

  INVENTORY {
    UUID inventoryId PK
    UUID variantId FK, UK
    INT quantityOnHand
    INT quantityReserved
    INT quantityAvailable "calculated"
    INT reorderLevel
    INT reorderQuantity
    STRING warehouseLocation
    TIMESTAMP lastCountedAt
    TIMESTAMP updatedAt
  }

  SHOPPING_CARTS {
    UUID cartId PK
    UUID userId FK, UK
    INT totalItems
    DECIMAL subtotalAmount
    DECIMAL taxAmount
    DECIMAL discountAmount
    DECIMAL totalAmount
    STRING cartStatus "ACTIVE, ABANDONED, CONVERTED"
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
    TIMESTAMP expiresAt
  }

  CART_ITEMS {
    UUID cartItemId PK
    UUID cartId FK
    UUID variantId FK
    INT quantity
    DECIMAL unitPrice
    DECIMAL lineTotal
    TIMESTAMP addedAt
    TIMESTAMP updatedAt
  }

  ORDERS {
    UUID orderId PK
    UUID userId FK
    STRING orderNumber UK
    ENUM orderStatus "PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED"
    DECIMAL subtotalAmount
    DECIMAL taxAmount
    DECIMAL shippingAmount
    DECIMAL discountAmount
    DECIMAL totalAmount
    TEXT shippingAddress
    TEXT billingAddress
    STRING shippingMethod
    STRING trackingNumber
    TIMESTAMP orderDate
    TIMESTAMP estimatedDeliveryDate
    TIMESTAMP actualDeliveryDate
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
  }

  ORDER_ITEMS {
    UUID orderItemId PK
    UUID orderId FK
    UUID variantId FK
    INT quantity
    DECIMAL unitPrice
    DECIMAL lineTotal
    ENUM itemStatus "PENDING, SHIPPED, DELIVERED, CANCELLED, RETURNED"
    TIMESTAMP createdAt
  }

  TRANSACTIONS {
    UUID transactionId PK
    UUID userId FK
    UUID orderId FK "nullable"
    ENUM transactionType "PAYMENT, REFUND, ADJUSTMENT"
    ENUM paymentMethod "CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, OTHER"
    DECIMAL amount
    ENUM transactionStatus "PENDING, COMPLETED, FAILED, REVERSED"
    STRING referenceId "3rd party gateway ID"
    TEXT notes
    TIMESTAMP transactionDate
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
  }