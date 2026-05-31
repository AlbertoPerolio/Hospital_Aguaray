import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { Check, X, RefreshCw, User } from "lucide-react";
import "../../styles/profile.css";

const TurnManagement = () => {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get("/turn/pending");
      setTurns(res.data.body);
    } catch (err) {
      console.error("Error al cargar turnos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await API.put(`/turn/${id}/${action}`);
      fetchPending(); // Refrescar lista
    } catch (err) {
      alert(err.response?.data?.body || `Error al ${action} turno`);
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
        }}
      >
        <h2 style={{ margin: 0 }}>Turnos por Confirmar</h2>
        <button
          onClick={fetchPending}
          className="btn-promote"
          style={{ padding: "8px" }}
          title="Refrescar lista"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {turns.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No hay turnos pendientes para procesar.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Médico / Especialidad</th>
                <th>Fecha</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turns.map((t) => (
                <tr key={t.id_turn}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {t.user
                        ? `${t.user.surname}, ${t.user.name}`
                        : t.presential_patient
                          ? `${t.presential_patient.last_name}, ${t.presential_patient.first_name}`
                          : `ID: ${t.id_user || t.id_patient_record}`}
                    </div>
                  </td>
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
                  <td>
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
