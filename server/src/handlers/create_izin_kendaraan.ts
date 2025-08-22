import { db } from '../db';
import { izinKendaraanTable } from '../db/schema';
import { type CreateIzinKendaraanInput, type IzinKendaraan } from '../schema';

export const createIzinKendaraan = async (input: CreateIzinKendaraanInput): Promise<IzinKendaraan> => {
  try {
    // Insert izin kendaraan record with default status "Pending"
    const result = await db.insert(izinKendaraanTable)
      .values({
        nama_pemakai: input.nama_pemakai,
        nik: input.nik,
        nama_sopir: input.nama_sopir,
        nomor_polisi: input.nomor_polisi,
        tujuan: input.tujuan,
        tanggal_berangkat: input.tanggal_berangkat,
        jam_berangkat: input.jam_berangkat,
        tanggal_kembali: input.tanggal_kembali,
        jam_kembali: input.jam_kembali,
        keterangan: input.keterangan,
        // status defaults to "Pending" as defined in schema
        // tanggal_persetujuan and jam_persetujuan remain null until approval
      })
      .returning()
      .execute();

    // Return the created record
    return result[0];
  } catch (error) {
    console.error('Izin kendaraan creation failed:', error);
    throw error;
  }
};