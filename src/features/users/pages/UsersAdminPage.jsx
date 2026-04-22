import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase.config";
import UserFormModal from "../components/UserFormModal";
import "../styles/users-admin.css";

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
        "id, email, nombre, role, username, phone, address, birth_date, status, cargo, avatar_url, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message || "No se pudieron cargar los usuarios.");
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers((data || []).map(normalizeProfile));
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
      .select(
        "id, email, nombre, role, username, phone, address, birth_date, status, cargo, avatar_url"
      )
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

    setSaving(false);
    setModalOpen(false);
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === "activo" ? "inactivo" : "activo";

    setSaving(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", user.id)
      .select(
        "id, email, nombre, role, username, phone, address, birth_date, status, cargo, avatar_url"
      )
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

    setSaving(false);
  }

  return (
    <section className="users-admin">
      <header className="users-admin__page-header">
        <div>
          <h1 className="users-admin__title">
            <span className="users-admin__title-icon">👥</span>
            Usuarios
          </h1>
          <p className="users-admin__subtitle">
            Administración de perfiles del sistema.
          </p>
        </div>

        <nav className="users-admin__breadcrumb" aria-label="breadcrumb">
          <span>Inicio</span>
          <span>/</span>
          <strong>Usuarios</strong>
        </nav>
      </header>

      <div className="users-admin__card">
        <div className="users-admin__card-header">
          <h2>Perfiles</h2>

          <select
            className="users-admin__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <div className="users-admin__toolbar">
          <button
            className="users-admin__primary-btn"
            onClick={loadUsers}
            disabled={loading || saving}
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>

        <div className="users-admin__filters">
          <div className="users-admin__page-size">
            <label htmlFor="pageSize">Mostrar</label>
            <select
              id="pageSize"
              className="users-admin__select users-admin__select--small"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>registros</span>
          </div>

          <div className="users-admin__search-wrap">
            <label htmlFor="usersSearch">Buscar:</label>
            <input
              id="usersSearch"
              type="search"
              className="users-admin__input"
              placeholder="Nombre, usuario, correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div
            style={{
              margin: "0 1.25rem 1rem",
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              background: "#fff1f2",
              color: "#be123c",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="users-admin__table-wrap">
          <table className="users-admin__table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Nombre y Foto</th>
                <th>Usuario</th>
                <th>Fecha nacimiento</th>
                <th>Teléfono | Correo</th>
                <th>Dirección</th>
                <th>Cargo | Rol</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">
                    <div className="users-admin__empty">Cargando usuarios...</div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="users-admin__empty">
                      No se encontraron usuarios.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{startIndex + index + 1}</td>

                    <td>
                      <div className="users-admin__name-cell">
                        <div className="users-admin__user-name">
                          {safeText(user.nombre)}
                        </div>
                        <div className="users-admin__avatar">
                          {getInitials(user)}
                        </div>
                      </div>
                    </td>

                    <td>{safeText(user.username)}</td>
                    <td>{formatDate(user.birth_date)}</td>
                    <td>
                      <div>{safeText(user.phone)}</div>
                      <div className="users-admin__muted">{safeText(user.email)}</div>
                    </td>
                    <td>{safeText(user.address)}</td>
                    <td>
                      <div>{safeText(user.cargo)}</div>
                      <div className="users-admin__muted">
                        {getRoleLabel(user.role)}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`users-admin__status-badge ${
                          user.status === "activo"
                            ? "users-admin__status-badge--active"
                            : "users-admin__status-badge--inactive"
                        }`}
                      >
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td>
                      <div className="users-admin__actions">
                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--warning"
                          title="Editar"
                          onClick={() => openEditModal(user)}
                          disabled={saving}
                        >
                          ✏️
                        </button>

                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--info"
                          title="Ver"
                          onClick={() => openViewModal(user)}
                          disabled={saving}
                        >
                          👁
                        </button>

                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--secondary"
                          title={
                            user.status === "activo" ? "Desactivar" : "Activar"
                          }
                          onClick={() => handleToggleStatus(user)}
                          disabled={saving}
                        >
                          ⏻
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="users-admin__mobile-list">
          {loading ? (
            <div className="users-admin__empty">Cargando usuarios...</div>
          ) : paginatedUsers.length === 0 ? (
            <div className="users-admin__empty">No se encontraron usuarios.</div>
          ) : (
            paginatedUsers.map((user, index) => (
              <article className="users-admin__mobile-card" key={user.id}>
                <div className="users-admin__mobile-head">
                  <div className="users-admin__avatar users-admin__avatar--lg">
                    {getInitials(user)}
                  </div>

                  <div className="users-admin__mobile-head-text">
                    <strong>{safeText(user.nombre)}</strong>
                    <span>@{safeText(user.username)}</span>
                  </div>

                  <span
                    className={`users-admin__status-badge ${
                      user.status === "activo"
                        ? "users-admin__status-badge--active"
                        : "users-admin__status-badge--inactive"
                    }`}
                  >
                    {getStatusLabel(user.status)}
                  </span>
                </div>

                <div className="users-admin__mobile-grid">
                  <div>
                    <span className="users-admin__label">N°</span>
                    <p>{startIndex + index + 1}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Cargo</span>
                    <p>{safeText(user.cargo)}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Rol</span>
                    <p>{getRoleLabel(user.role)}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Correo</span>
                    <p>{safeText(user.email)}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Teléfono</span>
                    <p>{safeText(user.phone)}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Fecha nacimiento</span>
                    <p>{formatDate(user.birth_date)}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Dirección</span>
                    <p>{safeText(user.address)}</p>
                  </div>
                </div>

                <div className="users-admin__actions users-admin__actions--mobile">
                  <button
                    className="users-admin__icon-btn users-admin__icon-btn--warning"
                    onClick={() => openEditModal(user)}
                    disabled={saving}
                  >
                    ✏️
                  </button>
                  <button
                    className="users-admin__icon-btn users-admin__icon-btn--info"
                    onClick={() => openViewModal(user)}
                    disabled={saving}
                  >
                    👁
                  </button>
                  <button
                    className="users-admin__icon-btn users-admin__icon-btn--secondary"
                    onClick={() => handleToggleStatus(user)}
                    disabled={saving}
                  >
                    ⏻
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="users-admin__footer">
          <p>
            Mostrando registros del{" "}
            <strong>{filteredUsers.length === 0 ? 0 : startIndex + 1}</strong> al{" "}
            <strong>{Math.min(startIndex + pageSize, filteredUsers.length)}</strong>{" "}
            de un total de <strong>{filteredUsers.length}</strong> registros
          </p>

          <div className="users-admin__pagination">
            <button
              className="users-admin__page-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>

            <span className="users-admin__page-indicator">{currentPage}</span>

            <button
              className="users-admin__page-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

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
    </section>
  );
}