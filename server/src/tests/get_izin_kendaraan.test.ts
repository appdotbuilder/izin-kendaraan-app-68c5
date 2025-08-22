import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { izinKendaraanTable, usersTable } from '../db/schema';
import { type GetIzinByStatusInput, type GetIzinByDateRangeInput } from '../schema';
import {
  getAllIzinKendaraan,
  getIzinKendaraanByStatus,
  getIzinKendaraanByDateRange,
  getIzinKendaraanById
} from '../handlers/get_izin_kendaraan';

// Test data
const testUser = {
  nik: '123456789',
  password: 'hashedpassword',
  name: 'Test User',
  role: 'Karyawan' as const,
  fcm_token: null
};

const testIzinData1 = {
  nama_pemakai: 'John Doe',
  nik: '123456789',
  nama_sopir: 'Driver One',
  nomor_polisi: 'B 1234 ABC',
  tujuan: 'Jakarta',
  tanggal_berangkat: new Date('2024-01-15'),
  jam_berangkat: '08:00',
  tanggal_kembali: new Date('2024-01-15'),
  jam_kembali: '17:00',
  keterangan: 'Official business',
  status: 'Pending' as const
};

const testIzinData2 = {
  nama_pemakai: 'Jane Smith',
  nik: '987654321',
  nama_sopir: 'Driver Two',
  nomor_polisi: 'B 5678 DEF',
  tujuan: 'Bandung',
  tanggal_berangkat: new Date('2024-01-20'),
  jam_berangkat: '09:00',
  tanggal_kembali: new Date('2024-01-20'),
  jam_kembali: '18:00',
  keterangan: null,
  status: 'Disetujui' as const,
  tanggal_persetujuan: new Date('2024-01-18'),
  jam_persetujuan: '14:30'
};

describe('getAllIzinKendaraan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all izin kendaraan records', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test izin data - insert individually to ensure different timestamps
    await db.insert(izinKendaraanTable).values(testIzinData1).execute();
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(izinKendaraanTable).values(testIzinData2).execute();

    const results = await getAllIzinKendaraan();

    expect(results).toHaveLength(2);
    // The second record (testIzinData2) should be first due to desc order
    expect(results[0].nama_pemakai).toEqual('Jane Smith');
    expect(results[1].nama_pemakai).toEqual('John Doe');
    expect(results[0].nik).toEqual('987654321');
    expect(results[1].nik).toEqual('123456789');
  });

  it('should return empty array when no records exist', async () => {
    const results = await getAllIzinKendaraan();
    expect(results).toHaveLength(0);
  });

  it('should order results by created_at descending', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create records with different timestamps
    const oldRecord = { ...testIzinData1, nama_pemakai: 'Old Record' };
    const newRecord = { ...testIzinData2, nama_pemakai: 'New Record' };

    await db.insert(izinKendaraanTable).values(oldRecord).execute();
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(izinKendaraanTable).values(newRecord).execute();

    const results = await getAllIzinKendaraan();

    expect(results).toHaveLength(2);
    expect(results[0].nama_pemakai).toEqual('New Record');
    expect(results[1].nama_pemakai).toEqual('Old Record');
    expect(results[0].created_at >= results[1].created_at).toBe(true);
  });
});

describe('getIzinKendaraanByStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should filter by status only', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data with different statuses
    await db.insert(izinKendaraanTable).values([testIzinData1, testIzinData2]).execute();

    const input: GetIzinByStatusInput = {
      status: 'Pending'
    };

    const results = await getIzinKendaraanByStatus(input);

    expect(results).toHaveLength(1);
    expect(results[0].status).toEqual('Pending');
    expect(results[0].nama_pemakai).toEqual('John Doe');
  });

  it('should filter by NIK only', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data
    await db.insert(izinKendaraanTable).values([testIzinData1, testIzinData2]).execute();

    const input: GetIzinByStatusInput = {
      nik: '123456789'
    };

    const results = await getIzinKendaraanByStatus(input);

    expect(results).toHaveLength(1);
    expect(results[0].nik).toEqual('123456789');
    expect(results[0].nama_pemakai).toEqual('John Doe');
  });

  it('should filter by both status and NIK', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create additional test data
    const additionalData = {
      ...testIzinData1,
      nama_pemakai: 'Another Request',
      status: 'Disetujui' as const,
      tanggal_persetujuan: new Date('2024-01-16'),
      jam_persetujuan: '10:00'
    };

    await db.insert(izinKendaraanTable).values([testIzinData1, testIzinData2, additionalData]).execute();

    const input: GetIzinByStatusInput = {
      status: 'Disetujui',
      nik: '123456789'
    };

    const results = await getIzinKendaraanByStatus(input);

    expect(results).toHaveLength(1);
    expect(results[0].status).toEqual('Disetujui');
    expect(results[0].nik).toEqual('123456789');
    expect(results[0].nama_pemakai).toEqual('Another Request');
  });

  it('should return all records when no filters provided', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data
    await db.insert(izinKendaraanTable).values([testIzinData1, testIzinData2]).execute();

    const input: GetIzinByStatusInput = {};

    const results = await getIzinKendaraanByStatus(input);

    expect(results).toHaveLength(2);
  });

  it('should return empty array when no matching records', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data
    await db.insert(izinKendaraanTable).values([testIzinData1]).execute();

    const input: GetIzinByStatusInput = {
      status: 'Ditolak'
    };

    const results = await getIzinKendaraanByStatus(input);

    expect(results).toHaveLength(0);
  });
});

