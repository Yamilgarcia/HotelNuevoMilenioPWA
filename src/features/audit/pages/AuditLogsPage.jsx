import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { getAuditLogs } from "../services/auditService";
import "./AuditLogsPage.css";

const ACTION_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "INSERT", label: "Creaciones" },
  { value: "UPDATE", label: "Actualizaciones" },
  { value: "DELETE", label: "Eliminaciones" },
  { value: "LOGIN", label: "Inicios de sesión" },
  { value: "LOGOUT", label: "Cierres de sesión" },
  { value: "VIEW_CLIENT_HISTORY", label: "Consulta historial cliente" },
  { value: "EXPORT_REPORT", label: "Exportación de reportes" },
];

const TABLE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "clientes", label: "Clientes" },
  { value: "habitaciones", label: "Habitaciones" },
  { value: "historial_hospedajes", label: "Historial hospedajes" },
  { value: "profiles", label: "Usuarios / perfiles" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "administrador", label: "Administrador" },
  { value: "recepcionista", label: "Recepcionista" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const IGNORED_VISIBLE_FIELDS = [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "updated_by",
];

const FIELD_LABELS = {
  activo: "Activo",
  estado: "Estado",
  numero: "Número",
  precio: "Precio",
  categoria: "Categoría",
  amenidades: "Amenidades",
  nombre: "Nombre",
  nombres: "Nombres",
  apellido: "Apellido",
  apellidos: "Apellidos",
  cedula: "Cédula",
  telefono: "Teléfono",
  correo: "Correo",
  email: "Correo",
  direccion: "Dirección",
  role: "Rol",
  full_name: "Nombre completo",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-NI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === "") return "Vacío";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (isDateString(value)) return formatDate(value);

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Vacío";
  }

  // AQUÍ ESTÁ LA MAGIA: Si el valor es un objeto (como el del huésped)
  if (typeof value === "object") {
    // Si detectamos que es el objeto del huésped (porque tiene cédula o nombre)
    if (value.cedula || value.nombre) {
      return `👤 Huésped: ${value.nombre || 'Sin nombre'}
🆔 Cédula: ${value.cedula || 'N/A'}
👥 Personas: ${value.personas || 1}
💰 Pago: ${value.estadoPago || 'N/A'} (C$ ${value.precioPactado || 0})`;
    }
    
    // Si es cualquier otro objeto, lo formatea como una lista limpia sin llaves {}
    return Object.entries(value)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
      .join('\n');
  }

  return String(value);
}

function getActionLabel(action) {
  const labels = {
    INSERT: "Creación",
    UPDATE: "Actualización",
    DELETE: "Eliminación",
    LOGIN: "Inicio de sesión",
    LOGOUT: "Cierre de sesión",
    VIEW_CLIENT_HISTORY: "Consulta historial",
    EXPORT_REPORT: "Exportación reporte",
  };

  return labels[action] || action || "—";
}

function getTableLabel(tableName) {
  const labels = {
    clientes: "Clientes",
    habitaciones: "Habitaciones",
    historial_hospedajes: "Historial hospedajes",
    profiles: "Usuarios / perfiles",
  };

  return labels[tableName] || tableName || "—";
}

function getActionClass(action) {
  if (action === "INSERT") return "audit-chip audit-chip--insert";
  if (action === "UPDATE") return "audit-chip audit-chip--update";
  if (action === "DELETE") return "audit-chip audit-chip--delete";
  if (action === "LOGIN") return "audit-chip audit-chip--login";
  if (action === "LOGOUT") return "audit-chip audit-chip--logout";
  if (action?.startsWith("VIEW")) return "audit-chip audit-chip--view";
  if (action?.startsWith("EXPORT")) return "audit-chip audit-chip--export";

  return "audit-chip";
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field.replaceAll("_", " ");
}

function getVisibleChangedEntries(changedFields) {
  const entries = Object.entries(changedFields || {});

  return entries.filter(([field, values]) => {
    if (IGNORED_VISIBLE_FIELDS.includes(field)) return false;

    const oldValue = values?.old;
    const newValue = values?.new;

    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  });
}

function getLogData(log) {
  return log?.new_data || log?.old_data || {};
}

