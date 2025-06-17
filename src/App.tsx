import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ScheduleViewer from './pages/ScheduleViewer';
import AdminDashboard from './pages/AdminDashboard';
import Header from './components/Header';
import CompleteProfilePage from './pages/CompleteProfilePage';
import DebugInfo from './components/DebugInfo';
import './App.css';

function App() {
  const { currentUser, loading } = useAuth();

  // Show loading state when checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Debug information for troubleshooting */}
        <DebugInfo />
        
        {/* Show header only when user is logged in */}
        {currentUser && <Header />}
        
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              currentUser ? <Navigate to="/" /> : <LoginPage />
            } />
            <Route path="/signup" element={
              currentUser ? <Navigate to="/" /> : <SignupPage />
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <PrivateRoute>
                <ScheduleViewer />
              </PrivateRoute>
            } />
            
            <Route path="/admin" element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/complete-profile" element={
              <PrivateRoute>
                <CompleteProfilePage />
              </PrivateRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App
