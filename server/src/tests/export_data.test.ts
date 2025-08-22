import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, izinKendaraanTable } from '../db/schema';
import { type ExportDataInput } from '../schema';
import { exportIzinKendaraanToExcel } from '../handlers/export_data';
import * as fs from 'fs';
import * as path from 'path';

// Test data setup
const testUser = {
  nik: 'EMP001',
  password: 'password123',
  name: 'Test Employee',
  role: 'Karyawan' as const
};

const testIzinData = [
  {
    nama_pemakai: 'John Doe',
    nik: 'EMP001',
    nama_sopir: 'Driver A',
    nomor_polisi: 'B 1234 ABC',
    tujuan: 'Jakarta Pusat',
    tanggal_berangkat: new Date('2024-01-15'),
    jam_berangkat: '08:00',
    tanggal_kembali: new Date('2024-01-15'),
    jam_kembali: '17:00',
    keterangan: 'Rapat dengan klien',
    status: 'Disetujui' as const,
    tanggal_persetujuan: new Date('2024-01-14'),
    jam_persetujuan: '10:00'
  },
  {
    nama_pemakai: 'Jane Smith',
    nik: 'EMP002',
    nama_sopir: 'Driver B',
    nomor_polisi: 'B 5678 DEF',
    tujuan: 'Bandung',
    tanggal_berangkat: new Date('2024-01-16'),
    jam_berangkat: '07:30',
    tanggal_kembali: new Date('2024-01-17'),
    jam_kembali: '18:00',
    keterangan: null,
    status: 'Pending' as const,
    tanggal_persetujuan: null,
    jam_persetujuan: null
  },
  {
    nama_pemakai: 'Bob Wilson',
    nik: 'EMP003',
    nama_sopir: 'Driver C',
    nomor_polisi: 'B 9876 GHI',
    tujuan: 'Surabaya',
    tanggal_berangkat: new Date('2024-01-20'),
    jam_berangkat: '06:00',
    tanggal_kembali: new Date('2024-01-22'),
    jam_kembali: '20:00',
    keterangan: 'Kunjungan cabang',
    status: 'Ditolak' as const,
    tanggal_persetujuan: new Date('2024-01-19'),
    jam_persetujuan: '14:30'
  }
];