function getRecordLabel(log) {
  const data = getLogData(log);

  // 1. Si es una habitación
  if (log?.entity_table === "habitaciones") {
    return data?.numero 
      ? `Habitación ${data.numero}` 
      : `Habitación (Ref: ${String(log?.entity_id).substring(0, 6)})`;
  }

  // 2. Si es un cliente
  if (log?.entity_table === "clientes") {
    const fullName = [
      data?.nombre,
      data?.nombres,
      data?.apellido,
      data?.apellidos,
    ].filter(Boolean).join(" ");

    if (fullName) return fullName;
    if (data?.cedula) return `Cliente con cédula: ${data.cedula}`;
    return `Cliente (Ref: ${String(log?.entity_id).substring(0, 6)})`;
  }

  // 3. Si es un usuario
  if (log?.entity_table === "profiles") {
    return data?.email || data?.correo || data?.full_name || "Usuario del sistema";
  }

  // 4. Si es un HOSPEDAJE (Aquí estaba el error que me mandaste)
  if (log?.entity_table === "historial_hospedajes") {
    if (data?.habitacion_numero) return `Hospedaje en Hab. ${data.habitacion_numero}`;
    
    // Si la BD guardó el ID de la habitación y es un número normal (ej. 1, 2, 3)
    if (data?.habitacion_id && String(data.habitacion_id).length < 5) {
      return `Hospedaje en Hab. ${data.habitacion_id}`;
    }

    // Si tenemos la cédula de quien rentó
    if (data?.cliente_cedula) return `Hospedaje (Cliente: ${data.cliente_cedula})`;
    
    // Si nada de lo anterior existe, mostramos un texto limpio en vez del UUID
    return "Registro de Hospedaje";
  }

  // Para cualquier otra cosa, acortamos el ID para que no rompa el diseño
  return log?.entity_id ? `Registro #${String(log.entity_id).substring(0, 8)}` : "—";
}

function getMovementTitle(log) {
  if (!log) return "Detalle del movimiento";

  const action = getActionLabel(log.action);
  const record = getRecordLabel(log);

  // Mejoramos la gramática. Ej: "Creación de Registro de Hospedaje" 
  // en vez de "Creación en bf6bd77b-..."
  if (record && record !== "—") {
    return `${action} - ${record}`;
  }

  return `${action} en el módulo ${getTableLabel(log.entity_table)}`;
}

function getChangeSummary(log) {
  if (!log) return "—";

  if (log.action === "INSERT") return "Registro creado";
  if (log.action === "DELETE") return "Registro eliminado";
  if (log.action === "LOGIN") return "Usuario inició sesión";
  if (log.action === "LOGOUT") return "Usuario cerró sesión";
  if (log.action === "VIEW_CLIENT_HISTORY")
    return "Consultó historial de cliente";
  if (log.action === "EXPORT_REPORT") return "Exportó un reporte";

  const entries = getVisibleChangedEntries(log.changed_fields);

  if (!entries.length) return "Actualización registrada";

  const [field, values] = entries[0];

  const summary = `${getFieldLabel(field)}: ${formatDisplayValue(
    values?.old,
  )} → ${formatDisplayValue(values?.new)}`;

  if (entries.length === 1) return summary;

  return `${summary} +${entries.length - 1} más`;
}

