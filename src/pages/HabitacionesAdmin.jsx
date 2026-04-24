import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.config";

export default function HabitacionesAdmin() {
  const navigate = useNavigate();
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    numero: "",
  });

  useEffect(() => {
    fetchHabitaciones();
  }, []);

  const fetchHabitaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("habitaciones")
      .select("*")
      .order("numero", { ascending: true });

    if (error) {
      console.error("Error cargando habitaciones:", error);
    } else {
      setHabitaciones(data || []);
    }
    setLoading(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredHabitaciones = habitaciones.filter(
    (hab) =>
      hab.numero?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      hab.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hab.amenidades?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const confirmDelete = (id, numero) => {
    setDeleteDialog({ open: true, id, numero });
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("habitaciones")
        .delete()
        .eq("id", deleteDialog.id);

      if (error) {
        if (error.code === "23503") {
          alert(
            "No se puede eliminar la habitación porque tiene historial de hospedajes. Te sugerimos cambiar su estado a 'Inactiva'.",
          );
        } else {
          throw error;
        }
      } else {
        setHabitaciones(habitaciones.filter((h) => h.id !== deleteDialog.id));
      }
    } catch (error) {
      alert("Hubo un error al eliminar la habitación.");
      console.error(error);
    } finally {
      setDeleteDialog({ open: false, id: null, numero: "" });
    }
  };

  // ESTILOS COMPARTIDOS PARA CELDAS
  const tableCellHeadStyle = {
    color: "#38bdf8",
    fontWeight: "bold",
    bgcolor: "#0f172a", // Fondo más oscuro para el encabezado
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    textTransform: "uppercase",
    fontSize: "0.85rem",
  };

  const tableCellBodyStyle = {
    color: "white",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        margin: "0 auto",
        p: { xs: 1, md: 3 },
        paddingBottom: "2rem",
      }}
    >
      {/* HEADER: Título y Botón Agregar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <span style={{ color: "#38bdf8" }}></span> Catálogo de Habitaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/configuracion/Registrarhabitaciones")}
          sx={{
            bgcolor: "#38bdf8",
            color: "#0f172a",
            fontWeight: "bold",
            borderRadius: 2,
            px: 3,
            "&:hover": { bgcolor: "#0ea5e9" },
          }}
        >
          Agregar nueva
        </Button>
      </Box>

      {/* BARRA DE BÚSQUEDA */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          display: "flex",
          justifyContent: "flex-end",
          bgcolor: "#1e293b",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por número, categoría..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            width: { xs: "100%", sm: "350px" },
            input: { color: "white" },
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(0,0,0,0.2)",
              borderRadius: 2,
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: "#38bdf8" },
              "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#38bdf8" }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* TABLA DE DATOS */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          bgcolor: "#1e293b",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          // ESTO PERMITE VER TODO SIN OCULTAR:
          overflowX: "auto",
          // Scrollbar estilizado para que sea parte del diseño
          "&::-webkit-scrollbar": { height: "8px" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#38bdf8",
            borderRadius: "4px",
          },
        }}
      >
        <Table sx={{ minWidth: 1000 }} size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...tableCellHeadStyle, width: "10%" }}>
                Nombre / Nro
              </TableCell>
              <TableCell sx={{ ...tableCellHeadStyle, width: "15%" }}>
                Categoría
              </TableCell>
              <TableCell sx={{ ...tableCellHeadStyle, width: "10%" }}>
                Precio Base
              </TableCell>
              <TableCell sx={{ ...tableCellHeadStyle, width: "10%" }}>
                Tarifa
              </TableCell>

              {/* AQUÍ ESTÁ EL TRUCO: limitamos el espacio de detalles */}
              <TableCell sx={{ ...tableCellHeadStyle, width: "3%" }}>
                Detalles
              </TableCell>

              <TableCell
                sx={{
                  ...tableCellHeadStyle,
                  width: "10%",
                  textAlign: "center",
                }}
              >
                Estado
              </TableCell>
              <TableCell
                sx={{
                  ...tableCellHeadStyle,
                  width: "10%",
                  textAlign: "center",
                }}
              >
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 5, color: "white" }}
                >
                  Cargando datos...
                </TableCell>
              </TableRow>
            ) : filteredHabitaciones.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 5, color: "rgba(255,255,255,0.5)" }}
                >
                  No se encontraron habitaciones.
                </TableCell>
              </TableRow>
            ) : (
              filteredHabitaciones
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((hab) => (
                  <TableRow
                    key={hab.id}
                    sx={{
                      "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell
                      sx={{
                        ...tableCellBodyStyle,
                        fontWeight: "bold",
                        fontSize: "1.05rem",
                      }}
                    >
                      {hab.numero}
                    </TableCell>
                    <TableCell
                      sx={{ ...tableCellBodyStyle, textTransform: "uppercase" }}
                    >
                      {hab.categoria}
                    </TableCell>
                    <TableCell sx={tableCellBodyStyle}>
                      <span style={{ color: "#10b981", fontWeight: "bold" }}>
                        C$ {hab.precio}
                      </span>
                    </TableCell>
                    <TableCell
                      sx={{
                        ...tableCellBodyStyle,
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      24hr
                    </TableCell>
                    <TableCell
                      sx={{
                        ...tableCellBodyStyle,
                        fontSize: "0.85rem",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {hab.amenidades || "Sin especificar"}
                    </TableCell>
                    <TableCell align="center" sx={tableCellBodyStyle}>
                      <Chip
                        label={hab.estado || "Activa"}
                        size="small"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          bgcolor:
                            hab.estado === "Inactiva"
                              ? "rgba(239, 68, 68, 0.2)"
                              : "rgba(16, 185, 129, 0.2)",
                          color:
                            hab.estado === "Inactiva" ? "#fca5a5" : "#6ee7b7",
                          border: `1px solid ${hab.estado === "Inactiva" ? "#ef4444" : "#10b981"}`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={tableCellBodyStyle}>
                      <IconButton
                        onClick={() =>
                          navigate(
                            `/configuracion/habitaciones/editar/${hab.id}`,
                          )
                        }
                        sx={{
                          color: "#38bdf8",
                          "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => confirmDelete(hab.id, hab.numero)}
                        sx={{
                          color: "#ef4444",
                          "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

        {/* PAGINACIÓN */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredHabitaciones.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Registros por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
          sx={{
            color: "rgba(255,255,255,0.7)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            ".MuiTablePagination-selectIcon": {
              color: "rgba(255,255,255,0.7)",
            },
            ".MuiTablePagination-menuItem": {
              bgcolor: "#1e293b",
              color: "white",
            },
          }}
        />
      </TableContainer>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CON TEMA OSCURO */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, numero: "" })}
        PaperProps={{
          sx: {
            bgcolor: "#1e293b",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: "#ef4444", fontWeight: "bold" }}>
          ¿Eliminar Habitación?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.8)" }}>
            Estás a punto de eliminar la habitación{" "}
            <strong style={{ color: "white" }}>{deleteDialog.numero}</strong>.
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, id: null, numero: "" })
            }
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
