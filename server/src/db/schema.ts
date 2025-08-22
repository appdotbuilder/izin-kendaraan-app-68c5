import { serial, text, pgTable, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['Karyawan', 'HR', 'Admin']);
export const izinStatusEnum = pgEnum('izin_status', ['Pending', 'Disetujui', 'Ditolak']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  nik: text('nik').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  fcm_token: text('fcm_token'), // Nullable for optional FCM token
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Izin Kendaraan table
export const izinKendaraanTable = pgTable('izin_kendaraan', {
  id: serial('id').primaryKey(),
  nama_pemakai: text('nama_pemakai').notNull(),
  nik: text('nik').notNull(),
  nama_sopir: text('nama_sopir').notNull(),
  nomor_polisi: text('nomor_polisi').notNull(),
  tujuan: text('tujuan').notNull(),
  tanggal_berangkat: timestamp('tanggal_berangkat', { mode: 'date' }).notNull(),
  jam_berangkat: text('jam_berangkat').notNull(), // Store time as text (HH:MM format)
  tanggal_kembali: timestamp('tanggal_kembali', { mode: 'date' }).notNull(),
  jam_kembali: text('jam_kembali').notNull(), // Store time as text (HH:MM format)
  keterangan: text('keterangan'), // Nullable for optional remarks
  status: izinStatusEnum('status').notNull().default('Pending'),
  tanggal_persetujuan: timestamp('tanggal_persetujuan', { mode: 'date' }), // Nullable until approved/rejected
  jam_persetujuan: text('jam_persetujuan'), // Nullable until approved/rejected
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type IzinKendaraan = typeof izinKendaraanTable.$inferSelect;
export type NewIzinKendaraan = typeof izinKendaraanTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  izinKendaraan: izinKendaraanTable 
};