describe('exportIzinKendaraanToExcel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Clean up test files after each test
  afterEach(async () => {
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (fs.existsSync(exportsDir)) {
      const files = fs.readdirSync(exportsDir);
      files.forEach(file => {
        if (file.startsWith('izin_kendaraan_') && file.endsWith('.xlsx')) {
          fs.unlinkSync(path.join(exportsDir, file));
        }
      });
    }
  });

  it('should export izin kendaraan data to Excel file', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test izin kendaraan records
    await db.insert(izinKendaraanTable).values(testIzinData).execute();

    const input: ExportDataInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Verify response structure
    expect(result.file_url).toMatch(/^\/exports\/izin_kendaraan_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(result.file_name).toMatch(/^izin_kendaraan_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(result.total_records).toBe(3);

    // Verify file was created
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should create valid CSV file with correct data structure', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test izin kendaraan records
    await db.insert(izinKendaraanTable).values([testIzinData[0]]).execute();

    const input: ExportDataInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Read and verify CSV file content
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');

    // Should have header + 1 data row
    expect(lines).toHaveLength(2);

    // Verify headers
    const headers = lines[0].split(',');
    expect(headers).toContain('No');
    expect(headers).toContain('Nama Pemakai');
    expect(headers).toContain('NIK');
    expect(headers).toContain('Status');

    // Verify data row contains expected values
    const dataRow = lines[1];
    expect(dataRow).toContain('"John Doe"');
    expect(dataRow).toContain('"EMP001"');
    expect(dataRow).toContain('"Driver A"');
    expect(dataRow).toContain('"B 1234 ABC"');
    expect(dataRow).toContain('"Jakarta Pusat"');
    expect(dataRow).toContain('"Disetujui"');
  });

  it('should handle null values correctly in CSV export', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create record with null values
    await db.insert(izinKendaraanTable).values([testIzinData[1]]).execute();

    const input: ExportDataInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Read and verify CSV file handles null values
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');

    const dataRow = lines[1];
    expect(dataRow).toContain('"-"'); // Null keterangan should become "-"
    expect(dataRow).toContain('"-"'); // Null tanggal_persetujuan should become "-"
    expect(dataRow).toContain('"-"'); // Null jam_persetujuan should become "-"
  });

  it('should filter data by date range correctly', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test records with different dates
    await db.insert(izinKendaraanTable).values(testIzinData).execute();

    // Export only data from January 15-16
    const input: ExportDataInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-16'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Should only include 2 records (Jan 15 and Jan 16)
    expect(result.total_records).toBe(2);

    // Verify file content
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');

    // Header + 2 data rows
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"John Doe"');
    expect(lines[2]).toContain('"Jane Smith"');
  });

  it('should return empty export for date range with no data', async () => {
    const input: ExportDataInput = {
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-06-30'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    expect(result.total_records).toBe(0);
    expect(result.file_name).toMatch(/^izin_kendaraan_2024-06-01_to_2024-06-30_\d{4}-\d{2}-\d{2}\.xlsx$/);

    // Verify empty CSV file was created (header only)
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    expect(fs.existsSync(filePath)).toBe(true);

    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');
    expect(lines).toHaveLength(1); // Only header row
    expect(lines[0]).toContain('No,Nama Pemakai,NIK');
  });

  it('should create exports directory if it does not exist', async () => {
    // Ensure exports directory doesn't exist
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (fs.existsSync(exportsDir)) {
      fs.rmSync(exportsDir, { recursive: true });
    }

    const input: ExportDataInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Directory should be created
    expect(fs.existsSync(exportsDir)).toBe(true);
    
    // File should be created successfully
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should order records by tanggal_berangkat', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create records in non-chronological order
    await db.insert(izinKendaraanTable).values([
      testIzinData[2], // Jan 20
      testIzinData[0], // Jan 15
      testIzinData[1]  // Jan 16
    ]).execute();

    const input: ExportDataInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Verify file content is ordered correctly
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');

    expect(lines).toHaveLength(4); // Header + 3 data rows
    expect(lines[1]).toContain('"John Doe"');   // Jan 15
    expect(lines[2]).toContain('"Jane Smith"'); // Jan 16
    expect(lines[3]).toContain('"Bob Wilson"'); // Jan 20
  });

  it('should handle CSV format with proper quoting', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create record with potential CSV problematic characters
    const specialData = {
      nama_pemakai: 'John "Johnny" Doe, Jr.',
      nik: 'EMP001',
      nama_sopir: 'Driver, A',
      nomor_polisi: 'B 1234 ABC',
      tujuan: 'Jakarta, Pusat',
      tanggal_berangkat: new Date('2024-01-15'),
      jam_berangkat: '08:00',
      tanggal_kembali: new Date('2024-01-15'),
      jam_kembali: '17:00',
      keterangan: 'Meeting with client, important',
      status: 'Disetujui' as const,
      tanggal_persetujuan: new Date('2024-01-14'),
      jam_persetujuan: '10:00'
    };

    await db.insert(izinKendaraanTable).values([specialData]).execute();

    const input: ExportDataInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      format: 'xlsx'
    };

    const result = await exportIzinKendaraanToExcel(input);

    // Verify file was created and contains quoted data
    const filePath = path.join(process.cwd(), 'public', result.file_url);
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    
    // Should contain properly quoted fields (CSV standard uses double quotes to escape quotes)
    expect(csvContent).toContain('"John ""Johnny"" Doe, Jr."');
    expect(csvContent).toContain('"Driver, A"');
    expect(csvContent).toContain('"Jakarta, Pusat"');
    expect(csvContent).toContain('"Meeting with client, important"');
  });
});