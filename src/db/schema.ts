import {
  mysqlTable,
  int,
  bigint,
  varchar,
  text,
  decimal,
  boolean,
  datetime,
  mysqlEnum,
  index,
  uniqueIndex,
  timestamp,
} from "drizzle-orm/mysql-core";

import { sql, relations } from "drizzle-orm";

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
| Authentication and application-level user accounts.
|
| Roles:
| ADMIN    - Full system access
| EMPLOYEE - Product viewing + customer enquiry access
|--------------------------------------------------------------------------
*/

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    userCode: varchar("user_code", { length: 50 }).notNull(),

    name: varchar("name", { length: 150 }).notNull(),

    email: varchar("email", { length: 255 }),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    role: mysqlEnum("role", ["ADMIN", "EMPLOYEE"])
      .notNull()
      .default("EMPLOYEE"),

    isActive: boolean("is_active").notNull().default(true),

    lastLoginAt: datetime("last_login_at"),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userCodeUnique: uniqueIndex("users_user_code_unique").on(table.userCode),

    emailUnique: uniqueIndex("users_email_unique").on(table.email),

    roleIndex: index("users_role_idx").on(table.role),

    activeIndex: index("users_active_idx").on(table.isActive),
  }),
);


/*
|--------------------------------------------------------------------------
| EMPLOYEES
|--------------------------------------------------------------------------
| Additional employee information.
|
| Each employee belongs to one user account.
|--------------------------------------------------------------------------
*/

export const employees = mysqlTable(
  "employees",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    employeeCode: varchar("employee_code", { length: 50 }).notNull(),

    phone: varchar("phone", { length: 30 }),

    designation: varchar("designation", { length: 100 }),

    joiningDate: datetime("joining_date"),

    address: text("address"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userUnique: uniqueIndex("employees_user_unique").on(table.userId),

    employeeCodeUnique: uniqueIndex(
      "employees_employee_code_unique",
    ).on(table.employeeCode),

    activeIndex: index("employees_active_idx").on(table.isActive),
  }),
);


/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

export const categories = mysqlTable(
  "categories",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    categoryCode: varchar("category_code", { length: 50 }).notNull(),

    name: varchar("name", { length: 150 }).notNull(),

    description: text("description"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    categoryCodeUnique: uniqueIndex(
      "categories_category_code_unique",
    ).on(table.categoryCode),

    nameIndex: index("categories_name_idx").on(table.name),

    activeIndex: index("categories_active_idx").on(table.isActive),
  }),
);


/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
| currentStock is the current available quantity.
|
| inventory_transactions keeps the complete stock movement history.
|--------------------------------------------------------------------------
*/

export const products = mysqlTable(
  "products",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    productCode: varchar("product_code", { length: 50 }).notNull(),

    name: varchar("name", { length: 200 }).notNull(),

    description: text("description"),

    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    unit: varchar("unit", { length: 30 }).notNull().default("Piece"),

    currentStock: int("current_stock").notNull().default(0),

    minimumStockLevel: int("minimum_stock_level").notNull().default(0),

    purchasePrice: decimal("purchase_price", {
      precision: 12,
      scale: 2,
    }),

    sellingPrice: decimal("selling_price", {
      precision: 12,
      scale: 2,
    }),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    productCodeUnique: uniqueIndex(
      "products_product_code_unique",
    ).on(table.productCode),

    nameIndex: index("products_name_idx").on(table.name),

    categoryIndex: index("products_category_idx").on(table.categoryId),

    stockIndex: index("products_stock_idx").on(table.currentStock),

    activeIndex: index("products_active_idx").on(table.isActive),
  }),
);


/*
|--------------------------------------------------------------------------
| CUSTOMERS
|--------------------------------------------------------------------------
*/

export const customers = mysqlTable(
  "customers",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    customerCode: varchar("customer_code", { length: 50 }).notNull(),

    name: varchar("name", { length: 150 }).notNull(),

    mobile: varchar("mobile", { length: 30 }),

    email: varchar("email", { length: 255 }),

    address: text("address"),

    remarks: text("remarks"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    customerCodeUnique: uniqueIndex(
      "customers_customer_code_unique",
    ).on(table.customerCode),

    mobileIndex: index("customers_mobile_idx").on(table.mobile),

    nameIndex: index("customers_name_idx").on(table.name),
  }),
);


/*
|--------------------------------------------------------------------------
| CUSTOMER ENQUIRIES
|--------------------------------------------------------------------------
| Created by employees or administrators.
|
| IMPORTANT:
| Creating an enquiry DOES NOT reduce stock.
|
| An enquiry may later be converted into a sale by an ADMIN.
|--------------------------------------------------------------------------
*/

