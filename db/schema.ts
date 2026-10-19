import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  experience: text("experience").notNull(),
  goal: text("goal").notNull().default(""),
  status: text("status").notNull().default("payment_pending"),
  orderId: text("order_id").unique(),
  paymentId: text("payment_id").unique(),
  amount: integer("amount").notNull().default(99900),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
});
