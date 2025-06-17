import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // If a specific role is required, check if the user has that role
  if (requiredRole && userData?.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute;
