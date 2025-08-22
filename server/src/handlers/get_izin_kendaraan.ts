import { db } from '../db';
import { izinKendaraanTable } from '../db/schema';
import { type IzinKendaraan, type GetIzinByStatusInput, type GetIzinByDateRangeInput } from '../schema';
import { eq, and, gte, lte, SQL, desc } from 'drizzle-orm';

export async function getAllIzinKendaraan(): Promise<IzinKendaraan[]> {
  try {
    const results = await db.select()
      .from(izinKendaraanTable)
      .orderBy(desc(izinKendaraanTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get all izin kendaraan:', error);
    throw error;
  }
}

export async function getIzinKendaraanByStatus(input: GetIzinByStatusInput): Promise<IzinKendaraan[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    if (input.status) {
      conditions.push(eq(izinKendaraanTable.status, input.status));
    }

    if (input.nik) {
      conditions.push(eq(izinKendaraanTable.nik, input.nik));
    }

    // Build query without reassigning to avoid type issues
    const baseQuery = db.select().from(izinKendaraanTable);
    
    const results = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(izinKendaraanTable.created_at))
          .execute()
      : await baseQuery
          .orderBy(desc(izinKendaraanTable.created_at))
          .execute();
    
    return results;
  } catch (error) {
    console.error('Failed to get izin kendaraan by status:', error);
    throw error;
  }
}

export async function getIzinKendaraanByDateRange(input: GetIzinByDateRangeInput): Promise<IzinKendaraan[]> {
  try {
    // Apply date range filter using tanggal_berangkat
    const dateCondition = and(
      gte(izinKendaraanTable.tanggal_berangkat, input.start_date),
      lte(izinKendaraanTable.tanggal_berangkat, input.end_date)
    );

    const results = await db.select()
      .from(izinKendaraanTable)
      .where(dateCondition)
      .orderBy(desc(izinKendaraanTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get izin kendaraan by date range:', error);
    throw error;
  }
}

export async function getIzinKendaraanById(id: number): Promise<IzinKendaraan | null> {
  try {
    const results = await db.select()
      .from(izinKendaraanTable)
      .where(eq(izinKendaraanTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to get izin kendaraan by id:', error);
    throw error;
  }
}