import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, Clock, CheckCircle, XCircle, LogOut, User, Bell, 
  Eye, Check, X, Filter, Calendar
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, IzinKendaraan, IzinStatus } from '../../../server/src/schema';

// Mock data for demonstration (since backend handlers are stubs)
const MOCK_ALL_REQUESTS: IzinKendaraan[] = [
  {
    id: 1,
    nama_pemakai: 'Ahmad Pratama',
    nik: '001',
    nama_sopir: 'Joko Susilo',
    nomor_polisi: 'B 1234 ABC',
    tujuan: 'Kunjungan klien di Jakarta Selatan untuk presentasi proposal proyek',
    tanggal_berangkat: new Date('2024-01-15'),
    jam_berangkat: '08:00',
    tanggal_kembali: new Date('2024-01-15'),
    jam_kembali: '17:00',
    keterangan: 'Perlu membawa laptop dan proyektor untuk presentasi',
    status: 'Pending' as IzinStatus,
    tanggal_persetujuan: null,
    jam_persetujuan: null,
    created_at: new Date('2024-01-10')
  },
  {
    id: 2,
    nama_pemakai: 'Dewi Lestari',
    nik: '004',
    nama_sopir: 'Bambang Wijaya',
    nomor_polisi: 'B 5678 DEF',
    tujuan: 'Meeting dengan vendor teknologi di Kemang',
    tanggal_berangkat: new Date('2024-01-14'),
    jam_berangkat: '09:30',
    tanggal_kembali: new Date('2024-01-14'),
    jam_kembali: '15:00',
    keterangan: null,
    status: 'Disetujui' as IzinStatus,
    tanggal_persetujuan: new Date('2024-01-12'),
    jam_persetujuan: '10:15',
    created_at: new Date('2024-01-09')
  },
  {
    id: 3,
    nama_pemakai: 'Rizki Hamdani',
    nik: '005',
    nama_sopir: 'Slamet Riyadi',
    nomor_polisi: 'B 9999 GHI',
    tujuan: 'Inspeksi lapangan proyek di Bogor',
    tanggal_berangkat: new Date('2024-01-13'),
    jam_berangkat: '07:00',
    tanggal_kembali: new Date('2024-01-13'),
    jam_kembali: '18:00',
    keterangan: 'Membawa peralatan survei dan kamera dokumentasi',
    status: 'Ditolak' as IzinStatus,
    tanggal_persetujuan: new Date('2024-01-11'),
    jam_persetujuan: '14:30',
    created_at: new Date('2024-01-08')
  },
  {
    id: 4,
    nama_pemakai: 'Maya Sari',
    nik: '006',
    nama_sopir: 'Agus Setiawan',
    nomor_polisi: 'B 3333 JKL',
    tujuan: 'Training karyawan di hotel Borobudur',
    tanggal_berangkat: new Date('2024-01-16'),
    jam_berangkat: '08:30',
    tanggal_kembali: new Date('2024-01-16'),
    jam_kembali: '16:30',
    keterangan: 'Acara training leadership untuk manager',
    status: 'Pending' as IzinStatus,
    tanggal_persetujuan: null,
    jam_persetujuan: null,
    created_at: new Date('2024-01-11')
  }
];

let mockAllRequestsState = [...MOCK_ALL_REQUESTS];

interface HRDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export function HRDashboard({ user, onLogout }: HRDashboardProps) {
  const [requests, setRequests] = useState<IzinKendaraan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<IzinKendaraan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IzinStatus | 'All'>('All');

