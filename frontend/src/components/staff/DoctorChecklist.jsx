import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { format } from "date-fns";
import { CheckCircle, XCircle, Save, Plus, Trash2 } from "lucide-react";
import "../../styles/profile.css";

const DoctorChecklist = () => {
  const [doctors, setDoctors] = useState([]);
  const [capacity, setCapacity] = useState({});
  const today = format(new Date(), "yyyy-MM-dd");

  // Estado para nuevo médico
  const [newDoc, setNewDoc] = useState({
    name: "",
    surname: "",
    specialty: "",
  });

  const fetchDoctors = async () => {
    try {
      const res = await API.get(`/doctor?date=${today}`);
      const docs = res.data.body || [];
      setDoctors(docs);

      const initialCap = {};
      docs.forEach((doc) => {
        // Si ya tiene capacidad guardada para hoy, la usamos. Si no, valores por defecto.
        const savedCap = doc.doctor_daily_capacities?.[0];
        initialCap[doc.id_doctor] = {
          enabled: savedCap ? savedCap.enabled : false,
          limit_turns: savedCap ? savedCap.limit_turns : 10,
        };
      });
      setCapacity(initialCap);
    } catch (err) {
      console.error("Error cargando doctores", err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleToggle = (id) => {
    setCapacity((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const handleLimitChange = (id, val) => {
    setCapacity((prev) => ({
      ...prev,
      [id]: { ...prev[id], limit_turns: parseInt(val, 10) || 0 },
    }));
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await API.post("/doctor", newDoc);
      setNewDoc({ name: "", surname: "", specialty: "" });
      fetchDoctors();
      alert("Médico agregado con éxito");
    } catch (err) {
      alert("Error al agregar médico");
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("¿Eliminar este médico del sistema?")) return;
    try {
      await API.delete(`/doctor/${id}`);
      fetchDoctors();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const saveDailyConfig = async () => {
    const rows = Object.entries(capacity).map(([id, data]) => ({
      id_doctor: parseInt(id, 10),
      ...data,
    }));

    try {
      await API.put("/doctor/daily-capacity", { date: today, rows });
      alert("Configuración del día guardada correctamente");
    } catch (err) {
      alert(
        "Error al guardar: " +
          (err.response?.data?.body || err.message || "Error desconocido"),
      );
    }
  };

  return (
    <div>
      <section
        style={{
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "1px solid #eee",
        }}
      >
        <h3>Registrar Nuevo Médico</h3>
        <form onSubmit={handleAddDoctor} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                value={newDoc.surname}
                onChange={(e) =>
                  setNewDoc({ ...newDoc, surname: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Especialidad</label>
            <input
              value={newDoc.specialty}
              onChange={(e) =>
                setNewDoc({ ...newDoc, specialty: e.target.value })
              }
              required
            />
          </div>
          <button
            type="submit"
            className="btn-save-profile"
            style={{ marginTop: "10px", width: "auto" }}
          >
            <Plus size={18} /> Agregar Médico
          </button>
        </form>
      </section>

      <h3>Disponibilidad del Día: {today}</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Especialidad</th>
            <th className="text-center">Disponible Hoy</th>
            <th>Límite Turnos</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr key={doc.id_doctor}>
              <td>
                {doc.surname}, {doc.name}
              </td>
              <td>{doc.specialty}</td>
              <td className="text-center">
                <button onClick={() => handleToggle(doc.id_doctor)}>
                  {capacity[doc.id_doctor]?.enabled ? (
                    <CheckCircle color="#22c55e" />
                  ) : (
                    <XCircle color="#94a3b8" />
                  )}
                </button>
              </td>
              <td>
                <input
                  type="number"
                  style={{ width: "60px", padding: "5px" }}
                  value={capacity[doc.id_doctor]?.limit_turns}
                  onChange={(e) =>
                    handleLimitChange(doc.id_doctor, e.target.value)
                  }
                  disabled={!capacity[doc.id_doctor]?.enabled}
                />
              </td>
              <td className="text-center">
                <button
                  onClick={() => handleDeleteDoctor(doc.id_doctor)}
                  className="btn-demote"
                  style={{ padding: "5px 10px" }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={saveDailyConfig}
        className="btn-save-profile"
        style={{ marginTop: "20px" }}
      >
        <Save size={18} /> Guardar Configuración de Hoy
      </button>
    </div>
  );
};

export default DoctorChecklist;
