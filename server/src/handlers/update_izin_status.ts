import { db } from '../db';
import { izinKendaraanTable, usersTable } from '../db/schema';
import { type UpdateIzinStatusInput, type IzinKendaraan } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateIzinStatus(input: UpdateIzinStatusInput, hrUserId: number): Promise<IzinKendaraan> {
  try {
    // First, verify that the HR user exists and has appropriate role
    const hrUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, hrUserId))
      .execute();

    if (hrUser.length === 0) {
      throw new Error('HR user not found');
    }

    if (hrUser[0].role !== 'HR' && hrUser[0].role !== 'Admin') {
      throw new Error('Insufficient permissions. Only HR or Admin users can update izin status');
    }

    // Check if the izin kendaraan exists and is in pending status
    const existingIzin = await db.select()
      .from(izinKendaraanTable)
      .where(eq(izinKendaraanTable.id, input.id))
      .execute();

    if (existingIzin.length === 0) {
      throw new Error('Izin kendaraan not found');
    }

    if (existingIzin[0].status !== 'Pending') {
      throw new Error('Cannot update status. Izin is not in pending status');
    }

    // Update the izin status with approval information
    const result = await db.update(izinKendaraanTable)
      .set({
        status: input.status,
        tanggal_persetujuan: input.tanggal_persetujuan,
        jam_persetujuan: input.jam_persetujuan
      })
      .where(eq(izinKendaraanTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to update izin status');
    }

    // TODO: In a real implementation, here we would trigger FCM notification
    // to notify the requester about the status change
    console.log(`Izin ${input.id} status updated to ${input.status} by HR user ${hrUserId}`);

    return result[0];
  } catch (error) {
    console.error('Update izin status failed:', error);
    throw error;
  }
}