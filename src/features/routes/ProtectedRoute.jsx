import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/logic/AuthProvider";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center", 
          height: "100vh",
          bgcolor: "#0f172a", // Fondo un poco más oscuro que el layout principal para dar profundidad
          color: "white"
        }}
      >
        <CircularProgress sx={{ color: "#38bdf8", mb: 3 }} />
        <Typography variant="h6" sx={{ letterSpacing: 2, fontWeight: 300 }}>
          VALIDANDO SESIÓN...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}