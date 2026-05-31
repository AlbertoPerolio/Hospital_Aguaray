import Turn from "../../DB/models/turn.js";
import Doctor from "../../DB/models/doctor.js";
import DoctorDailyCapacity from "../../DB/models/doctor_daily_capacity.js";
import User from "../../DB/models/user.js";
import PresentialPatient from "../../DB/models/presential_patient.js";

export default function turnController() {
  async function countConfirmedForDoctorOnDate({ id_doctor, date }) {
    return await Turn.count({
      where: {
        id_doctor,
        date,
        status: "CONFIRMADO",
      },
    });
  }

  async function getCapacityRow({ id_doctor, date }) {
    return await DoctorDailyCapacity.findOne({ where: { id_doctor, date } });
  }

  // Usuario pide turno
  async function requestTurn({ id_doctor, date, id_user, id_patient_record }) {
    const doctor = await Doctor.findByPk(id_doctor);
    if (!doctor) {
      const err = new Error("Doctor no encontrado");
      err.statusCode = 404;
      throw err;
    }

    if (!doctor.activo) {
      const err = new Error("Doctor pausado");
      err.statusCode = 400;
      throw err;
    }

    const capacity = await getCapacityRow({ id_doctor, date });
    if (!capacity || !capacity.enabled) {
      const err = new Error("Doctor no disponible para esa fecha");
      err.statusCode = 400;
      throw err;
    }

    const confirmedCount = await countConfirmedForDoctorOnDate({
      id_doctor,
      date,
    });

    if (confirmedCount >= capacity.limit_turns) {
      const err = new Error("Sin cupos disponibles para esa fecha");
      err.statusCode = 400;
      throw err;
    }

    if (!id_user && !id_patient_record) {
      const err = new Error(
        "Se requiere un usuario o un registro de paciente para el turno",
      );
      err.statusCode = 400;
      throw err;
    }

    // Creamos el turno como PENDIENTE (a confirmar por secretario)
    return await Turn.create({
      id_doctor,
      id_user: id_user || null,
      id_patient_record: id_patient_record || null,
      date,
      status: "PENDIENTE",
    });
  }

  async function myTurns(id_user) {
    return await Turn.findAll({
      where: { id_user },
      include: [{ model: Doctor }],
      order: [["createdAt", "DESC"]],
    });
  }

  async function pendingTurns() {
    return await Turn.findAll({
      where: { status: "PENDIENTE" },
      include: [
        { model: Doctor },
        {
          model: User,
          attributes: ["id_user", "name", "surname", "user"],
        },
        { model: PresentialPatient },
      ],
      order: [["createdAt", "ASC"]],
    });
  }

  async function confirmTurn(id_turn, confirmedBy) {
    const t = await Turn.findByPk(id_turn);
    if (!t) {
      const err = new Error("Turno no encontrado");
      err.statusCode = 404;
      throw err;
    }
    if (t.status !== "PENDIENTE") {
      const err = new Error("Solo se puede confirmar un turno pendiente");
      err.statusCode = 400;
      throw err;
    }

    const capacity = await getCapacityRow({
      id_doctor: t.id_doctor,
      date: t.date,
    });
    if (!capacity || !capacity.enabled) {
      const err = new Error("Capacidad no disponible");
      err.statusCode = 400;
      throw err;
    }

    const confirmedCount = await countConfirmedForDoctorOnDate({
      id_doctor: t.id_doctor,
      date: t.date,
    });

    // confirmedCount ya cuenta el turno confirmado actual; como el turno es PENDIENTE aún, no cuenta.
    if (confirmedCount >= capacity.limit_turns) {
      const err = new Error("Ya no hay cupos disponibles");
      err.statusCode = 400;
      throw err;
    }

    t.status = "CONFIRMADO";
    t.confirmedAt = new Date();
    t.confirmedBy = confirmedBy;
    await t.save();

    return t;
  }

  async function cancelTurn(id_turn) {
    const t = await Turn.findByPk(id_turn);
    if (!t) {
      const err = new Error("Turno no encontrado");
      err.statusCode = 404;
      throw err;
    }
    if (t.status !== "PENDIENTE") {
      const err = new Error("Solo se puede cancelar un turno pendiente");
      err.statusCode = 400;
      throw err;
    }

    t.status = "CANCELADO";
    await t.save();
    return t;
  }

  return {
    requestTurn,
    myTurns,
    pendingTurns,
    confirmTurn,
    cancelTurn,
  };
}
