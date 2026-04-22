import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
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

export default function UserFormModal({
  open,
  mode = "create",
  initialData,
  onClose,
  onSave,
  userTypeOptions = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const title = useMemo(() => {
    if (mode === "edit") return "Editar Usuario";
    if (mode === "view") return "Ver Usuario";
    return "Agregar Usuario";
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    setForm(initialData?.id ? initialData : EMPTY_FORM);
    setErrors({});
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
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

    if (!form.first_name.trim()) nextErrors.first_name = "El nombre es obligatorio.";
    if (!form.email.trim()) nextErrors.email = "El correo es obligatorio.";
    if (!form.username.trim()) nextErrors.username = "El usuario es obligatorio.";
    if (!form.user_type.trim()) nextErrors.user_type = "El tipo es obligatorio.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isViewMode) {
      onClose();
      return;
    }

    if (!validate()) return;

    onSave({
      ...form,
      first_name: form.first_name.trim(),
      last_name_paternal: form.last_name_paternal.trim(),
      last_name_maternal: form.last_name_maternal.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      username: form.username.trim(),
      user_type: form.user_type.trim(),
      status: form.status || "Activo",
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
          <button className="user-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="user-modal__body" onSubmit={handleSubmit}>
          <div className="user-modal__group">
            <label className="user-modal__label">
              *Nombre: <span>(Obligatorio)</span>
            </label>
            <input
              type="text"
              className={`user-modal__input ${errors.first_name ? "is-error" : ""}`}
              value={form.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              disabled={isViewMode}
              placeholder="Ingrese el nombre"
            />
            {errors.first_name && (
              <small className="user-modal__error">{errors.first_name}</small>
            )}
          </div>

          <div className="user-modal__grid">
            <div className="user-modal__group">
              <label className="user-modal__label">Apellido Paterno:</label>
              <input
                type="text"
                className="user-modal__input"
                value={form.last_name_paternal}
                onChange={(e) =>
                  updateField("last_name_paternal", e.target.value)
                }
                disabled={isViewMode}
                placeholder="Ingrese el apellido paterno"
              />
            </div>

            <div className="user-modal__group">
              <label className="user-modal__label">Apellido Materno:</label>
              <input
                type="text"
                className="user-modal__input"
                value={form.last_name_maternal}
                onChange={(e) =>
                  updateField("last_name_maternal", e.target.value)
                }
                disabled={isViewMode}
                placeholder="Ingrese el apellido materno"
              />
            </div>
          </div>

          <div className="user-modal__group">
            <label className="user-modal__label">Fecha de nacimiento:</label>
            <input
              type="date"
              className="user-modal__input"
              value={form.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
              disabled={isViewMode}
            />
          </div>

          <div className="user-modal__grid">
            <div className="user-modal__group">
              <label className="user-modal__label">
                *Correo: <span>(Obligatorio)</span>
              </label>
              <input
                type="email"
                className={`user-modal__input ${errors.email ? "is-error" : ""}`}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isViewMode}
                placeholder="correo@dominio.com"
              />
              {errors.email && (
                <small className="user-modal__error">{errors.email}</small>
              )}
            </div>

            <div className="user-modal__group">
              <label className="user-modal__label">Teléfono:</label>
              <input
                type="text"
                className="user-modal__input"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={isViewMode}
                placeholder="Ingrese el teléfono"
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
              disabled={isViewMode}
              placeholder="Ingrese la dirección"
            />
          </div>

          <div className="user-modal__group">
            <label className="user-modal__label">
              *Usuario: <span>(Obligatorio)</span>
            </label>
            <input
              type="text"
              className={`user-modal__input ${errors.username ? "is-error" : ""}`}
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              disabled={isViewMode}
              placeholder="Ingrese el usuario"
            />
            {errors.username && (
              <small className="user-modal__error">{errors.username}</small>
            )}
          </div>

          <div className="user-modal__group">
            <label className="user-modal__label">
              *Tipo: <span>(Obligatorio)</span>
            </label>
            <select
              className={`user-modal__input ${errors.user_type ? "is-error" : ""}`}
              value={form.user_type}
              onChange={(e) => updateField("user_type", e.target.value)}
              disabled={isViewMode}
            >
              <option value="">Seleccione un tipo</option>
              {userTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.user_type && (
              <small className="user-modal__error">{errors.user_type}</small>
            )}
          </div>

          <div className="user-modal__group">
            <label className="user-modal__label">Estatus:</label>
            <select
              className="user-modal__input"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              disabled={isViewMode}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="user-modal__footer">
            <button
              type="button"
              className="user-modal__btn user-modal__btn--ghost"
              onClick={onClose}
            >
              Cancelar
            </button>

            {!isViewMode && (
              <button type="submit" className="user-modal__btn user-modal__btn--primary">
                {mode === "edit" ? "Guardar cambios" : "Crear usuario"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}