export const customerEnquiries = mysqlTable(
  "customer_enquiries",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    enquiryCode: varchar("enquiry_code", { length: 50 }).notNull(),

    customerId: bigint("customer_id", { mode: "number" })
      .notNull()
      .references(() => customers.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    requiredQuantity: int("required_quantity").notNull(),

    expectedPurchaseDate: datetime("expected_purchase_date"),

    remarks: text("remarks"),

    status: mysqlEnum("status", [
      "NEW",
      "CONTACTED",
      "FOLLOW_UP",
      "CONVERTED",
      "LOST",
      "CANCELLED",
    ])
      .notNull()
      .default("NEW"),

    submittedByUserId: bigint("submitted_by_user_id", {
      mode: "number",
    })
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    enquiryCodeUnique: uniqueIndex(
      "enquiries_enquiry_code_unique",
    ).on(table.enquiryCode),

    customerIndex: index("enquiries_customer_idx").on(table.customerId),

    productIndex: index("enquiries_product_idx").on(table.productId),

    submittedByIndex: index(
      "enquiries_submitted_by_idx",
    ).on(table.submittedByUserId),

    statusIndex: index("enquiries_status_idx").on(table.status),

    createdAtIndex: index("enquiries_created_at_idx").on(table.createdAt),
  }),
);


/*
|--------------------------------------------------------------------------
| SALES
|--------------------------------------------------------------------------
| ADMIN ONLY.
|
| Two sources:
|
| DIRECT
|   Customer → Admin → Sale
|
| ENQUIRY
|   Employee → Enquiry → Admin → Sale
|--------------------------------------------------------------------------
*/

export const sales = mysqlTable(
  "sales",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    saleCode: varchar("sale_code", { length: 50 }).notNull(),

    customerId: bigint("customer_id", { mode: "number" })
      .notNull()
      .references(() => customers.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    source: mysqlEnum("source", ["DIRECT", "ENQUIRY"])
      .notNull()
      .default("DIRECT"),

    enquiryId: bigint("enquiry_id", { mode: "number" }).references(
      () => customerEnquiries.id,
      {
        onDelete: "restrict",
        onUpdate: "cascade",
      },
    ),

    saleDate: datetime("sale_date").notNull().default(sql`CURRENT_TIMESTAMP`),

    totalAmount: decimal("total_amount", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0.00"),

    paymentStatus: mysqlEnum("payment_status", [
      "PENDING",
      "PARTIAL",
      "PAID",
      "CANCELLED",
    ])
      .notNull()
      .default("PENDING"),

    remarks: text("remarks"),

    createdByUserId: bigint("created_by_user_id", {
      mode: "number",
    })
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    saleCodeUnique: uniqueIndex(
      "sales_sale_code_unique",
    ).on(table.saleCode),

    enquiryUnique: uniqueIndex(
      "sales_enquiry_unique",
    ).on(table.enquiryId),

    customerIndex: index("sales_customer_idx").on(table.customerId),

    sourceIndex: index("sales_source_idx").on(table.source),

    saleDateIndex: index("sales_date_idx").on(table.saleDate),

    paymentStatusIndex: index(
      "sales_payment_status_idx",
    ).on(table.paymentStatus),

    createdByIndex: index(
      "sales_created_by_idx",
    ).on(table.createdByUserId),
  }),
);


/*
|--------------------------------------------------------------------------
| SALE ITEMS
|--------------------------------------------------------------------------
| A sale may contain multiple products.
|--------------------------------------------------------------------------
*/

export const saleItems = mysqlTable(
  "sale_items",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    saleId: bigint("sale_id", { mode: "number" })
      .notNull()
      .references(() => sales.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    quantity: int("quantity").notNull(),

    unitPrice: decimal("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    lineTotal: decimal("line_total", {
      precision: 14,
      scale: 2,
    }).notNull(),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    saleIndex: index("sale_items_sale_idx").on(table.saleId),

    productIndex: index("sale_items_product_idx").on(table.productId),
  }),
);


/*
|--------------------------------------------------------------------------
| INVENTORY TRANSACTIONS
|--------------------------------------------------------------------------
| Complete stock movement ledger.
|
| Every stock-changing operation should create a transaction.
|
| Examples:
|
| OPENING       +100
| PURCHASE       +50
| SALE           -20
| DAMAGE          -2
| ADJUSTMENT_IN   +5
| ADJUSTMENT_OUT  -5
| RETURN_IN       +3
| RETURN_OUT      -2
|--------------------------------------------------------------------------
*/

