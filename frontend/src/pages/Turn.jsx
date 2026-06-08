import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import "../styles/home.css";

const ROLES = {
  USUARIO: 1,
  SECRETARIO: 2,
  ADMIN: 3,
};

function yyyyMmDd(d) {
  // d: Date
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Turn() {
  const { user } = useAuth();

  const [date, setDate] = useState(() => yyyyMmDd(new Date()));

  const today = useMemo(() => yyyyMmDd(new Date()), []);

  useEffect(() => {
    if (user?.id_role === ROLES.USER) {
      setDate(today);
    }
  }, [user, today]);

  const [doctorsAvailable, setDoctorsAvailable] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [idDoctorSelected, setIdDoctorSelected] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Si venís de "Turno Presencial" (PresentialBooking), guardamos el paciente pendiente en localStorage.
  // Acá lo usamos para solicitar el turno presencial (id_patient_record) sin que el secretario vuelva a elegirlo.
  const [pendingPresentialPatientId] = useState(() => {
    try {
      return localStorage.getItem("pendingPresentialPatientId");
    } catch {
      return null;
    }
  });

  // Si venís de presencial, le armamos el request para usar id_patient_record en lugar de id_user.
  const pendingPresentialPatientIdInt = useMemo(() => {
    if (!pendingPresentialPatientId) return null;
    const v = parseInt(pendingPresentialPatientId, 10);
    return Number.isNaN(v) ? null : v;
  }, [pendingPresentialPatientId]);

  // Mis turnos
  const [myTurns, setMyTurns] = useState([]);
  const [loadingMyTurns, setLoadingMyTurns] = useState(false);

  // Pending
  const [pendingTurns, setPendingTurns] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const isAdminOrSecretary =
    user?.id_role === ROLES.ADMIN || user?.id_role === ROLES.SECRETARIO;

  const selectedDoctorId = useMemo(() => {
    const v = parseInt(idDoctorSelected, 10);
    return Number.isNaN(v) ? null : v;
  }, [idDoctorSelected]);

  async function fetchDoctors() {
    setLoadingDoctors(true);
    try {
      const res = await API.get(
        `/doctor/available?date=${encodeURIComponent(date)}`,
      );
      setDoctorsAvailable(res.data?.body ?? []);
    } catch {
      setDoctorsAvailable([]);
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function fetchMyTurns() {
    if (!user) return;
    setLoadingMyTurns(true);
    try {
      const res = await API.get("/turn/my");
      setMyTurns(res.data?.body ?? []);
    } catch {
      setMyTurns([]);
    } finally {
      setLoadingMyTurns(false);
    }
  }

  async function fetchPending() {
    setLoadingPending(true);
    try {
      const res = await API.get("/turn/pending");
      setPendingTurns(res.data?.body ?? []);
    } catch {
      setPendingTurns([]);
    } finally {
      setLoadingPending(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
    // reset selection when date changes
    setIdDoctorSelected("");
  }, [date]);

  useEffect(() => {
    fetchMyTurns();
  }, [user]);

  useEffect(() => {
    if (!isAdminOrSecretary) return;
    fetchPending();
  }, [isAdminOrSecretary]);

  const handleRequestTurn = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!selectedDoctorId) {
      setMessage({ type: "error", text: "Seleccioná un doctor." });
      return;
    }

    setLoadingRequest(true);
    try {
      // Si venís de presencial, pedimos con id_patient_record.
      const payload = {
        id_doctor: selectedDoctorId,
        date,
      };

      if (pendingPresentialPatientIdInt) {
        payload.id_patient_record = pendingPresentialPatientIdInt;
      }

      const res = await API.post("/turn/", payload);

      setMessage({
        type: "success",
        text: res.data?.body?.id_turn
          ? "Turno solicitado. Queda pendiente de confirmación."
          : "Turno solicitado.",
      });
      await fetchMyTurns();
    } catch (err) {
      const txt =
        err.response?.data?.body?.message ||
        err.response?.data?.body?.error ||
        err.response?.data?.message ||
        err.response?.data?.body ||
        "No se pudo solicitar el turno";
      setMessage({
        type: "error",
        text:
          typeof txt === "string" && txt.trim()
            ? txt
            : "No se pudo solicitar el turno",
      });
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleConfirm = async (id_turn) => {
    if (!window.confirm("¿Confirmar este turno?")) return;
    try {
      await API.put(`/turn/${id_turn}/confirm`);
      await fetchPending();
      await fetchMyTurns();
    } catch {
      setMessage({ type: "error", text: "No se pudo confirmar el turno" });
    }
  };

  const handleCancel = async (id_turn) => {
    if (!window.confirm("¿Cancelar este turno?")) return;
    try {
      await API.put(`/turn/${id_turn}/cancel`);
      await fetchPending();
      await fetchMyTurns();
    } catch {
      setMessage({ type: "error", text: "No se pudo cancelar el turno" });
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Turnos</h1>
        <p>Solicitá tu turno eligiendo un doctor disponible.</p>
      </header>

      <div className="profile-card-v2 wide-card">
        <h2>Solicitar turno</h2>

        {message.text && (
          <div className={`alert-banner ${message.type}`}>{message.text}</div>
        )}

        <div className="form-row" style={{ gap: 12, marginBottom: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Fecha</label>
            {user?.id_role === ROLES.USER ? (
              <div className="form-text">{date}</div>
            ) : (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </div>
        </div>

        <form onSubmit={handleRequestTurn}>
          <div className="form-group">
            <label>Doctor disponible</label>

            <select
              value={idDoctorSelected}
              onChange={(e) => setIdDoctorSelected(e.target.value)}
              disabled={loadingDoctors || doctorsAvailable.length === 0}
            >
              <option value="">
                {loadingDoctors
                  ? "Cargando..."
                  : doctorsAvailable.length === 0
                    ? "Sin doctores disponibles"
                    : "Seleccione..."}
              </option>
              {doctorsAvailable.map((d) => (
                <option key={d.id_doctor} value={d.id_doctor}>
                  Dr. {d.surname}, {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-save-profile"
            type="submit"
            disabled={
              loadingRequest ||
              (user?.id_role === ROLES.USER &&
                myTurns.some(
                  (t) => t.status === "PENDIENTE" || t.status === "CONFIRMADO",
                ))
            }
          >
            {loadingRequest ? "Solicitando..." : "Pedir turno"}
          </button>
        </form>
      </div>

      <div style={{ height: 18 }} />

      <div className="profile-card-v2 wide-card">
        <h2>Mis turnos</h2>
        {loadingMyTurns ? (
          <p>Cargando...</p>
        ) : myTurns.length === 0 ? (
          <p>No tenés turnos todavía.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Doctor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {myTurns.map((t) => (
                  <tr key={t.id_turn}>
                    <td>{t.id_turn}</td>
                    <td>{t.date}</td>
                    <td>Dr. {t.doctor?.surname || t.id_doctor}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdminOrSecretary && (
        <>
          <div style={{ height: 18 }} />
          <div className="profile-card-v2 wide-card">
            <h2>Turnos pendientes (Secretaría)</h2>
            {loadingPending ? (
              <p>Cargando...</p>
            ) : pendingTurns.length === 0 ? (
              <p>No hay turnos pendientes.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Paciente (id)</th>
                      <th>Doctor (id)</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTurns.map((t) => (
                      <tr key={t.id_turn}>
                        <td>{t.id_turn}</td>
                        <td>{t.date}</td>
                        <td>{t.id_user}</td>
                        <td>{t.id_doctor}</td>
                        <td>
                          <div className="actions-cell-gap">
                            <button
                              className="btn-action-role btn-promote"
                              type="button"
                              onClick={() => handleConfirm(t.id_turn)}
                            >
                              Confirmar
                            </button>
                            <button
                              className="btn-action-role btn-demote"
                              type="button"
                              onClick={() => handleCancel(t.id_turn)}
                            >
                              Cancelar
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
        </>
      )}
    </div>
  );
}
