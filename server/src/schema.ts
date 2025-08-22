import { z } from 'zod';

// Enum definitions
export const userRoleSchema = z.enum(['Karyawan', 'HR', 'Admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const izinStatusSchema = z.enum(['Pending', 'Disetujui', 'Ditolak']);
export type IzinStatus = z.infer<typeof izinStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  nik: z.string(),
  password: z.string(),
  name: z.string(),
  role: userRoleSchema,
  fcm_token: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// IzinKendaraan schema
export const izinKendaraanSchema = z.object({
  id: z.number(),
  nama_pemakai: z.string(),
  nik: z.string(),
  nama_sopir: z.string(),
  nomor_polisi: z.string(),
  tujuan: z.string(),
  tanggal_berangkat: z.coerce.date(),
  jam_berangkat: z.string(),
  tanggal_kembali: z.coerce.date(),
  jam_kembali: z.string(),
  keterangan: z.string().nullable(),
  status: izinStatusSchema,
  tanggal_persetujuan: z.coerce.date().nullable(),
  jam_persetujuan: z.string().nullable(),
  created_at: z.coerce.date()
});

export type IzinKendaraan = z.infer<typeof izinKendaraanSchema>;

// Input schemas for authentication
export const loginInputSchema = z.object({
  nik: z.string(),
  password: z.string(),
  fcm_token: z.string().optional()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResponseSchema = z.object({
  user: userSchema.omit({ password: true }),
  token: z.string()
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Input schema for creating izin kendaraan
export const createIzinKendaraanInputSchema = z.object({
  nama_pemakai: z.string(),
  nik: z.string(),
  nama_sopir: z.string(),
  nomor_polisi: z.string(),
  tujuan: z.string(),
  tanggal_berangkat: z.coerce.date(),
  jam_berangkat: z.string(),
  tanggal_kembali: z.coerce.date(),
  jam_kembali: z.string(),
  keterangan: z.string().nullable()
});

export type CreateIzinKendaraanInput = z.infer<typeof createIzinKendaraanInputSchema>;

// Input schema for updating izin status
export const updateIzinStatusInputSchema = z.object({
  id: z.number(),
  status: izinStatusSchema.exclude(['Pending']), // Only allow Disetujui or Ditolak
  tanggal_persetujuan: z.coerce.date(),
  jam_persetujuan: z.string()
});

export type UpdateIzinStatusInput = z.infer<typeof updateIzinStatusInputSchema>;

// Query schemas for filtering
export const getIzinByStatusInputSchema = z.object({
  status: izinStatusSchema.optional(),
  nik: z.string().optional()
});

export type GetIzinByStatusInput = z.infer<typeof getIzinByStatusInputSchema>;

export const getIzinByDateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  filter_type: z.enum(['today', 'this_week', 'this_month', 'custom']).optional()
});

export type GetIzinByDateRangeInput = z.infer<typeof getIzinByDateRangeInputSchema>;

// Export data schema
export const exportDataInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  format: z.enum(['xlsx']).default('xlsx')
});

export type ExportDataInput = z.infer<typeof exportDataInputSchema>;

export const exportDataResponseSchema = z.object({
  file_url: z.string(),
  file_name: z.string(),
  total_records: z.number()
});

export type ExportDataResponse = z.infer<typeof exportDataResponseSchema>;

// FCM notification schema
export const fcmNotificationInputSchema = z.object({
  user_id: z.number(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional()
});

export type FcmNotificationInput = z.infer<typeof fcmNotificationInputSchema>;