export const inventoryTransactions = mysqlTable(
  "inventory_transactions",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    transactionCode: varchar("transaction_code", {
      length: 50,
    }).notNull(),

    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    transactionType: mysqlEnum("transaction_type", [
      "OPENING",
      "PURCHASE",
      "SALE",
      "DAMAGE",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "RETURN_IN",
      "RETURN_OUT",
    ]).notNull(),

    quantity: int("quantity").notNull(),

    previousBalance: int("previous_balance").notNull(),

    newBalance: int("new_balance").notNull(),

    saleId: bigint("sale_id", { mode: "number" }).references(
      () => sales.id,
      {
        onDelete: "restrict",
        onUpdate: "cascade",
      },
    ),

    saleItemId: bigint("sale_item_id", { mode: "number" }).references(
      () => saleItems.id,
      {
        onDelete: "restrict",
        onUpdate: "cascade",
      },
    ),

    performedByUserId: bigint("performed_by_user_id", {
      mode: "number",
    })
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    remarks: text("remarks"),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    transactionCodeUnique: uniqueIndex(
      "inventory_transaction_code_unique",
    ).on(table.transactionCode),

    productIndex: index(
      "inventory_transactions_product_idx",
    ).on(table.productId),

    typeIndex: index(
      "inventory_transactions_type_idx",
    ).on(table.transactionType),

    saleIndex: index(
      "inventory_transactions_sale_idx",
    ).on(table.saleId),

    performedByIndex: index(
      "inventory_transactions_performed_by_idx",
    ).on(table.performedByUserId),

    createdAtIndex: index(
      "inventory_transactions_created_at_idx",
    ).on(table.createdAt),
  }),
);


/*
|--------------------------------------------------------------------------
| ACTIVITY LOGS
|--------------------------------------------------------------------------
| Tracks important administrative/system actions.
|--------------------------------------------------------------------------
*/

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),

    userId: bigint("user_id", { mode: "number" }).references(
      () => users.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),

    action: varchar("action", { length: 100 }).notNull(),

    entityType: varchar("entity_type", { length: 100 }),

    entityId: varchar("entity_id", { length: 100 }),

    description: text("description"),

    metadata: text("metadata"),

    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIndex: index("activity_logs_user_idx").on(table.userId),

    actionIndex: index("activity_logs_action_idx").on(table.action),

    entityIndex: index(
      "activity_logs_entity_idx",
    ).on(table.entityType, table.entityId),

    createdAtIndex: index(
      "activity_logs_created_at_idx",
    ).on(table.createdAt),
  }),
);


/*
|--------------------------------------------------------------------------
| RELATIONS
|--------------------------------------------------------------------------
*/

/* USERS */

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),

  enquiries: many(customerEnquiries),

  sales: many(sales),

  inventoryTransactions: many(inventoryTransactions),

  activityLogs: many(activityLogs),
}));


/* EMPLOYEES */

export const employeesRelations = relations(
  employees,
  ({ one }) => ({
    user: one(users, {
      fields: [employees.userId],
      references: [users.id],
    }),
  }),
);


/* CATEGORIES */

export const categoriesRelations = relations(
  categories,
  ({ many }) => ({
    products: many(products),
  }),
);


/* PRODUCTS */

export const productsRelations = relations(
  products,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [products.categoryId],
      references: [categories.id],
    }),

    enquiries: many(customerEnquiries),

    saleItems: many(saleItems),

    inventoryTransactions: many(inventoryTransactions),
  }),
);


/* CUSTOMERS */

export const customersRelations = relations(
  customers,
  ({ many }) => ({
    enquiries: many(customerEnquiries),

    sales: many(sales),
  }),
);


/* CUSTOMER ENQUIRIES */

export const customerEnquiriesRelations = relations(
  customerEnquiries,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [customerEnquiries.customerId],
      references: [customers.id],
    }),

    product: one(products, {
      fields: [customerEnquiries.productId],
      references: [products.id],
    }),

    submittedBy: one(users, {
      fields: [customerEnquiries.submittedByUserId],
      references: [users.id],
    }),

    sales: many(sales),
  }),
);


/* SALES */

export const salesRelations = relations(
  sales,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [sales.customerId],
      references: [customers.id],
    }),

    enquiry: one(customerEnquiries, {
      fields: [sales.enquiryId],
      references: [customerEnquiries.id],
    }),

    createdBy: one(users, {
      fields: [sales.createdByUserId],
      references: [users.id],
    }),

    items: many(saleItems),

    inventoryTransactions: many(inventoryTransactions),
  }),
);


/* SALE ITEMS */

export const saleItemsRelations = relations(
  saleItems,
  ({ one, many }) => ({
    sale: one(sales, {
      fields: [saleItems.saleId],
      references: [sales.id],
    }),

    product: one(products, {
      fields: [saleItems.productId],
      references: [products.id],
    }),

    inventoryTransactions: many(inventoryTransactions),
  }),
);


/* INVENTORY TRANSACTIONS */

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryTransactions.productId],
      references: [products.id],
    }),

    sale: one(sales, {
      fields: [inventoryTransactions.saleId],
      references: [sales.id],
    }),

    saleItem: one(saleItems, {
      fields: [inventoryTransactions.saleItemId],
      references: [saleItems.id],
    }),

    performedBy: one(users, {
      fields: [inventoryTransactions.performedByUserId],
      references: [users.id],
    }),
  }),
);


/* ACTIVITY LOGS */

export const activityLogsRelations = relations(
  activityLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [activityLogs.userId],
      references: [users.id],
    }),
  }),
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),

    userId: int("user_id").notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);