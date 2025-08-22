import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, izinKendaraanTable } from '../db/schema';
import { type UpdateIzinStatusInput } from '../schema';
import { updateIzinStatus } from '../handlers/update_izin_status';
import { eq } from 'drizzle-orm';

describe('updateIzinStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let hrUserId: number;
  let adminUserId: number;
  let karyawanUserId: number;
  let pendingIzinId: number;
  let approvedIzinId: number;

  beforeEach(async () => {
    // Create test users with different roles
    const hrUser = await db.insert(usersTable)
      .values({
        nik: '1234567890123456',
        password: 'hashedpassword',
        name: 'HR User',
        role: 'HR',
        fcm_token: 'hr_fcm_token'
      })
      .returning()
      .execute();
    hrUserId = hrUser[0].id;

    const adminUser = await db.insert(usersTable)
      .values({
        nik: '2234567890123456',
        password: 'hashedpassword',
        name: 'Admin User',
        role: 'Admin',
        fcm_token: 'admin_fcm_token'
      })
      .returning()
      .execute();
    adminUserId = adminUser[0].id;

    const karyawanUser = await db.insert(usersTable)
      .values({
        nik: '3234567890123456',
        password: 'hashedpassword',
        name: 'Karyawan User',
        role: 'Karyawan',
        fcm_token: 'karyawan_fcm_token'
      })
      .returning()
      .execute();
    karyawanUserId = karyawanUser[0].id;

    // Create test izin kendaraan records
    const pendingIzin = await db.insert(izinKendaraanTable)
      .values({
        nama_pemakai: 'Test User',
        nik: '1234567890123456',
        nama_sopir: 'Driver Name',
        nomor_polisi: 'B 1234 ABC',
        tujuan: 'Jakarta',
        tanggal_berangkat: new Date('2024-02-15'),
        jam_berangkat: '08:00',
        tanggal_kembali: new Date('2024-02-15'),
        jam_kembali: '17:00',
        keterangan: 'Business trip',
        status: 'Pending'
      })
      .returning()
      .execute();
    pendingIzinId = pendingIzin[0].id;

    const approvedIzin = await db.insert(izinKendaraanTable)
      .values({
        nama_pemakai: 'Another User',
        nik: '2234567890123456',
        nama_sopir: 'Another Driver',
        nomor_polisi: 'B 5678 DEF',
        tujuan: 'Bandung',
        tanggal_berangkat: new Date('2024-02-16'),
        jam_berangkat: '09:00',
        tanggal_kembali: new Date('2024-02-16'),
        jam_kembali: '18:00',
        keterangan: null,
        status: 'Disetujui',
        tanggal_persetujuan: new Date('2024-02-14'),
        jam_persetujuan: '14:30'
      })
      .returning()
      .execute();
    approvedIzinId = approvedIzin[0].id;
  });

  const testUpdateInput: UpdateIzinStatusInput = {
    id: 0, // Will be set in each test
    status: 'Disetujui',
    tanggal_persetujuan: new Date('2024-02-15'),
    jam_persetujuan: '10:30'
  };

  it('should update izin status by HR user successfully', async () => {
    const input = { ...testUpdateInput, id: pendingIzinId };
    
    const result = await updateIzinStatus(input, hrUserId);

    expect(result.id).toEqual(pendingIzinId);
    expect(result.status).toEqual('Disetujui');
    expect(result.tanggal_persetujuan).toEqual(new Date('2024-02-15'));
    expect(result.jam_persetujuan).toEqual('10:30');
    expect(result.nama_pemakai).toEqual('Test User');
    expect(result.nik).toEqual('1234567890123456');
  });

  it('should update izin status by Admin user successfully', async () => {
    const input = { ...testUpdateInput, id: pendingIzinId };
    
    const result = await updateIzinStatus(input, adminUserId);

    expect(result.id).toEqual(pendingIzinId);
    expect(result.status).toEqual('Disetujui');
    expect(result.tanggal_persetujuan).toEqual(new Date('2024-02-15'));
    expect(result.jam_persetujuan).toEqual('10:30');
  });

  it('should update izin status to Ditolak successfully', async () => {
    const input: UpdateIzinStatusInput = {
      id: pendingIzinId,
      status: 'Ditolak',
      tanggal_persetujuan: new Date('2024-02-15'),
      jam_persetujuan: '11:45'
    };
    
    const result = await updateIzinStatus(input, hrUserId);

    expect(result.id).toEqual(pendingIzinId);
    expect(result.status).toEqual('Ditolak');
    expect(result.tanggal_persetujuan).toEqual(new Date('2024-02-15'));
    expect(result.jam_persetujuan).toEqual('11:45');
  });

  it('should save updated status to database correctly', async () => {
    const input = { ...testUpdateInput, id: pendingIzinId };
    
    await updateIzinStatus(input, hrUserId);

    // Verify the record was updated in the database
    const updatedIzin = await db.select()
      .from(izinKendaraanTable)
      .where(eq(izinKendaraanTable.id, pendingIzinId))
      .execute();

    expect(updatedIzin).toHaveLength(1);
    expect(updatedIzin[0].status).toEqual('Disetujui');
    expect(updatedIzin[0].tanggal_persetujuan).toEqual(new Date('2024-02-15'));
    expect(updatedIzin[0].jam_persetujuan).toEqual('10:30');
  });

  it('should throw error when HR user does not exist', async () => {
    const input = { ...testUpdateInput, id: pendingIzinId };
    const nonExistentUserId = 99999;
    
    expect(updateIzinStatus(input, nonExistentUserId)).rejects.toThrow(/hr user not found/i);
  });

  it('should throw error when user is not HR or Admin', async () => {
    const input = { ...testUpdateInput, id: pendingIzinId };
    
    expect(updateIzinStatus(input, karyawanUserId)).rejects.toThrow(/insufficient permissions/i);
  });

  it('should throw error when izin kendaraan does not exist', async () => {
    const input = { ...testUpdateInput, id: 99999 };
    
    expect(updateIzinStatus(input, hrUserId)).rejects.toThrow(/izin kendaraan not found/i);
  });

  it('should throw error when trying to update non-pending izin', async () => {
    const input = { ...testUpdateInput, id: approvedIzinId };
    
    expect(updateIzinStatus(input, hrUserId)).rejects.toThrow(/cannot update status.*not in pending status/i);
  });

  it('should handle different approval dates and times correctly', async () => {
    const futureDate = new Date('2024-03-01');
    const input: UpdateIzinStatusInput = {
      id: pendingIzinId,
      status: 'Disetujui',
      tanggal_persetujuan: futureDate,
      jam_persetujuan: '15:45'
    };
    
    const result = await updateIzinStatus(input, hrUserId);

    expect(result.tanggal_persetujuan).toEqual(futureDate);
    expect(result.jam_persetujuan).toEqual('15:45');
    expect(result.tanggal_persetujuan).toBeInstanceOf(Date);
  });

  it('should preserve original izin data when updating status', async () => {
    const input = { ...testUpdateInput, id: pendingIzinId };
    
    const result = await updateIzinStatus(input, hrUserId);

    // Verify all original fields are preserved
    expect(result.nama_pemakai).toEqual('Test User');
    expect(result.nik).toEqual('1234567890123456');
    expect(result.nama_sopir).toEqual('Driver Name');
    expect(result.nomor_polisi).toEqual('B 1234 ABC');
    expect(result.tujuan).toEqual('Jakarta');
    expect(result.tanggal_berangkat).toEqual(new Date('2024-02-15'));
    expect(result.jam_berangkat).toEqual('08:00');
    expect(result.tanggal_kembali).toEqual(new Date('2024-02-15'));
    expect(result.jam_kembali).toEqual('17:00');
    expect(result.keterangan).toEqual('Business trip');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});