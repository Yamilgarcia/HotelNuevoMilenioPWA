import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import HabitacionPage from "./pages/HabitacionPage";
import DashboardPageHabitacion from "./pages/DashboardPage"
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPageHabitacion />} />
       <Route path="/RegistrarHabitacion" element={<HabitacionPage />} />
      </Route>
    </Routes>
  );
}
