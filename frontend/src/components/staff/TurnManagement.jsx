import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { Check, X, RefreshCw, User } from "lucide-react";
import "../../styles/profile.css";

const TurnManagement = () => {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDIENTE"); // PENDIENTE | CONFIRMADO | CANCELADO | ALL

  const fetchTurns = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/turn/history?status=${statusFilter}`);
      setTurns(res.data.body);
    } catch (err) {
      console.error("Error al cargar turnos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurns();
  }, [statusFilter]);

  const handleAction = async (id, action) => {
    try {
      await API.put(`/turn/${id}/${action}`);
      // Refrescar usando el filtro actual (el estado del componente no cambia)
      await fetchTurns();
    } catch (err) {
      alert(err.response?.data?.body || `Error al ${action} turno`);
    }
  };

  const getPacienteLabel = (t) => {
    if (t.user) return `${t.user.surname}, ${t.user.name}`;
    if (t.presential_patient)
      return `${t.presential_patient.last_name}, ${t.presential_patient.first_name}`;
    return `ID: ${t.id_user || t.id_patient_record}`;
  };

  const formatWhen = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "-";
    }
  };

  return (
    <div>
      <div
        className="search-bar-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Historial de Turnos</h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="dashboard-search-input"
            style={{ width: 200 }}
          >
            <option value="ALL">Todos</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>

          <button
            onClick={fetchTurns}
            className="btn-promote"
            style={{ padding: "8px" }}
            title="Refrescar lista"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {turns.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No hay turnos.</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Médico / Especialidad</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Ingreso</th>
                <th>Actualizado</th>
                <th>Quien hizo</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turns.map((t) => (
                <tr key={t.id_turn}>
                  <td>{getPacienteLabel(t)}</td>
                  <td>
                    <strong>Dr. {t.doctor?.surname}</strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.8em",
                        color: "#666",
                      }}
                    >
                      {t.doctor?.specialty}
                    </span>
                  </td>
                  <td>{t.date}</td>
                  <td>{t.status}</td>
                  <td>{formatWhen(t.createdAt)}</td>
                  <td>{formatWhen(t.confirmedAt)}</td>
                  <td>
                    {t.confirmedBy &&
                    (t.confirmedBy_user?.name || t.confirmedBy_user?.surname)
                      ? `${t.confirmedBy_user.surname}, ${t.confirmedBy_user.name}`
                      : t.confirmedBy
                        ? `ID: ${t.confirmedBy}`
                        : "-"}
                  </td>
                  <td>
                    {t.status === "PENDIENTE" ? (
                      <div
                        className="actions-cell-gap"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleAction(t.id_turn, "confirm")}
                          className="btn-promote"
                          style={{ padding: "5px" }}
                          title="Confirmar asistencia"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAction(t.id_turn, "cancel")}
                          className="btn-demote"
                          style={{ padding: "5px" }}
                          title="Cancelar turno"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="txt-protected">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TurnManagement;
