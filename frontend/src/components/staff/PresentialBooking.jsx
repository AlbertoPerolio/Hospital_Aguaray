import React, { useState } from "react";
import API from "../../api/axios";
import { Search, UserPlus } from "lucide-react";
import "../../styles/profile.css";

const PresentialBooking = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    nacionalidad: "",
    telefono: "",
  });

  const searchPatient = async () => {
    try {
      // Buscamos en ambos universos: usuarios registrados y pacientes presenciales previos
      const [resUsers, resPatients] = await Promise.all([
        API.get(`/user-management/admin/search?dni=${query}`),
        API.get(`/patient/autocomplete?dni=${query}`),
      ]);

      // Unificamos resultados para la previsualización
      const combined = [
        ...resUsers.data.body.map((u) => ({
          ...u,
          type: "Registrado",
          display: `${u.surname}, ${u.name}`,
        })),
        ...resPatients.data.body.map((p) => ({
          ...p,
          type: "Presencial",
          display: `${p.last_name}, ${p.first_name}`,
        })),
      ];
      setResults(combined);
    } catch (err) {
      console.error(err);
    }
  };

  const selectPatient = (p) => {
    setForm({
      dni: query, // El DNI usado para buscar
      nombre: p.name || p.first_name || "",
      apellido: p.surname || p.last_name || "",
      nacionalidad: p.nacionalidad || "",
      telefono: p.telefono || p.phone || "",
    });
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Restricciones: DNI, Nombre, Apellido, Nacionalidad obligatorios
    const dni = form.dni?.trim();
    const nombre = form.nombre?.trim();
    const apellido = form.apellido?.trim();
    const nacionalidad = form.nacionalidad?.trim();

    if (!dni || !nombre || !apellido || !nacionalidad) {
      alert("Faltan datos obligatorios: DNI, nombre, apellido y nacionalidad.");
      return;
    }

    try {
      // 1) guardar/actualizar registro presencial
      const resPatient = await API.post("/patient/upsert", form);
      const patientId = resPatient.data.body.id_patient_record;

      // 2) pedir turno presencial automáticamente
      // Para pedir el turno necesitamos doctor y fecha.
      // Este componente no los muestra; por eso guardamos el paciente y te quedás en este flujo.
      // 2) pedir turno presencial automáticamente
      // Acá no contamos con doctor/date, así que movemos el paciente listo a Turn.jsx.
      // Guardamos el patientId en localStorage para que Turn.jsx lo use al pedir el turno.
      localStorage.setItem("pendingPresentialPatientId", String(patientId));
      alert(
        `Paciente listo (ID ${patientId}). Ahora elegí el doctor en la pantalla "Turnos" y pedí el turno.`,
      );
    } catch (err) {
      alert("Error al procesar paciente");
    }
  };

  return (
    <div>
      <h2 style={{ display: "flex", alignItems: "center" }}>
        <UserPlus className="mr-2" /> Turno Presencial / Autocompletado
      </h2>

      <div
        className="search-bar-container"
        style={{ display: "flex", gap: "10px", marginTop: "20px" }}
      >
        <input
          className="dashboard-search-input"
          placeholder="Buscar por DNI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={searchPatient}
          className="btn-promote"
          style={{ padding: "10px 20px" }}
        >
          <Search />
        </button>
      </div>

      {results.length > 0 && (
        <ul
          className="admin-table"
          style={{ listStyle: "none", padding: 0, margin: "20px 0" }}
        >
          {results.map((r, i) => (
            <li
              key={i}
              style={{
                padding: "12px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
              onClick={() => selectPatient(r)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>{r.display}</strong>
                <span
                  className={`table-role-badge role-${r.type === "Registrado" ? 1 : 2}`}
                >
                  {r.type}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="profile-form"
        style={{
          marginTop: "20px",
          borderTop: "1px solid #333",
          paddingTop: "20px",
        }}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>DNI</label>
            <input
              type="text"
              value={form.dni}
              onChange={(e) => setForm({ ...form, dni: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Nacionalidad</label>
            <input
              type="text"
              value={form.nacionalidad}
              onChange={(e) =>
                setForm({ ...form, nacionalidad: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input
            type="text"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-save-profile">
          Confirmar Datos de Paciente
        </button>
      </form>
    </div>
  );
};

export default PresentialBooking;
