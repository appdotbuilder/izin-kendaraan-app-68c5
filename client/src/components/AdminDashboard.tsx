import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, Clock, CheckCircle, XCircle, LogOut, User, Bell, 
  Download, Filter, Calendar, FileSpreadsheet, BarChart3
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, IzinKendaraan, IzinStatus } from '../../../server/src/schema';

// Mock data for demonstration (since backend handlers are stubs)
const MOCK_ADMIN_REQUESTS: IzinKendaraan[] = [
  {
    id: 1,
    nama_pemakai: 'Ahmad Pratama',
    nik: '001',
    nama_sopir: 'Joko Susilo',
    nomor_polisi: 'B 1234 ABC',
    tujuan: 'Kunjungan klien di Jakarta Selatan',
    tanggal_berangkat: new Date(),
    jam_berangkat: '08:00',
    tanggal_kembali: new Date(),
    jam_kembali: '17:00',
    keterangan: 'Perlu membawa laptop dan proyektor',
    status: 'Pending' as IzinStatus,
    tanggal_persetujuan: null,
    jam_persetujuan: null,
    created_at: new Date()
  },
  {
    id: 2,
    nama_pemakai: 'Dewi Lestari',
    nik: '004',
    nama_sopir: 'Bambang Wijaya',
    nomor_polisi: 'B 5678 DEF',
    tujuan: 'Meeting dengan vendor teknologi',
    tanggal_berangkat: new Date(Date.now() - 86400000), // Yesterday
    jam_berangkat: '09:30',
    tanggal_kembali: new Date(Date.now() - 86400000),
    jam_kembali: '15:00',
    keterangan: null,
    status: 'Disetujui' as IzinStatus,
    tanggal_persetujuan: new Date(Date.now() - 172800000), // 2 days ago
    jam_persetujuan: '10:15',
    created_at: new Date(Date.now() - 259200000) // 3 days ago
  },
  {
    id: 3,
    nama_pemakai: 'Rizki Hamdani',
    nik: '005',
    nama_sopir: 'Slamet Riyadi',
    nomor_polisi: 'B 9999 GHI',
    tujuan: 'Inspeksi lapangan proyek di Bogor',
    tanggal_berangkat: new Date(Date.now() + 86400000), // Tomorrow
    jam_berangkat: '07:00',
    tanggal_kembali: new Date(Date.now() + 86400000),
    jam_kembali: '18:00',
    keterangan: 'Membawa peralatan survei',
    status: 'Disetujui' as IzinStatus,
    tanggal_persetujuan: new Date(),
    jam_persetujuan: '14:30',
    created_at: new Date(Date.now() - 86400000)
  },
  {
    id: 4,
    nama_pemakai: 'Maya Sari',
    nik: '006',
    nama_sopir: 'Agus Setiawan',
    nomor_polisi: 'B 3333 JKL',
    tujuan: 'Training karyawan di hotel Borobudur',
    tanggal_berangkat: new Date(Date.now() + 172800000), // Day after tomorrow
    jam_berangkat: '08:30',
    tanggal_kembali: new Date(Date.now() + 172800000),
    jam_kembali: '16:30',
    keterangan: 'Acara training leadership',
    status: 'Pending' as IzinStatus,
    tanggal_persetujuan: null,
    jam_persetujuan: null,
    created_at: new Date()
  }
];

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [requests, setRequests] = useState<IzinKendaraan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    start: '',
    end: ''
  });

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      let startDate = new Date();
      let endDate = new Date();

      // Calculate date range based on filter
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'this_week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          startDate = startOfWeek;
          endDate = endOfWeek;
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
          } else {
            // Default to today if custom dates not set
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
          }
          break;
      }

      // STUB IMPLEMENTATION: Using mock data since backend handlers are stubs
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      // Filter mock data based on date range
      const result = MOCK_ADMIN_REQUESTS.filter(req => {
        const reqDate = req.tanggal_berangkat;
        return reqDate >= startDate && reqDate <= endDate;
      });

      setRequests(result);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Set default export date range to current month
  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setExportDateRange({
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    });
  }, []);

  const handleExport = async () => {
    if (!exportDateRange.start || !exportDateRange.end) {
      setNotification('❌ Pilih rentang tanggal untuk export');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsExporting(true);
    try {
      // STUB IMPLEMENTATION: Simulating export since backend handlers are stubs
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      const startDate = new Date(exportDateRange.start);
      const endDate = new Date(exportDateRange.end);
      
      // Filter data for export
      const exportData = MOCK_ADMIN_REQUESTS.filter(req => {
        const reqDate = req.tanggal_berangkat;
        return reqDate >= startDate && reqDate <= endDate;
      });

      // In a real implementation, this would generate an actual Excel file
      // For demo purposes, we'll simulate the download
      const mockFileName = `izin_kendaraan_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.xlsx`;
      
      setNotification(`✅ Data berhasil diexport (${exportData.length} record) - ${mockFileName} (DEMO: File download disimulasikan)`);
      setTimeout(() => setNotification(null), 8000);
    } catch (error) {
      console.error('Export failed:', error);
      setNotification('❌ Gagal export data');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsExporting(false);
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return time ? `${formattedDate} ${time}` : formattedDate;
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Hari Ini';
      case 'this_week': return 'Minggu Ini';
      case 'this_month': return 'Bulan Ini';
      case 'custom': return 'Custom';
      default: return 'Semua';
    }
  };

  const pendingCount = requests.filter(req => req.status === 'Pending').length;
  const approvedCount = requests.filter(req => req.status === 'Disetujui').length;
  const rejectedCount = requests.filter(req => req.status === 'Ditolak').length;
  const totalCount = requests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Admin</h1>
                <p className="text-sm text-gray-600">Laporan dan analisis sistem izin kendaraan</p>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Backend Status Banner */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Bell className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Demo Mode:</strong> Backend menggunakan stub data. Fitur laporan dan export berfungsi dengan mock data untuk demonstrasi.
          </AlertDescription>
        </Alert>

        {notification && (
          <Alert className="mb-6 border-purple-200 bg-purple-50">
            <Bell className="h-4 w-4" />
            <AlertDescription className="text-purple-800">
              {notification}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard Real-time</TabsTrigger>
            <TabsTrigger value="reports">Laporan & Export</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Waktu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Periode</Label>
                    <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Hari Ini</SelectItem>
                        <SelectItem value="this_week">Minggu Ini</SelectItem>
                        <SelectItem value="this_month">Bulan Ini</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateFilter === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label>Tanggal Mulai</Label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal Selesai</Label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <Button onClick={loadRequests} disabled={isLoading}>
                    {isLoading ? 'Memuat...' : 'Refresh'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total ({getFilterLabel()})</p>
                      <p className="text-2xl font-bold text-purple-600">{totalCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                <CardTitle>Data Permohonan Real-time - {getFilterLabel()}</CardTitle>
                <CardDescription>
                  Menampilkan semua permohonan izin kendaraan berdasarkan filter waktu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Memuat data...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada data untuk periode {getFilterLabel().toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-semibold">Nama Pemakai</th>
                          <th className="text-left p-3 font-semibold">NIK</th>
                          <th className="text-left p-3 font-semibold">Tujuan</th>
                          <th className="text-left p-3 font-semibold">Tanggal & Jam Berangkat</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                          <th className="text-left p-3 font-semibold">Tanggal & Jam Persetujuan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request: IzinKendaraan) => (
                          <tr key={request.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{request.nama_pemakai}</p>
                                <p className="text-sm text-gray-500">Sopir: {request.nama_sopir}</p>
                              </div>
                            </td>
                            <td className="p-3 text-sm">{request.nik}</td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{request.tujuan}</p>
                                <p className="text-sm text-gray-500">{request.nomor_polisi}</p>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {formatDateTime(request.tanggal_berangkat, request.jam_berangkat)}
                            </td>
                            <td className="p-3">
                              {getStatusBadge(request.status)}
                            </td>
                            <td className="p-3 text-sm">
                              {request.tanggal_persetujuan 
                                ? formatDateTime(request.tanggal_persetujuan, request.jam_persetujuan)
                                : '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Export Data ke Excel
                </CardTitle>
                <CardDescription>
                  Export data permohonan izin kendaraan ke file Excel berdasarkan rentang tanggal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-start">Tanggal Mulai</Label>
                    <Input
                      id="export-start"
                      type="date"
                      value={exportDateRange.start}
                      onChange={(e) => setExportDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-end">Tanggal Selesai</Label>
                    <Input
                      id="export-end"
                      type="date"
                      value={exportDateRange.end}
                      onChange={(e) => setExportDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-gray-600">
                    File akan didownload dalam format .xlsx
                  </p>
                  <Button 
                    onClick={handleExport}
                    disabled={isExporting || !exportDateRange.start || !exportDateRange.end}
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Mengexport...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export ke Excel
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Statistik</CardTitle>
                <CardDescription>
                  Statistik keseluruhan sistem izin kendaraan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-2xl font-bold text-blue-600">{totalCount}</h3>
                    <p className="text-sm text-gray-600">Total Permohonan Periode Ini</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="text-2xl font-bold text-green-600">
                      {totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}%
                    </h3>
                    <p className="text-sm text-gray-600">Tingkat Persetujuan</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <h3 className="text-2xl font-bold text-yellow-600">{pendingCount}</h3>
                    <p className="text-sm text-gray-600">Menunggu Persetujuan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}