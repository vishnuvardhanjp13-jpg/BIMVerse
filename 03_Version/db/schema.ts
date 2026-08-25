import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const deliveryOrders = sqliteTable("delivery_orders", {
  id: text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull(),
  customerEmail: text("customer_email").notNull(),
  productKey: text("product_key").notNull(),
  objectKey: text("object_key").notNull(),
  downloadToken: text("download_token").notNull(),
  expiresAt: integer("expires_at").notNull(),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_delivery_orders_stripe_session").on(table.stripeSessionId),
  uniqueIndex("idx_delivery_orders_download_token").on(table.downloadToken),
]);

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(), userId: text("user_id"), email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"), stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull(), currentPeriodEnd: integer("current_period_end"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
});

export const bepDrafts = sqliteTable("bep_drafts", {
  userId: text("user_id").primaryKey(), dataJson: text("data_json").notNull(),
  completion: integer("completion").notNull().default(0), createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