describe('getIzinKendaraanByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should filter by date range correctly', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data with different dates
    const earlyDate = {
      ...testIzinData1,
      tanggal_berangkat: new Date('2024-01-10'),
      nama_pemakai: 'Early Trip'
    };
    
    const midDate = {
      ...testIzinData2,
      tanggal_berangkat: new Date('2024-01-15'),
      nama_pemakai: 'Mid Trip'
    };
    
    const lateDate = {
      ...testIzinData1,
      tanggal_berangkat: new Date('2024-01-25'),
      nama_pemakai: 'Late Trip'
    };

    await db.insert(izinKendaraanTable).values([earlyDate, midDate, lateDate]).execute();

    const input: GetIzinByDateRangeInput = {
      start_date: new Date('2024-01-12'),
      end_date: new Date('2024-01-20')
    };

    const results = await getIzinKendaraanByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].nama_pemakai).toEqual('Mid Trip');
    expect(results[0].tanggal_berangkat).toEqual(new Date('2024-01-15'));
  });

  it('should include records on boundary dates', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    const startBoundary = {
      ...testIzinData1,
      tanggal_berangkat: new Date('2024-01-15'),
      nama_pemakai: 'Start Boundary'
    };
    
    const endBoundary = {
      ...testIzinData2,
      tanggal_berangkat: new Date('2024-01-20'),
      nama_pemakai: 'End Boundary'
    };

    await db.insert(izinKendaraanTable).values([startBoundary, endBoundary]).execute();

    const input: GetIzinByDateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-20')
    };

    const results = await getIzinKendaraanByDateRange(input);

    expect(results).toHaveLength(2);
    const names = results.map(r => r.nama_pemakai).sort();
    expect(names).toEqual(['End Boundary', 'Start Boundary']);
  });

  it('should return empty array when no records in date range', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data outside the range
    const outsideRange = {
      ...testIzinData1,
      tanggal_berangkat: new Date('2024-02-01')
    };

    await db.insert(izinKendaraanTable).values([outsideRange]).execute();

    const input: GetIzinByDateRangeInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const results = await getIzinKendaraanByDateRange(input);

    expect(results).toHaveLength(0);
  });

  it('should handle same start and end date', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    const sameDate = {
      ...testIzinData1,
      tanggal_berangkat: new Date('2024-01-15'),
      nama_pemakai: 'Same Date Trip'
    };

    await db.insert(izinKendaraanTable).values([sameDate]).execute();

    const input: GetIzinByDateRangeInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const results = await getIzinKendaraanByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].nama_pemakai).toEqual('Same Date Trip');
  });
});

describe('getIzinKendaraanById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return specific izin kendaraan by id', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create test data
    const results = await db.insert(izinKendaraanTable)
      .values(testIzinData1)
      .returning()
      .execute();

    const createdId = results[0].id;
    const result = await getIzinKendaraanById(createdId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdId);
    expect(result!.nama_pemakai).toEqual('John Doe');
    expect(result!.nik).toEqual('123456789');
    expect(result!.nomor_polisi).toEqual('B 1234 ABC');
    expect(result!.status).toEqual('Pending');
  });

  it('should return null when id does not exist', async () => {
    const result = await getIzinKendaraanById(999);
    expect(result).toBeNull();
  });

  it('should return correct record when multiple exist', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create multiple test records
    const results = await db.insert(izinKendaraanTable)
      .values([testIzinData1, testIzinData2])
      .returning()
      .execute();

    const secondId = results[1].id;
    const result = await getIzinKendaraanById(secondId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(secondId);
    expect(result!.nama_pemakai).toEqual('Jane Smith');
    expect(result!.status).toEqual('Disetujui');
  });

  it('should return all fields including nullable ones', async () => {
    // Create prerequisite user data
    await db.insert(usersTable).values(testUser).execute();

    // Create record with all fields populated
    const fullData = {
      ...testIzinData2,
      keterangan: 'Full test record',
      tanggal_persetujuan: new Date('2024-01-18'),
      jam_persetujuan: '15:30'
    };

    const results = await db.insert(izinKendaraanTable)
      .values(fullData)
      .returning()
      .execute();

    const createdId = results[0].id;
    const result = await getIzinKendaraanById(createdId);

    expect(result).toBeDefined();
    expect(result!.keterangan).toEqual('Full test record');
    expect(result!.tanggal_persetujuan).toEqual(new Date('2024-01-18'));
    expect(result!.jam_persetujuan).toEqual('15:30');
    expect(result!.created_at).toBeInstanceOf(Date);
  });
});