import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const restaurants = pgTable('restaurants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  cuisine: text('cuisine'),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  deliveryFee: integer('delivery_fee').notNull().default(0),
  imageUrl: text('image_url'),
  isOpen: boolean('is_open').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable('menu_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  fullName: text('full_name'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  cartMenuItemUnique: uniqueIndex('cart_items_cart_menu_item_idx').on(table.cartId, table.menuItemId),
}));

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method').notNull().default('cod'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  razorpayOrderId: text('razorpay_order_id').unique(),
  razorpayPaymentId: text('razorpay_payment_id').unique(),
  deliveryAddress: text('delivery_address').notNull(),
  phone: text('phone').notNull(),
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').notNull(),
  total: integer('total').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: integer('line_total').notNull(),
});
