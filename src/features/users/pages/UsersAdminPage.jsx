import { useEffect, useMemo, useState } from "react";
import UserFormModal from "../components/UserFormModal";
import "../styles/users-admin.css";

const USER_TYPE_OPTIONS = [
  "Administrador",
  "Recepción",
  "Limpieza",
  "Mantenimiento",
  "Empleado",
];

const MOCK_USERS = [
  {
    id: 1,
    first_name: "Luisa",
    last_name_paternal: "",
    last_name_maternal: "",
    birth_date: "",
    email: "luiii@gmail.com",
    phone: "",
    address: "",
    username: "luis12",
    user_type: "Limpieza",
    status: "Activo",
  },
  {
    id: 2,
    first_name: "Dayana",
    last_name_paternal: "",
    last_name_maternal: "",
    birth_date: "",
    email: "daya@gmail.com",
    phone: "",
    address: "",
    username: "daya123",
    user_type: "Empleado",
    status: "Activo",
  },
  {
    id: 3,
    first_name: "Alisson",
    last_name_paternal: "Men",
    last_name_maternal: "",
    birth_date: "",
    email: "se@gmail.com",
    phone: "",
    address: "",
    username: "alimen",
    user_type: "Administrador",
    status: "Activo",
  },
];

const EMPTY_USER = {
  id: null,
  first_name: "",
  last_name_paternal: "",
  last_name_maternal: "",
  birth_date: "",
  email: "",
  phone: "",
  address: "",
  username: "",
  user_type: "",
  status: "Activo",
};

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

function fullName(user) {
  return [
    user.first_name,
    user.last_name_paternal,
    user.last_name_maternal,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getInitials(user) {
  const name = fullName(user) || user.username || "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function safeText(value) {
  return value?.trim() ? value : "Pendiente";
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(EMPTY_USER);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus =
        statusFilter === "Todos" ? true : user.status === statusFilter;

      const haystack = [
        fullName(user),
        user.username,
        user.email,
        user.phone,
        user.address,
        user.user_type,
        user.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || haystack.includes(term);

      return matchesStatus && matchesSearch;
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
    setSelectedUser(EMPTY_USER);
    setModalMode("create");
    setModalOpen(true);
  }

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
  }

  function handleSave(payload) {
    if (modalMode === "edit") {
      setUsers((current) =>
        current.map((item) => (item.id === payload.id ? payload : item))
      );
    } else {
      const nextId =
        users.length > 0 ? Math.max(...users.map((item) => item.id)) + 1 : 1;

      setUsers((current) => [{ ...payload, id: nextId }, ...current]);
    }

    setModalOpen(false);
  }

  function handleToggleStatus(user) {
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status: item.status === "Activo" ? "Inactivo" : "Activo",
            }
          : item
      )
    );
  }

  function handleDelete(user) {
    const confirmDelete = window.confirm(
      `¿Eliminar a ${fullName(user) || user.username}?`
    );

    if (!confirmDelete) return;

    setUsers((current) => current.filter((item) => item.id !== user.id));
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
            Gestión de cuentas internas del hotel.
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
          <h2>Catálogo de Usuarios</h2>

          <select
            className="users-admin__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>

        <div className="users-admin__toolbar">
          <button className="users-admin__primary-btn" onClick={openCreateModal}>
            Agregar nuevo
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
                <th>Tipo</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length === 0 ? (
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
                          {fullName(user) || "Sin nombre"}
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
                    <td>{safeText(user.user_type)}</td>
                    <td>
                      <span
                        className={`users-admin__status-badge ${
                          user.status === "Activo"
                            ? "users-admin__status-badge--active"
                            : "users-admin__status-badge--inactive"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="users-admin__actions">
                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--warning"
                          title="Editar"
                          onClick={() => openEditModal(user)}
                        >
                          ✏️
                        </button>

                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--info"
                          title="Ver"
                          onClick={() => openViewModal(user)}
                        >
                          👁
                        </button>

                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--secondary"
                          title={
                            user.status === "Activo"
                              ? "Desactivar"
                              : "Activar"
                          }
                          onClick={() => handleToggleStatus(user)}
                        >
                          ⏻
                        </button>

                        <button
                          className="users-admin__icon-btn users-admin__icon-btn--danger"
                          title="Eliminar"
                          onClick={() => handleDelete(user)}
                        >
                          🗑
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
          {paginatedUsers.length === 0 ? (
            <div className="users-admin__empty">No se encontraron usuarios.</div>
          ) : (
            paginatedUsers.map((user, index) => (
              <article className="users-admin__mobile-card" key={user.id}>
                <div className="users-admin__mobile-head">
                  <div className="users-admin__avatar users-admin__avatar--lg">
                    {getInitials(user)}
                  </div>

                  <div className="users-admin__mobile-head-text">
                    <strong>{fullName(user) || "Sin nombre"}</strong>
                    <span>@{safeText(user.username)}</span>
                  </div>

                  <span
                    className={`users-admin__status-badge ${
                      user.status === "Activo"
                        ? "users-admin__status-badge--active"
                        : "users-admin__status-badge--inactive"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="users-admin__mobile-grid">
                  <div>
                    <span className="users-admin__label">N°</span>
                    <p>{startIndex + index + 1}</p>
                  </div>
                  <div>
                    <span className="users-admin__label">Tipo</span>
                    <p>{safeText(user.user_type)}</p>
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
                  >
                    ✏️
                  </button>
                  <button
                    className="users-admin__icon-btn users-admin__icon-btn--info"
                    onClick={() => openViewModal(user)}
                  >
                    👁
                  </button>
                  <button
                    className="users-admin__icon-btn users-admin__icon-btn--secondary"
                    onClick={() => handleToggleStatus(user)}
                  >
                    ⏻
                  </button>
                  <button
                    className="users-admin__icon-btn users-admin__icon-btn--danger"
                    onClick={() => handleDelete(user)}
                  >
                    🗑
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
        userTypeOptions={USER_TYPE_OPTIONS}
      />
    </section>
  );
}