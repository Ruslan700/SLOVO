import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectAuthInitialized } from './authSlice';

const RequireAuth = () => {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const initialized = useAppSelector(selectAuthInitialized);
  const location = useLocation();

  if (!initialized) return null;
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

export default RequireAuth;
