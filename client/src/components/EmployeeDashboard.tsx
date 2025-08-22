import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Plus, Clock, CheckCircle, XCircle, LogOut, User, Bell } from 'lucide-react';
import { VehicleRequestForm } from '@/components/VehicleRequestForm';
import { trpc } from '@/utils/trpc';
import type { User as UserType, IzinKendaraan, IzinStatus } from '../../../server/src/schema';

// Mock data for demonstration (since backend handlers are stubs)
const MOCK_REQUESTS: IzinKendaraan[] = [
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
    nama_pemakai: 'Ahmad Pratama',
    nik: '001',
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
    nama_pemakai: 'Ahmad Pratama',
    nik: '001',
    nama_sopir: 'Slamet Riyadi',
    nomor_polisi: 'B 9999 GHI',
    tujuan: 'Audit sistem di kantor cabang Bekasi',
    tanggal_berangkat: new Date('2024-01-12'),
    jam_berangkat: '09:00',
    tanggal_kembali: new Date('2024-01-12'),
    jam_kembali: '17:30',
    keterangan: null,
    status: 'Ditolak' as IzinStatus,
    tanggal_persetujuan: new Date('2024-01-11'),
    jam_persetujuan: '14:30',
    created_at: new Date('2024-01-08')
  }
];

let mockRequestsState = [...MOCK_REQUESTS];
let nextMockId = 4;

interface EmployeeDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export function EmployeeDashboard({ user, onLogout }: EmployeeDashboardProps) {
  const [requests, setRequests] = useState<IzinKendaraan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      // STUB IMPLEMENTATION: Using mock data since backend handlers are stubs
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      const result = mockRequestsState.filter(req => req.nik === user.nik);
      setRequests(result);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.nik]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRequestSubmitted = useCallback((newRequest: IzinKendaraan) => {
    // Add new request to mock state
    mockRequestsState.push({
      ...newRequest,
      id: nextMockId++,
      status: 'Pending' as IzinStatus,
      tanggal_persetujuan: null,
      jam_persetujuan: null,
      created_at: new Date()
    });
    
    setNotification('✅ Permohonan izin kendaraan berhasil diajukan!');
    setTimeout(() => setNotification(null), 5000);
    loadRequests();
    setActiveTab('dashboard');
  }, [loadRequests]);

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

  const pendingCount = requests.filter(req => req.status === 'Pending').length;
  const approvedCount = requests.filter(req => req.status === 'Disetujui').length;
  const rejectedCount = requests.filter(req => req.status === 'Ditolak').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Karyawan</h1>
                <p className="text-sm text-gray-600">Selamat datang, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                {user.role} • {user.nik}
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
            <strong>Demo Mode:</strong> Backend menggunakan stub data. Semua fitur UI/UX berfungsi dengan mock data untuk demonstrasi aplikasi. 
            Notifikasi FCM push akan diintegrasikan dengan Firebase Cloud Messaging pada implementasi final.
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="new-request">Ajukan Izin Baru</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Requests List */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Permohonan Izin</CardTitle>
                <CardDescription>
                  Daftar semua permohonan izin kendaraan Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Memuat data...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada permohonan izin kendaraan</p>
                    <Button 
                      onClick={() => setActiveTab('new-request')}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajukan Izin Baru
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request: IzinKendaraan) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{request.tujuan}</h3>
                            <p className="text-sm text-gray-600">
                              {request.nama_pemakai} • {request.nomor_polisi}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(request.status)}
                            <p className="text-xs text-gray-500 mt-1">
                              {request.created_at.toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <strong>Sopir:</strong> {request.nama_sopir}
                            </p>
                            <p className="text-gray-600">
                              <strong>Berangkat:</strong> {formatDateTime(request.tanggal_berangkat, request.jam_berangkat)}
                            </p>
                            <p className="text-gray-600">
                              <strong>Kembali:</strong> {formatDateTime(request.tanggal_kembali, request.jam_kembali)}
                            </p>
                          </div>
                          <div>
                            {request.keterangan && (
                              <p className="text-gray-600">
                                <strong>Keterangan:</strong> {request.keterangan}
                              </p>
                            )}
                            {request.status !== 'Pending' && request.tanggal_persetujuan && (
                              <p className="text-gray-600">
                                <strong>Diproses:</strong> {formatDateTime(request.tanggal_persetujuan, request.jam_persetujuan)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new-request">
            <Card>
              <CardHeader>
                <CardTitle>Ajukan Izin Kendaraan Baru</CardTitle>
                <CardDescription>
                  Isi form berikut untuk mengajukan izin penggunaan kendaraan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VehicleRequestForm 
                  userNik={user.nik}
                  userName={user.name}
                  onSubmitSuccess={handleRequestSubmitted}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}