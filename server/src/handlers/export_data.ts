import { db } from '../db';
import { izinKendaraanTable } from '../db/schema';
import { type ExportDataInput, type ExportDataResponse } from '../schema';
import { gte, lte, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export async function exportIzinKendaraanToExcel(input: ExportDataInput): Promise<ExportDataResponse> {
  try {
    // Query data within the date range
    const data = await db.select()
      .from(izinKendaraanTable)
      .where(
        and(
          gte(izinKendaraanTable.tanggal_berangkat, input.start_date),
          lte(izinKendaraanTable.tanggal_berangkat, input.end_date)
        )
      )
      .orderBy(izinKendaraanTable.tanggal_berangkat)
      .execute();

    // Transform data for CSV export (Excel compatible)
    const headers = [
      'No',
      'Nama Pemakai',
      'NIK',
      'Nama Sopir',
      'Nomor Polisi',
      'Tujuan',
      'Tanggal Berangkat',
      'Jam Berangkat',
      'Tanggal Kembali',
      'Jam Kembali',
      'Keterangan',
      'Status',
      'Tanggal Persetujuan',
      'Jam Persetujuan',
      'Tanggal Dibuat'
    ];

    const csvRows = [headers.join(',')];

    // Helper function to escape CSV values
    const escapeCsvValue = (value: string): string => {
      // Escape double quotes by doubling them and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    };

    // Add data rows
    data.forEach((record, index) => {
      const row = [
        (index + 1).toString(),
        escapeCsvValue(record.nama_pemakai),
        escapeCsvValue(record.nik),
        escapeCsvValue(record.nama_sopir),
        escapeCsvValue(record.nomor_polisi),
        escapeCsvValue(record.tujuan),
        escapeCsvValue(record.tanggal_berangkat.toLocaleDateString('id-ID')),
        escapeCsvValue(record.jam_berangkat),
        escapeCsvValue(record.tanggal_kembali.toLocaleDateString('id-ID')),
        escapeCsvValue(record.jam_kembali),
        escapeCsvValue(record.keterangan || '-'),
        escapeCsvValue(record.status),
        escapeCsvValue(record.tanggal_persetujuan ? record.tanggal_persetujuan.toLocaleDateString('id-ID') : '-'),
        escapeCsvValue(record.jam_persetujuan || '-'),
        escapeCsvValue(record.created_at.toLocaleDateString('id-ID'))
      ];
      csvRows.push(row.join(','));
    });

    // Join all rows with newlines
    const csvContent = csvRows.join('\n');

    // Generate filename with timestamp
    const startDateStr = input.start_date.toISOString().split('T')[0];
    const endDateStr = input.end_date.toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `izin_kendaraan_${startDateStr}_to_${endDateStr}_${timestamp}.xlsx`;

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Write CSV file to disk (with .xlsx extension for Excel compatibility)
    const filePath = path.join(exportsDir, fileName);
    fs.writeFileSync(filePath, csvContent, 'utf-8');

    // Return response with file information
    return {
      file_url: `/exports/${fileName}`,
      file_name: fileName,
      total_records: data.length
    };

  } catch (error) {
    console.error('Excel export failed:', error);
    throw error;
  }
}