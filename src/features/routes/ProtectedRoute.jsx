import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/logic/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem" }}>Cargando sesión...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}