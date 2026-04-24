import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HabitacionForm from "../features/habitaciones/ui/HabitacionForm";
import { useHabitaciones } from "../features/habitaciones/logic/useHabitaciones";
import { Typography, Box, CircularProgress } from "@mui/material";
import { supabase } from "../supabase.config"; // Asegúrate de que esta ruta sea correcta

export default function HabitacionPage() {
  const { id } = useParams(); // Captura el ID de la URL si existe (Ruta de edición)
  const navigate = useNavigate();
  const { handleSave } = useHabitaciones();
  
  const [habitacionAEditar, setHabitacionAEditar] = useState(null);
  const [loading, setLoading] = useState(!!id); // Si hay ID, empezamos cargando

  useEffect(() => {
    // Si la URL trae un ID, buscamos esa habitación en Supabase
    if (id) {
      const fetchHabitacion = async () => {
        try {
          const { data, error } = await supabase
            .from("habitaciones")
            .select("*")
            .eq("id", id)
            .single(); // Trae solo un registro

          if (error) throw error;
          
          setHabitacionAEditar(data);
        } catch (error) {
          console.error("Error al cargar la habitación:", error);
          alert("No se pudo cargar la información de la habitación.");
          navigate("/configuracion/habitaciones"); // Regresa a la tabla si falla
        } finally {
          setLoading(false);
        }
      };
      
      fetchHabitacion();
    }
  }, [id, navigate]);

  // Pantalla de carga mientras trae los datos para editar
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <section style={{ maxWidth: 400, margin: "0 auto", paddingBottom: "2rem" }}>
      <Typography 
        variant="h4" 
        component="h1" 
        align="center" 
        sx={{ color: "white", mb: 3, fontWeight: "bold" }}
      >
        {id ? "Editar habitación" : "Registrar habitación"}
      </Typography>

      {/* Le pasamos la data inicial y el ID al formulario para que sepa cómo actuar */}
      <HabitacionForm 
        onSave={handleSave} 
        initialData={habitacionAEditar} 
        habitacionId={id} 
      />
    </section>
  );
}