function ChangedFields({ log }) {
  const entries = getVisibleChangedEntries(log?.changed_fields);

  if (!entries.length) {
    if (log?.action === "INSERT") {
      return (
        <Typography className="audit-empty-text">
          Se creó un nuevo registro.
        </Typography>
      );
    }

    if (log?.action === "DELETE") {
      return (
        <Typography className="audit-empty-text">
          Se eliminó un registro.
        </Typography>
      );
    }

    return (
      <Typography className="audit-empty-text">
        No hay campos importantes modificados para mostrar.
      </Typography>
    );
  }

  return (
    <div className="audit-changes-list">
      {entries.map(([field, values]) => (
        <div className="audit-change-item" key={field}>
          <Typography className="audit-change-field">
            {getFieldLabel(field)}
          </Typography>

          <div className="audit-change-values">
            <div>
              <span>Antes</span>
              <p>{formatDisplayValue(values?.old)}</p>
            </div>

            <div>
              <span>Después</span>
              <p>{formatDisplayValue(values?.new)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    table: "all",
    source: "all",
    actorRole: "all",
    dateFrom: "",
    dateTo: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedLog, setSelectedLog] = useState(null);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters).filter(([key, value]) => {
      if (key === "search") return Boolean(value.trim());
      if (key === "source") return false;
      return value && value !== "all";
    }).length;
  }, [appliedFilters]);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await getAuditLogs({
        page: page + 1,
        pageSize,
        filters: appliedFilters,
      });

      setItems(response.items);
      setTotalRows(response.total);
    } catch (err) {
      setError(err.message || "No se pudo cargar la auditoría.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, appliedFilters]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  }

  function handleClearFilters() {
    const cleanFilters = {
      search: "",
      action: "all",
      table: "all",
      source: "all",
      actorRole: "all",
      dateFrom: "",
      dateTo: "",
    };

    setFilters(cleanFilters);
    setAppliedFilters(cleanFilters);
    setPage(0);
  }

  function handleChangePage(_event, newPage) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  }

  return (
    <main className="audit-page">
      <Box className="audit-header">
        <div>
          <Typography component="h1" className="audit-title">
            Auditoría del sistema
          </Typography>
          <Typography className="audit-subtitle">
            Registro claro de los movimientos realizados en el sistema del
            hotel.
          </Typography>
        </div>

        <Chip
          label={`${totalRows} registros`}
          className="audit-total-chip"
          variant="outlined"
        />
      </Box>

      <Paper className="audit-filters-card" elevation={0}>
        <Box
          component="form"
          className="audit-filters-form"
          onSubmit={handleSubmit}
        >
          <TextField
            label="Buscar"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            size="small"
            placeholder="Usuario, habitación, cliente o acción"
            className="audit-filter-search"
          />

          <TextField
            select
            label="Acción"
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            size="small"
          >
            {ACTION_OPTIONS.map((option) => (
              <MenuItem value={option.value} key={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Módulo"
            name="table"
            value={filters.table}
            onChange={handleFilterChange}
            size="small"
          >
            {TABLE_OPTIONS.map((option) => (
              <MenuItem value={option.value} key={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Rol"
            name="actorRole"
            value={filters.actorRole}
            onChange={handleFilterChange}
            size="small"
          >
            {ROLE_OPTIONS.map((option) => (
              <MenuItem value={option.value} key={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Desde"
            name="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Hasta"
            name="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <div className="audit-filter-actions">
            <Button
              type="submit"
              variant="contained"
              className="audit-btn-main"
            >
              Filtrar
            </Button>

            <Button
              type="button"
              variant="outlined"
              className="audit-btn-clear"
              onClick={handleClearFilters}
            >
              Limpiar
            </Button>
          </div>
        </Box>

        {activeFiltersCount > 0 && (
          <Typography className="audit-active-filters">
            Filtros activos: {activeFiltersCount}
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" className="audit-alert">
          {error}
        </Alert>
      )}

      <Paper className="audit-table-card" elevation={0}>
        {loading ? (
          <div className="audit-loading">
            <CircularProgress size={30} />
            <Typography>Cargando auditoría...</Typography>
          </div>
        ) : items.length === 0 ? (
          <div className="audit-empty">
            <Typography className="audit-empty-title">
              No hay registros de auditoría
            </Typography>
            <Typography className="audit-empty-text">
              No se encontraron movimientos con los filtros actuales.
            </Typography>
          </div>
        ) : (
          <>
            <div className="audit-table-wrap">
              <Table className="audit-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Acción</TableCell>
                    <TableCell>Módulo</TableCell>
                    <TableCell>Registro</TableCell>
                    <TableCell>Cambio principal</TableCell>
                    <TableCell align="right">Detalle</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <span className="audit-date">
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="audit-user-cell">
                          <span>{item.actor_email || "Sin usuario"}</span>
                          {item.actor_role && <small>{item.actor_role}</small>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={getActionLabel(item.action)}
                          className={getActionClass(item.action)}
                        />
                      </TableCell>

                      <TableCell>{getTableLabel(item.entity_table)}</TableCell>

                      <TableCell>
                        <span className="audit-entity-id">
                          {getRecordLabel(item)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="audit-change-preview">
                          {getChangeSummary(item)}
                        </span>
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          className="audit-detail-btn"
                          onClick={() => setSelectedLog(item)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              rowsPerPage={pageSize}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={PAGE_SIZE_OPTIONS}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="audit-dialog-title">
          {selectedLog
            ? getMovementTitle(selectedLog)
            : "Detalle del movimiento"}
        </DialogTitle>

        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={2}>
              <Box>
                <Typography className="audit-section-title">Resumen</Typography>

                <div className="audit-detail-grid">
                  <div>
                    <span>Fecha</span>
                    <p>{formatDate(selectedLog.created_at)}</p>
                  </div>

                  <div>
                    <span>Usuario</span>
                    <p>{selectedLog.actor_email || "Sin usuario"}</p>
                  </div>

                  <div>
                    <span>Rol</span>
                    <p>{selectedLog.actor_role || "—"}</p>
                  </div>

                  <div>
                    <span>Acción</span>
                    <p>{getActionLabel(selectedLog.action)}</p>
                  </div>

                  <div>
                    <span>Módulo</span>
                    <p>{getTableLabel(selectedLog.entity_table)}</p>
                  </div>

                  <div>
                    <span>Registro</span>
                    <p>{getRecordLabel(selectedLog)}</p>
                  </div>
                </div>
              </Box>

              <Divider />

              <Box>
                <Typography className="audit-section-title">
                  Cambios importantes
                </Typography>

                <ChangedFields log={selectedLog} />
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedLog(null)}
            variant="contained"
            className="audit-btn-main"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