  const loadRequests = useCallback(async () => {
    try {
      // STUB IMPLEMENTATION: Using mock data since backend handlers are stubs
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setRequests([...mockAllRequestsState]);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleStatusUpdate = async (id: number, status: 'Disetujui' | 'Ditolak') => {
    setIsProcessing(true);
    try {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      
      // STUB IMPLEMENTATION: Using mock update since backend handlers are stubs
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

      // Update mock state
      const requestIndex = mockAllRequestsState.findIndex(req => req.id === id);
      if (requestIndex !== -1) {
        mockAllRequestsState[requestIndex] = {
          ...mockAllRequestsState[requestIndex],
          status,
          tanggal_persetujuan: now,
          jam_persetujuan: timeString
        };
      }

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === id 
          ? { ...req, status, tanggal_persetujuan: now, jam_persetujuan: timeString }
          : req
      ));

      setNotification(`✅ Permohonan berhasil ${status.toLowerCase()}`);
      setTimeout(() => setNotification(null), 5000);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      setNotification('❌ Gagal memproses permohonan');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'Disetujui':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Disetujui
        </Badge>;
      case 'Ditolak':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Ditolak
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (date: Date, time?: string | null) => {
    const formattedDate = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return time ? `${formattedDate}, ${time}` : formattedDate;
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(req => 
    statusFilter === 'All' || req.status === statusFilter
  );

  const pendingCount = requests.filter(req => req.status === 'Pending').length;
  const approvedCount = requests.filter(req => req.status === 'Disetujui').length;
  const rejectedCount = requests.filter(req => req.status === 'Ditolak').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard HR</h1>
                <p className="text-sm text-gray-600">Kelola permohonan izin kendaraan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                {user.name} • {user.role}
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Backend Status Banner */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Bell className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Demo Mode:</strong> Backend menggunakan stub data. Fitur approval/reject berfungsi dengan mock data untuk demonstrasi.
          </AlertDescription>
        </Alert>

        {notification && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Bell className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              {notification}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Disetujui</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ditolak</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daftar Permohonan Izin Kendaraan</CardTitle>
                <CardDescription>
                  Kelola dan proses permohonan izin dari karyawan
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IzinStatus | 'All')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Semua</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Disetujui">Disetujui</SelectItem>
                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Memuat data...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {statusFilter === 'All' 
                    ? 'Belum ada permohonan izin kendaraan' 
                    : `Tidak ada permohonan dengan status ${statusFilter}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request: IzinKendaraan) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{request.tujuan}</h3>
                        <p className="text-sm text-gray-600">
                          {request.nama_pemakai} ({request.nik}) • {request.nomor_polisi}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <strong>Sopir:</strong> {request.nama_sopir}
                        </p>
                        <p className="text-gray-600">
                          <strong>Diajukan:</strong> {request.created_at.toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          <strong>Berangkat:</strong> {formatDateTime(request.tanggal_berangkat, request.jam_berangkat)}
                        </p>
                        <p className="text-gray-600">
                          <strong>Kembali:</strong> {formatDateTime(request.tanggal_kembali, request.jam_kembali)}
                        </p>
                      </div>
                      <div>
                        {request.status !== 'Pending' && request.tanggal_persetujuan && (
                          <p className="text-gray-600">
                            <strong>Diproses:</strong> {formatDateTime(request.tanggal_persetujuan, request.jam_persetujuan)}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.status === 'Pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(request.id, 'Disetujui')}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(request.id, 'Ditolak')}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Permohonan Izin Kendaraan</DialogTitle>
            <DialogDescription>
              Informasi lengkap permohonan izin kendaraan
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{selectedRequest.tujuan}</h3>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Informasi Pemohon</h4>
                  <p><strong>Nama:</strong> {selectedRequest.nama_pemakai}</p>
                  <p><strong>NIK:</strong> {selectedRequest.nik}</p>
                  <p><strong>Tanggal Pengajuan:</strong> {selectedRequest.created_at.toLocaleDateString('id-ID')}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Informasi Kendaraan</h4>
                  <p><strong>Sopir:</strong> {selectedRequest.nama_sopir}</p>
                  <p><strong>Nomor Polisi:</strong> {selectedRequest.nomor_polisi}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Jadwal Perjalanan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Tanggal & Jam Berangkat:</strong></p>
                    <p>{formatDateTime(selectedRequest.tanggal_berangkat, selectedRequest.jam_berangkat)}</p>
                  </div>
                  <div>
                    <p><strong>Tanggal & Jam Kembali:</strong></p>
                    <p>{formatDateTime(selectedRequest.tanggal_kembali, selectedRequest.jam_kembali)}</p>
                  </div>
                </div>
              </div>

              {selectedRequest.keterangan && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Keterangan</h4>
                  <p className="bg-gray-50 p-3 rounded-md">{selectedRequest.keterangan}</p>
                </div>
              )}

              {selectedRequest.status !== 'Pending' && selectedRequest.tanggal_persetujuan && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Informasi Persetujuan</h4>
                  <p><strong>Status:</strong> {selectedRequest.status}</p>
                  <p><strong>Tanggal & Jam Persetujuan:</strong> {formatDateTime(selectedRequest.tanggal_persetujuan, selectedRequest.jam_persetujuan)}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'Pending' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedRequest && handleStatusUpdate(selectedRequest.id, 'Disetujui')}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Setujui
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedRequest && handleStatusUpdate(selectedRequest.id, 'Ditolak')}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-1" />
                  Tolak
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}