import { mysqlTable, varchar, int, timestamp, boolean, text, serial, mysqlEnum, bigint, date, json } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const departments = mysqlTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  oauthProvider: mysqlEnum('oauth_provider', ['local', 'google', 'linkedin', 'microsoft']).default('local'),
  oauthId: varchar('oauth_id', { length: 255 }),
  emailVerifiedAt: timestamp('email_verified_at'),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  departmentId: bigint('department_id', { mode: 'number', unsigned: true }).references(() => departments.id),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const bookings = mysqlTable('bookings', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  date: date('date').notNull(),
  status: mysqlEnum('status', ['confirmed', 'pending', 'cancelled']).notNull().default('confirmed'),
  needsApproval: boolean('needs_approval').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const swapRequests = mysqlTable('swap_requests', {
  id: serial('id').primaryKey(),
  requesterId: bigint('requester_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  targetUserId: bigint('target_user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  requesterDate: date('requester_date').notNull(),
  targetDate: date('target_date').notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).notNull().default('pending'),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const appSettings = mysqlTable('app_settings', {
  id: serial('id').primaryKey(),
  maxBookingsPerDay: int('max_bookings_per_day').notNull().default(3),
  maxBookingsPerWeekPerUser: int('max_bookings_per_week_per_user').default(2),
  allowedDays: json('allowed_days').notNull().$type<number[]>().default([1, 2, 3, 4, 5]),
  requireApprovalForBookings: boolean('require_approval_for_bookings').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const adminAnnouncements = mysqlTable('admin_announcements', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const blockedDates = mysqlTable('blocked_dates', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

