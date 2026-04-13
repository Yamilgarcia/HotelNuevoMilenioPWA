import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import HabitacionPage from "./pages/HabitacionPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./features/pages/LoginPage";

import { AuthProvider } from "./features/auth/logic/AuthProvider";
import ProtectedRoute from "./features/routes/ProtectedRoute";
import RoleRoute from "./features/routes/RoleRoute";

function NoAutorizadoPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>No autorizado</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
    </main>
  );
}

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/no-autorizado" element={<NoAutorizadoPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Acceso para ambos roles */}
            <Route
              element={
                <RoleRoute allowedRoles={["administrador", "recepcionista"]} />
              }
            >
              <Route path="/" element={<DashboardPage />} />
            </Route>

            {/* Solo administrador */}
            <Route element={<RoleRoute allowedRoles={["administrador"]} />}>
              <Route
                path="/RegistrarHabitacion"
                element={<HabitacionPage />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}