import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase.config";
import UserFormModal from "../components/UserFormModal"; // Mantendremos tu modal funcionando

// Importaciones de Material-UI
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
  MenuItem,
  Avatar,
} from "@mui/material";

// Iconos
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import SyncIcon from "@mui/icons-material/Sync";
import GroupIcon from "@mui/icons-material/Group";

const ROLE_OPTIONS = ["administrador", "recepcionista"];
const CARGO_OPTIONS = [
  "Recepción",
  "Limpieza",
  "Mantenimiento",
  "Gerencia",
  "Administración",
];

const EMPTY_USER = {
  id: "",
  nombre: "",
  email: "",
  username: "",
  phone: "",
  address: "",
  birth_date: "",
  cargo: "",
  role: "recepcionista",
  status: "activo",
  avatar_url: "",
};

// --- Helpers ---
function normalizeProfile(row) {
  return {
    id: row.id ?? "",
    nombre: row.nombre ?? "",
    email: row.email ?? "",
    username: row.username ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    birth_date: row.birth_date ?? "",
    cargo: row.cargo ?? "",
    role: row.role ?? "recepcionista",
    status: row.status === "inactivo" ? "inactivo" : "activo",
    avatar_url: row.avatar_url ?? "",
  };
}

function formatDate(dateValue) {
  if (!dateValue) return "Pendiente";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Pendiente";
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function safeText(value) {
  return value?.trim() ? value : "Pendiente";
}
function getStatusLabel(status) {
  return status === "inactivo" ? "Inactivo" : "Activo";
}
function getRoleLabel(role) {
  if (role === "administrador") return "Administrador";
  if (role === "recepcionista") return "Recepcionista";
  return "Pendiente";
}

function getInitials(user) {
  const name = user.nombre?.trim() || user.username || user.email || "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
// ----------------

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedUser, setSelectedUser] = useState(EMPTY_USER);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select(
        "id, email, nombre, role, username, phone, address, birth_date, status, cargo, avatar_url, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message || "No se pudieron cargar los usuarios.");
      setUsers([]);
    } else {
      setUsers((data || []).map(normalizeProfile));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const statusOk =
        statusFilter === "todos" ? true : user.status === statusFilter;
      const haystack = [
        user.nombre,
        user.username,
        user.email,
        user.phone,
        user.address,
        user.cargo,
        user.role,
        user.status,
      ]
        .join(" ")
        .toLowerCase();
      const searchOk = !term || haystack.includes(term);
      return statusOk && searchOk;
    });
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function openEditModal(user) {
    setSelectedUser(user);
    setModalMode("edit");
    setModalOpen(true);
  }
  function openViewModal(user) {
    setSelectedUser(user);
    setModalMode("view");
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedUser(EMPTY_USER);
  }

  async function handleSave(payload) {
    if (!payload?.id) return;
    setSaving(true);
    setError("");

    const updates = {
      nombre: payload.nombre.trim(),
      username: payload.username.trim() || null,
      phone: payload.phone.trim() || null,
      address: payload.address.trim() || null,
      birth_date: payload.birth_date || null,
      cargo: payload.cargo.trim() || null,
      role: payload.role,
      status: payload.status,
      avatar_url: payload.avatar_url.trim() || null,
    };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", payload.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message || "No se pudo actualizar el usuario.");
    } else {
      const nextUser = normalizeProfile(data);
      setUsers((current) =>
        current.map((item) => (item.id === nextUser.id ? nextUser : item)),
      );
      setModalOpen(false);
    }
    setSaving(false);
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === "activo" ? "inactivo" : "activo";
    setSaving(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message || "No se pudo cambiar el estado.");
    } else {
      const nextUser = normalizeProfile(data);
      setUsers((current) =>
        current.map((item) => (item.id === nextUser.id ? nextUser : item)),
      );
    }
    setSaving(false);
  }

  // --- ESTILOS COMPARTIDOS ---
  const tableCellHeadStyle = {
    color: "#38bdf8",
    fontWeight: "bold",
    bgcolor: "#0f172a",
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
      {/* HEADER */}
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
          <GroupIcon sx={{ color: "#38bdf8", fontSize: "2.5rem" }} />{" "}
          Administración de Usuarios
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SyncIcon />}
          onClick={loadUsers}
          disabled={loading || saving}
          sx={{
            color: "#38bdf8",
            borderColor: "#38bdf8",
            "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
          }}
        >
          {loading ? "Cargando..." : "Recargar"}
        </Button>
      </Box>

      {/* MENSAJE DE ERROR */}
      {error && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            border: "1px solid #ef4444",
            borderRadius: 2,
          }}
        >
          <strong>Error:</strong> {error}
        </Paper>
      )}

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "space-between",
          bgcolor: "#1e293b",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Filtro Estado */}
          <TextField
            select
            size="small"
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              width: "150px",
              // Esto hace blanca la letra de la opción seleccionada (cuando está cerrado)
              "& .MuiSelect-select": { color: "white" },
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(0,0,0,0.2)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "#38bdf8" },
              },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
              "& .MuiSelect-icon": { color: "white" },
            }}
            // ESTO ES LO NUEVO: Estiliza la lista flotante que se abre
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: "#1e293b", // Fondo oscuro
                    color: "white", // Letras blancas
                    border: "1px solid rgba(255,255,255,0.1)", // Borde sutil
                  },
                },
              },
            }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="activo">Activos</MenuItem>
            <MenuItem value="inactivo">Inactivos</MenuItem>
          </TextField>
        </Box>

        {/* Buscador */}
        <TextField
          size="small"
          placeholder="Buscar nombre, usuario, correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 900 }} size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={tableCellHeadStyle}>Perfil</TableCell>
              <TableCell sx={tableCellHeadStyle}>Contacto</TableCell>
              <TableCell sx={tableCellHeadStyle}>Cargo & Rol</TableCell>
              <TableCell sx={{ ...tableCellHeadStyle, textAlign: "center" }}>
                Estatus
              </TableCell>
              <TableCell sx={{ ...tableCellHeadStyle, textAlign: "center" }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 5, color: "white" }}
                >
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 5, color: "rgba(255,255,255,0.5)" }}
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                    transition: "background-color 0.2s",
                  }}
                >
                  {/* Célula: Perfil */}
                  <TableCell sx={tableCellBodyStyle}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: "#0ea5e9",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        {getInitials(user)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="white"
                        >
                          {safeText(user.nombre)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          @{safeText(user.username)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Célula: Contacto */}
                  <TableCell sx={tableCellBodyStyle}>
                    <Typography variant="body2" color="white">
                      📞 {safeText(user.phone)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      ✉️ {safeText(user.email)}
                    </Typography>
                  </TableCell>

                  {/* Célula: Cargo y Rol */}
                  <TableCell sx={tableCellBodyStyle}>
                    <Typography variant="body2" color="white" fontWeight="bold">
                      {safeText(user.cargo)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#38bdf8", textTransform: "uppercase" }}
                    >
                      {getRoleLabel(user.role)}
                    </Typography>
                  </TableCell>

                  {/* Célula: Estatus */}
                  <TableCell align="center" sx={tableCellBodyStyle}>
                    <Chip
                      label={getStatusLabel(user.status)}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        bgcolor:
                          user.status === "inactivo"
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(16, 185, 129, 0.2)",
                        color:
                          user.status === "inactivo" ? "#fca5a5" : "#6ee7b7",
                        border: `1px solid ${user.status === "inactivo" ? "#ef4444" : "#10b981"}`,
                      }}
                    />
                  </TableCell>

                  {/* Célula: Acciones */}
                  <TableCell align="center" sx={tableCellBodyStyle}>
                    <IconButton
                      onClick={() => openViewModal(user)}
                      disabled={saving}
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => openEditModal(user)}
                      disabled={saving}
                      sx={{
                        color: "#38bdf8",
                        "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleToggleStatus(user)}
                      disabled={saving}
                      sx={{
                        color: user.status === "activo" ? "#ef4444" : "#10b981",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
                      }}
                      title={
                        user.status === "activo" ? "Desactivar" : "Activar"
                      }
                    >
                      <PowerSettingsNewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* PAGINACIÓN (Conectada a tu lógica manual) */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={pageSize}
          page={currentPage - 1} // MUI usa base 0, tu lógica base 1
          onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
          onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value, 10))}
          labelRowsPerPage="Registros:"
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

      {/* Modal de Formulario */}
      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={selectedUser}
        onClose={closeModal}
        onSave={handleSave}
        roleOptions={ROLE_OPTIONS}
        cargoOptions={CARGO_OPTIONS}
        saving={saving}
      />
    </Box>
  );
}
