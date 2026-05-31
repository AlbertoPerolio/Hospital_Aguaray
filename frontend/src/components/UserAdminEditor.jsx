import { useMemo, useState } from "react";
import API from "../api/axios";

export default function UserAdminEditor({ userRow, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: userRow?.name || "",
    surname: userRow?.surname || "",
    nacionalidad: userRow?.nacionalidad || "",
    dni: "",
    telefono: "",
  });

  const canSave = useMemo(() => {
    return (
      (form.name ?? "").trim().length > 0 &&
      (form.surname ?? "").trim().length > 0
    );
  }, [form.name, form.surname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    const payload = {
      name: form.name,
      surname: form.surname,
      nacionalidad: form.nacionalidad || "",
    };

    if (form.dni.trim()) payload.dni = form.dni.trim();
    if (form.telefono.trim()) payload.telefono = form.telefono.trim();

    await API.put(`/user-management/admin/user/${userRow.id_user}`, payload);
    onSaved?.();
    onClose?.();
  };

  return (
    <div className="modal-overlay">
      <div className="address-modal-card">
        <h3>Editar usuario #{userRow?.id_user}</h3>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input
              name="surname"
              value={form.surname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Nacionalidad</label>
            <input
              name="nacionalidad"
              value={form.nacionalidad}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>DNI (opcional, se hashea)</label>
            <input name="dni" value={form.dni} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Teléfono (opcional, se hashea)</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions-buttons">
            <button
              type="button"
              className="btn-cancel-modal"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit-modal"
              disabled={!canSave}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
