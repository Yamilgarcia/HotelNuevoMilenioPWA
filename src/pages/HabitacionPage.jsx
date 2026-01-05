import HabitacionForm from "../features/habitaciones/ui/HabitacionForm";
import { useHabitaciones } from "../features/habitaciones/logic/useHabitaciones";

export default function HabitacionPage() {
  const { handleSave } = useHabitaciones();

  return (
    <section style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Registrar habitación</h1>
      <HabitacionForm onSave={handleSave} />
    </section>
  );
}
