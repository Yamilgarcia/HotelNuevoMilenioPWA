import { useEffect, useMemo, useState } from "react";
import "./UserFormModal.css";

const EMPTY_FORM = {
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
  password: "",
  confirmPassword: "",
};

export default function UserFormModal({
  open,
  mode = "view",
  initialData,
  onClose,
  onSave,
  roleOptions = [],
  cargoOptions = [],
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  const title = useMemo(() => {
    if (isCreateMode) return "Agregar usuario";
    if (isEditMode) return "Editar usuario";
    return "Ver usuario";
  }, [isCreateMode, isEditMode]);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, ...(initialData || {}) });
    setErrors({});
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("user-modal-body-lock");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("user-modal-body-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }
  }

  function validate() {
    const nextErrors = {};

    if (!form.nombre.trim()) {
      nextErrors.nombre = "El nombre es obligatorio.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "El correo no es válido.";
    }

    if (!form.role.trim()) {
      nextErrors.role = "El rol es obligatorio.";
    }

    if (!form.status.trim()) {
      nextErrors.status = "El estado es obligatorio.";
    }

    if (isCreateMode) {
      if (!form.password.trim()) {
        nextErrors.password = "La contraseña temporal es obligatoria.";
      } else if (form.password.trim().length < 8) {
        nextErrors.password = "La contraseña debe tener al menos 8 caracteres.";
      }

      if (!form.confirmPassword.trim()) {
        nextErrors.confirmPassword = "Confirma la contraseña.";
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Las contraseñas no coinciden.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isViewMode) {
      onClose();
      return;
    }

    if (!validate()) return;

    onSave({
      ...form,
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      cargo: form.cargo.trim(),
      avatar_url: form.avatar_url.trim(),
      password: form.password.trim(),
      confirmPassword: form.confirmPassword.trim(),
    });
  }

  function getRoleLabel(role) {
    return role === "administrador" ? "Administrador" : "Recepcionista";
  }

  return (
    <div className="user-modal-overlay" onClick={saving ? undefined : onClose}>
      <div
        className="user-modal-shell"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <form className="user-form-container" onSubmit={handleSubmit}>
          <div className="user-form-header">
            <div className="user-form-header__center">
              <h2 id="user-modal-title" className="user-form-title">
                {title}
              </h2>
            </div>

            <button
              type="button"
              className="user-form-close"
              onClick={onClose}
              disabled={saving}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="user-form-scroll">
            <div className="user-form-group">
              <label className="user-form-label" htmlFor="user-nombre">
                Nombre <span>(obligatorio)</span>
              </label>
              <input
                id="user-nombre"
                type="text"
                className={`user-form-input ${errors.nombre ? "is-error" : ""}`}
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                disabled={isViewMode || saving}
                placeholder="Ingrese el nombre completo"
              />
              {errors.nombre && (
                <small className="user-form-error">{errors.nombre}</small>
              )}
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-email">
                  Correo <span>(obligatorio)</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  className={`user-form-input ${errors.email ? "is-error" : ""}`}
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={!isCreateMode || saving}
                  placeholder="correo@dominio.com"
                />
                {errors.email && (
                  <small className="user-form-error">{errors.email}</small>
                )}
              </div>

              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-username">
                  Usuario
                </label>
                <input
                  id="user-username"
                  type="text"
                  className="user-form-input"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  disabled={isViewMode || saving}
                  placeholder="Nombre de usuario"
                />
              </div>
            </div>

            {isCreateMode && (
              <div className="user-form-grid">
                <div className="user-form-group">
                  <label className="user-form-label" htmlFor="user-password">
                    Contraseña temporal <span>(obligatorio)</span>
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    className={`user-form-input ${errors.password ? "is-error" : ""}`}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    disabled={saving}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {errors.password && (
                    <small className="user-form-error">{errors.password}</small>
                  )}
                </div>

                <div className="user-form-group">
                  <label
                    className="user-form-label"
                    htmlFor="user-confirm-password"
                  >
                    Confirmar contraseña <span>(obligatorio)</span>
                  </label>
                  <input
                    id="user-confirm-password"
                    type="password"
                    className={`user-form-input ${errors.confirmPassword ? "is-error" : ""}`}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    disabled={saving}
                    placeholder="Repita la contraseña"
                  />
                  {errors.confirmPassword && (
                    <small className="user-form-error">
                      {errors.confirmPassword}
                    </small>
                  )}
                </div>
              </div>
            )}

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-phone">
                  Teléfono
                </label>
                <input
                  id="user-phone"
                  type="text"
                  className="user-form-input"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  disabled={isViewMode || saving}
                  placeholder="Teléfono"
                />
              </div>

              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-birth-date">
                  Fecha de nacimiento
                </label>
                <input
                  id="user-birth-date"
                  type="date"
                  className="user-form-input"
                  value={form.birth_date || ""}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                  disabled={isViewMode || saving}
                />
              </div>
            </div>

            <div className="user-form-group">
              <label className="user-form-label" htmlFor="user-address">
                Dirección
              </label>
              <input
                id="user-address"
                type="text"
                className="user-form-input"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                disabled={isViewMode || saving}
                placeholder="Dirección"
              />
            </div>

            <div className="user-form-info">
              <p>Información del perfil</p>
              <span>
                Configura cargo, rol, estado y datos visuales del usuario.
              </span>
              <div className="user-form-info__divider" />
              <strong>Rol actual: {getRoleLabel(form.role)}</strong>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-cargo">
                  Cargo
                </label>
                <select
                  id="user-cargo"
                  className="user-form-input"
                  value={form.cargo}
                  onChange={(e) => updateField("cargo", e.target.value)}
                  disabled={isViewMode || saving}
                >
                  <option value="">Seleccione un cargo</option>
                  {cargoOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-role">
                  Rol <span>(obligatorio)</span>
                </label>
                <select
                  id="user-role"
                  className={`user-form-input ${errors.role ? "is-error" : ""}`}
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  disabled={isViewMode || saving}
                >
                  <option value="">Seleccione un rol</option>
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "administrador"
                        ? "Administrador"
                        : "Recepcionista"}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <small className="user-form-error">{errors.role}</small>
                )}
              </div>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-status">
                  Estado <span>(obligatorio)</span>
                </label>
                <select
                  id="user-status"
                  className={`user-form-input ${errors.status ? "is-error" : ""}`}
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  disabled={isViewMode || saving}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {errors.status && (
                  <small className="user-form-error">{errors.status}</small>
                )}
              </div>

              <div className="user-form-group">
                <label className="user-form-label" htmlFor="user-avatar-url">
                  Avatar URL
                </label>
                <input
                  id="user-avatar-url"
                  type="text"
                  className="user-form-input"
                  value={form.avatar_url}
                  onChange={(e) => updateField("avatar_url", e.target.value)}
                  disabled={isViewMode || saving}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="user-form-actions">
            <button
              type="button"
              className="user-form-btn user-form-btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cerrar
            </button>

            {!isViewMode && (
              <button
                type="submit"
                className="user-form-btn user-form-btn--primary"
                disabled={saving}
              >
                {saving
                  ? isCreateMode
                    ? "Creando..."
                    : "Guardando..."
                  : isCreateMode
                    ? "Crear usuario"
                    : "Guardar cambios"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}