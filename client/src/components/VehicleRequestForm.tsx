import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateIzinKendaraanInput } from '../../../server/src/schema';

interface VehicleRequestFormProps {
  userNik: string;
  userName: string;
  onSubmitSuccess: (newRequest: any) => void;
}

export function VehicleRequestForm({ userNik, userName, onSubmitSuccess }: VehicleRequestFormProps) {
  const [formData, setFormData] = useState<CreateIzinKendaraanInput>({
    nama_pemakai: userName,
    nik: userNik,
    nama_sopir: '',
    nomor_polisi: '',
    tujuan: '',
    tanggal_berangkat: new Date(),
    jam_berangkat: '',
    tanggal_kembali: new Date(),
    jam_kembali: '',
    keterangan: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate dates
      if (formData.tanggal_kembali < formData.tanggal_berangkat) {
        throw new Error('Tanggal kembali tidak boleh lebih awal dari tanggal berangkat');
      }

      // STUB IMPLEMENTATION: Using mock submission since backend handlers are stubs
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      onSubmitSuccess(formData);
      
      // Reset form
      setFormData({
        nama_pemakai: userName,
        nik: userNik,
        nama_sopir: '',
        nomor_polisi: '',
        tujuan: '',
        tanggal_berangkat: new Date(),
        jam_berangkat: '',
        tanggal_kembali: new Date(),
        jam_kembali: '',
        keterangan: null
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengajukan izin');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string) => {
    return new Date(dateString);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nama_pemakai">Nama Pemakai</Label>
          <Input
            id="nama_pemakai"
            value={formData.nama_pemakai}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, nama_pemakai: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nik">NIK</Label>
          <Input
            id="nik"
            value={formData.nik}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, nik: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nama_sopir">Nama Sopir</Label>
          <Input
            id="nama_sopir"
            placeholder="Masukkan nama sopir"
            value={formData.nama_sopir}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, nama_sopir: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomor_polisi">Nomor Polisi</Label>
          <Input
            id="nomor_polisi"
            placeholder="Contoh: B 1234 XYZ"
            value={formData.nomor_polisi}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, nomor_polisi: e.target.value.toUpperCase() }))
            }
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Purpose */}
      <div className="space-y-2">
        <Label htmlFor="tujuan">Tujuan dan Keperluan</Label>
        <Textarea
          id="tujuan"
          placeholder="Jelaskan tujuan dan keperluan penggunaan kendaraan"
          value={formData.tujuan}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, tujuan: e.target.value }))
          }
          required
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Departure Date & Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Waktu Keberangkatan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal_berangkat">Tanggal Berangkat</Label>
            <Input
              id="tanggal_berangkat"
              type="date"
              value={formatDateForInput(formData.tanggal_berangkat)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, tanggal_berangkat: parseInputDate(e.target.value) }))
              }
              required
              disabled={isLoading}
              min={formatDateForInput(new Date())}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jam_berangkat">Jam Berangkat</Label>
            <Input
              id="jam_berangkat"
              type="time"
              value={formData.jam_berangkat}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, jam_berangkat: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Return Date & Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Waktu Kembali
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal_kembali">Tanggal Kembali</Label>
            <Input
              id="tanggal_kembali"
              type="date"
              value={formatDateForInput(formData.tanggal_kembali)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, tanggal_kembali: parseInputDate(e.target.value) }))
              }
              required
              disabled={isLoading}
              min={formatDateForInput(formData.tanggal_berangkat)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jam_kembali">Jam Kembali</Label>
            <Input
              id="jam_kembali"
              type="time"
              value={formData.jam_kembali}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, jam_kembali: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
        <Textarea
          id="keterangan"
          placeholder="Tambahan informasi atau catatan khusus"
          value={formData.keterangan || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, keterangan: e.target.value || null }))
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Mengajukan...
            </>
          ) : (
            'Ajukan Izin Kendaraan'
          )}
        </Button>
      </div>
    </form>
  );
}