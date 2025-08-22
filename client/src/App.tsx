import { useState, useEffect, useCallback } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { HRDashboard } from '@/components/HRDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { trpc } from '@/utils/trpc';
import type { User as UserType, UserRole } from '../../server/src/schema';

// Mock users for demonstration (since backend handlers are stubs)
const MOCK_USERS = [
  { id: 1, nik: '001', password: 'password', name: 'Ahmad Pratama', role: 'Karyawan' as const, fcm_token: null, created_at: new Date('2023-01-15') },
  { id: 2, nik: '002', password: 'password', name: 'Siti Rahayu', role: 'HR' as const, fcm_token: null, created_at: new Date('2023-01-10') },
  { id: 3, nik: '003', password: 'password', name: 'Budi Santoso', role: 'Admin' as const, fcm_token: null, created_at: new Date('2023-01-05') }
];

interface AuthState {
  user: UserType | null;
  token: string | null;
  isLoading: boolean;
}

function App() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true
  });

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData) as UserType;
        setAuth({ user, token, isLoading: false });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setAuth({ user: null, token: null, isLoading: false });
      }
    } else {
      setAuth({ user: null, token: null, isLoading: false });
    }
  }, []);

  const handleLogin = useCallback(async (nik: string, password: string) => {
    try {
      // STUB IMPLEMENTATION: Since backend handlers are stubs, using mock authentication
      const mockUser = MOCK_USERS.find(u => u.nik === nik && u.password === password);
      if (!mockUser) {
        throw new Error('NIK atau password salah');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = {
        user: mockUser,
        token: `mock_jwt_token_${mockUser.id}`
      };
      
      // Store authentication data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      setAuth({
        user: response.user,
        token: response.token,
        isLoading: false
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setAuth({ user: null, token: null, isLoading: false });
  }, []);

  // Show loading spinner while checking authentication
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (auth.user?.role) {
      case 'Karyawan':
        return <EmployeeDashboard user={auth.user} onLogout={handleLogout} />;
      case 'HR':
        return <HRDashboard user={auth.user} onLogout={handleLogout} />;
      case 'Admin':
        return <AdminDashboard user={auth.user} onLogout={handleLogout} />;
      default:
        return (
          <div className="min-h-screen bg-red-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-4">Your role is not recognized.</p>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
}

export default App;