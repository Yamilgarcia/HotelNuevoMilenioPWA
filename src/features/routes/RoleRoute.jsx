import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/logic/AuthProvider";

export default function RoleRoute({ allowedRoles = [] }) {
  const { loading, role, isAuthenticated } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem" }}>Validando permisos...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}