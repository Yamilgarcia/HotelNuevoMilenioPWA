import { useEffect, useMemo, useState } from "react";

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

  const title = useMemo(() => {
    if (mode === "edit") return "Editar usuario";
    return "Ver usuario";
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    setForm(initialData?.id ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
    setErrors({});
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!form.role.trim()) nextErrors.role = "El rol es obligatorio.";
    if (!form.status.trim()) nextErrors.status = "El estado es obligatorio.";

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
      username: form.username.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      cargo: form.cargo.trim(),
      avatar_url: form.avatar_url.trim(),
    });
  }

  return (
    <div className="user-modal__overlay" onClick={onClose}>
      <div
        className="user-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <div className="user-modal__header">
          <h3 id="user-modal-title">{title}</h3>
          <button className="user-modal__close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="user-modal__body" onSubmit={handleSubmit}>
          <div className="user-modal__group">
            <label className="user-modal__label">
              Nombre: <span>(obligatorio)</span>
            </label>
            <input
              type="text"
              className={`user-modal__input ${errors.nombre ? "is-error" : ""}`}
              value={form.nombre}
              onChange={(e) => updateField("nombre", e.target.value)}
              disabled={isViewMode || saving}
              placeholder="Ingrese el nombre completo"
            />
            {errors.nombre && (
              <small className="user-modal__error">{errors.nombre}</small>
            )}
          </div>

          <div className="user-modal__grid">
            <div className="user-modal__group">
              <label className="user-modal__label">Correo:</label>
              <input
                type="email"
                className="user-modal__input"
                value={form.email}
                disabled
                placeholder="Correo del usuario"
              />
            </div>

            <div className="user-modal__group">
              <label className="user-modal__label">Usuario:</label>
              <input
                type="text"
                className="user-modal__input"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                disabled={isViewMode || saving}
                placeholder="Nombre de usuario"
              />
            </div>
          </div>

          <div className="user-modal__grid">
            <div className="user-modal__group">
              <label className="user-modal__label">Teléfono:</label>
              <input
                type="text"
                className="user-modal__input"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={isViewMode || saving}
                placeholder="Teléfono"
              />
            </div>

            <div className="user-modal__group">
              <label className="user-modal__label">Fecha de nacimiento:</label>
              <input
                type="date"
                className="user-modal__input"
                value={form.birth_date || ""}
                onChange={(e) => updateField("birth_date", e.target.value)}
                disabled={isViewMode || saving}
              />
            </div>
          </div>

          <div className="user-modal__group">
            <label className="user-modal__label">Dirección:</label>
            <input
              type="text"
              className="user-modal__input"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={isViewMode || saving}
              placeholder="Dirección"
            />
          </div>

          <div className="user-modal__grid">
            <div className="user-modal__group">
              <label className="user-modal__label">Cargo:</label>
              <select
                className="user-modal__input"
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

            <div className="user-modal__group">
              <label className="user-modal__label">
                Rol: <span>(obligatorio)</span>
              </label>
              <select
                className={`user-modal__input ${errors.role ? "is-error" : ""}`}
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                disabled={isViewMode || saving}
              >
                <option value="">Seleccione un rol</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "administrador" ? "Administrador" : "Recepcionista"}
                  </option>
                ))}
              </select>
              {errors.role && (
                <small className="user-modal__error">{errors.role}</small>
              )}
            </div>
          </div>

          <div className="user-modal__grid">
            <div className="user-modal__group">
              <label className="user-modal__label">
                Estado: <span>(obligatorio)</span>
              </label>
              <select
                className={`user-modal__input ${errors.status ? "is-error" : ""}`}
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                disabled={isViewMode || saving}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
              {errors.status && (
                <small className="user-modal__error">{errors.status}</small>
              )}
            </div>

            <div className="user-modal__group">
              <label className="user-modal__label">Avatar URL:</label>
              <input
                type="text"
                className="user-modal__input"
                value={form.avatar_url}
                onChange={(e) => updateField("avatar_url", e.target.value)}
                disabled={isViewMode || saving}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="user-modal__footer">
            <button
              type="button"
              className="user-modal__btn user-modal__btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cerrar
            </button>

            {!isViewMode && (
              <button
                type="submit"
                className="user-modal__btn user-modal__btn--primary"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}