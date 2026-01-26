import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import GuardDashboard from './pages/GuardDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';

const HomePage = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user.role === 'GUARD') {
    return <Navigate to="/guard" replace />;
  } else if (user.role === 'SUPERVISOR') {
    return <Navigate to="/supervisor" replace />;
  } else {
    // Invalid role - redirect to login
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomePage />} />
          
          <Route
            path="/guard"
            element={
              <ProtectedRoute allowedRoles={['GUARD']}>
                <GuardDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          

          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
