import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { izinKendaraanTable } from '../db/schema';
import { type CreateIzinKendaraanInput } from '../schema';
import { createIzinKendaraan } from '../handlers/create_izin_kendaraan';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateIzinKendaraanInput = {
  nama_pemakai: 'John Doe',
  nik: '1234567890123456',
  nama_sopir: 'Jane Smith',
  nomor_polisi: 'B 1234 ABC',
  tujuan: 'Jakarta - Bandung',
  tanggal_berangkat: new Date('2024-01-15'),
  jam_berangkat: '08:00',
  tanggal_kembali: new Date('2024-01-16'),
  jam_kembali: '17:00',
  keterangan: 'Perjalanan dinas resmi'
};

// Test input with minimal required fields (nullable keterangan)
const minimalTestInput: CreateIzinKendaraanInput = {
  nama_pemakai: 'Jane Doe',
  nik: '9876543210987654',
  nama_sopir: 'Bob Wilson',
  nomor_polisi: 'D 5678 XYZ',
  tujuan: 'Surabaya - Malang',
  tanggal_berangkat: new Date('2024-02-01'),
  jam_berangkat: '09:30',
  tanggal_kembali: new Date('2024-02-01'),
  jam_kembali: '18:30',
  keterangan: null
};

describe('createIzinKendaraan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an izin kendaraan with complete data', async () => {
    const result = await createIzinKendaraan(testInput);

    // Basic field validation
    expect(result.nama_pemakai).toEqual('John Doe');
    expect(result.nik).toEqual('1234567890123456');
    expect(result.nama_sopir).toEqual('Jane Smith');
    expect(result.nomor_polisi).toEqual('B 1234 ABC');
    expect(result.tujuan).toEqual('Jakarta - Bandung');
    expect(result.tanggal_berangkat).toEqual(new Date('2024-01-15'));
    expect(result.jam_berangkat).toEqual('08:00');
    expect(result.tanggal_kembali).toEqual(new Date('2024-01-16'));
    expect(result.jam_kembali).toEqual('17:00');
    expect(result.keterangan).toEqual('Perjalanan dinas resmi');

    // Default values validation
    expect(result.status).toEqual('Pending');
    expect(result.tanggal_persetujuan).toBeNull();
    expect(result.jam_persetujuan).toBeNull();

    // Auto-generated fields validation
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an izin kendaraan with minimal data (null keterangan)', async () => {
    const result = await createIzinKendaraan(minimalTestInput);

    // Basic field validation
    expect(result.nama_pemakai).toEqual('Jane Doe');
    expect(result.nik).toEqual('9876543210987654');
    expect(result.nama_sopir).toEqual('Bob Wilson');
    expect(result.nomor_polisi).toEqual('D 5678 XYZ');
    expect(result.tujuan).toEqual('Surabaya - Malang');
    expect(result.keterangan).toBeNull();

    // Default values validation
    expect(result.status).toEqual('Pending');
    expect(result.tanggal_persetujuan).toBeNull();
    expect(result.jam_persetujuan).toBeNull();

    // Auto-generated fields validation
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save izin kendaraan to database', async () => {
    const result = await createIzinKendaraan(testInput);

    // Query the database to verify the record was saved
    const izinRecords = await db.select()
      .from(izinKendaraanTable)
      .where(eq(izinKendaraanTable.id, result.id))
      .execute();

    expect(izinRecords).toHaveLength(1);
    
    const savedRecord = izinRecords[0];
    expect(savedRecord.nama_pemakai).toEqual('John Doe');
    expect(savedRecord.nik).toEqual('1234567890123456');
    expect(savedRecord.nama_sopir).toEqual('Jane Smith');
    expect(savedRecord.nomor_polisi).toEqual('B 1234 ABC');
    expect(savedRecord.tujuan).toEqual('Jakarta - Bandung');
    expect(savedRecord.tanggal_berangkat).toEqual(new Date('2024-01-15'));
    expect(savedRecord.jam_berangkat).toEqual('08:00');
    expect(savedRecord.tanggal_kembali).toEqual(new Date('2024-01-16'));
    expect(savedRecord.jam_kembali).toEqual('17:00');
    expect(savedRecord.keterangan).toEqual('Perjalanan dinas resmi');
    expect(savedRecord.status).toEqual('Pending');
    expect(savedRecord.tanggal_persetujuan).toBeNull();
    expect(savedRecord.jam_persetujuan).toBeNull();
    expect(savedRecord.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple izin kendaraan records', async () => {
    // Create multiple records
    const result1 = await createIzinKendaraan(testInput);
    const result2 = await createIzinKendaraan(minimalTestInput);

    // Verify both records have unique IDs
    expect(result1.id).not.toEqual(result2.id);

    // Verify both records exist in database
    const allRecords = await db.select()
      .from(izinKendaraanTable)
      .execute();

    expect(allRecords).toHaveLength(2);

    // Verify records can be distinguished by their data
    const johnRecord = allRecords.find(r => r.nama_pemakai === 'John Doe');
    const janeRecord = allRecords.find(r => r.nama_pemakai === 'Jane Doe');

    expect(johnRecord).toBeDefined();
    expect(janeRecord).toBeDefined();
    expect(johnRecord?.nik).toEqual('1234567890123456');
    expect(janeRecord?.nik).toEqual('9876543210987654');
  });

  it('should handle date objects correctly', async () => {
    const specificDateInput = {
      ...testInput,
      tanggal_berangkat: new Date('2024-12-25T00:00:00.000Z'),
      tanggal_kembali: new Date('2024-12-26T00:00:00.000Z')
    };

    const result = await createIzinKendaraan(specificDateInput);

    // Verify dates are preserved correctly
    expect(result.tanggal_berangkat).toEqual(new Date('2024-12-25T00:00:00.000Z'));
    expect(result.tanggal_kembali).toEqual(new Date('2024-12-26T00:00:00.000Z'));

    // Verify in database
    const savedRecord = await db.select()
      .from(izinKendaraanTable)
      .where(eq(izinKendaraanTable.id, result.id))
      .execute();

    expect(savedRecord[0].tanggal_berangkat).toEqual(new Date('2024-12-25T00:00:00.000Z'));
    expect(savedRecord[0].tanggal_kembali).toEqual(new Date('2024-12-26T00:00:00.000Z'));
  });

  it('should handle time strings correctly', async () => {
    const timeTestInput = {
      ...testInput,
      jam_berangkat: '06:30',
      jam_kembali: '23:45'
    };

    const result = await createIzinKendaraan(timeTestInput);

    // Verify time strings are preserved correctly
    expect(result.jam_berangkat).toEqual('06:30');
    expect(result.jam_kembali).toEqual('23:45');

    // Verify in database
    const savedRecord = await db.select()
      .from(izinKendaraanTable)
      .where(eq(izinKendaraanTable.id, result.id))
      .execute();

    expect(savedRecord[0].jam_berangkat).toEqual('06:30');
    expect(savedRecord[0].jam_kembali).toEqual('23:45');
  });
});