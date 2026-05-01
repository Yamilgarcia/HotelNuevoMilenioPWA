import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase.config";
import UserFormModal from "../components/UserFormModal";

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

import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import SyncIcon from "@mui/icons-material/Sync";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

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

async function getFunctionErrorMessage(fnError, fallback) {
  if (fnError?.context?.json) {
    try {
      const body = await fnError.context.json();
      if (body?.error) return body.error;
    } catch {
      return fnError.message || fallback;
    }
  }

  return fnError?.message || fallback;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        "id, email, nombre, role, username, phone, address, birth_date, status, cargo, avatar_url, created_at, updated_at"
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

  function openCreateModal() {
    setSelectedUser({
      ...EMPTY_USER,
      role: "recepcionista",
      status: "activo",
    });
    setModalMode("create");
    setModalOpen(true);
    setError("");
    setSuccess("");
  }

  function openEditModal(user) {
    setSelectedUser(user);
    setModalMode("edit");
    setModalOpen(true);
    setError("");
    setSuccess("");
  }

  function openViewModal(user) {
    setSelectedUser(user);
    setModalMode("view");
    setModalOpen(true);
    setError("");
    setSuccess("");
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedUser(EMPTY_USER);
  }

  async function handleCreate(payload) {
    setSaving(true);
    setError("");
    setSuccess("");

    const body = {
      email: payload.email,
      password: payload.password,
      nombre: payload.nombre,
      username: payload.username || null,
      phone: payload.phone || null,
      address: payload.address || null,
      birth_date: payload.birth_date || null,
      cargo: payload.cargo || null,
      role: payload.role,
      status: payload.status,
      avatar_url: payload.avatar_url || null,
    };

    const { data, error: fnError } = await supabase.functions.invoke(
      "admin-create-user",
      { body }
    );

    if (fnError) {
      setError(
        await getFunctionErrorMessage(
          fnError,
          "No se pudo crear el usuario."
        )
      );
      setSaving(false);
      return;
    }

    if (data?.error) {
      setError(data.error);
      setSaving(false);
      return;
    }

    setSuccess(data?.message || "Usuario creado correctamente.");
    setModalOpen(false);
    setSaving(false);
    await loadUsers();
  }

  async function handleUpdate(payload) {
    if (!payload?.id) return;

    setSaving(true);
    setError("");
    setSuccess("");

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
      setSaving(false);
      return;
    }

    const nextUser = normalizeProfile(data);

    setUsers((current) =>
      current.map((item) => (item.id === nextUser.id ? nextUser : item))
    );

    setSuccess("Usuario actualizado correctamente.");
    setModalOpen(false);
    setSaving(false);
  }

  async function handleSave(payload) {
    if (modalMode === "create") {
      await handleCreate(payload);
      return;
    }

    await handleUpdate(payload);
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === "activo" ? "inactivo" : "activo";

    setSaving(true);
    setError("");
    setSuccess("");

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message || "No se pudo cambiar el estado.");
      setSaving(false);
      return;
    }

    const nextUser = normalizeProfile(data);

    setUsers((current) =>
      current.map((item) => (item.id === nextUser.id ? nextUser : item))
    );

    setSuccess(
      nextStatus === "activo"
        ? "Usuario activado correctamente."
        : "Usuario desactivado correctamente."
    );

    setSaving(false);
  }

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
          <GroupIcon sx={{ color: "#38bdf8", fontSize: "2.5rem" }} />
          Administración de Usuarios
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1Icon />}
            onClick={openCreateModal}
            disabled={saving}
            sx={{
              bgcolor: "#2563eb",
              fontWeight: 700,
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            Agregar usuario
          </Button>

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
      </Box>

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

      {success && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "rgba(16, 185, 129, 0.12)",
            color: "#10b981",
            border: "1px solid #10b981",
            borderRadius: 2,
          }}
        >
          <strong>Listo:</strong> {success}
        </Paper>
      )}

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
          <TextField
            select
            size="small"
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              width: "150px",
              "& .MuiSelect-select": { color: "white" },
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(0,0,0,0.2)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "#38bdf8" },
              },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
              "& .MuiSelect-icon": { color: "white" },
            }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: "#1e293b",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.1)",
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

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          bgcolor: "#1e293b",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: "8px" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#38bdf8",
            borderRadius: "4px",
          },
        }}
      >
        <Table sx={{ minWidth: 1200 }} size="medium">
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
                  <TableCell sx={tableCellBodyStyle}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={user.avatar_url || undefined}
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
                        border: `1px solid ${
                          user.status === "inactivo" ? "#ef4444" : "#10b981"
                        }`,
                      }}
                    />
                  </TableCell>

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
                        color:
                          user.status === "activo" ? "#ef4444" : "#10b981",
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

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={pageSize}
          page={currentPage - 1}
          onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
          onRowsPerPageChange={(e) =>
            setPageSize(parseInt(e.target.value, 10))
          }
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